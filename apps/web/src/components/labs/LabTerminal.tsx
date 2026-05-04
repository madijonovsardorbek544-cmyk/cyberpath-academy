import { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { api } from "../../api/client";
import type { Lab } from "../../types";

type FsNode = string | FsDirectory;
type FsDirectory = Record<string, FsNode>;

type LabSubmission = {
  score: number;
  feedback: string;
};

type TerminalState = {
  cwd: string;
  buffer: string;
  fs: FsDirectory;
  hintIndex: number;
  answers: Record<string, string>;
};

type LabTerminalProps = {
  lab: Lab;
  onSubmission?: (submission: LabSubmission) => void;
};

const COLORS = {
  green: "\x1b[38;2;52;211;153m",
  cyan: "\x1b[38;2;56;189;248m",
  yellow: "\x1b[38;2;250;204;21m",
  red: "\x1b[38;2;251;113;133m",
  gray: "\x1b[38;2;148;163;184m",
  white: "\x1b[38;2;248;250;252m",
  reset: "\x1b[0m",
  bold: "\x1b[1m"
};

function toSafeJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function buildTaskFiles(lab: Lab): FsDirectory {
  const files: FsDirectory = {};

  for (const task of lab.tasks) {
    files[`${task.id}.txt`] =
      `Task ID: ${task.id}\n\n` +
      `${task.prompt}\n\n` +
      `How to answer in terminal:\n` +
      `answer ${task.id} "your evidence-based defensive answer"\n`;
  }

  if (Object.keys(files).length === 0) {
    files["no-tasks.txt"] = "No tasks are available for this lab.\n";
  }

  return files;
}

function buildHints(lab: Lab): FsDirectory {
  const hints: string[] = [
    "Read README.md first, then inspect dataset.json.",
    "Use 'ls tasks' and 'cat tasks/task1.txt' to understand what you must answer.",
    "Use evidence from the fictional dataset. Do not invent facts.",
    "Keep your answer defensive: identify, validate, document, contain only when justified.",
    "Use 'answer task1 \"...\"' to save an answer, then 'submit' to send it."
  ];

  return Object.fromEntries(
    hints.map((hint, index) => [
      `hint${String(index + 1).padStart(2, "0")}.txt`,
      `${hint}\n`
    ])
  );
}

function buildFilesystem(lab: Lab): FsDirectory {
  const readme =
    `# ${lab.title}\n\n` +
    `Category: ${lab.category}\n` +
    `Difficulty: ${lab.difficulty}\n\n` +
    `## Goal\n${lab.description}\n\n` +
    `## Safety boundary\n${lab.safeGuardrails}\n\n` +
    `## Workflow\n` +
    `1. Run: ls\n` +
    `2. Run: cat dataset.json\n` +
    `3. Run: ls tasks\n` +
    `4. Run: cat tasks/task1.txt\n` +
    `5. Save answers with: answer task1 "your answer"\n` +
    `6. Submit with: submit\n\n` +
    `This is a fictional defensive simulation. No live targets. No offensive workflow.\n`;

  return {
    home: {
      learner: {
        "README.md": readme,
        "dataset.json": `${toSafeJson(lab.dataset)}\n`,
        "guardrails.txt": `${lab.safeGuardrails}\n`,
        "solution-outline.locked": "Solution outline is shown after submission in the page UI.\n",
        tasks: buildTaskFiles(lab),
        hints: buildHints(lab)
      }
    }
  };
}

function normalizePath(path: string) {
  const parts = path.split("/").filter(Boolean);
  const stack: string[] = [];

  for (const part of parts) {
    if (part === ".") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }

  return "/" + stack.join("/");
}

function resolvePath(cwd: string, target?: string) {
  if (!target || target === "~") return cwd;
  if (target.startsWith("/")) return normalizePath(target);
  return normalizePath(`${cwd}/${target}`);
}

function getNode(fs: FsDirectory, path: string): FsNode | null {
  if (path === "/") return fs;

  const parts = path.split("/").filter(Boolean);
  let node: FsNode = fs;

  for (const part of parts) {
    if (typeof node === "object" && node !== null && part in node) {
      node = node[part];
    } else {
      return null;
    }
  }

  return node;
}

function parseCommand(line: string) {
  const result: string[] = [];
  const regex = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line))) {
    result.push(match[1] ?? match[2] ?? match[3]);
  }

  return result;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Unknown error.";
}

function prompt(term: Terminal, cwd: string) {
  const shortPath = cwd.replace("/home/learner", "~");
  term.write(
    `${COLORS.green}learner@cyberpath${COLORS.reset}:${COLORS.cyan}${shortPath}${COLORS.reset}${COLORS.green}$${COLORS.reset} `
  );
}

function writeBanner(term: Terminal, lab: Lab) {
  term.writeln("");
  term.writeln(`${COLORS.green}${COLORS.bold}CyberPath Defensive Lab Terminal${COLORS.reset}`);
  term.writeln(`${COLORS.gray}Fictional simulation · safe learning environment · authorized practice only${COLORS.reset}`);
  term.writeln("");
  term.writeln(`${COLORS.cyan}Lab:${COLORS.reset} ${lab.title}`);
  term.writeln(`${COLORS.cyan}Category:${COLORS.reset} ${lab.category}`);
  term.writeln(`${COLORS.cyan}Difficulty:${COLORS.reset} ${lab.difficulty}`);
  term.writeln("");
  term.writeln(`${COLORS.gray}Start with:${COLORS.reset} help`);
  term.writeln("");
}

export function LabTerminal({ lab, onSubmission }: LabTerminalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const onSubmissionRef = useRef(onSubmission);
  const [ready, setReady] = useState(false);

  const stateRef = useRef<TerminalState>({
    cwd: "/home/learner",
    buffer: "",
    fs: buildFilesystem(lab),
    hintIndex: 0,
    answers: {}
  });

  useEffect(() => {
    onSubmissionRef.current = onSubmission;
  }, [onSubmission]);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: '"JetBrains Mono", "Fira Code", Menlo, Monaco, Consolas, monospace',
      fontSize: 13,
      convertEol: true,
      scrollback: 2000,
      theme: {
        background: "#020617",
        foreground: "#E2E8F0",
        cursor: "#38BDF8",
        selectionBackground: "rgba(56, 189, 248, 0.25)"
      }
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);

    try {
      fit.fit();
    } catch {
      // Ignore fit errors during first render.
    }

    termRef.current = term;
    fitRef.current = fit;
    stateRef.current = {
      cwd: "/home/learner",
      buffer: "",
      fs: buildFilesystem(lab),
      hintIndex: 0,
      answers: {}
    };

    writeBanner(term, lab);
    prompt(term, stateRef.current.cwd);
    setReady(true);

    const disposable = term.onData((data) => {
      void handleInput(data, term);
    });

    const onResize = () => {
      try {
        fit.fit();
      } catch {
        // Ignore resize fit errors.
      }
    };

    window.addEventListener("resize", onResize);

    return () => {
      disposable.dispose();
      window.removeEventListener("resize", onResize);
      term.dispose();
      setReady(false);
    };
  }, [lab.id]);

  async function handleInput(data: string, term: Terminal) {
    const state = stateRef.current;

    if (data === "\r") {
      term.write("\r\n");
      const command = state.buffer;
      state.buffer = "";
      await execute(command, term);
      return;
    }

    if (data === "\u007F") {
      if (state.buffer.length > 0) {
        state.buffer = state.buffer.slice(0, -1);
        term.write("\b \b");
      }
      return;
    }

    if (data === "\x03") {
      term.write("^C\r\n");
      state.buffer = "";
      prompt(term, state.cwd);
      return;
    }

    if (data === "\x0C") {
      term.clear();
      prompt(term, state.cwd);
      return;
    }

    for (const char of data) {
      const code = char.charCodeAt(0);
      if (code >= 32 && code < 127) {
        state.buffer += char;
        term.write(char);
      }
    }
  }

  async function execute(line: string, term: Terminal) {
    const state = stateRef.current;
    const trimmed = line.trim();

    if (!trimmed) {
      prompt(term, state.cwd);
      return;
    }

    const [command, ...args] = parseCommand(trimmed);

    try {
      switch (command) {
        case "help": {
          term.writeln(`${COLORS.cyan}Available commands:${COLORS.reset}`);
          term.writeln(`  help                         show commands`);
          term.writeln(`  ls [path]                    list files`);
          term.writeln(`  cd <path>                    change folder`);
          term.writeln(`  pwd                          show current folder`);
          term.writeln(`  cat <file>                   read a file`);
          term.writeln(`  hint                         show next safe hint`);
          term.writeln(`  answer <taskId> "text"       save a task answer`);
          term.writeln(`  answers                      show saved answers`);
          term.writeln(`  submit                       submit saved answers`);
          term.writeln(`  clear                        clear terminal`);
          break;
        }

        case "pwd": {
          term.writeln(state.cwd);
          break;
        }

        case "whoami": {
          term.writeln("learner");
          break;
        }

        case "clear": {
          term.clear();
          break;
        }

        case "ls": {
          const path = resolvePath(state.cwd, args[0]);
          const node = getNode(state.fs, path);

          if (!node) {
            term.writeln(`${COLORS.red}ls: cannot access '${path}': No such file or directory${COLORS.reset}`);
            break;
          }

          if (typeof node === "string") {
            term.writeln(path);
            break;
          }

          const entries = Object.keys(node).sort();
          if (entries.length === 0) {
            term.writeln(`${COLORS.gray}(empty)${COLORS.reset}`);
            break;
          }

          for (const entry of entries) {
            const child = node[entry];
            term.writeln(typeof child === "object" ? `${COLORS.cyan}${entry}/${COLORS.reset}` : entry);
          }

          break;
        }

        case "cd": {
          const target = args[0] ? resolvePath(state.cwd, args[0]) : "/home/learner";
          const node = getNode(state.fs, target);

          if (!node) {
            term.writeln(`${COLORS.red}cd: ${args[0] ?? ""}: No such directory${COLORS.reset}`);
            break;
          }

          if (typeof node === "string") {
            term.writeln(`${COLORS.red}cd: ${args[0] ?? ""}: Not a directory${COLORS.reset}`);
            break;
          }

          state.cwd = target;
          break;
        }

        case "cat": {
          if (!args[0]) {
            term.writeln(`${COLORS.red}cat: missing file name${COLORS.reset}`);
            break;
          }

          const target = resolvePath(state.cwd, args[0]);
          const node = getNode(state.fs, target);

          if (node === null) {
            term.writeln(`${COLORS.red}cat: ${args[0]}: No such file${COLORS.reset}`);
            break;
          }

          if (typeof node === "object") {
            term.writeln(`${COLORS.red}cat: ${args[0]}: Is a directory${COLORS.reset}`);
            break;
          }

          node.split("\n").forEach((row) => term.writeln(row));
          break;
        }

        case "hint": {
          const hintsDir = getNode(state.fs, "/home/learner/hints");

          if (!hintsDir || typeof hintsDir === "string") {
            term.writeln(`${COLORS.yellow}No hints available.${COLORS.reset}`);
            break;
          }

          const hints = Object.keys(hintsDir).sort();

          if (state.hintIndex >= hints.length) {
            term.writeln(`${COLORS.yellow}No more hints. Use the dataset and task prompts carefully.${COLORS.reset}`);
            break;
          }

          const hintName = hints[state.hintIndex];
          const hint = hintsDir[hintName];

          term.writeln(`${COLORS.yellow}[${hintName}]${COLORS.reset}`);
          term.writeln(typeof hint === "string" ? hint.trim() : "Hint unavailable.");
          state.hintIndex += 1;
          break;
        }

        case "answer": {
          const taskId = args[0];
          const answerText = args.slice(1).join(" ").trim();

          if (!taskId || !answerText) {
            term.writeln(`${COLORS.red}Usage: answer task1 "your evidence-based answer"${COLORS.reset}`);
            break;
          }

          const taskExists = lab.tasks.some((task) => task.id === taskId);

          if (!taskExists) {
            term.writeln(`${COLORS.red}Unknown task ID: ${taskId}. Run 'ls tasks' first.${COLORS.reset}`);
            break;
          }

          state.answers[taskId] = answerText;
          term.writeln(`${COLORS.green}Saved answer for ${taskId}.${COLORS.reset}`);
          break;
        }

        case "answers": {
          const entries = Object.entries(state.answers);

          if (entries.length === 0) {
            term.writeln(`${COLORS.gray}No answers saved yet.${COLORS.reset}`);
            break;
          }

          for (const [taskId, answer] of entries) {
            term.writeln(`${COLORS.cyan}${taskId}:${COLORS.reset} ${answer}`);
          }

          break;
        }

        case "submit": {
          if (Object.keys(state.answers).length === 0) {
            term.writeln(`${COLORS.red}No answers saved. Use: answer task1 "your answer"${COLORS.reset}`);
            break;
          }

          term.writeln(`${COLORS.gray}Submitting defensive lab answers...${COLORS.reset}`);

          const data = await api.post<{ submission: LabSubmission }>(
            `/learning/labs/${lab.id}/submit`,
            { answers: state.answers }
          );

          term.writeln(`${COLORS.green}${COLORS.bold}Submission received.${COLORS.reset}`);
          term.writeln(`${COLORS.white}Score: ${data.submission.score}%${COLORS.reset}`);
          term.writeln(`${COLORS.gray}${data.submission.feedback}${COLORS.reset}`);

          onSubmissionRef.current?.(data.submission);
          break;
        }

        case "echo": {
          term.writeln(args.join(" "));
          break;
        }

        default: {
          term.writeln(`${COLORS.red}${command}: command not found${COLORS.reset}`);
          term.writeln(`${COLORS.gray}Type 'help' to see available commands.${COLORS.reset}`);
        }
      }
    } catch (error) {
      term.writeln(`${COLORS.red}Error: ${getErrorMessage(error)}${COLORS.reset}`);
    }

    prompt(term, state.cwd);
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-sky-400/20 bg-slate-950 shadow-2xl shadow-sky-950/30">
      <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-rose-400" />
        <span className="h-3 w-3 rounded-full bg-yellow-300" />
        <span className="h-3 w-3 rounded-full bg-emerald-400" />
        <span className="ml-2 text-xs text-slate-400">defensive-lab-terminal</span>
        {ready ? (
          <span className="ml-auto text-[10px] uppercase tracking-[0.3em] text-emerald-300">
            live
          </span>
        ) : null}
      </div>

      <div
        ref={containerRef}
        className="h-[460px] bg-slate-950 p-3"
        aria-label="CyberPath defensive lab terminal"
      />
    </div>
  );
}
