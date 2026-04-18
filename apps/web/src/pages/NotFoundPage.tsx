import { Link } from "react-router-dom";
import { Button, Card } from "../components/ui";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100">
      <Card className="max-w-md p-8 text-center">
        <h1 className="text-3xl font-semibold text-white">Page not found</h1>
        <p className="mt-3 text-sm text-slate-400">That route does not exist. Use the actual app navigation instead of teleporting randomly.</p>
        <Link to="/"><Button className="mt-5 bg-sky-400 text-slate-950">Go home</Button></Link>
      </Card>
    </div>
  );
}
