# Teacher / Mentor Dashboard

The mentor dashboard is being upgraded from progress viewing to actionable teaching support.

## Cohort model

Mentors see assigned cohort learners only in mock mode; admins see all learners. Each learner can have mastery, lessons, quiz accuracy, labs, portfolio artifacts, alerts, and assignments.

## Reports

The dashboard includes:

- cohort metrics
- cohort mastery heatmap
- weak topic heatmap
- students needing review
- students ready for labs/projects
- lab submission review queue
- portfolio artifact review queue
- CSV cohort export

## Assignment workflow

Mentors can assign targeted work with title, instructions, target mastery, due date, and status. Assignment types should expand to explicit skill, lesson, exercise set, lab, portfolio artifact, and review sprint targets.

## At-risk alerts

Current alert categories include weak area, engagement/momentum, inactivity, and low accuracy signals. Future backend work should centralize alert generation from mastery decay and repeated misses.

## Route aliases

The product UI now exposes `/teacher` for school users while `/mentor` remains as a backwards-compatible redirect. The API exposes both `/api/teacher/*` and `/api/mentor/*` for the same role-protected cohort workflows.


## 2026-05-16 implementation note

The teacher dashboard is demo/pilot credible but not yet a paid-school 10/10 dashboard. It can show cohort metrics, weak topics, mastery heatmap, students needing review, lab readiness, alerts, assignments, lab submissions, and artifact review queues. Remaining work includes polished assignment lifecycle UX, scheduled CSV exports, printable reports ready for parent/school meetings, SIS/LMS integration planning, and real teacher usability testing.
