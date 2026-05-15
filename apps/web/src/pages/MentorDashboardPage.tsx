import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { AppShell } from '../components/AppShell';
import { Badge, Button, Card, Input, Loader, SectionTitle, Select, Textarea } from '../components/ui';
import type { Cohort, MentorAlert, MentorAssignment } from '../types';

type MentorStudent = {
  id: string;
  name: string;
  email: string;
  goal?: string | null;
  analytics: {
    completionRate: number;
    totalQuizAccuracy: number;
    timeStudied: number;
    streakDays: number;
    readiness: { specialization: number; capstone: number };
    weakTopics: { topic: string }[];
  };
  mastery: { trackSlug: string; title: string; status: string; reviewDueCount?: number }[];
  portfolioCount: number;
  assignmentCount?: number;
  cohort?: Cohort | null;
};

type MentorFeedbackItem = {
  id: string;
  message: string;
  createdAt: string;
  student: { name: string; email: string };
};

export function MentorDashboardPage() {
  const [students, setStudents] = useState<MentorStudent[] | null>(null);
  const [feedback, setFeedback] = useState<MentorFeedbackItem[] | null>(null);
  const [alerts, setAlerts] = useState<(MentorAlert & { student?: { name: string; email: string } | null })[] | null>(null);
  const [cohorts, setCohorts] = useState<Cohort[] | null>(null);
  const [assignments, setAssignments] = useState<MentorAssignment[] | null>(null);
  const [studentId, setStudentId] = useState('');
  const [message, setMessage] = useState('Your momentum is real, but your terminology is still loose in risk and IAM. Tighten definitions and justify each action with evidence.');
  const [assignmentTitle, setAssignmentTitle] = useState('Mastery recovery sprint');
  const [assignmentInstructions, setAssignmentInstructions] = useState('Complete one focused lesson, one review rep, and one applied explanation. Be specific about why each defensive action matters.');
  const [assignmentDueAt, setAssignmentDueAt] = useState('');
  const [assignmentTargetMastery, setAssignmentTargetMastery] = useState('70');

  const load = async () => {
    const [studentData, feedbackData, alertsData, cohortsData, assignmentsData] = await Promise.all([
      api.get<{ students: MentorStudent[] }>('/mentor/students'),
      api.get<{ feedback: MentorFeedbackItem[] }>('/mentor/feedback'),
      api.get<{ alerts: (MentorAlert & { student?: { name: string; email: string } | null })[] }>('/mentor/alerts'),
      api.get<{ cohorts: Cohort[] }>('/mentor/cohorts'),
      api.get<{ assignments: MentorAssignment[] }>('/mentor/assignments')
    ]);
    setStudents(studentData.students);
    setFeedback(feedbackData.feedback);
    setAlerts(alertsData.alerts);
    setCohorts(cohortsData.cohorts);
    setAssignments(assignmentsData.assignments);
    if (studentData.students[0] && !studentId) setStudentId(studentData.students[0].id);
  };

  useEffect(() => {
    load();
  }, []);

  const selected = useMemo(() => students?.find((item) => item.id === studentId), [students, studentId]);
  const selectedAssignments = useMemo(() => assignments?.filter((item) => item.studentId === studentId) || [], [assignments, studentId]);
  const cohortStats = useMemo(() => {
    const list = students || [];
    const totalStudents = list.length;
    const activeThisWeek = list.filter((student) => student.analytics.streakDays > 0 || student.analytics.timeStudied > 0).length;
    const averageQuizAccuracy = totalStudents ? Math.round(list.reduce((sum, student) => sum + student.analytics.totalQuizAccuracy, 0) / totalStudents) : 0;
    const lessonsCompleted = list.reduce((sum, student) => sum + Math.round((student.analytics.completionRate / 100) * 30), 0);
    const labsSubmitted = list.reduce((sum, student) => sum + Math.max(1, student.portfolioCount), 0);
    const studentsNeedingHelp = list.filter((student) => student.analytics.totalQuizAccuracy < 75 || student.analytics.completionRate < 25).length;
    const portfolioArtifacts = list.reduce((sum, student) => sum + student.portfolioCount, 0);
    const weakTopics = Array.from(new Set(list.flatMap((student) => student.analytics.weakTopics.map((topic) => topic.topic)))).slice(0, 5);
    return { totalStudents, activeThisWeek, lessonsCompleted, averageQuizAccuracy, labsSubmitted, studentsNeedingHelp, portfolioArtifacts, weakTopics, assignmentsDue: (assignments || []).filter((item) => item.status !== 'done').length };
  }, [students, assignments]);

  const exportCsvReport = () => {
    const rows = [['name', 'email', 'goal', 'completion_rate', 'quiz_average', 'time_studied', 'streak_days', 'portfolio_artifacts', 'open_assignments', 'recommended_next_step']];
    (students || []).forEach((student) => rows.push([student.name, student.email, student.goal || '', String(student.analytics.completionRate), String(student.analytics.totalQuizAccuracy), String(student.analytics.timeStudied), String(student.analytics.streakDays), String(student.portfolioCount), String(student.assignmentCount || 0), student.analytics.totalQuizAccuracy < 75 ? 'Assign targeted review sprint' : 'Create next portfolio artifact']));
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/\"/g, '\"\"')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'cyberpath-cohort-report.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (!students || !feedback || !alerts || !cohorts || !assignments) return <AppShell><Loader text="Loading mentor dashboard..." /></AppShell>;

  const submitFeedback = async (event: FormEvent) => {
    event.preventDefault();
    await api.post('/mentor/feedback', { studentId, message });
    setMessage('');
    load();
  };

  const submitAssignment = async (event: FormEvent) => {
    event.preventDefault();
    await api.post('/mentor/assignments', {
      studentId,
      title: assignmentTitle,
      instructions: assignmentInstructions,
      targetMastery: assignmentTargetMastery ? Number(assignmentTargetMastery) : null,
      dueAt: assignmentDueAt ? new Date(assignmentDueAt).toISOString() : null,
      rubric: ['Shows correct defensive reasoning', 'Uses accurate cybersecurity terminology', 'Explains evidence clearly']
    });
    setAssignmentTitle('Mastery recovery sprint');
    setAssignmentInstructions('Complete one focused lesson, one review rep, and one applied explanation. Be specific about why each defensive action matters.');
    setAssignmentDueAt('');
    load();
  };

  const updateAlertStatus = async (id: string, status: 'open' | 'reviewing' | 'resolved') => {
    await api.patch(`/mentor/alerts/${id}`, { status });
    load();
  };

  const updateAssignmentStatus = async (id: string, status: 'open' | 'in_progress' | 'done') => {
    await api.patch(`/mentor/assignments/${id}`, { status });
    load();
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <SectionTitle eyebrow="Mentor cohort dashboard" title="See weak areas and intervene before learners stall." subtitle="Teachers and mentors get cohort analytics, student reports, assignments, at-risk alerts, and portfolio evidence review in one school-ready workflow." />
          <Button className="border border-slate-700 bg-slate-900 text-white" onClick={exportCsvReport}>Export CSV report</Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="p-5"><p className="text-sm text-slate-400">Total students</p><p className="mt-2 text-3xl font-semibold text-white">{cohortStats.totalStudents}</p></Card>
          <Card className="p-5"><p className="text-sm text-slate-400">Active this week</p><p className="mt-2 text-3xl font-semibold text-white">{cohortStats.activeThisWeek}</p></Card>
          <Card className="p-5"><p className="text-sm text-slate-400">Avg quiz accuracy</p><p className="mt-2 text-3xl font-semibold text-white">{cohortStats.averageQuizAccuracy}%</p></Card>
          <Card className="p-5"><p className="text-sm text-slate-400">Students needing help</p><p className="mt-2 text-3xl font-semibold text-white">{cohortStats.studentsNeedingHelp}</p></Card>
          <Card className="p-5"><p className="text-sm text-slate-400">Lessons completed</p><p className="mt-2 text-3xl font-semibold text-white">{cohortStats.lessonsCompleted}</p></Card>
          <Card className="p-5"><p className="text-sm text-slate-400">Labs submitted</p><p className="mt-2 text-3xl font-semibold text-white">{cohortStats.labsSubmitted}</p></Card>
          <Card className="p-5"><p className="text-sm text-slate-400">Assignments due</p><p className="mt-2 text-3xl font-semibold text-white">{cohortStats.assignmentsDue}</p></Card>
          <Card className="p-5"><p className="text-sm text-slate-400">Portfolio artifacts</p><p className="mt-2 text-3xl font-semibold text-white">{cohortStats.portfolioArtifacts}</p></Card>
        </div>
        <Card className="p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-semibold text-white">Weak topics by cohort</h3><Badge>school plan signal</Badge></div><div className="mt-3 flex flex-wrap gap-2">{cohortStats.weakTopics.length ? cohortStats.weakTopics.map((topic) => <Badge key={topic} className="border-amber-400/40 text-amber-200">{topic}</Badge>) : <span className="text-sm text-slate-400">No weak-topic alerts yet.</span>}</div></Card>
        <div className="grid gap-5 xl:grid-cols-[1fr,0.9fr]">
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-white">Assigned students</h3>
            <div className="mt-4 space-y-4">
              {students.map((student) => (
                <div key={student.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{student.name}</p>
                      <p className="text-sm text-slate-400">{student.email} · {student.goal || 'No goal set'}</p>
                    </div>
                    <div className="flex gap-2"><Badge>{student.analytics.completionRate}% completion</Badge><Badge>{student.analytics.totalQuizAccuracy}% accuracy</Badge></div>
                  </div>
                  <p className="mt-3 text-sm text-slate-400">Weak areas: {student.analytics.weakTopics.length ? student.analytics.weakTopics.map((item) => item.topic).join(', ') : 'not enough data yet'}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {student.mastery.slice(0, 3).map((item) => <Badge key={item.trackSlug}>{item.title}: {item.status}</Badge>)}
                    <Badge>{student.portfolioCount} portfolio items</Badge>
                    <Badge>{student.assignmentCount || 0} active assignments</Badge>
                    {student.cohort ? <Badge>{student.cohort.name}</Badge> : null}
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <div className="space-y-5">
            <Card className="p-5">
              <h3 className="text-lg font-semibold text-white">Leave feedback</h3>
              <form className="mt-4 space-y-4" onSubmit={submitFeedback}>
                <Select value={studentId} onChange={(event) => setStudentId(event.target.value)}>
                  {students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
                </Select>
                <Textarea value={message} onChange={(event) => setMessage(event.target.value)} />
                <Button className="bg-sky-400 text-slate-950">Send feedback</Button>
              </form>
            </Card>
            <Card className="p-5">
              <h3 className="text-lg font-semibold text-white">Create assignment</h3>
              <form className="mt-4 space-y-4" onSubmit={submitAssignment}>
                <Select value={studentId} onChange={(event) => setStudentId(event.target.value)}>
                  {students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
                </Select>
                <Input value={assignmentTitle} onChange={(event) => setAssignmentTitle(event.target.value)} placeholder="Assignment title" />
                <Textarea value={assignmentInstructions} onChange={(event) => setAssignmentInstructions(event.target.value)} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input value={assignmentTargetMastery} onChange={(event) => setAssignmentTargetMastery(event.target.value)} type="number" min="0" max="100" placeholder="Target mastery" />
                  <Input value={assignmentDueAt} onChange={(event) => setAssignmentDueAt(event.target.value)} type="date" />
                </div>
                <Button className="bg-sky-400 text-slate-950">Assign work</Button>
              </form>
            </Card>
            <Card className="p-5">
              <h3 className="text-lg font-semibold text-white">Selected student snapshot</h3>
              {selected ? (
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <p>Time studied: {selected.analytics.timeStudied} min</p>
                  <p>Streak: {selected.analytics.streakDays} days</p>
                  <p>Capstone readiness: {selected.analytics.readiness.capstone}%</p>
                  <p>Specialization readiness: {selected.analytics.readiness.specialization}%</p>
                </div>
              ) : null}
            </Card>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr,1fr]">
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-white">Intervention alerts</h3>
            <div className="mt-4 space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{alert.student?.name || alert.studentId}</p>
                      <p className="mt-1 text-sm text-slate-400">{alert.summary}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={alert.severity === 'high' ? 'border-rose-400/40 text-rose-200' : alert.severity === 'medium' ? 'border-amber-400/40 text-amber-200' : ''}>{alert.severity}</Badge>
                      <Select className="w-auto min-w-[140px]" value={alert.status} onChange={(event) => updateAlertStatus(alert.id, event.target.value as 'open' | 'reviewing' | 'resolved')}>
                        <option value="open">open</option>
                        <option value="reviewing">reviewing</option>
                        <option value="resolved">resolved</option>
                      </Select>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">Recommendation: {alert.recommendation}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-white">Assignments for selected student</h3>
            <div className="mt-4 space-y-3">
              {selectedAssignments.length ? selectedAssignments.map((assignment) => (
                <div key={assignment.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium text-white">{assignment.title}</p>
                    <Select className="w-auto min-w-[140px]" value={assignment.status} onChange={(event) => updateAssignmentStatus(assignment.id, event.target.value as 'open' | 'in_progress' | 'done')}>
                      <option value="open">open</option>
                      <option value="in_progress">in progress</option>
                      <option value="done">done</option>
                    </Select>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{assignment.instructions}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                    {assignment.targetMastery ? <span>Target {assignment.targetMastery}% mastery</span> : null}
                    {assignment.dueAt ? <span>Due {new Date(assignment.dueAt).toLocaleDateString()}</span> : null}
                  </div>
                </div>
              )) : <p className="text-sm text-slate-400">No assignments for this student yet.</p>}
            </div>
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr,1fr]">
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-white">Recent feedback log</h3>
            <div className="mt-4 space-y-3">
              {feedback.slice(0, 5).map((item) => <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"><p className="font-medium text-white">{item.student.name}</p><p className="mt-2 text-sm text-slate-400">{item.message}</p></div>)}
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-white">Cohorts</h3>
            <div className="mt-4 space-y-3">
              {cohorts.map((cohort) => (
                <div key={cohort.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium text-white">{cohort.name}</p>
                    <Badge>{cohort.memberCount || cohort.members?.length || 0} members</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{cohort.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {cohort.members?.map((member) => <Badge key={member.id}>{member.name} · {member.membershipRole}</Badge>)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
