"""LangGraph orchestration for OnTime+.

Pipeline:
    intent -> retrieve -> route -> risk -> compose

The graph is intentionally linear because each step strictly consumes the
previous step's output. We still use LangGraph (instead of a plain function
chain) so that:

* every node's input/output is visible in the trace and can be inspected
  from the FastAPI / Streamlit layer for debugging;
* future expansion (e.g. an "ask user to clarify origin" branch) is easy to
  add without restructuring everything.
"""

from __future__ import annotations

from typing import Any, TypedDict

from langgraph.graph import END, StateGraph

from .harness.llm_client import LLMClient
from .nodes.answer_composer import compose_answer
from .nodes.intent_extractor import extract_intent
from .nodes.retrieve import retrieve_evidence
from .nodes.risk_analyzer import analyze_risk
from .nodes.route_estimator import estimate_route
from .retriever.hybrid import HybridRetriever
from .schemas import (
    Answer,
    ChatResponse,
    RetrievedDoc,
    RiskAnalysis,
    RoutePlan,
    TimeConstraint,
)


class GraphState(TypedDict, total=False):
    query: str
    schedule: dict[str, Any] | None
    intent: TimeConstraint
    evidence: list[RetrievedDoc]
    plan: RoutePlan
    risk: RiskAnalysis
    suggested_depart: str | None
    answer: Answer


class OnTimeAgent:
    """Stateless wrapper around the LangGraph pipeline.

    Heavy resources (retriever, LLM client) are loaded once and shared across
    requests, which is important for low-latency use from FastAPI/Streamlit.
    """

    def __init__(
        self,
        retriever: HybridRetriever | None = None,
        llm: LLMClient | None = None,
    ) -> None:
        self.retriever = retriever or HybridRetriever()
        self.llm = llm or LLMClient()
        self.graph = self._build()

    def _build(self):
        builder = StateGraph(GraphState)

        def n_intent(state: GraphState) -> GraphState:
            intent = extract_intent(
                state["query"], state.get("schedule"), llm=self.llm
            )
            return {"intent": intent}

        def n_retrieve(state: GraphState) -> GraphState:
            ev = retrieve_evidence(state["intent"], retriever=self.retriever)
            return {"evidence": ev}

        def n_route(state: GraphState) -> GraphState:
            plan = estimate_route(state["intent"], state["evidence"])
            return {"plan": plan}

        def n_risk(state: GraphState) -> GraphState:
            risk, depart = analyze_risk(
                state["intent"], state["plan"], state["evidence"]
            )
            return {"risk": risk, "suggested_depart": depart}

        def n_answer(state: GraphState) -> GraphState:
            ans = compose_answer(
                state["intent"],
                state["plan"],
                state["risk"],
                state.get("suggested_depart"),
                state["evidence"],
                llm=self.llm,
            )
            return {"answer": ans}

        builder.add_node("intent", n_intent)
        builder.add_node("retrieve", n_retrieve)
        builder.add_node("route", n_route)
        builder.add_node("risk", n_risk)
        builder.add_node("answer", n_answer)

        builder.set_entry_point("intent")
        builder.add_edge("intent", "retrieve")
        builder.add_edge("retrieve", "route")
        builder.add_edge("route", "risk")
        builder.add_edge("risk", "answer")
        builder.add_edge("answer", END)

        return builder.compile()

    def ask(self, query: str, schedule: dict[str, Any] | None = None) -> ChatResponse:
        state: GraphState = {"query": query, "schedule": schedule}
        out = self.graph.invoke(state)
        return ChatResponse(
            answer=out["answer"],
            intent=out["intent"],
            retrieved=out["evidence"],
        )
