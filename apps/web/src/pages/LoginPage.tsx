import { FormEvent, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button, Card, Input, SectionTitle } from "../components/ui";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("student@cyberpath.local");
  const [password, setPassword] = useState("Student123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
            <h3 className="text-lg font-semibold text-white">Demo accounts</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p><strong>Student:</strong> student@cyberpath.local / Student123!</p>
              <p><strong>Mentor:</strong> mentor@cyberpath.local / Mentor123!</p>
              <p><strong>Admin:</strong> admin@cyberpath.local / Admin123!</p>
            </div>
          </Card>
        </div>
        <Card className="p-6 sm:p-8">
          <div className="mb-6 flex gap-3">
            <button className={`rounded-2xl px-4 py-2 text-sm ${mode === "login" ? "bg-sky-400 text-slate-950" : "bg-slate-900 text-slate-300"}`} onClick={() => setMode("login")}>Login</button>
            <button className={`rounded-2xl px-4 py-2 text-sm ${mode === "signup" ? "bg-sky-400 text-slate-950" : "bg-slate-900 text-slate-300"}`} onClick={() => setMode("signup")}>Sign up</button>
          </div>
          <form className="space-y-4" onSubmit={submit}>
            {mode === "signup" ? <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required /> : null}
            <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            <Button className="w-full bg-sky-400 text-slate-950" disabled={loading}>{loading ? "Working..." : mode === "login" ? "Login" : "Create account"}</Button>
          </form>
          <div className="mt-4 text-sm text-slate-400">
            Need a reset token flow? <Link className="text-sky-300" to="/reset-password">Open password reset</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
