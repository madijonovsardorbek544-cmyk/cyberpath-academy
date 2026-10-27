// SOC alert-queue simulator: a "shift" is a queue of SIEM alerts the learner triages.
// All entities are fictional; IPs are RFC 5737 / RFC 1918. Contains the grading key.

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertVerdict = 'true_positive' | 'false_positive';

export const alertSeverities: AlertSeverity[] = ['low', 'medium', 'high', 'critical'];

export type SocAlert = {
  id: string;
  title: string;
  rule: string;
  siemSeverity: AlertSeverity;
  time: string;
  entities: Record<string, string>;
  rawEvent: string;
  context: Array<{ label: string; value: string }>;
  key: {
    verdict: AlertVerdict;
    /** Expected severity for true positives; ignored for false positives. */
    severity: AlertSeverity;
    noteChecks: Array<{ label: string; any: string[] }>;
    explanation: string;
  };
};

export type SocShift = {
  slug: string;
  title: string;
  summary: string;
  briefing: string;
  difficulty: 'beginner' | 'intermediate';
  estimatedMinutes: number;
  alerts: SocAlert[];
};

export type SocDecision = { alertId: string; verdict: AlertVerdict; severity?: AlertSeverity; note: string };

export type SocAlertResult = {
  alertId: string;
  verdict: AlertVerdict;
  expectedVerdict: AlertVerdict;
  verdictCorrect: boolean;
  expectedSeverity: AlertSeverity | null;
  severityPoints: number;
  notePoints: number;
  missedNoteChecks: string[];
  points: number;
  maxPoints: number;
  explanation: string;
};

export type SocShiftResult = { score: number; maxScore: number; correctVerdicts: number; totalAlerts: number; alerts: SocAlertResult[] };

const VERDICT_POINTS = 10;
const SEVERITY_POINTS = 5;
const NOTE_POINTS = 5;

export function toPublicShift(shift: SocShift) {
  return { ...shift, alerts: shift.alerts.map(({ key: _key, ...alert }) => alert) };
}

export function gradeSocShift(shift: SocShift, decisions: SocDecision[]): SocShiftResult {
  const byId = new Map(decisions.map((decision) => [decision.alertId, decision]));
  const alerts = shift.alerts.map((alert): SocAlertResult => {
    const decision = byId.get(alert.id);
    const verdict = decision?.verdict ?? (alert.key.verdict === 'true_positive' ? 'false_positive' : 'true_positive');
    const verdictCorrect = verdict === alert.key.verdict;
    let severityPoints = 0;
    if (verdictCorrect) {
      if (alert.key.verdict === 'false_positive') severityPoints = SEVERITY_POINTS;
      else if (decision?.severity) {
        const distance = Math.abs(alertSeverities.indexOf(decision.severity) - alertSeverities.indexOf(alert.key.severity));
        severityPoints = distance === 0 ? SEVERITY_POINTS : distance === 1 ? 2 : 0;
      }
    }
    const note = (decision?.note ?? '').toLowerCase();
    const missed = alert.key.noteChecks.filter((check) => !check.any.some((term) => note.includes(term.toLowerCase())));
    const notePoints = alert.key.noteChecks.length ? Math.round((NOTE_POINTS * (alert.key.noteChecks.length - missed.length)) / alert.key.noteChecks.length) : NOTE_POINTS;
    const points = (verdictCorrect ? VERDICT_POINTS : 0) + severityPoints + notePoints;
    return {
      alertId: alert.id,
      verdict,
      expectedVerdict: alert.key.verdict,
      verdictCorrect,
      expectedSeverity: alert.key.verdict === 'true_positive' ? alert.key.severity : null,
      severityPoints,
      notePoints,
      missedNoteChecks: missed.map((check) => check.label),
      points,
      maxPoints: VERDICT_POINTS + SEVERITY_POINTS + NOTE_POINTS,
      explanation: alert.key.explanation
    };
  });
  return {
    score: alerts.reduce((sum, alert) => sum + alert.points, 0),
    maxScore: alerts.reduce((sum, alert) => sum + alert.maxPoints, 0),
    correctVerdicts: alerts.filter((alert) => alert.verdictCorrect).length,
    totalAlerts: alerts.length,
    alerts
  };
}

export const socShifts: SocShift[] = [
  {
    slug: 'monday-morning-queue',
    title: 'Monday morning queue',
    summary: 'Six overnight alerts at Northwind. Some are real, some are noise. Sort them before the 9:00 stand-up.',
    briefing: 'You are the first analyst in on Monday. The SIEM raised six alerts overnight. For each one, decide whether it is a real security problem (true positive) or expected activity (false positive), set a severity for the real ones, and write a short note for the next shift. Use the context panel: asset notes and tickets often explain an alert.',
    difficulty: 'beginner',
    estimatedMinutes: 20,
    alerts: [
      {
        id: 'a1', title: 'Multiple failed logins followed by success', rule: 'AUTH-007 Brute force then success', siemSeverity: 'medium', time: '2026-03-14T02:14:37Z',
        entities: { user: 'j.okafor', source_ip: '203.0.113.45', system: 'vpn-gw01' },
        rawEvent: '8 x FAIL (8 different users) from 203.0.113.45 between 02:10:51 and 02:12:31\nSUCCESS user=j.okafor src=203.0.113.45 mfa=not_enrolled session=7f3a91',
        context: [{ label: 'Directory', value: 'j.okafor (Facilities) is not enrolled in MFA. Last password change 2024-06-18.' }, { label: 'Threat intel', value: '203.0.113.45 is not a known Northwind or partner address.' }, { label: 'User report', value: 'Help desk ticket HD-5512: user says he was asleep at 02:14.' }],
        key: { verdict: 'true_positive', severity: 'high', noteChecks: [{ label: 'Names the source IP', any: ['203.0.113.45'] }, { label: 'Calls out the missing MFA', any: ['mfa'] }, { label: 'Says to disable, reset or kill the session', any: ['disable', 'reset', 'session', 'revoke'] }], explanation: 'A password spray succeeded against the only account without MFA, and the user denies the login. This is a confirmed account takeover: high severity. Disable the account, end session 7f3a91, reset the password, and check what the session touched.' }
      },
      {
        id: 'a2', title: 'Impossible travel', rule: 'ID-112 Sign-ins from distant locations', siemSeverity: 'medium', time: '2026-03-14T08:10:03Z',
        entities: { user: 'm.chen', first_ip: '198.51.100.7 (Tashkent)', second_ip: '192.0.2.140 (Frankfurt)' },
        rawEvent: '07:58:40 SUCCESS user=m.chen src=198.51.100.7 geo=UZ mfa=push_approved\n08:10:03 SUCCESS user=m.chen src=192.0.2.140 geo=DE mfa=push_approved app=Outlook',
        context: [{ label: 'Asset note', value: '192.0.2.140 is the egress IP of the Northwind secure web gateway (cloud proxy), hosted in Frankfurt. All laptop web traffic exits through it once the VPN agent connects.' }, { label: 'Device', value: 'Both sign-ins come from the same managed laptop FIN-LT-22.' }],
        key: { verdict: 'false_positive', severity: 'low', noteChecks: [{ label: 'Explains the proxy / gateway egress', any: ['proxy', 'gateway', 'egress', 'zscaler'] }, { label: 'Mentions the same device', any: ['same device', 'same laptop', 'fin-lt-22', 'managed'] }], explanation: 'The "Frankfurt" sign-in is the company\'s own cloud proxy, from the same managed laptop with MFA approved. This is expected. A good follow-up is to tune the rule to exclude the gateway egress IP.' }
      },
      {
        id: 'a3', title: 'Office application spawned PowerShell', rule: 'EDR-031 Office child process', siemSeverity: 'high', time: '2026-03-10T09:52:31Z',
        entities: { host: 'WS-FIN-07', user: 'd.karimov', parent: 'WINWORD.EXE', child: 'powershell.exe' },
        rawEvent: 'ParentImage: WINWORD.EXE (Invoice_INV-20931.docm)\nCommandLine: powershell.exe -NoP -W Hidden -Enc JAB1AD0AIgBoAHQAdABwAHMAOgAvAC8AMQA5ADgALgA1ADEALgAxADAAMAAuADIAMwAv...\nNetwork: 198.51.100.23:443\nFile created: %APPDATA%\\OneDriveUpdate\\odupd.exe\nschtasks /Create /SC ONLOGON /TN "OneDriveUpdate"',
        context: [{ label: 'Email gateway', value: 'Invoice_INV-20931.docm arrived from accounts@contoso-billing.example (DMARC fail) at 09:41.' }, { label: 'Threat intel', value: '198.51.100.23 has no history with Northwind.' }],
        key: { verdict: 'true_positive', severity: 'critical', noteChecks: [{ label: 'Names the host', any: ['ws-fin-07'] }, { label: 'Mentions the persistence task or dropped file', any: ['schtasks', 'scheduled task', 'onedriveupdate', 'odupd'] }, { label: 'Says to isolate the host', any: ['isolate', 'contain', 'quarantine'] }], explanation: 'A macro document launched hidden encoded PowerShell, downloaded an executable and set up logon persistence. Code is running on the host right now: critical. Isolate WS-FIN-07 immediately.' }
      },
      {
        id: 'a4', title: 'Antivirus detection: EICAR-Test-File', rule: 'AV-001 Malware detected', siemSeverity: 'high', time: '2026-03-13T16:20:11Z',
        entities: { host: 'IT-LAB-02', user: 'it.trainer', file: 'C:\\Users\\it.trainer\\Downloads\\eicar.com' },
        rawEvent: 'Detection: EICAR-Test-File (not a virus)\nAction: Quarantined\nSHA256: 275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f',
        context: [{ label: 'Change ticket', value: 'CHG-3307: "Verify AV quarantine on new lab image IT-LAB-02", owner it.trainer, window 13 Mar 16:00-17:00.' }, { label: 'Asset note', value: 'IT-LAB-02 is an isolated training machine.' }],
        key: { verdict: 'false_positive', severity: 'low', noteChecks: [{ label: 'Identifies EICAR as a test file', any: ['eicar', 'test file', 'test string'] }, { label: 'References the change ticket', any: ['chg-3307', 'change ticket', 'ticket'] }], explanation: 'EICAR is a harmless industry-standard test string. The detection matches an approved change ticket on a lab machine, and AV quarantined it as designed. Close it and link CHG-3307.' }
      },
      {
        id: 'a5', title: 'Large outbound data transfer', rule: 'NET-044 Outbound volume anomaly', siemSeverity: 'high', time: '2026-03-14T01:00:04Z',
        entities: { host: 'BKP-SRV-01 (10.20.6.5)', destination: '192.0.2.200:443', bytes_out: '41.8 GB' },
        rawEvent: 'src=10.20.6.5 dst=192.0.2.200 dport=443 duration=02:41:10 bytes_out=44882903040',
        context: [{ label: 'Asset note', value: 'BKP-SRV-01 is the backup server. Nightly offsite backup job runs at 01:00.' }, { label: 'Vendor list', value: '192.0.2.200 is the contracted offsite backup provider endpoint.' }, { label: 'Baseline', value: 'The last 30 nights sent between 38 and 44 GB to the same IP.' }],
        key: { verdict: 'false_positive', severity: 'low', noteChecks: [{ label: 'Identifies the scheduled backup', any: ['backup'] }, { label: 'Uses the baseline or known destination', any: ['baseline', 'every night', 'nightly', 'vendor', 'provider', 'same ip'] }], explanation: 'This is the nightly backup to the contracted provider, inside the normal 38-44 GB range. Volume alone is not suspicious when the source, destination and timing all match the baseline.' }
      },
      {
        id: 'a6', title: 'Mailbox forwarding rule to external address', rule: 'M365-019 External auto-forward created', siemSeverity: 'medium', time: '2026-03-14T03:41:52Z',
        entities: { user: 'a.rahimova', forward_to: 'a.rahimova.personal@freemail.example', client_ip: '203.0.113.99' },
        rawEvent: 'Operation: New-InboxRule\nName: "."\nConditions: (all messages)\nActions: ForwardTo a.rahimova.personal@freemail.example; MarkAsRead; MoveToFolder "RSS Subscriptions"',
        context: [{ label: 'Sign-in log', value: 'a.rahimova signed in from 203.0.113.99 at 03:39 (risk: high, unfamiliar location). Usual sign-ins are from 198.51.100.31.' }, { label: 'Policy', value: 'Auto-forwarding company mail to personal accounts is not allowed.' }],
        key: { verdict: 'true_positive', severity: 'high', noteChecks: [{ label: 'Names the external address or rule', any: ['freemail.example', 'forward'] }, { label: 'Links it to the risky sign-in IP', any: ['203.0.113.99'] }, { label: 'Says to remove the rule and reset access', any: ['remove', 'delete', 'reset', 'revoke'] }], explanation: 'A rule with a one-character name that forwards everything, marks it read and hides it in an obscure folder is a classic sign of a compromised mailbox, and it was created right after a high-risk sign-in. High severity: remove the rule, revoke sessions, reset the password, and check what was forwarded.' }
      }
    ]
  },
  {
    slug: 'cloud-and-identity-queue',
    title: 'Cloud and identity queue',
    summary: 'Six alerts from the cloud account and identity provider. Context matters more than the rule name.',
    briefing: 'Northwind\'s cloud and identity alerts are noisier and higher stakes. Check every alert against tickets, baselines and asset notes before you decide. Severity should reflect what an attacker could do with the access involved.',
    difficulty: 'intermediate',
    estimatedMinutes: 25,
    alerts: [
      {
        id: 'b1', title: 'Root account console sign-in', rule: 'AWS-001 Root user activity', siemSeverity: 'high', time: '2026-04-05T22:17:40Z',
        entities: { account: '111122223333', identity: 'root', source_ip: '198.51.100.200', mfa_used: 'false' },
        rawEvent: '{"eventName":"ConsoleLogin","userIdentity":{"type":"Root"},"sourceIPAddress":"198.51.100.200","additionalEventData":{"MFAUsed":"No"},"responseElements":{"ConsoleLogin":"Success"}}',
        context: [{ label: 'Policy', value: 'Root is break-glass only. Use requires a ticket and two people. Root has a hardware MFA key in the safe.' }, { label: 'Tickets', value: 'No open break-glass ticket.' }, { label: 'Threat intel', value: '198.51.100.200 downloaded payroll data from a public bucket on 3 April.' }],
        key: { verdict: 'true_positive', severity: 'critical', noteChecks: [{ label: 'Points out no MFA', any: ['mfa'] }, { label: 'Names the IP', any: ['198.51.100.200'] }, { label: 'Escalates / starts incident response', any: ['escalate', 'incident', 'page', 'lock', 'rotate', 'reset'] }], explanation: 'A root login without MFA, without a ticket, from an IP already linked to a data leak means someone has full control of the account. Critical: start the incident process now, reset root credentials, and review every action taken in that session.' }
      },
      {
        id: 'b2', title: 'S3 bucket made public', rule: 'AWS-031 Bucket policy allows public read', siemSeverity: 'high', time: '2026-04-06T10:02:15Z',
        entities: { bucket: 'northwind-www-assets', identity: 'ci-deployer' },
        rawEvent: '{"eventName":"PutBucketPolicy","requestParameters":{"bucketName":"northwind-www-assets","bucketPolicy":{"Statement":[{"Effect":"Allow","Principal":"*","Action":"s3:GetObject","Resource":"arn:aws:s3:::northwind-www-assets/public/*"}]}}}',
        context: [{ label: 'Change ticket', value: 'WEB-412 (approved): "Serve website images from northwind-www-assets/public/ via public read."' }, { label: 'Data classification', value: 'northwind-www-assets is tagged data-class=public. Only marketing images are stored there.' }],
        key: { verdict: 'false_positive', severity: 'low', noteChecks: [{ label: 'References the approved change', any: ['web-412', 'ticket', 'approved'] }, { label: 'Notes the data is public / scoped to public/', any: ['public/', 'data-class', 'marketing', 'images'] }], explanation: 'Unlike the payroll bucket, this change is approved, scoped to the public/ prefix, and the bucket only holds public website images. The rule fired correctly, but the activity is intended.' }
      },
      {
        id: 'b3', title: 'Many MFA push denials, then approval', rule: 'ID-140 MFA fatigue', siemSeverity: 'medium', time: '2026-04-06T23:48:09Z',
        entities: { user: 'k.ito', source_ip: '203.0.113.61', denials: '14 in 6 minutes' },
        rawEvent: '23:42:02-23:47:51 MFA push DENIED x14 user=k.ito src=203.0.113.61\n23:48:09 MFA push APPROVED user=k.ito src=203.0.113.61 app=VPN',
        context: [{ label: 'Directory', value: 'k.ito (Sales) is on leave this week.' }, { label: 'Sign-in history', value: 'k.ito has never signed in from 203.0.113.61.' }],
        key: { verdict: 'true_positive', severity: 'high', noteChecks: [{ label: 'Describes push fatigue / repeated prompts', any: ['fatigue', 'push', 'bomb', 'spam', 'denial'] }, { label: 'Names the IP', any: ['203.0.113.61'] }, { label: 'Says to revoke sessions and reset the password', any: ['revoke', 'reset', 'disable'] }], explanation: 'The attacker already had the password and kept sending pushes until the user approved one to make them stop. High severity: revoke the session, reset the password, and move the user to number matching or a phishing-resistant method.' }
      },
      {
        id: 'b4', title: 'Repeated failed logins from one host', rule: 'AUTH-003 Excessive authentication failures', siemSeverity: 'medium', time: '2026-04-07T08:00:00Z',
        entities: { account: 'svc.scan', source: 'PRN-3F (10.20.7.30)', failures: '288 in 24h' },
        rawEvent: 'FAIL user=svc.scan src=10.20.7.30 reason=bad_password (every 5 minutes since 2026-04-06T08:00Z)',
        context: [{ label: 'Asset note', value: 'PRN-3F is the 3rd-floor multifunction printer. It logs in as svc.scan to save scans to a file share.' }, { label: 'Change log', value: 'svc.scan password was rotated on 2026-04-06 at 07:55 by IT. The printer config was not updated.' }],
        key: { verdict: 'false_positive', severity: 'low', noteChecks: [{ label: 'Identifies the password rotation / stale credential', any: ['rotat', 'stale', 'old password', 'changed'] }, { label: 'Asks IT to update the printer config', any: ['update', 'printer', 'config'] }], explanation: 'One internal device failing every five minutes with the same account, starting right after a password rotation, is a stale saved password, not an attack. Still worth fixing: update the printer config so the account does not get locked out.' }
      },
      {
        id: 'b5', title: 'Access key used from unusual location', rule: 'AWS-050 Credential used from new IP', siemSeverity: 'medium', time: '2026-04-07T02:11:30Z',
        entities: { identity: 'payroll-export-job', access_key: 'AKIAEXAMPLE-PAYROLL', source_ip: '203.0.113.150' },
        rawEvent: '02:11:30 ListBuckets src=203.0.113.150 ua=aws-cli/2.15\n02:11:44 GetObject northwind-payroll-exports/2026-03/payroll.csv\n02:12:05 GetObject northwind-hr-archive/2025/contracts.zip (AccessDenied)\n02:12:19 ListUsers (AccessDenied)',
        context: [{ label: 'Baseline', value: 'This key has only ever been used from 10.40.3.21 (the payroll export server) by aws-sdk-python.' }, { label: 'Threat intel', value: '203.0.113.150 downloaded payroll data from the public bucket on 3 April.' }],
        key: { verdict: 'true_positive', severity: 'high', noteChecks: [{ label: 'Names the access key or identity', any: ['payroll-export-job', 'akiaexample-payroll', 'access key'] }, { label: 'Notes the change from the baseline IP / tool', any: ['10.40.3.21', 'baseline', 'aws-cli', 'new ip'] }, { label: 'Says to deactivate / rotate the key', any: ['deactivate', 'disable', 'rotate', 'revoke'] }], explanation: 'A machine key that only ever runs from one server is now used from an outside IP with a different tool, and the caller is probing permissions (AccessDenied on ListUsers). The key has leaked. Deactivate it now, rotate, and find where it leaked from.' }
      },
      {
        id: 'b6', title: 'Global administrator role assigned', rule: 'ID-201 Privileged role granted', siemSeverity: 'high', time: '2026-04-07T11:30:44Z',
        entities: { target_user: 'dev.intern', role: 'Global Administrator', granted_by: 'alice.admin' },
        rawEvent: 'Operation: Add member to role\nRole: Global Administrator\nTarget: dev.intern@northwind.example\nInitiatedBy: alice.admin@northwind.example (IP 10.40.2.15, compliant device)',
        context: [{ label: 'Ticket', value: 'IAM-2291 (approved): "Give dev.intern read access to usage reports" - requested role: Reports Reader.' }, { label: 'Admin activity', value: 'alice.admin signed in normally from her usual device and IP.' }],
        key: { verdict: 'true_positive', severity: 'medium', noteChecks: [{ label: 'Points out the mismatch with the ticket', any: ['iam-2291', 'reports reader', 'ticket', 'mismatch'] }, { label: 'Says to remove the excess role', any: ['remove', 'revoke', 'downgrade', 'least privilege'] }], explanation: 'The admin is legitimate, but the grant is far beyond what was approved: Global Administrator instead of Reports Reader. It is probably a mistake rather than an attack, yet it is a real security problem. Remove the role, grant the right one, and let alice.admin know.' }
      }
    ]
  }
];

export function findSocShift(slug: string) {
  return socShifts.find((shift) => shift.slug === slug) ?? null;
}
