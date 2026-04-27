"""Streamlit web UI for OnTime+.

This UI is intentionally a thin client over the FastAPI backend at
``http://{API_HOST}:{API_PORT}``. The same JSON contract will work for the
future mobile app.

Run:
    # 1) start the backend in another terminal
    uvicorn ontime_plus.app.api:app --port 8000

    # 2) start the UI
    streamlit run ontime_plus/app/streamlit_app.py
"""

from __future__ import annotations

import json
import os

import requests
import streamlit as st

DEFAULT_API = os.getenv(
    "ONTIME_API_URL",
    f"http://{os.getenv('API_HOST', '127.0.0.1')}:{os.getenv('API_PORT', '8000')}",
)

st.set_page_config(page_title="OnTime+", page_icon=":bus:", layout="wide")

st.title("OnTime+ — Schedule-Aware Transit Assistant")
st.caption("RAG chatbot for UMass Boston commuters. Ask when to leave and how risky a plan is.")

with st.sidebar:
    st.header("Settings")
    api_url = st.text_input("Backend URL", value=DEFAULT_API, help="FastAPI base URL")
    if st.button("Health check"):
        try:
            r = requests.get(f"{api_url}/health", timeout=10)
            r.raise_for_status()
            st.success(r.json())
        except Exception as e:
            st.error(f"Health check failed: {e}")

    st.markdown("---")
    st.subheader("Optional schedule")
    event = st.text_input("Event", value="class")
    event_time = st.text_input("Deadline (HH:MM)", value="10:00")
    high_stakes = st.checkbox("High-stakes (exam/interview/flight)?", value=False)

    schedule_payload: dict | None = None
    if event_time.strip():
        schedule_payload = {
            "event": event,
            "time": event_time,
            "high_stakes": high_stakes,
        }

st.subheader("Example questions")
try:
    ex = requests.get(f"{api_url}/example_queries", timeout=5).json().get("examples", [])
except Exception:
    ex = []
cols = st.columns(2)
selected_example: str | None = None
for i, q in enumerate(ex):
    with cols[i % 2]:
        if st.button(q, key=f"ex_{i}"):
            selected_example = q

st.markdown("---")
query = st.text_area(
    "Your question",
    value=selected_example or "",
    placeholder="e.g. My class starts at 10 AM, when should I leave from Alewife?",
    height=100,
)

if st.button("Ask OnTime+", type="primary", use_container_width=True):
    if not query.strip():
        st.warning("Please type a question first.")
    else:
        with st.spinner("Thinking ..."):
            try:
                r = requests.post(
                    f"{api_url}/chat",
                    json={"query": query, "schedule": schedule_payload},
                    timeout=60,
                )
                r.raise_for_status()
                data = r.json()
            except Exception as e:
                st.error(f"Request failed: {e}")
                data = None

        if data:
            ans = data["answer"]
            risk_label = ans["risk"]["label"]
            color_map = {"reliable": "green", "caution": "orange", "risky": "red"}
            color = color_map.get(risk_label, "gray")

            st.markdown(f"### Answer  :{color}[{risk_label.upper()}]")
            st.write(ans["recommendation"])

            cols = st.columns(3)
            cols[0].metric(
                "Suggested depart",
                ans.get("suggested_depart_time") or "-",
            )
            cols[1].metric(
                "Total trip (min)",
                f"{ans['plan']['total_expected_min']:.0f} ± {ans['plan']['total_std_min']:.1f}"
                if ans.get("plan") else "-",
            )
            cols[2].metric(
                "Buffer (min)",
                f"{ans['risk']['buffer_min']:.1f}",
            )

            with st.expander("Route plan"):
                st.json(ans.get("plan"))
            with st.expander("Risk analysis"):
                st.json(ans.get("risk"))
            with st.expander("Extracted intent"):
                st.json(data.get("intent"))
            with st.expander("Retrieved evidence"):
                for r in data.get("retrieved", []):
                    d = r["doc"]
                    st.markdown(
                        f"**[{d['id']}] {d['title']}** — "
                        f"`type={d['type']}, route={d['route']}, "
                        f"score={r['score']:.4f}, src={r['retriever']}`"
                    )
                    st.write(d["content"])
                    st.markdown("---")
