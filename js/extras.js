/* Claude Code Quest — the bridge to the real tool.
 *
 * For each level (keyed by level id):
 *   tryIt  things to do in a real Claude Code session; the player ticks them off
 *   sheet  cheat-sheet entries: [stepIndex, what to type, what it does]
 *          An entry unlocks when the step at stepIndex is completed.
 */
const EXTRAS = {
  boot: {
    tryIt: [
      'Install Claude Code and check it works with: claude --version',
      'cd into a real project of yours, run claude, and ask "what does this project do?"',
      'Leave with /exit, then run git status to confirm that asking questions changed nothing.',
    ],
    sheet: [
      [2, 'npm install -g @anthropic-ai/claude-code', 'Install (or use the installer from claude.ai/install.sh)'],
      [4, 'cd my-project && claude', 'Start a session in the folder you want to work on'],
      [5, 'plain English', 'No special syntax: describe what you want'],
      [7, '/exit  or  Ctrl+D', 'End the session'],
      [7, 'Ctrl+C', 'Clear what you are typing; press twice to quit'],
    ],
  },
  talk: {
    tryIt: [
      'Ask about one specific file using an @ mention.',
      'Run !git status (or !ls) inside a session, then ask a follow-up question about the output.',
      'Take a vague request you would normally type and rewrite it to say what, where, and what done looks like.',
    ],
    sheet: [
      [1, 'what + where + done', 'A good prompt names the change, the place, and the finished result'],
      [3, '@path/to/file', 'Attach a file or folder to your message'],
      [5, '!command', 'Run a shell command yourself; the output joins the conversation'],
      [7, '\\ then Enter', 'New line in a prompt (Shift+Enter in most terminals)'],
      [7, '↑', 'Recall your earlier prompts'],
    ],
  },
  slash: {
    tryIt: [
      'Run /context and see what is using the most space.',
      'Finish one small task, then run /clear before starting the next.',
      'Quit, then come straight back to the same conversation with claude -c.',
    ],
    sheet: [
      [2, '/help', 'List every command'],
      [2, '/clear', 'Forget the conversation: use when switching to an unrelated task'],
      [2, '/compact [what to keep]', 'Swap the conversation for a summary: use mid-task'],
      [2, '/context', 'See what is filling the context window'],
      [2, '/model', 'Switch model'],
      [5, 'claude -c', 'Start and continue the most recent conversation'],
      [5, 'claude -r', 'Start with a picker of past conversations (/resume inside a session)'],
    ],
  },
  modes: {
    tryIt: [
      'Press Shift+Tab until plan mode is on, ask for a plan for a small change, and read it before approving.',
      'Interrupt Claude mid-response with Esc and give it a different instruction.',
      'Let Claude make an edit, then press Esc twice and rewind it.',
    ],
    sheet: [
      [1, 'No, and tell Claude…', 'Declining a permission prompt lets you redirect; asking "why?" is always fine'],
      [3, 'Shift+Tab', 'Cycle permission modes: default, accept edits, plan'],
      [3, 'Plan mode', 'Claude only reads and researches, then proposes a plan to approve'],
      [5, 'Esc', 'Stop Claude mid-action; the conversation is kept'],
      [6, 'Esc Esc  or  /rewind', 'Restore code and/or conversation to an earlier checkpoint'],
    ],
  },
  memory: {
    tryIt: [
      'Run /init in a project and read the CLAUDE.md it writes.',
      'Delete one line Claude would know anyway, and add one gotcha that only you know.',
      'Put one personal preference in ~/.claude/CLAUDE.md.',
    ],
    sheet: [
      [1, '/init', 'Have Claude write a first-draft CLAUDE.md'],
      [2, 'CLAUDE.md', 'Project memory, loaded every session: commands, conventions, gotchas'],
      [4, '~/.claude/CLAUDE.md', 'Your personal preferences, for every project'],
      [4, 'CLAUDE.local.md', 'Your private notes for one project (keep out of git)'],
      [5, '/memory', 'Open memory files for editing'],
      [5, '@docs/file.md', 'Inside CLAUDE.md: import another file instead of pasting it'],
    ],
  },
  flow: {
    tryIt: [
      'Before your next change, ask Claude to read and explain the code involved first.',
      'Give Claude a test or an expected output to verify against, and watch it iterate until it passes.',
      'Ask Claude to commit with a clear message, and read the message it writes.',
    ],
    sheet: [
      [1, 'Explore → Plan → Code → Verify → Commit', 'The workflow for anything bigger than a small fix'],
      [3, 'Give it a check', 'Tests, expected output, a lint command or a screenshot to compare against'],
      [5, '"commit my changes"', 'Claude reads the diff and writes the commit message'],
      [5, '"open a pull request"', 'Uses the gh CLI if installed'],
      [7, 'Two failed corrections → /clear', 'Start again with a sharper prompt instead of a third correction'],
    ],
  },
  settings: {
    tryIt: [
      'Run /permissions and read the rules you already have.',
      'Add an allow rule for your test command so Claude stops asking.',
      'Add a deny rule for a secrets file such as .env, then ask Claude to read it and watch it get blocked.',
    ],
    sheet: [
      [2, '.claude/settings.json', 'Project settings, shared through git'],
      [2, '.claude/settings.local.json', 'Project settings, just for you'],
      [2, '~/.claude/settings.json', 'Your settings for every project'],
      [3, '"allow": ["Bash(npm test)"]', 'Run without asking. * is a wildcard: Bash(npm run *)'],
      [3, '"deny": ["Read(./.env)"]', 'Never allowed, whatever else is set'],
      [4, 'deny → ask → allow', 'The order rules are checked in: deny always wins'],
      [5, '/permissions', 'View and edit rules interactively'],
    ],
  },
  skills: {
    tryIt: [
      'Think of instructions you have typed more than twice, and turn them into a skill.',
      'Invoke your skill with an argument.',
      'Commit the .claude/skills folder so your teammates get it too.',
    ],
    sheet: [
      [2, '.claude/skills/<name>/SKILL.md', 'A project skill (use ~/.claude/skills/ for a personal one)'],
      [3, 'name:  description:', 'The SKILL.md header; the description tells Claude when to use it'],
      [3, '$ARGUMENTS', 'Replaced by whatever you type after the command'],
      [4, '/skill-name arguments', 'Run a skill yourself'],
    ],
  },
  extend: {
    tryIt: [
      'Ask Claude to "use a subagent" to research a question that spans many files.',
      'Add a PostToolUse hook that runs your formatter or linter, and check it with /hooks.',
      'Run claude mcp list, then /mcp inside a session, to see what is connected.',
    ],
    sheet: [
      [1, '"use a subagent to…"', 'Delegate research to a separate context; only the answer comes back'],
      [1, '/agents', 'Create and manage your own subagents (.claude/agents/)'],
      [3, 'PostToolUse hook', 'A command that always runs after a tool, e.g. format after Edit|Write'],
      [3, 'PreToolUse hook', 'Runs before a tool and can block it'],
      [3, '/hooks', 'See configured hooks'],
      [5, 'claude mcp add --transport http <name> <url>', 'Connect an external tool server'],
      [5, 'claude mcp list', 'Show configured servers (/mcp inside a session)'],
    ],
  },
  auto: {
    tryIt: [
      'Run: claude -p "summarise the last 5 commits"',
      'Pipe something in: git diff | claude -p "review this diff for bugs"',
      'Add --output-format json to a headless run and look at the fields you get back.',
    ],
    sheet: [
      [1, 'claude -p "prompt"', 'Headless: run once, print the answer, exit'],
      [2, 'cat file | claude -p "…"', 'Pipe input in from another command'],
      [4, '--output-format json', 'Structured output for scripts'],
      [5, '--allowedTools "Edit" "Bash(npm test)"', 'Pre-approve tools, since nobody is there to click Yes'],
    ],
  },
};

if (typeof module !== 'undefined') module.exports = EXTRAS;
