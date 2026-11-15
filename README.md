# Claude Code Quest

A browser game that teaches Claude Code from first launch to intermediate use.
Ten levels, each a mix of short lessons and hands-on tasks, ending in a gate
test you must pass to unlock the next level.

## Play

Open `index.html` in a browser. No build step, no server, no network access.
Progress and XP are saved in the browser's localStorage; the Reset button
clears them.

## Levels

1. Boot Up — install, launch, first prompt, exit
2. Talking to Claude — specific prompts, `@` file mentions, `!` shell mode
3. Slash Commands — `/clear`, `/compact`, `/context`, resuming sessions
4. Permissions & Modes — approvals, Shift+Tab, plan mode, Esc, rewind
5. Project Memory — `CLAUDE.md`, `/init`, where memory files live
6. The Core Workflow — explore, plan, code, verify, commit
7. Settings & Rules — `settings.json`, allow / ask / deny rules
8. Custom Commands & Skills — `SKILL.md`, `$ARGUMENTS`
9. Subagents, Hooks & MCP — delegation, lifecycle hooks, `claude mcp add`
10. Automation & Final Exam — `claude -p`, pipes, JSON output

## Task types

- **Terminal** — type the right command into a simulated shell or Claude session
- **Keyboard** — press the real shortcut (Shift+Tab, Esc, Esc Esc)
- **File** — edit a `CLAUDE.md`, `settings.json` or `SKILL.md` until it validates
- **Ordering** and **quick checks** — multiple choice with retries
- **Gate test** — one attempt per question, 75% to pass

Hints and "show answer" halve the XP for that task.

## Editing content

All lessons and tasks live in `js/levels.js`. After changing it, run:

    node claude-quest/tests/levels.test.js

This checks that every task accepts its own model answer and rejects its
listed wrong answers.
