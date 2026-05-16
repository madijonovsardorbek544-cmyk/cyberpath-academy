# Exercise Engine

The exercise engine provides safe, adaptive defensive practice.

## Supported exercise types

- `multiple_choice`
- `multi_select`
- `true_false`
- `matching`
- `short_answer`
- `scenario_classification`
- `evidence_selection`
- `risk_ranking`
- `log_interpretation`
- `policy_review`
- `report_writing`

## Practice modes

- Learn mode: easier questions and hints.
- Practice mode: mixed questions with mastery updates.
- Review mode: spaced repetition and stale skill repair.
- Mastery challenge: harder prompts with higher impact.
- Lab prep: questions connected to a specific safe lab.

## Feedback logic

Wrong answers show why the answer is wrong, what concept was missed, what to review, a retry-style exercise when available, and a related lesson link.

## Scoring rules

Correct answers increase mastery. Mastery challenge and review successes have stronger impact than ordinary practice. Wrong answers create review debt/mistakes and apply a small penalty.

## Safety rules

Exercises must use fictional scenarios, toy logs, policy review, defensive reasoning, and authorization reminders. They must not teach credential theft, malware, evasion, persistence, phishing creation, live exploitation, bypassing systems, data theft, or unauthorized access.

## Backend routes

- `GET /api/learning/practice/session` returns a safe exercise set for a skill and mode.
- `POST /api/learning/practice/submit` scores an exercise, stores a practice attempt, updates review debt, and returns mastery feedback.
- `POST /api/learning/review/submit` uses the same scoring path with review-mode defaults.

