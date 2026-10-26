// The practical analyst exam: timed evidence sections graded automatically, plus a written
// incident report graded by a mentor against a rubric. Answers are never revealed to candidates.
// This module contains answers. The server grades with it; the web app only loads it in the mock demo build.
import { isCaseAnswerCorrect, type CaseEvidence, type CaseQuestion } from './cases.js';

export type ExamSection = { id: string; title: string; brief: string; evidence: CaseEvidence[]; questions: CaseQuestion[] };
export type RubricCriterion = { id: string; label: string; description: string; points: number };

export type AnalystExam = {
  slug: string;
  title: string;
  summary: string;
  scenario: string;
  durationMinutes: number;
  /** Out of 100: section questions plus the report. */
  passMark: number;
  /** The report alone must reach this many points, so nobody passes on multiple choice. */
  reportPassMark: number;
  retakeCooldownDays: number;
  sections: ExamSection[];
  report: { prompt: string; minLength: number; maxLength: number; rubric: RubricCriterion[] };
};

export type PublicExamQuestion = Omit<CaseQuestion, 'answers' | 'explanation' | 'hint'>;
export type PublicExamSection = Omit<ExamSection, 'questions'> & { questions: PublicExamQuestion[] };

export function toPublicExam(exam: AnalystExam) {
  return {
    ...exam,
    sections: exam.sections.map((section) => ({
      ...section,
      questions: section.questions.map(({ answers: _answers, explanation: _explanation, hint: _hint, ...question }) => question)
    }))
  };
}

export function examQuestionPoints(exam: AnalystExam) {
  return exam.sections.reduce((sum, section) => sum + section.questions.reduce((inner, question) => inner + question.points, 0), 0);
}

export function examReportPoints(exam: AnalystExam) {
  return exam.report.rubric.reduce((sum, criterion) => sum + criterion.points, 0);
}

/** Per-section scores only, so the result does not reveal which answers were right. */
export function gradeExamAnswers(exam: AnalystExam, answers: Record<string, string>) {
  const sections = exam.sections.map((section) => {
    const earned = section.questions.reduce((sum, question) => sum + (isCaseAnswerCorrect(question, answers[`${section.id}.${question.id}`] ?? '') ? question.points : 0), 0);
    return { id: section.id, title: section.title, earned, max: section.questions.reduce((sum, question) => sum + question.points, 0) };
  });
  return { sections, total: sections.reduce((sum, section) => sum + section.earned, 0) };
}

/** Clamps mentor scores to each criterion's range; missing criteria count as zero. */
export function scoreReport(exam: AnalystExam, scores: Record<string, number>) {
  const criteria = exam.report.rubric.map((criterion) => ({ id: criterion.id, label: criterion.label, earned: Math.max(0, Math.min(criterion.points, Math.round(Number(scores[criterion.id]) || 0))), max: criterion.points }));
  return { criteria, total: criteria.reduce((sum, criterion) => sum + criterion.earned, 0) };
}

export function examPassed(exam: AnalystExam, autoScore: number, reportScore: number) {
  return autoScore + reportScore >= exam.passMark && reportScore >= exam.reportPassMark;
}

export const analystExam: AnalystExam = {
  slug: 'cpa-1',
  title: 'CyberPath Practical Analyst (CPA-1)',
  summary: 'A 3-hour hands-on exam: investigate three linked incidents at a fictional company, then write the incident report a manager would read.',
  scenario: 'You are the on-call SOC analyst at Harbor Logistics, a fictional shipping company. Over three days, three alerts reached your queue. Work through the evidence in each section, then write one incident report that ties it together. Use the terminal tab if it helps. You can change answers until you submit; you will not see which answers were right.',
  durationMinutes: 180,
  passMark: 70,
  reportPassMark: 20,
  retakeCooldownDays: 7,
  sections: [
    {
      id: 'mail',
      title: 'Section A: The payroll correction',
      brief: 'An email with a spreadsheet attachment reached several staff. EDR raised an alert an hour later.',
      evidence: [
        {
          id: 'mail-log',
          name: 'mail-gateway.csv',
          kind: 'csv',
          description: 'Mail gateway decisions for the campaign.',
          content: `time,from,to,subject,attachment,verdict
2026-03-02T08:41:10Z,hr-notice@payroll-portal.test,k.yusupova@harbor.example,March payroll correction,payroll_correction.xlsm,delivered
2026-03-02T08:41:12Z,hr-notice@payroll-portal.test,d.rahimov@harbor.example,March payroll correction,payroll_correction.xlsm,delivered
2026-03-02T08:41:15Z,hr-notice@payroll-portal.test,s.aliyev@harbor.example,March payroll correction,payroll_correction.xlsm,quarantined
2026-03-02T09:02:00Z,newsletter@vendor.example,k.yusupova@harbor.example,Spring catalogue,,delivered`
        },
        {
          id: 'edr',
          name: 'edr-process.csv',
          kind: 'csv',
          description: 'Process creation events from staff laptops.',
          content: `time,host,user,parent,process,command_line
2026-03-02T09:15:31Z,HRB-LT-044,k.yusupova,outlook.exe,excel.exe,"excel.exe payroll_correction.xlsm"
2026-03-02T09:15:44Z,HRB-LT-044,k.yusupova,excel.exe,rundll32.exe,"rundll32.exe C:\\Users\\k.yusupova\\AppData\\Local\\Temp\\upd.dll,Start"
2026-03-02T09:16:02Z,HRB-LT-044,k.yusupova,rundll32.exe,net.exe,"net group ""Domain Admins"" /domain"
2026-03-02T09:21:40Z,HRB-LT-051,d.rahimov,outlook.exe,excel.exe,"excel.exe payroll_correction.xlsm"`
        },
        {
          id: 'proxy',
          name: 'proxy.log',
          kind: 'log',
          description: 'Web proxy entries for the two laptops.',
          content: `2026-03-02T09:15:42Z HRB-LT-044 GET http://198.51.100.144/c/upd.dll 200
2026-03-02T09:17:00Z HRB-LT-044 POST https://sync.cdn-relay.test/beacon 200
2026-03-02T09:18:00Z HRB-LT-044 POST https://sync.cdn-relay.test/beacon 200
2026-03-02T09:19:00Z HRB-LT-044 POST https://sync.cdn-relay.test/beacon 200
2026-03-02T09:21:41Z HRB-LT-051 GET https://intranet.harbor.example/payroll 200`
        }
      ],
      questions: [
        { id: 'delivered', prompt: 'How many mailboxes received the attachment?', format: 'Number', hint: '', answers: ['2'], explanation: 'Two were delivered; one was quarantined.', points: 6 },
        { id: 'host', prompt: 'Which host ran the malicious payload?', format: 'Hostname', hint: '', answers: ['HRB-LT-044'], explanation: 'Only HRB-LT-044 spawned rundll32 from Excel.', points: 6 },
        { id: 'loader', prompt: 'Which process loaded the downloaded DLL?', format: 'Process name', hint: '', answers: ['rundll32.exe', 'rundll32'], explanation: 'rundll32.exe loaded upd.dll from Temp.', points: 6 },
        { id: 'c2', prompt: 'Which hostname is the infected laptop checking in with every minute?', format: 'Hostname', hint: '', answers: ['sync.cdn-relay.test', 'cdn-relay.test'], explanation: 'Regular POSTs to sync.cdn-relay.test every 60 seconds look like beaconing.', points: 6 }
      ]
    },
    {
      id: 'cloud',
      title: 'Section B: The key in the repository',
      brief: 'A developer noticed a cloud access key in a commit and removed it. Was that the end of it?',
      evidence: [
        {
          id: 'git',
          name: 'git-log.txt',
          kind: 'text',
          description: 'Recent commits to the deploy repository.',
          content: `commit 9f2c1e7  2026-03-03T14:02:11Z  author: build-bot
    ci: add deploy script (contains key AKIAEXAMPLE-DEPLOY01)

commit 4b7a0d2  2026-03-03T16:40:09Z  author: t.karimova
    remove leaked key from deploy script`
        },
        {
          id: 'audit',
          name: 'cloud-audit.jsonl',
          kind: 'json',
          description: 'Cloud API calls made with the deploy key.',
          content: `{"eventTime":"2026-03-03T15:12:40Z","eventName":"GetCallerIdentity","accessKeyId":"AKIAEXAMPLE-DEPLOY01","sourceIPAddress":"203.0.113.201"}
{"eventTime":"2026-03-03T15:13:02Z","eventName":"ListBuckets","accessKeyId":"AKIAEXAMPLE-DEPLOY01","sourceIPAddress":"203.0.113.201"}
{"eventTime":"2026-03-03T15:14:55Z","eventName":"GetObject","accessKeyId":"AKIAEXAMPLE-DEPLOY01","sourceIPAddress":"203.0.113.201","requestParameters":{"bucketName":"harbor-hr-exports","key":"2026-02/salaries.csv"}}
{"eventTime":"2026-03-03T15:20:10Z","eventName":"RunInstances","accessKeyId":"AKIAEXAMPLE-DEPLOY01","sourceIPAddress":"203.0.113.201","errorCode":"UnauthorizedOperation"}
{"eventTime":"2026-03-03T16:05:00Z","eventName":"PutObject","accessKeyId":"AKIAEXAMPLE-DEPLOY01","sourceIPAddress":"10.40.0.12","requestParameters":{"bucketName":"harbor-releases","key":"app-1.8.2.zip"}}`
        }
      ],
      questions: [
        { id: 'ip', prompt: 'From which outside IP address was the leaked key used?', format: 'IPv4 address', hint: '', answers: ['203.0.113.201'], explanation: '203.0.113.201 is not the company build network (10.40.0.12).', points: 6 },
        { id: 'object', prompt: 'Which file did the outsider download?', format: 'Object key', hint: '', answers: ['2026-02/salaries.csv', 'salaries.csv'], explanation: 'GetObject on harbor-hr-exports/2026-02/salaries.csv.', points: 6 },
        { id: 'enough', prompt: 'Was removing the key in the 16:40 commit enough?', format: 'Pick one', hint: '', options: ['Yes, the latest commit no longer contains it', 'No, the key must be deactivated and replaced because it stays in git history and was already used'], answers: ['No, the key must be deactivated and replaced because it stays in git history and was already used'], explanation: 'A leaked key stays valid until revoked, and history keeps it.', points: 6 }
      ]
    },
    {
      id: 'web',
      title: 'Section C: The payout change',
      brief: 'Finance asks why one employee\'s payout account changed overnight.',
      evidence: [
        {
          id: 'app-auth',
          name: 'portal-auth.log',
          kind: 'log',
          description: 'Employee portal sign-in and profile events.',
          content: `2026-03-04T11:00:01Z login user=a.nazarova ip=203.0.113.99 result=fail ua=python-requests/2.31
2026-03-04T11:00:01Z login user=b.tursunov ip=203.0.113.99 result=fail ua=python-requests/2.31
2026-03-04T11:00:02Z login user=c.ismoilova ip=203.0.113.99 result=fail ua=python-requests/2.31
2026-03-04T11:00:02Z login user=d.rahimov ip=203.0.113.99 result=success ua=python-requests/2.31
2026-03-04T11:00:03Z login user=e.qodirov ip=203.0.113.99 result=fail ua=python-requests/2.31
2026-03-04T11:00:03Z login user=f.saidov ip=203.0.113.99 result=fail ua=python-requests/2.31
2026-03-04T11:05:40Z login user=m.ortiq ip=192.168.20.14 result=success ua=Mozilla/5.0
2026-03-04T11:06:10Z profile_update user=d.rahimov ip=203.0.113.99 field=payout_account`
        }
      ],
      questions: [
        { id: 'account', prompt: 'Which account was taken over?', format: 'Username', hint: '', answers: ['d.rahimov'], explanation: 'The only success from the scripted source.', points: 6 },
        { id: 'field', prompt: 'Which profile field did the attacker change?', format: 'Field name', hint: '', answers: ['payout_account'], explanation: 'field=payout_account at 11:06:10.', points: 6 },
        { id: 'control', prompt: 'Which control would most directly stop this kind of attack?', format: 'Pick one', hint: '', options: ['Multi-factor authentication on the portal', 'A longer session timeout', 'A bigger web server', 'Hiding the login page URL'], answers: ['Multi-factor authentication on the portal'], explanation: 'Credential stuffing uses valid passwords; MFA blocks the login even when the password is right.', points: 6 }
      ]
    }
  ],
  report: {
    prompt: 'Write the incident report for Harbor Logistics\' IT manager. Cover all three sections: what happened and when, what was affected, what you contained or would contain right away, and what the company should change. Note any link between the incidents you can support with evidence, and say where you are unsure.',
    minLength: 400,
    maxLength: 12000,
    rubric: [
      { id: 'timeline', label: 'Timeline', description: 'Key events in order with times from the evidence, across all three incidents.', points: 10 },
      { id: 'scope', label: 'Scope and impact', description: 'Which hosts, accounts and data were affected, and what was not. Separates evidence from assumption.', points: 10 },
      { id: 'response', label: 'Containment and next steps', description: 'Concrete actions in a sensible order: isolate, revoke, reset, block, check related accounts.', points: 10 },
      { id: 'clarity', label: 'Clarity for a manager', description: 'Plain language, a short summary up front, and clear decisions the manager needs to make.', points: 10 }
    ]
  }
};
