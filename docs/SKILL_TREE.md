# Skill Tree

CyberPath's first skill-tree version is a mapped defensive learning graph. It is designed to grow toward Khan Academy-style mastery without pretending all future content is finished.

## Categories

1. Cyber Foundations
2. Identity and Access
3. Networking for Cybersecurity
4. Linux and Systems Basics
5. Blue Team / SOC Foundations
6. Web Security Defense
7. Cloud and IAM Defense
8. GRC and Risk
9. AI Security Awareness

## Mapping rules

Every visible skill must include at least one lesson or exercise. Skills may also map to labs, portfolio artifacts, review items, and a track/path. Empty future nodes must stay hidden or be clearly labeled coming soon.

## Prerequisites

Prerequisites gate skill cards until the prerequisite reaches at least `practiced`. Locked nodes explain which prerequisite needs work.

## Recommended next skill

The recommendation favors:

1. unlocked skills not yet mastered,
2. stale skills needing review,
3. the first safe beginner foundation skill for new learners.

## Mock demo

The GitHub Pages mock demo uses deterministic skill and exercise catalogs, seeded mastery records, and no live-target cyber content.

## 2026-05-16 implementation note

Mock and backend skill trees now expose the same nine defensive curriculum categories. Visible nodes must have lessons or exercises, prerequisites must explain locked states, and coming-soon nodes should never appear as empty mapped content.
