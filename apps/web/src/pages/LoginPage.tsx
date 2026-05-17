import { FormEvent, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button, Card, ErrorMessage, FormField, Input, SectionTitle } from "../components/ui";
import { isMockApiMode } from "../api/client";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("student@cyberpath.local");
  const [password, setPassword] = useState("Student123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const enterDemo = async (role: "student" | "mentor" | "admin" = "student") => {
    const accounts = {
      student: { email: "student@cyberpath.local", password: "Student123!" },
      mentor: { email: "mentor@cyberpath.local", password: "Mentor123!" },
      admin: { email: "admin@cyberpath.local", password: "Admin123!" }
    };
    setLoading(true);
    setError("");
    try {
      const account = accounts[role];
      await login(account.email, account.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo login failed.");
    } finally {
      setLoading(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup({ name, email, password });
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-glow px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr,1.1fr]">
        <div className="space-y-6">
          <Link to="/" className="text-sm text-sky-300">← Back to landing</Link>
          <SectionTitle eyebrow="Authentication" title="Sign in fast, or create a clean account." subtitle="Use the seeded demo accounts immediately or create a fresh student account. Password reset is available in dev mode with a visible reset token." />
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white">{isMockApiMode ? "Public demo access" : "Seeded local accounts"}</h3>
            {isMockApiMode ? (
              <div className="mt-4 space-y-4 text-sm text-slate-300">
                <p>Use a one-click demo account to review the student, mentor, or admin experience without connecting to a live backend.</p>
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                  <Button className="bg-sky-400 text-slate-950" disabled={loading} onClick={() => enterDemo("student")}>Try student demo</Button>
                  <Button className="border border-slate-700 bg-slate-900 text-white" disabled={loading} onClick={() => enterDemo("mentor")}>Try mentor demo</Button>
                  <Button className="border border-slate-700 bg-slate-900 text-white" disabled={loading} onClick={() => enterDemo("admin")}>Try admin demo</Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <p><strong>Student:</strong> student@cyberpath.local / Student123!</p>
                <p><strong>Mentor:</strong> mentor@cyberpath.local / Mentor123!</p>
                <p><strong>Admin:</strong> admin@cyberpath.local / Admin123!</p>
              </div>
            )}
          </Card>
        </div>
        <Card className="p-6 sm:p-8">
          <div className="mb-6 flex gap-3">
            <button type="button" className={`min-h-11 rounded-2xl px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${mode === "login" ? "bg-sky-400 text-slate-950" : "bg-slate-900 text-slate-300"}`} onClick={() => setMode("login")} aria-pressed={mode === "login"}>Login</button>
            <button type="button" className={`min-h-11 rounded-2xl px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${mode === "signup" ? "bg-sky-400 text-slate-950" : "bg-slate-900 text-slate-300"}`} onClick={() => setMode("signup")} aria-pressed={mode === "signup"}>Sign up</button>
          </div>
          <form className="space-y-4" onSubmit={submit}>
            {mode === "signup" ? <FormField id="signup-name" label="Full name"><Input id="signup-name" autoComplete="name" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required /></FormField> : null}
            <FormField id="auth-email" label="Email"><Input id="auth-email" autoComplete="email" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></FormField>
            <FormField id="auth-password" label="Password" hint="Demo passwords are prefilled in mock mode."><Input id="auth-password" autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></FormField>
            {error ? <ErrorMessage>{error}</ErrorMessage> : null}
            <Button type="submit" className="w-full bg-sky-400 text-slate-950" disabled={loading}>{loading ? "Working..." : mode === "login" ? "Login" : "Create account"}</Button>
          </form>
          <div className="mt-4 text-sm text-slate-400">
            Need a reset token flow? <Link className="text-sky-300" to="/reset-password">Open password reset</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
