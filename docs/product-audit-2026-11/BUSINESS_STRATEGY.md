# CyberPath Academy — Business Strategy and Validation Plan

Date: 2026-11-13. Everything marked **[assumption]** is my judgement, not research. Nothing here comes from customer interviews, because none have been recorded in the repository. Treat the numbers as hypotheses to test, not forecasts.

## 1. Competitors: what is verified and what is assumed

| | TryHackMe | Hack The Box Academy | PortSwigger Web Security Academy |
| --- | --- | --- | --- |
| Model | Free tier plus Premium subscription | Subscription tiers (moved to tier-based access in 2026) | Free |
| Verified | Raised its monthly price for all subscribers from 16 June 2025; annual price unchanged ([TryHackMe blog](https://tryhackme.com/resources/blog/upcoming-changes-to-tryhackme-monthly-pricing)) | Announced tier-based pricing and new rates, with old rates locked until 12 October ([HTB blog](https://www.hackthebox.com/blog/new-academy-pricing)) | Free labs are its core offer (well known; not re-checked today) |
| Learning shape **[assumption, from public product knowledge]** | Paths → rooms → tasks with questions; browser-based attack box | Modules → sections with exercises; strong for exam prep (CPTS etc.) | Topic pages with an explanation then one or more live labs per vulnerability |
| Language | English | English | English |

Exact current prices were not confirmed today; check the sites before quoting them.

What CyberPath should borrow (ideas, not designs): TryHackMe's short tasks with an answer box after each bit of reading; HTB Academy's clear module → section structure and progress per module; PortSwigger's "read, then immediately practise the same idea" rhythm.

What CyberPath should **not** try to match: hosted attack machines and VPN labs. They are expensive, need serious isolation work and are against your defensive-only rule.

**Real advantage, if you build it:** none of these teach in Uzbek, none offer a local human instructor, and none sell to Uzbek schools and learning centres with local invoicing. Today CyberPath has none of these three either. They are the strategy, not existing assets.

## 2. Primary customer segment **[assumption]**

Uzbek-speaking learners aged roughly 16 to 25 in Tashkent and regional cities who want to start an IT/security career, already pay for offline IT courses or English classes, and find English-only platforms hard. The payer is often a parent.

Second segment (later): learning centres and school IT clubs that want a ready curriculum and a teacher dashboard.

Questions to settle in interviews: do they want a job, a university advantage, or a hobby? Do they pay monthly for courses today, and how much? Do they trust online-only courses or want a human?

## 3. Problem and value proposition

Problem **[assumption]**: there is little structured, practical cybersecurity teaching in Uzbek; English platforms are hard for beginners; offline courses are expensive and in Tashkent.

Value proposition to test: "Learn cybersecurity from zero in Uzbek, with practice you can do on your phone, and a mentor who checks your work."

## 4. Business model recommendation

| Option | Recurring value? | Fit now |
| --- | --- | --- |
| Monthly subscription (current $3 / 36,000 UZS Premium) | Only if new content arrives every month. It does not today. | **No.** Low price, high churn, needs scale you do not have. |
| One-time course purchase | One finished course | Possible after the course exists |
| **Paid instructor-supported cohort** | Weekly sessions, feedback, deadlines, a group | **Yes. Start here.** |
| School / learning-centre licence | Teacher dashboard, reports | Second step, after one cohort shows results |

**Why a cohort first:** it validates willingness to pay with 10 people, it does not need payment automation (you invoice by hand, which the new payment ledger supports), the human support makes up for thin content while you write better lessons, and each session tells you what to build next. Its weakness: it does not scale and depends on your time. That is fine for the first 10 to 30 customers.

### First paid product (proposal)
"Kiberxavfsizlik asoslari" (Cybersecurity Foundations), 6 weeks, in Uzbek, online, 10 to 15 learners per group:
- 2 live sessions a week (Telegram or Google Meet), recorded
- 12 lessons on CyberPath (to be written, see PRODUCT_AUDIT PA-1), using the existing investigations, SOC simulator, SIEM lab and browser shell as homework
- weekly written feedback on one assignment
- final practical assessment (the existing CPA-1 exam flow) and a completion certificate that says exactly what was completed, nothing more

### Pricing hypotheses in UZS **[assumption, to test]**
- A: 390,000 UZS for the whole 6-week cohort
- B: 590,000 UZS
- C: 790,000 UZS with a 1-to-1 review session
Offer A or B to the first group and ask the others what they would pay. Do not run fake discounts or "only 3 seats left" unless it is true.
Keep the self-paced Premium plan hidden until the cohort's lessons exist; then test a one-time price for the self-paced course (for example 150,000 to 250,000 UZS **[assumption]**).

## 5. Payments

- **Now:** invoice by Payme/Click payment link or bank transfer to a business account, then record it in Admin → Payments and access. This is built and tested in this PR.
- **Before automating:** a payment provider needs a registered business (individual entrepreneur or company) **[assumption: verify with Payme/Click and a local accountant]**. Do not use a personal card to collect money from customers, and do not get around age or identity requirements.
- **Integration when volume justifies it** (around 30+ payments a month **[assumption]**): one provider (Payme or Click, whichever your bank and business form support), with a server-side signed webhook that writes the same `payments` table. Never trust the browser redirect. See SECURITY_AUDIT S-7.

## 6. Operating costs (monthly)

| Item | Now | When charging |
| --- | --- | --- |
| Render web service | $0 (free, sleeps after 15 min) | Recommend a paid always-on instance (Render Starter has been about $7/month **[verify]**) so paying users do not wait 60 seconds. **Needs your approval.** |
| Database backups (Backblaze B2) | $0 within 10 GB | $0 |
| Email (Brevo) | $0, 300/day | $0 |
| Domain | about $10–15/year **[verify]** | same |
| Video calls | $0 (Google Meet / Telegram) | $0 |
| Payment fees | none | provider fee per payment **[verify]** |
| Legal review (privacy, terms, data location) | — | one-off fee; necessary before schools |

The real cost is your time: about 6 to 8 hours a week per cohort for sessions and feedback **[assumption]**.

## 7. Metrics that matter

Track weekly, in a simple spreadsheet first (do not build dashboards before you have users):
1. Conversations with prospective learners (target 30 in 30 days)
2. Cohort applications
3. Paid seats and UZS collected (from the payment ledger)
4. Week-by-week attendance and assignment submission per learner
5. Completion rate of the cohort
6. Refund requests
7. "Would you recommend this?" at week 3 and week 6
8. Referrals: how many new applicants came from a learner

The platform already logs sign-ups, lesson completions, quiz attempts and lab submissions. Do not add third-party analytics until you have a privacy policy that names them.

## 8. Route to the first 10 paying customers

1. **Write the first 4 lessons in Uzbek** of the cohort course, properly. Without these there is nothing to sell. (1 to 2 weeks)
2. **Do 30 short interviews** with your target learners and parents (Telegram, university friends, IT course groups). Ask about goals and what they pay today; do not pitch until the end. Write the answers down.
3. **Publish one honest landing page in Uzbek** for the cohort: what they will learn week by week, schedule, price, who teaches, refund rule, how to pay. No invented testimonials or numbers.
4. **Run a free 60-minute online taster session** (for example "How phishing attacks work and how to spot them") in 2 or 3 Uzbek Telegram IT communities. Collect applications at the end.
5. **Invite the best 10 to 15 applicants** to the paid cohort, take payment by Payme/Click link or transfer, record it in the admin ledger, start within 2 weeks.

If fewer than 5 people pay after about 100 people saw the offer, change the offer (topic, price, format) before writing more code.

## 9. Things that are unproven

- That Uzbek learners will pay for online cybersecurity teaching at all.
- That Uzbek language is a strong enough reason to choose CyberPath over free English content and YouTube.
- That schools will pay; school budgets and procurement in Uzbekistan were not researched.
- Every price in this document.
- Whether the data-localisation rule applies (SECURITY_AUDIT S-3).
