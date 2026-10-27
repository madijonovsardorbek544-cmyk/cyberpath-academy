// A fictional morning of SIEM data for Northwind Traders, built with a fixed seed so every learner
// and every test sees the same events. Hidden inside the normal noise: an MFA push-fatigue login over
// VPN, remote WMI to a workstation, and a new process beaconing every 300 seconds.
// All IPs are RFC 1918 or RFC 5737 and all domains end in .example.

const users = [
  'a.karimov', 'b.tursunova', 'c.lee', 'd.okafor', 'e.ivanova', 'f.nazarov', 'g.mendes', 'h.saidova', 'i.petrov', 'j.wong',
  'k.ahmedova', 'l.garcia', 'm.usmonov', 'n.kim', 'o.fayzullaeva', 'p.novak', 'q.hasanov', 'r.ito', 'd.rahimov', 's.yusupova',
  't.brown', 'u.mirzaeva', 'v.costa', 'w.ergashev', 'x.silva', 'y.abdullaeva', 'z.morris', 'aa.kholmatov', 'bb.ali', 'cc.jensen',
  'dd.qodirova', 'ee.santos', 'ff.rashidov', 'gg.olsen', 'hh.nurmatova', 'ii.patel', 'jj.sobirov', 'kk.weber', 'll.tosheva', 'mm.reyes'
];
const hostOf = (index: number) => `WS-OPS-${String(index + 1).padStart(2, '0')}`;
const ipOf = (index: number) => `10.30.2.${20 + index}`;

const domains = [
  { name: 'mail.northwind.example', ip: '10.30.0.25' }, { name: 'intranet.northwind.example', ip: '10.30.0.30' },
  { name: 'crm.saas.example', ip: '203.0.113.21' }, { name: 'docs.vendor.example', ip: '203.0.113.34' },
  { name: 'cdn.office.example', ip: '203.0.113.50' }, { name: 'news.example', ip: '198.51.100.70' },
  { name: 'weather.example', ip: '198.51.100.71' }, { name: 'updates.osvendor.example', ip: '203.0.113.60' },
  { name: 'meet.video.example', ip: '203.0.113.88' }, { name: 'hr.payroll.example', ip: '203.0.113.95' },
  { name: 'search.example', ip: '198.51.100.80' }, { name: 'maps.example', ip: '198.51.100.81' },
  { name: 'translate.example', ip: '198.51.100.82' }, { name: 'status.cloud.example', ip: '203.0.113.101' }
];
const apps = [
  { process: 'outlook.exe', parent: 'explorer.exe' }, { process: 'chrome.exe', parent: 'explorer.exe' },
  { process: 'teams.exe', parent: 'explorer.exe' }, { process: 'excel.exe', parent: 'outlook.exe' },
  { process: 'winword.exe', parent: 'explorer.exe' }, { process: 'onedrive.exe', parent: 'explorer.exe' },
  { process: 'msedgeupdate.exe', parent: 'services.exe' }, { process: 'notepad.exe', parent: 'explorer.exe' }
];

/** mulberry32: tiny seeded PRNG so the dataset is identical everywhere. */
function rng(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const START = Date.parse('2026-05-21T07:00:00Z');
const END = Date.parse('2026-05-21T11:00:00Z');
const iso = (ms: number) => `${new Date(ms).toISOString().slice(0, 19)}Z`;

export function buildNorthwindSiemEvents() {
  const random = rng(20260521);
  const pick = <T>(list: T[]) => list[Math.floor(random() * list.length)];
  const between = (from: number, to: number) => from + Math.floor(random() * (to - from));
  const events: Array<Record<string, unknown> & { ts: string }> = [];
  const add = (ms: number, event: Record<string, unknown>) => events.push({ ts: iso(ms), ...event });

  // Morning sign-ins: everyone once, some again later. A few typo failures.
  users.forEach((user, index) => {
    const first = between(START, START + 90 * 60 * 1000);
    add(first, { sourcetype: 'auth', app: 'sso', user, src_ip: ipOf(index), action: 'success', mfa_result: 'approved' });
    if (random() < 0.5) add(between(first, END), { sourcetype: 'auth', app: 'sso', user, src_ip: ipOf(index), action: 'success', mfa_result: 'approved' });
  });
  for (let i = 0; i < 12; i += 1) {
    const index = between(0, users.length);
    add(between(START, END), { sourcetype: 'auth', app: 'sso', user: users[index], src_ip: ipOf(index), action: 'failure', mfa_result: 'none', reason: 'bad_password' });
  }
  // Staff working from home over VPN.
  for (let i = 0; i < 8; i += 1) {
    const user = users[between(0, users.length)];
    if (user === 'd.rahimov') continue;
    add(between(START, END), { sourcetype: 'auth', app: 'vpn', user, src_ip: `192.0.2.${between(10, 200)}`, action: 'success', mfa_result: 'approved', assigned_ip: `10.30.250.${30 + i}` });
  }
  // Decoy: s.yusupova taps "deny" twice by mistake, then approves, from her own workstation.
  const sIndex = users.indexOf('s.yusupova');
  const sAt = Date.parse('2026-05-21T08:14:02Z');
  [0, 1].forEach((n) => add(sAt + n * 40_000, { sourcetype: 'auth', app: 'sso', user: 's.yusupova', src_ip: ipOf(sIndex), action: 'failure', mfa_result: 'denied' }));
  add(sAt + 95_000, { sourcetype: 'auth', app: 'sso', user: 's.yusupova', src_ip: ipOf(sIndex), action: 'success', mfa_result: 'approved' });

  // Normal web, DNS and process noise.
  for (let i = 0; i < 900; i += 1) {
    const index = between(0, users.length);
    const domain = pick(domains);
    add(between(START, END), { sourcetype: 'proxy', src_ip: ipOf(index), host: hostOf(index), user: users[index], url_domain: domain.name, method: random() < 0.85 ? 'GET' : 'POST', status: random() < 0.95 ? 200 : 304, bytes_out: between(300, 4000), bytes_in: between(2000, 600000) });
  }
  for (let i = 0; i < 320; i += 1) {
    const index = between(0, users.length);
    const domain = pick(domains);
    add(between(START, END), { sourcetype: 'dns', src_ip: ipOf(index), query: domain.name, answer: domain.ip });
  }
  for (let i = 0; i < 140; i += 1) {
    const index = between(0, users.length);
    const app = pick(apps);
    add(between(START, END), { sourcetype: 'edr', event: 'process_start', host: hostOf(index), user: users[index], process: app.process, parent: app.parent, cmdline: `"C:\\Program Files\\${app.process.replace('.exe', '')}\\${app.process}"` });
  }

  // The incident.
  const attacker = '198.51.100.23';
  const pushStart = Date.parse('2026-05-21T09:31:05Z');
  for (let n = 0; n < 14; n += 1) add(pushStart + n * 61_000, { sourcetype: 'auth', app: 'vpn', user: 'd.rahimov', src_ip: attacker, action: 'failure', mfa_result: 'denied' });
  add(Date.parse('2026-05-21T09:45:12Z'), { sourcetype: 'auth', app: 'vpn', user: 'd.rahimov', src_ip: attacker, action: 'success', mfa_result: 'approved', assigned_ip: '10.30.250.12' });
  const victim = users.indexOf('d.rahimov');
  add(Date.parse('2026-05-21T09:52:40Z'), { sourcetype: 'auth', app: 'wmi', user: 'd.rahimov', src_ip: '10.30.250.12', dest_host: hostOf(victim), action: 'success', mfa_result: 'none' });
  add(Date.parse('2026-05-21T09:52:44Z'), { sourcetype: 'edr', event: 'process_start', host: hostOf(victim), user: 'd.rahimov', process: 'syshelper.exe', parent: 'wmiprvse.exe', cmdline: 'C:\\Users\\d.rahimov\\AppData\\Local\\Temp\\syshelper.exe --host cdn-telemetry.example --interval 300' });
  add(Date.parse('2026-05-21T09:52:47Z'), { sourcetype: 'dns', src_ip: ipOf(victim), query: 'cdn-telemetry.example', answer: '203.0.113.140' });
  for (let at = Date.parse('2026-05-21T09:52:48Z'); at < END; at += 300_000) {
    add(at, { sourcetype: 'proxy', src_ip: ipOf(victim), host: hostOf(victim), user: 'd.rahimov', url_domain: 'cdn-telemetry.example', method: 'POST', status: 200, bytes_out: 412, bytes_in: 128 });
  }

  return events.sort((a, b) => a.ts.localeCompare(b.ts));
}

/** The dataset as JSON lines, the format most SIEMs export. */
export const northwindSiemLog = buildNorthwindSiemEvents().map((event) => JSON.stringify(event)).join('\n');
