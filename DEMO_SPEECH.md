# OnTime+ — Demo Speech (Verbatim)

**Duration:** ~3 min 30 s · read this script word-for-word during the live demo.
Stage directions are in *italics inside square brackets*. Everything else is spoken aloud.

---

## Stage Setup (≈ 20 s)

*[Screen showing the OnTime+ Welcome page in the browser.]*

"Before I ask any question, let me show you what OnTime+ already knows about the user.

*[Tap **Get started →**, then open the drawer and tap **Schedule**.]*

This is the user's class schedule, saved in advance. They have **Artificial Intelligence** on Monday, Wednesday, and Friday at 10 AM in Wheatley Hall, and **Computer Systems** on Tuesday and Thursday at 2 PM in University Hall. The app already knows the day's events.

*[Drawer → tap **Alerts**.]*

And this is the live MBTA picture: a moderate signal issue on the Red Line near JFK/UMass, and the campus shuttle running normally. The app already knows the network state.

*[Drawer → back to **Chat**. Empty composer visible.]*

Both of these — the schedule and the alerts — flow into every answer. Now let me ask two questions."

---

## Query 1 — Disruption + Midterm (≈ 90 s)

"Imagine I'm a UMass Boston student. It's Wednesday morning. The Red Line just had a signal problem near Park Street, and I have a midterm at 9 AM. I open OnTime+ and ask:

*[Type into the composer:]*

```
The Red Line has a signal problem near Park Street.
My midterm at UMass Boston is at 9:00 AM. What should I do?
```

*[Press Enter. Wait for the bot bubble to appear, then read it aloud:]*

The bot says: *'I recommend you take the UMass Boston shuttle instead of the Red Line due to the signal problem. You should depart by 8:30 AM to ensure you arrive on time for your 9:00 AM midterm. The predicted travel time is about 27 minutes, which includes a shuttle transfer. Your route will be UMass Shuttle from Park Street to UMass Boston Campus Center. Please note that there are active alerts affecting the Red Line, so this route is labeled **Caution**.'

Now let me show you three things about this answer.

**First — where the information comes from.**

*[Tap the bubble; expand the Retrieved evidence drawer; point at the doc IDs.]*

These are the source documents the system used: the simulated MBTA alert `alert-red-signal-2026-04-26`, the real UMB shuttle schedule `shuttle-jfk-campus`, a travel-time distribution document, and our policy KB `policy-risk-label`. Three families of source: real MBTA infrastructure, simulated alerts and travel-time distributions, and the OnTime+ policy KB. The recommendation didn't come from the language model's memory — it came from these specific files, and the user can read every one of them right here in the UI.

**Second — how the answer was derived.**

The pipeline ran five stages, in order. *Intent extraction* parsed 'midterm' as a high-stakes flag and 09:00 as the deadline. *Retrieval* picked up the keyword 'signal' and ran a targeted alert pass — that's why the signal-alert document landed at rank one. *Route estimation* — a rule-based stage, not the LLM — picked the shuttle leg and summed the medians plus the twelve-minute alert delay. *Risk analysis* — also rule-based — combined the active alert with the high-stakes flag and produced the Caution label. Only at the very end did the LLM verbalize the structured plan. Notice what the LLM did not do: it did not estimate a number, and it did not pick the risk label. Those are deterministic.

**Third — the citations.**

*[Point at the `[Caution]` tag in the bubble.]*

The Caution tag is right here in the answer. Every claim — the route, the twelve minutes, the safer-via-shuttle reasoning — is grounded in the doc IDs you just saw. If a reviewer ever asks me 'why did you say Caution?', I can point them at `alert-red-signal-2026-04-26` and `policy-risk-label` and walk through the rule.

And finally, the **action**. This is what matters in a real-world setting. The answer is not 'travel time is twenty-seven minutes' — that's what Google Maps gives you. The answer is **'leave by 8:30 by shuttle, and we labelled this Caution because the Red Line is broken.'** That is a verb the student can act on, and a confidence level they can plan around. They close the app and walk to the shuttle stop."

---

## Query 2 — Weather + Normal Class (≈ 90 s)

"Let's try a harder one. Heavy rain, different origin, different stakes — same OnTime+, same context, no app changes.

*[Clear the composer. Type:]*

```
It is raining heavily today. My class is at 9:30 AM at UMass Boston
and I am leaving from South Station.
```

*[Press Enter. Read the bot bubble aloud:]*

The bot says: *'I recommend leaving South Station by 8:15 AM to ensure you arrive at your 9:30 AM class at UMass Boston. The total predicted travel time is about 15 minutes, which includes 7 minutes on the Red Line to JFK/UMass and an 8-minute UMB Shuttle ride to the Campus Center. Your route will be Red Line — JFK/UMass — UMB Shuttle. Please note that due to heavy rain, there is a risk of delays, and the travel is labeled as **Risky** because of an active alert affecting your route, alert-bus-8-detour.'

Same three things again, faster this time.

**Sources** —

*[Expand the evidence drawer on this bubble.]*

A different subset of documents: the South Station to JFK/UMass travel-time doc, the same shuttle schedule reused across queries, the active alert `alert-bus-8-detour`, and the same policy KB. Same three families of source, but exactly the docs needed for this trip — not boilerplate.

**Reasoning** — same five-stage pipeline. Different inputs, different output. Origin is South Station instead of Park Street. The word 'raining' fired the targeted alert pass. The route estimator composed two legs — Red Line plus UMB Shuttle — by stitching real KB entries together. And the risk analyzer escalated past Caution to **Risky**, because an active alert hit this route. Same policy table as the first query — different result, traceable line by line.

**Citations** —

*[Point at the `[alert-bus-8-detour]` token inside the bubble text.]*

This is even more explicit. The doc ID is **inside the answer text itself**. The user, even without opening the evidence drawer, can see exactly which alert escalated their trip. The LLM is forced to cite from the retrieved IDs only — it cannot invent an alert.

And the **action**: a clock time, a concrete route, a confidence label. The user knows to leave 75 minutes before class instead of the usual 45. That's a real schedule change driven by real evidence."

---

## Closing (≈ 25 s)

*[Slide back to the Chat screen.]*

"Two queries, two completely different pipelines, through the same five-stage architecture: **intent, retrieval, route, risk, grounded answer**. For both answers, the user can see which documents were pulled, how the rule-based stages turned them into a plan, which doc IDs back each claim, and a concrete action they can take.

The user sees a chat bubble. Underneath the bubble, every number is traceable, every risk label is deterministic, and the LLM never decides whether you're going to be late.

That's what we mean by **schedule-aware, risk-aware, transparent transit guidance**."
