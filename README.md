# OnTime+ — A Schedule-Aware Transit Assistant

A RAG-based chatbot that integrates user schedules (e.g., class time) and transit information (routes, delays, alternatives) to recommend when to leave, suggest the most reliable route, and provide risk-aware guidance.

## Motivation

Public transportation systems like the MBTA are often unpredictable due to delays, service changes, and disruptions. For UMass Boston students who rely on public transit, arriving on time for classes, exams, or meetings can be challenging. Most existing tools (e.g., Google Maps) focus on route planning but do not consider user schedules or provide reliability-aware recommendations under uncertainty.

## Target User

A UMass Boston student who depends on MBTA for daily commuting and needs to arrive on time reliably, especially when facing possible service disruptions.

## Problem Statement

> Will I arrive on time, and what is the safest way to ensure that?

This transforms the task into a time-constrained decision-making problem under uncertainty.

## Core Features

- **Schedule-Aware Planning** — Input event time and output recommended departure time with buffer.
- **On-Time Estimation** — Answer queries such as "If I leave now, will I be on time?"
- **Disruption-Aware Routing** — Incorporate transit alerts and suggest alternatives.
- **Risk-Aware Recommendations** — Label outputs as reliable or risky.

## Data Sources (RAG)

- **Real / Downloadable Sources**: MBTA alerts, route and station information, UMass Boston shuttle information.
- **Constructed / Simulated Data**: Typical travel times, predefined disruption scenarios, and user schedule input.

This approach allows realistic simulation without external APIs.

## System Architecture

```
User Query + Schedule
        ↓
Intent & Time Constraint Extraction
        ↓
RAG Retrieval (Transit Data)
        ↓
Route & Time Estimation
        ↓
Risk / Buffer Analysis
        ↓
Final Answer (with recommendation)
```

## Example Queries

- "My class starts at 10 AM — when should I leave?"
- "If I leave at 9:30, will I be on time?"
- "The Red Line is delayed — what should I do?"
- "What is the safest way to ensure I arrive on time?"

## Repository Structure

Work is split across feature branches so each component can be developed modularly:

| Branch | Scope |
| --- | --- |
| `main` | Integration branch |
| `data-collection` | MBTA alerts, routes, station and shuttle data |
| `data-processing` | Cleaning and chunking of source documents |
| `embeddings` | Embedding model selection and vector generation |
| `retrieval` | Vector store, similarity search, ranking |
| `pipeline-integration` | End-to-end RAG orchestration |
| `chatbot-interface` | Mobile (phone) app chatbot frontend |
| `evaluation` | Quality, reliability, and risk metrics |

## Expected Contribution

The system integrates user schedules, supports decision-making under uncertainty, and provides reliability-aware recommendations beyond traditional route planning.
