# Mastery System

CyberPath mastery is a defensive-only learning signal for safe beginner cybersecurity education. It is not a certification claim.

## Skill model

Each skill has an id, title, category, prerequisites, mapped lessons, mapped exercises, optional safe labs, portfolio artifact suggestion, track/path, and review cadence.

Mastery states:

| Score | State |
| --- | --- |
| 0-19 | `not_started` |
| 20-39 | `introduced` |
| 40-59 | `practiced` |
| 60-79 | `proficient` |
| 80-100 | `mastered` |

If the last practice date is older than the skill review cadence, the state becomes `needs_review` and confidence is reduced.

## Scoring inputs

The current implementation supports the full data shape for:

- lesson completion
- quiz accuracy
- exercise performance
- lab score
- review success streak
- time since last practice
- portfolio artifact quality
- mastery history

Mock mode and the Express API both calculate skill-tree mastery. The backend now stores adaptive practice attempts in `skill_exercise_attempts`, derives current skill mastery from mapped lessons/quizzes/labs/exercises, and uses the review queue plus mistake notebook for recovery evidence.

## Exercise effects

Practice submissions update mastery with bounded deltas:

- normal correct practice: positive mastery delta
- review correct answer: stronger retention delta
- mastery challenge correct answer: higher mastery impact
- incorrect answers: small confidence/mastery penalty and a review item/mistake record

Feedback always points to a related lesson and explains the missed safe defensive concept.

## Review decay

Each skill has a review cadence in days. If a learner has not practiced inside that window, the platform marks the skill `needs_review` even when the numeric score is high.

## Safety boundary

Mastery never rewards unauthorized access, real-target testing, credential theft, malware, evasion, persistence, phishing creation, bypassing systems, or data theft. Lab and exercise evidence uses fictional datasets only.

## 2026-05-16 implementation note

Current mastery is a credible MVP, not a validated learning-science model. The app tracks skill states (`not_started`, `introduced`, `practiced`, `proficient`, `mastered`, `needs_review`), practice deltas, review debt, weak/strong skills, and next recommended skill. The remaining 10/10 work is learner-data calibration: validate weighting for difficulty, hint usage, repeated mistakes, lab score, portfolio quality, and recency decay against actual learner outcomes.
