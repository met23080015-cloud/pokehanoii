#!/usr/bin/env node
/**
 * UserPromptSubmit hook — Vibe Coding Journey logger.
 *
 * Reads the hook payload (JSON on stdin), extracts the submitted prompt,
 * and appends a timestamped entry to docs/vibe-coding-journey.json.
 *
 * Output file shape:
 * {
 *   "project": "Poke Hanoi - Calo Order App",
 *   "entries": [
 *     { "index": 1, "timestamp": "ISO", "session_id": "...", "prompt": "..." }
 *   ]
 * }
 *
 * Fails silently (exit 0) so it never blocks prompt submission.
 */
const fs = require("fs");
const path = require("path");

// project root = two levels up from .claude/hooks/
const ROOT = path.resolve(__dirname, "..", "..");
const OUT_DIR = path.join(ROOT, "docs");
const OUT_FILE = path.join(OUT_DIR, "vibe-coding-journey.json");

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function main() {
  const raw = readStdin();
  let payload = {};
  try {
    payload = JSON.parse(raw);
  } catch {
    // not JSON — store raw text as the prompt
    payload = { prompt: raw };
  }

  const prompt =
    payload.prompt ??
    payload.user_prompt ??
    payload.message ??
    (typeof raw === "string" ? raw.trim() : "");

  if (!prompt || !String(prompt).trim()) return; // nothing to log

  fs.mkdirSync(OUT_DIR, { recursive: true });

  let journey = { project: "Poke Hanoi - Calo Order App", entries: [] };
  if (fs.existsSync(OUT_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(OUT_FILE, "utf8"));
      if (parsed && Array.isArray(parsed.entries)) journey = parsed;
    } catch {
      // corrupt/empty file — start fresh, keep a backup
      try {
        fs.copyFileSync(OUT_FILE, OUT_FILE + ".bak");
      } catch {}
    }
  }

  journey.entries.push({
    index: journey.entries.length + 1,
    timestamp: new Date().toISOString(),
    session_id: payload.session_id ?? null,
    cwd: payload.cwd ?? null,
    prompt: String(prompt),
  });

  fs.writeFileSync(OUT_FILE, JSON.stringify(journey, null, 2) + "\n", "utf8");
}

try {
  main();
} catch {
  // never block the user's prompt
}
process.exit(0);
