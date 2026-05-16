# Learning System Implementation Matrix

This document maps the current CyberPath learning product surfaces to code, data, tests, and expansion rules.

## Implemented surfaces

| Surface | Frontend route | API route | Primary implementation |
| --- | --- | --- | --- |
| Mastery system | `/dashboard`, `/skill-tree`, `/practice`, `/review` | `/api/learning/dashboard`, `/api/learning/mastery-summary`, `/api/learning/skill-tree` | Track mastery from lessons/quizzes/labs plus skill mastery from adaptive exercise attempts. |
| Skill tree | `/skill-tree`, `/skills/:skillId` | `/api/learning/skill-tree` | Defensive skill categories, prerequisite locking, mapped lessons, mapped labs, and recommended next skill. |
| Exercise engine | `/practice/session` | `/api/learning/practice/session`, `/api/learning/practice/submit`, `/api/learning/review/submit` | Safe exercise catalog, answer checking, bounded mastery deltas, review queue updates, and mistake creation. |
| Teacher dashboard | `/teacher` (`/mentor` redirects) | `/api/teacher/*` and `/api/mentor/*` | Cohort metrics, risk table, weak-topic heatmap, assignments, alerts, lab review, portfolio review, and CSV export. |
| Content expansion | Admin dashboard and seed scripts | `/api/admin/lessons`, curriculum seed scripts | Lessons, labs, tracks, guided projects, glossary, review metadata, and safe-content quality rules. |

## Mastery system data flow

1. Learners complete lessons, quizzes, labs, and adaptive practice.
2. Track mastery is calculated from lesson completion, quiz averages, lab score, and review health.
3. Skill mastery is calculated from mapped lesson completion, quiz attempts, lab attempts, and `skill_exercise_attempts`.
4. Skill states decay to `needs_review` when practice is stale relative to the skill review cadence.
5. Incorrect exercise answers create review debt and mistake notebook entries.

## Skill tree structure

Every skill node should include:

- stable `id`
- human title and category
- prerequisite skill ids
- mapped lesson slugs
- mapped exercise ids
- optional safe lab slugs
- portfolio artifact suggestion
- track/path slug
- review cadence in days

A node is visible when it has at least one mapped lesson or exercise. A node is locked when prerequisite skills are not yet practiced, proficient, or mastered.

## Exercise engine structure

Exercise items must include:

- stable `id` and `skillId`
- type and difficulty
- practice mode (`learn`, `practice`, `review`, `mastery_challenge`, or `lab_prep`)
- fictional scenario and prompt
- answer/rubric
- explanation, hint, and wrong-answer explanation
- related lesson slug and optional lab slug

Answer submissions are defensive-only. Correct answers increase mastery by a small bounded delta. Incorrect answers add review debt and mistake evidence instead of hiding failure.

## Teacher dashboard structure

The teacher surface is an alias over the mentor cohort workflow because schools usually use the word teacher while internal permissions still use the existing `mentor` role.

Teacher dashboard objects should support:

- cohort metrics
- student progress/risk rows
- weak-topic heatmap
- mastery heatmap
- inactive learner alerts
- lab submission review
- portfolio artifact review
- assignments with target mastery and due dates
- CSV export for school review

## Content expansion checklist

Before adding new content, verify that every item is:

- defensive and authorized
- fictional or explicitly sandboxed
- mapped to a skill node
- mapped to a lesson, lab, or portfolio artifact when relevant
- covered by a review cadence
- compatible with teacher reporting
- documented enough for future content writers to extend safely

## Test coverage expectations

Minimum tests for this layer:

- skill tree loads for authenticated students
- practice sessions return mapped exercises
- exercise submissions produce mastery feedback
- incorrect answers create review/mistake evidence
- teacher dashboard alias works for mentor accounts
- unsafe or invalid payloads are rejected
