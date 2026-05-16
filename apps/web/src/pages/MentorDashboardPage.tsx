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

type CohortDashboard = {
  metrics: { totalStudents: number; activeThisWeek: number; inactiveStudents: number; lessonsCompleted: number; quizAverage: number; labsSubmitted: number; portfolioArtifactsCreated: number; weakTopics: string[]; assignmentsDue: number; studentsNeedingHelp: number };
  students: { id: string; name: string; email: string; goalPath: string; lessonsCompleted: number; quizAccuracy: number; labsCompleted: number; portfolioArtifacts: number; lastActiveAt: string; riskStatus: string; recommendedNextAction: string }[];
  masteryHeatmap?: { studentId: string; studentName: string; skills: { skillId: string; title: string; category: string; score: number; state: string }[] }[];
  studentsReadyForLab?: { id: string; name: string }[];
  studentsNeedingReview?: { id: string; name: string }[];
  weakTopicHeatmap: { topic: string; affectedStudents: number; intensity: number }[];
  inactiveAlerts: { studentId: string; name: string; lastActiveAt: string; recommendedNextAction: string }[];
  labSubmissions: { id: string; studentName: string; labTitle: string; score: number; feedback: string; createdAt: string }[];
  artifactReviews: { id: string; title: string; artifactType: string; status: string; studentName?: string; mentorFeedback?: string | null }[];
};

export function MentorDashboardPage() {
  const [students, setStudents] = useState<MentorStudent[] | null>(null);
  const [feedback, setFeedback] = useState<MentorFeedbackItem[] | null>(null);
  const [alerts, setAlerts] = useState<(MentorAlert & { student?: { name: string; email: string } | null })[] | null>(null);
  const [cohorts, setCohorts] = useState<Cohort[] | null>(null);
  const [assignments, setAssignments] = useState<MentorAssignment[] | null>(null);
  const [cohortDashboard, setCohortDashboard] = useState<CohortDashboard | null>(null);
  const [studentId, setStudentId] = useState('');
  const [message, setMessage] = useState('Your momentum is real, but your terminology is still loose in risk and IAM. Tighten definitions and justify each action with evidence.');
  const [assignmentTitle, setAssignmentTitle] = useState('Mastery recovery sprint');
  const [assignmentInstructions, setAssignmentInstructions] = useState('Complete one focused lesson, one review rep, and one applied explanation. Be specific about why each defensive action matters.');
  const [assignmentDueAt, setAssignmentDueAt] = useState('');
  const [assignmentTargetMastery, setAssignmentTargetMastery] = useState('70');

  const load = async () => {
    const [dashboardData, studentData, feedbackData, alertsData, cohortsData, assignmentsData] = await Promise.all([
      api.get<CohortDashboard>('/mentor/cohort-dashboard'),
      api.get<{ students: MentorStudent[] }>('/mentor/students'),
      api.get<{ feedback: MentorFeedbackItem[] }>('/mentor/feedback'),
      api.get<{ alerts: (MentorAlert & { student?: { name: string; email: string } | null })[] }>('/mentor/alerts'),
      api.get<{ cohorts: Cohort[] }>('/mentor/cohorts'),
      api.get<{ assignments: MentorAssignment[] }>('/mentor/assignments')
    ]);
    setCohortDashboard(dashboardData);
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

  if (!students || !feedback || !alerts || !cohorts || !assignments || !cohortDashboard) return <AppShell><Loader text="Loading mentor dashboard..." /></AppShell>;

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
          <Card className="p-5"><p className="text-sm text-slate-400">Total students</p><p className="mt-2 text-3xl font-semibold text-white">{cohortDashboard.metrics.totalStudents}</p></Card>
          <Card className="p-5"><p className="text-sm text-slate-400">Active this week</p><p className="mt-2 text-3xl font-semibold text-white">{cohortDashboard.metrics.activeThisWeek}</p></Card>
          <Card className="p-5"><p className="text-sm text-slate-400">Avg quiz accuracy</p><p className="mt-2 text-3xl font-semibold text-white">{cohortDashboard.metrics.quizAverage}%</p></Card>
          <Card className="p-5"><p className="text-sm text-slate-400">Students needing help</p><p className="mt-2 text-3xl font-semibold text-white">{cohortDashboard.metrics.studentsNeedingHelp}</p></Card>
          <Card className="p-5"><p className="text-sm text-slate-400">Lessons completed</p><p className="mt-2 text-3xl font-semibold text-white">{cohortDashboard.metrics.lessonsCompleted}</p></Card>
          <Card className="p-5"><p className="text-sm text-slate-400">Labs submitted</p><p className="mt-2 text-3xl font-semibold text-white">{cohortDashboard.metrics.labsSubmitted}</p></Card>
          <Card className="p-5"><p className="text-sm text-slate-400">Assignments due</p><p className="mt-2 text-3xl font-semibold text-white">{cohortDashboard.metrics.assignmentsDue}</p></Card>
          <Card className="p-5"><p className="text-sm text-slate-400">Portfolio artifacts</p><p className="mt-2 text-3xl font-semibold text-white">{cohortDashboard.metrics.portfolioArtifactsCreated}</p></Card>
        </div>
        <Card className="p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-semibold text-white">Weak topics by cohort</h3><Badge>school plan signal</Badge></div><div className="mt-3 flex flex-wrap gap-2">{cohortDashboard.metrics.weakTopics.length ? cohortDashboard.metrics.weakTopics.map((topic) => <Badge key={topic} className="border-amber-400/40 text-amber-200">{topic}</Badge>) : <span className="text-sm text-slate-400">No weak-topic alerts yet.</span>}</div></Card>
        <div className="grid gap-5 xl:grid-cols-[1.2fr,0.8fr]">
          <Card className="p-5 overflow-x-auto"><h3 className="text-lg font-semibold text-white">Student progress and risk table</h3><table className="mt-4 min-w-full text-left text-sm"><thead className="text-slate-400"><tr>{['Name','Goal/path','Lessons','Quiz','Labs','Artifacts','Last active','Risk','Next action'].map((head) => <th key={head} className="px-3 py-2 font-medium">{head}</th>)}</tr></thead><tbody>{cohortDashboard.students.map((student) => <tr key={student.id} className="border-t border-slate-800"><td className="px-3 py-3 text-white">{student.name}</td><td className="px-3 py-3 text-slate-300">{student.goalPath}</td><td className="px-3 py-3 text-slate-300">{student.lessonsCompleted}</td><td className="px-3 py-3 text-slate-300">{student.quizAccuracy}%</td><td className="px-3 py-3 text-slate-300">{student.labsCompleted}</td><td className="px-3 py-3 text-slate-300">{student.portfolioArtifacts}</td><td className="px-3 py-3 text-slate-300">{new Date(student.lastActiveAt).toLocaleDateString()}</td><td className="px-3 py-3"><Badge className={student.riskStatus === 'inactive' || student.riskStatus === 'struggling' ? 'border-rose-400/40 text-rose-200' : student.riskStatus === 'needs attention' ? 'border-amber-400/40 text-amber-200' : 'border-emerald-400/40 text-emerald-200'}>{student.riskStatus}</Badge></td><td className="px-3 py-3 text-slate-300">{student.recommendedNextAction}</td></tr>)}</tbody></table></Card>
          <div className="space-y-5"><Card className="p-5"><h3 className="text-lg font-semibold text-white">Weak-topic heatmap</h3><div className="mt-4 space-y-3">{cohortDashboard.weakTopicHeatmap.map((item) => <div key={item.topic}><div className="flex justify-between text-sm"><span className="text-slate-300">{item.topic}</span><span className="text-sky-200">{item.affectedStudents} students</span></div><div className="mt-2 h-2 rounded-full bg-slate-800"><div className="h-2 rounded-full bg-amber-300" style={{ width: `${item.intensity}%` }} /></div></div>)}</div></Card><Card className="p-5"><h3 className="text-lg font-semibold text-white">Inactive student alerts</h3><div className="mt-4 space-y-3">{cohortDashboard.inactiveAlerts.length ? cohortDashboard.inactiveAlerts.map((alert) => <div key={alert.studentId} className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-50"><p className="font-medium">{alert.name}</p><p className="mt-1">{alert.recommendedNextAction}</p></div>) : <p className="text-sm text-slate-400">No inactive students in the current demo cohort.</p>}</div></Card></div>
        </div>
        <div className="grid gap-5 xl:grid-cols-2"><Card className="p-5"><h3 className="text-lg font-semibold text-white">Lab submission review</h3><div className="mt-4 space-y-3">{cohortDashboard.labSubmissions.slice(0, 4).map((submission) => <div key={submission.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"><div className="flex justify-between gap-3"><p className="font-medium text-white">{submission.studentName} · {submission.labTitle}</p><Badge>{submission.score}%</Badge></div><p className="mt-2 text-sm text-slate-400">{submission.feedback}</p></div>)}</div></Card><Card className="p-5"><h3 className="text-lg font-semibold text-white">Portfolio artifact review</h3><div className="mt-4 space-y-3">{cohortDashboard.artifactReviews.slice(0, 4).map((artifact) => <div key={artifact.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"><div className="flex justify-between gap-3"><p className="font-medium text-white">{artifact.title}</p><Badge>{artifact.status}</Badge></div><p className="mt-2 text-sm text-slate-400">{artifact.studentName || 'Student'} · {artifact.artifactType}</p>{artifact.mentorFeedback ? <p className="mt-2 text-sm text-amber-200">Feedback: {artifact.mentorFeedback}</p> : null}</div>)}</div></Card></div>
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

        {cohortDashboard?.masteryHeatmap?.length ? (
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">Cohort mastery heatmap</h3>
                <p className="mt-1 text-sm text-slate-400">Rows are assigned learners; columns are mapped defensive skills. Use this to assign review, labs, or portfolio proof.</p>
              </div>
              <div className="flex flex-wrap gap-2"><Badge>{cohortDashboard.studentsNeedingReview?.length ?? 0} need review</Badge><Badge>{cohortDashboard.studentsReadyForLab?.length ?? 0} ready for labs</Badge></div>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead><tr><th className="sticky left-0 bg-slate-950 p-2 text-slate-400">Student</th>{cohortDashboard.masteryHeatmap[0].skills.map((skill) => <th key={skill.skillId} className="min-w-[120px] p-2 text-slate-400">{skill.title}</th>)}</tr></thead>
                <tbody>{cohortDashboard.masteryHeatmap.map((row) => <tr key={row.studentId} className="border-t border-slate-800"><td className="sticky left-0 bg-slate-950 p-2 font-medium text-white">{row.studentName}</td>{row.skills.map((skill) => <td key={skill.skillId} className="p-2"><span className={`inline-flex rounded-full border px-2 py-1 ${skill.state === 'mastered' ? 'border-emerald-400/40 text-emerald-100' : skill.state === 'needs_review' ? 'border-rose-400/40 text-rose-100' : skill.state === 'proficient' ? 'border-sky-400/40 text-sky-100' : 'border-slate-700 text-slate-300'}`}>{skill.state.replace('_', ' ')} · {skill.score}%</span></td>)}</tr>)}</tbody>
              </table>
            </div>
          </Card>
        ) : null}

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
