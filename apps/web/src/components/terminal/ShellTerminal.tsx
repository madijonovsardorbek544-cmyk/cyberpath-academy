import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { runShell, shellCommands, type ShellDir } from "@cyberpath/contracts/shell";

const GREEN = "\x1b[38;2;52;211;153m";
const CYAN = "\x1b[38;2;56;189;248m";
const GRAY = "\x1b[38;2;148;163;184m";
const RESET = "\x1b[0m";

/** Prints shell output: CRLF line endings, and NUL bytes (e.g. raw UTF-16) hidden like a real terminal. */
export function writeShellOutput(term: Terminal, output: string) {
  if (output) term.write(output.replace(/\0/g, "").replace(/\r?\n/g, "\r\n"));
}

function completions(fs: ShellDir, cwd: string, word: string, first: boolean) {
  if (first) return shellCommands.filter((command) => command.startsWith(word));
  const slash = word.lastIndexOf("/");
  const dirPart = slash >= 0 ? word.slice(0, slash + 1) : "";
  const listing = runShell(`ls ${dirPart || "."}`, { fs, cwd, home: cwd }).output;
  return listing.split(/\s+/).filter(Boolean).map((name) => `${dirPart}${name}`).filter((name) => name.startsWith(word));
}

export function ShellTerminal({ fs, home, banner, label }: { fs: ShellDir; home: string; banner: string[]; label: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const term = new Terminal({ cursorBlink: true, convertEol: false, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 13, theme: { background: "#020617", foreground: "#e2e8f0", cursor: "#38bdf8" } });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);
    fit.fit();

    let cwd = home;
    let buffer = "";
    const history: string[] = [];
    let historyIndex = 0;
    const promptText = () => `${GREEN}analyst@cyberpath${RESET}:${CYAN}${cwd === home ? "~" : cwd}${RESET}$ `;
    const prompt = () => term.write(promptText());
    const replaceBuffer = (next: string) => {
      term.write("\b \b".repeat(buffer.length));
      buffer = next;
      term.write(buffer);
    };

    banner.forEach((line) => term.writeln(`${GRAY}${line}${RESET}`));
    prompt();

    const disposable = term.onData((data) => {
      if (data === "\r") {
        term.write("\r\n");
        const line = buffer;
        buffer = "";
        if (line.trim()) {
          history.push(line);
          historyIndex = history.length;
          const result = runShell(line, { fs, cwd, home });
          if (result.clear) term.clear();
          writeShellOutput(term, result.output);
          cwd = result.cwd;
        }
        prompt();
        return;
      }
      if (data === "\u007F") {
        if (buffer) {
          buffer = buffer.slice(0, -1);
          term.write("\b \b");
        }
        return;
      }
      if (data === "\x03") {
        term.write("^C\r\n");
        buffer = "";
        prompt();
        return;
      }
      if (data === "\x0C") {
        term.clear();
        return;
      }
      if (data === "\x1b[A" || data === "\x1b[B") {
        if (!history.length) return;
        historyIndex = Math.max(0, Math.min(history.length, historyIndex + (data === "\x1b[A" ? -1 : 1)));
        replaceBuffer(history[historyIndex] ?? "");
        return;
      }
      if (data === "\t") {
        const words = buffer.split(" ");
        const word = words[words.length - 1];
        const options = completions(fs, cwd, word, words.length === 1);
        if (options.length === 1) {
          const completed = options[0].endsWith("/") ? options[0] : `${options[0]} `;
          term.write(completed.slice(word.length));
          buffer += completed.slice(word.length);
        } else if (options.length > 1) {
          term.write(`\r\n${options.join("  ")}\r\n`);
          prompt();
          term.write(buffer);
        }
        return;
      }
      if (data.startsWith("\x1b")) return;
      // Pasted text can contain several characters at once.
      for (const char of data.replace(/\r?\n/g, " ")) {
        if (char >= " ") {
          buffer += char;
          term.write(char);
        }
      }
    });

    const onResize = () => fit.fit();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      disposable.dispose();
      term.dispose();
    };
  }, [fs, home, banner]);

  return <div ref={containerRef} className="h-[460px] rounded-2xl border border-slate-800 bg-slate-950 p-2" role="application" aria-label={label} />;
}
