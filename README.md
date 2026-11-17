# Claude Code Quest

A browser game that teaches Claude Code from first launch to intermediate use.
Ten levels, each a mix of short lessons and hands-on tasks, ending in a boss
fight you must win to unlock the next level.

## Play

Open `index.html` in a browser. No build step, no server, no network access.
Progress and XP are saved in the browser's localStorage; the Reset button
clears them.

## Modes

- **Full Quest** — the whole game in order. Each level unlocks when you pass
  the previous boss fight. You choose an avatar (Claude or Blonde Claude) that
  accompanies you through the levels.
- **Specific Quest** — every level is open; pick the one you want.

Progress and XP are shared between modes. The Menu button (or the title)
returns to the mode screen.

## Boss fights, fireworks and the cheat sheet

- The story: Princess Dario (a cartoon in a crown and pink gown) is held in the
  last castle. After each of levels 1 to 9 he turns out to be in another
  castle; he hangs in a cage over the final fight and is freed when the last
  king falls.
- Each level ends in a **boss fight** against one of seven drawn caricature
  kings (Zuck, Jeff, Palmer, Peter, Jensen, Elon and Sam), shared out across
  levels 1 to 9. The final exam is a gauntlet against all seven, one after
  another. A right answer lands a hit; a wrong one costs a heart. Boss health and hearts are sized so that you
  win at the same 75% pass mark as before.
- Finish a level with **no mistakes and no hints** and you get one firework per
  level number (level 4 = 4 fireworks), then a shower of energy-drink cans and
  a power-up. Flawless levels are starred on the map. Replay a level from the
  start to try again.
- The **cheat sheet** (top bar) fills in as you pass the tasks that teach each
  command. It can be filtered and printed.
- Every level-complete screen has a **"Now try it for real"** checklist of
  things to do in an actual Claude Code session. Ticks are saved.
- All sound is synthesised in the browser; the speaker button mutes it.

## Terminal shortcuts

The simulated terminals support ↑/↓ command history (kept across tasks),
Ctrl+L or `clear`, Ctrl+U, Ctrl+K, Ctrl+A, Ctrl+E and Ctrl+C. The shell
terminals also answer `history`, `pwd`, `ls` and `help`.

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
- **Boss fight** — one attempt per question, 75% to win

Hints and "show answer" halve the XP for that task.

## Editing content

All lessons and tasks live in `js/levels.js`; cheat-sheet entries and
checklists are in `js/extras.js`; sound, fireworks and boss art are in
`js/fx.js`. Which king guards a level is the `boss` field on its boss step
in `js/levels.js`. After changing it, run:

    node claude-quest/tests/levels.test.js

This checks that every task accepts its own model answer and rejects its
listed wrong answers.
