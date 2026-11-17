/* Claude Code Quest — level data.
 *
 * Step types:
 *   lesson   { title, body }
 *   quiz     { title, q, options[], answer (index into options), explain }
 *   terminal { title, brief, mode: 'shell'|'claude', cmds: [{ ask, accept[], out, near[], hint, solution, bad[] }] }
 *   keys     { title, brief, scenario: 'plan'|'interrupt'|'rewind' }
 *   editor   { title, brief, filename, starter, validate(text) -> null | error string, hint, solution }
 *   order    { title, brief, items[] (in the correct order) }
 *   boss     { title, questions: [{ q, options[], answer, explain }] }   (played as a boss fight)
 *
 * Loaded as a plain script in the browser and via require() in the tests.
 */

const WORDS3 = /^(?![\/!]).*\S+\s+\S+\s+\S+/; // a real sentence, not a slash or bash command

function parseJson(text) {
  try {
    return { value: JSON.parse(text) };
  } catch (e) {
    return { error: 'That is not valid JSON yet: ' + e.message };
  }
}

const LEVELS = [
  /* ------------------------------------------------------------------ 1 */
  {
    id: 'boot',
    icon: '⏻',
    title: 'Boot Up',
    tagline: 'Install Claude Code, start a session, say hello.',
    steps: [
      {
        type: 'lesson',
        title: 'What is Claude Code?',
        body: `
          <p>Claude Code is an AI coding assistant that lives in your <strong>terminal</strong>. Unlike a chat window, it works directly inside your project:</p>
          <ul>
            <li>it <strong>reads</strong> your files to understand the code,</li>
            <li>it <strong>edits</strong> files to make changes,</li>
            <li>it <strong>runs commands</strong> such as tests, builds and git,</li>
            <li>and it asks your <strong>permission</strong> before doing anything that changes your machine.</li>
          </ul>
          <p>You describe what you want in plain English. Claude works out the steps, does them, and shows you what it did.</p>
          <p class="note">This course uses a simulated terminal, so nothing you type here touches your computer. Experiment freely.</p>`,
      },
      {
        type: 'lesson',
        title: 'Installing',
        body: `
          <p>There are two common ways to install. Either one gives you a <code>claude</code> command.</p>
          <p><strong>Native installer</strong> (macOS, Linux, WSL):</p>
          <pre>curl -fsSL https://claude.ai/install.sh | bash</pre>
          <p><strong>npm</strong> (needs Node.js 18 or newer):</p>
          <pre>npm install -g @anthropic-ai/claude-code</pre>
          <p>The <code>-g</code> flag installs it globally, so the command works in every folder.</p>`,
      },
      {
        type: 'terminal',
        title: 'Task: install it',
        brief: 'Install Claude Code using either method from the last page.',
        mode: 'shell',
        cmds: [
          {
            ask: 'Type an install command and press Enter.',
            accept: [
              /^npm (install|i) (-g|--global) @anthropic-ai\/claude-code$/,
              /^npm (install|i) @anthropic-ai\/claude-code (-g|--global)$/,
              /^curl -fsSL https:\/\/claude\.ai\/install\.sh \| (bash|sh)$/,
            ],
            near: [
              { re: /^npm (install|i) @anthropic-ai\/claude-code$/, msg: 'Close. Without -g it only installs into the current folder. Add the global flag.' },
              { re: /^npm (install|i) (-g )?claude(-code)?$/, msg: 'The package lives under the @anthropic-ai scope: @anthropic-ai/claude-code.' },
            ],
            out: 'added 2 packages in 4s\n\n✓ Claude Code installed. Run `claude` to get started.',
            hint: 'npm install, the global flag, then the package name @anthropic-ai/claude-code.',
            solution: 'npm install -g @anthropic-ai/claude-code',
            bad: ['npm install claude', 'npm install @anthropic-ai/claude-code'],
          },
        ],
      },
      {
        type: 'lesson',
        title: 'Start where your code is',
        body: `
          <p>Claude Code works on the folder you launch it from. That folder becomes its workspace: it can read and edit files there and nowhere else, unless you allow it.</p>
          <p>So the routine is always the same two steps:</p>
          <pre>cd path/to/your-project
claude</pre>
          <p>The first time you run it you will be asked to log in. After that you land at a prompt where you can start typing.</p>`,
      },
      {
        type: 'terminal',
        title: 'Task: launch a session',
        brief: 'Your project lives in a folder named <code>my-app</code>.',
        mode: 'shell',
        cmds: [
          {
            ask: 'Move into the my-app folder.',
            accept: [/^cd (\.\/)?my-app\/?$/],
            out: '',
            hint: 'cd changes directory.',
            solution: 'cd my-app',
            bad: ['claude', 'cd'],
            near: [{ re: /^claude/, msg: 'Not yet. If you start Claude here it will work on the wrong folder. Change directory first.' }],
          },
          {
            ask: 'Now start Claude Code.',
            accept: [/^claude$/],
            out: '✻ Welcome to Claude Code\n\n  cwd: ~/my-app\n\n  Tip: describe a task, or type / to see commands.',
            hint: 'The command is just its name.',
            solution: 'claude',
            bad: ['claude code', 'start claude'],
            near: [{ re: /^claude[- ]code$/, msg: 'The command is shorter than that: just one word.' }],
          },
        ],
      },
      {
        type: 'terminal',
        title: 'Task: your first prompt',
        brief: 'You are now inside a Claude Code session. There is no special syntax. Just ask.',
        mode: 'claude',
        cmds: [
          {
            ask: 'Ask Claude, in your own words, what this project does.',
            accept: [WORDS3],
            near: [{ re: /^\//, msg: 'Slash commands come later. For now, write a plain sentence.' }],
            out: '● Read(package.json)\n● Read(README.md)\n● Search(pattern: "src/**/*.js")\n\nThis is a small Express web app for tracking reading lists. The server\nlives in src/server.js, routes are in src/routes/, and data is stored in\nSQLite. Tests run with `npm test`.',
            hint: 'Any sentence of three or more words works, e.g. "what does this project do?"',
            solution: 'what does this project do?',
            bad: ['/help', 'hi'],
          },
        ],
      },
      {
        type: 'lesson',
        title: 'Getting out',
        body: `
          <p>Notice what happened: Claude <em>read files on its own</em> to answer. That is the difference between an agent and a chatbot.</p>
          <p>Three ways to stop:</p>
          <table>
            <tr><td><kbd>Esc</kbd></td><td>Interrupt Claude while it is working. The session stays open.</td></tr>
            <tr><td><kbd>Ctrl</kbd>+<kbd>C</kbd></td><td>Clear what you are typing. Press it twice to quit.</td></tr>
            <tr><td><code>/exit</code> or <kbd>Ctrl</kbd>+<kbd>D</kbd></td><td>End the session.</td></tr>
          </table>
          <p>Quitting does not lose your work. Edits are already saved to disk, and the conversation can be resumed later.</p>`,
      },
      {
        type: 'terminal',
        title: 'Task: end the session',
        brief: 'Leave Claude Code cleanly using a command.',
        mode: 'claude',
        cmds: [
          {
            ask: 'Type the command that ends the session.',
            accept: [/^\/(exit|quit)$/],
            near: [{ re: /^(exit|quit)$/, msg: 'Without a leading slash Claude treats that as a message to answer. Commands start with /.' }],
            out: 'Goodbye. Resume this conversation any time with: claude --continue',
            hint: 'Commands inside a session start with a slash.',
            solution: '/exit',
            bad: ['exit', 'bye'],
          },
        ],
      },
      {
        type: 'boss',
        title: 'Boss fight: Boot Up',
        boss: 'mark',
        questions: [
          {
            q: 'Why should you cd into your project before running claude?',
            options: [
              'Claude Code works on the folder it is launched from',
              'The claude command only exists inside project folders',
              'It makes Claude respond faster',
              'Otherwise you have to log in again',
            ],
            answer: 0,
            explain: 'The launch folder is the workspace Claude reads and edits.',
          },
          {
            q: 'Claude is halfway through something and you want it to stop, but keep the session open. What do you press?',
            options: ['Esc', 'Ctrl+D', 'Ctrl+Z', 'Enter'],
            answer: 0,
            explain: 'Esc interrupts. Ctrl+D ends the whole session.',
          },
          {
            q: 'What does the -g flag do in npm install -g @anthropic-ai/claude-code?',
            options: [
              'Installs globally so the claude command works in any folder',
              'Installs the newest "gold" release',
              'Grants Claude permission to edit files',
              'Downloads git alongside it',
            ],
            answer: 0,
            explain: '-g means global.',
          },
          {
            q: 'What makes Claude Code different from pasting code into a chat window?',
            options: [
              'It can read files, edit them and run commands in your project itself',
              'It only works on code that is already on GitHub',
              'It never needs permission for anything',
              'It can only answer questions, not change code',
            ],
            answer: 0,
            explain: 'It is an agent with tools, working directly in your project, with your permission.',
          },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ 2 */
  {
    id: 'talk',
    icon: '✎',
    title: 'Talking to Claude',
    tagline: 'Clear prompts, @ file mentions, and ! shell mode.',
    steps: [
      {
        type: 'lesson',
        title: 'Specific beats short',
        body: `
          <p>Claude can infer a lot, but it cannot read your mind. The single biggest improvement you can make is to be specific about <strong>what</strong>, <strong>where</strong> and <strong>what done looks like</strong>.</p>
          <table>
            <tr><th>Vague</th><th>Specific</th></tr>
            <tr><td>fix the login bug</td><td>users see a blank page after a wrong password on /login. Find the cause in src/auth/ and fix it. The error message should show instead.</td></tr>
            <tr><td>add tests</td><td>write tests for src/cart.js covering an empty cart and a cart with a discount code. Follow the style in tests/user.test.js.</td></tr>
          </table>
          <p>A good prompt reads like a ticket you would hand to a capable colleague who has never seen this code.</p>`,
      },
      {
        type: 'quiz',
        title: 'Check: pick the better prompt',
        q: 'You want a dark mode toggle. Which prompt will get the best first result?',
        options: [
          'Add a dark mode toggle to the header in src/components/Header.jsx. Store the choice in localStorage and reuse the colour variables in styles/theme.css.',
          'dark mode',
          'Can you make the site look better at night?',
          'Add dark mode. Do it properly and do not make mistakes.',
        ],
        answer: 0,
        explain: 'It names the place, the behaviour and the existing pattern to follow. "Do it properly" adds pressure but no information.',
      },
      {
        type: 'lesson',
        title: 'Point at files with @',
        body: `
          <p>Type <code>@</code> followed by a path to pull a file straight into the conversation. Claude reads it immediately instead of searching for it.</p>
          <pre>&gt; explain the retry logic in @src/api/client.js</pre>
          <p>As you type after <code>@</code>, a file picker appears and <kbd>Tab</kbd> completes the path. You can mention folders too, and several files in one message.</p>
          <p class="note">You do not <em>have</em> to use @. Claude can find files itself. Use it when you already know exactly which file matters.</p>`,
      },
      {
        type: 'terminal',
        title: 'Task: mention a file',
        brief: 'There is a file at <code>src/auth.js</code> that you do not understand.',
        mode: 'claude',
        cmds: [
          {
            ask: 'Ask Claude to explain that file, using an @ mention.',
            accept: [/\S.*@src\/auth\.js|@src\/auth\.js.*\S\s*\S/],
            near: [
              { re: /src\/auth\.js/, msg: 'You named the file but did not mention it. Put @ directly in front of the path.' },
              { re: /^@src\/auth\.js$/, msg: 'That attaches the file, but Claude still needs to know what you want. Add a request.' },
            ],
            out: '● Read(src/auth.js)\n\nsrc/auth.js handles sign-in. `login()` checks the password hash,\n`issueToken()` creates a 24-hour JWT, and `requireAuth` is the Express\nmiddleware that rejects requests without a valid token.',
            hint: 'Something like: explain @src/auth.js',
            solution: 'explain @src/auth.js',
            bad: ['explain src/auth.js', '@src/auth.js'],
          },
        ],
      },
      {
        type: 'lesson',
        title: 'Run shell commands with !',
        body: `
          <p>Start a line with <code>!</code> to run a shell command yourself, right from the prompt. No need to leave the session.</p>
          <pre>&gt; !npm test</pre>
          <p>The command runs immediately, and its output is added to the conversation, so Claude can see it. That makes this a neat two-step:</p>
          <pre>&gt; !npm test
&gt; fix the two failing tests above</pre>
          <p>Compare the three prefixes you now know:</p>
          <table>
            <tr><td><code>@</code></td><td>attach a file</td></tr>
            <tr><td><code>!</code></td><td>run a shell command yourself</td></tr>
            <tr><td><code>/</code></td><td>run a Claude Code command (next level)</td></tr>
          </table>`,
      },
      {
        type: 'terminal',
        title: 'Task: use shell mode',
        brief: 'You want to see which files have changed, without asking Claude to do it.',
        mode: 'claude',
        cmds: [
          {
            ask: 'Run git status yourself from inside the session.',
            accept: [/^! ?git status$/],
            near: [
              { re: /^git status$/, msg: 'Without a prefix, that is a message for Claude to act on. Add the character that runs it directly.' },
              { re: /^\/git/, msg: '/ is for Claude Code commands. Shell commands use a different prefix.' },
            ],
            out: 'On branch main\nChanges not staged for commit:\n  modified:   src/auth.js\n  modified:   src/routes/login.js',
            hint: 'Put ! in front of the command.',
            solution: '!git status',
            bad: ['git status', '/git status'],
          },
        ],
      },
      {
        type: 'lesson',
        title: 'Longer messages',
        body: `
          <p><kbd>Enter</kbd> sends your message. For a prompt with several lines:</p>
          <ul>
            <li>type <code>\\</code> then <kbd>Enter</kbd> for a new line, which works everywhere, or</li>
            <li>press <kbd>Shift</kbd>+<kbd>Enter</kbd>, which works in most terminals (run <code>/terminal-setup</code> if yours does not).</li>
          </ul>
          <p>Two more habits worth having:</p>
          <ul>
            <li><kbd>↑</kbd> recalls your previous prompts.</li>
            <li>You can paste a screenshot or drag an image in. Claude can read error dialogs, designs and diagrams.</li>
          </ul>`,
      },
      {
        type: 'quiz',
        title: 'Check: new lines',
        q: 'Which way of adding a new line to your prompt works in every terminal?',
        options: ['Backslash, then Enter', 'Enter twice', 'Ctrl+C', 'Typing /newline'],
        answer: 0,
        explain: 'A trailing \\ before Enter always inserts a line break.',
      },
      {
        type: 'boss',
        title: 'Boss fight: Talking to Claude',
        boss: 'jeff',
        questions: [
          {
            q: 'What does starting a line with ! do?',
            options: [
              'Runs it as a shell command and adds the output to the conversation',
              'Marks the message as urgent',
              'Attaches a file',
              'Tells Claude not to edit anything',
            ],
            answer: 0,
            explain: '! is shell mode.',
          },
          {
            q: 'When is an @ mention most useful?',
            options: [
              'When you already know which file is relevant',
              'Every time, because Claude cannot open files otherwise',
              'Only for image files',
              'When you want Claude to delete the file',
            ],
            answer: 0,
            explain: 'Claude can search on its own. @ skips the search when you know the target.',
          },
          {
            q: 'Which detail adds the most to a prompt?',
            options: [
              'What the finished result should look like',
              '"Please be very careful"',
              'Writing it in capital letters',
              'Telling Claude it is an expert',
            ],
            answer: 0,
            explain: 'A clear target gives Claude something to check its work against.',
          },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ 3 */
  {
    id: 'slash',
    icon: '/',
    title: 'Slash Commands',
    tagline: 'Control the session and keep the context clean.',
    steps: [
      {
        type: 'lesson',
        title: 'The command menu',
        body: `
          <p>Typing <code>/</code> at the prompt opens a menu of commands that control Claude Code itself. These are the ones you will use most:</p>
          <table>
            <tr><td><code>/help</code></td><td>list every command</td></tr>
            <tr><td><code>/clear</code></td><td>wipe the conversation and start fresh</td></tr>
            <tr><td><code>/compact</code></td><td>replace the conversation with a summary</td></tr>
            <tr><td><code>/context</code></td><td>show what is filling the context window</td></tr>
            <tr><td><code>/model</code></td><td>switch between Claude models</td></tr>
            <tr><td><code>/resume</code></td><td>reopen an earlier conversation</td></tr>
            <tr><td><code>/config</code></td><td>open settings</td></tr>
            <tr><td><code>/doctor</code></td><td>check that your install is healthy</td></tr>
          </table>
          <p>You do not need to memorise them. Type <code>/</code> and start typing to filter.</p>`,
      },
      {
        type: 'lesson',
        title: 'Why context matters',
        body: `
          <p>Everything in a session, your messages, Claude's replies, every file it read and every command output, sits in the <strong>context window</strong>. It is large, but finite, and Claude does its best work when it is not cluttered with leftovers from a previous task.</p>
          <p>Two tools keep it tidy:</p>
          <ul>
            <li><code>/clear</code> throws the conversation away. Use it whenever you <strong>switch to an unrelated task</strong>.</li>
            <li><code>/compact</code> keeps a summary and drops the detail. Use it when you are <strong>mid-task</strong> and the session is getting long. You can steer the summary: <code>/compact keep the database schema decisions</code></li>
          </ul>
          <p class="note">Neither command touches your files. They only affect what Claude remembers of the conversation.</p>`,
      },
      {
        type: 'terminal',
        title: 'Task: right command, right moment',
        brief: 'Five situations. Type the slash command that fits each one.',
        mode: 'claude',
        cmds: [
          {
            ask: 'You forgot what commands exist. Show the list.',
            accept: [/^\/help$/],
            out: 'Commands: /clear /compact /config /context /doctor /init /model\n/memory /permissions /resume /rewind /review ...',
            hint: 'It is the first row of the table.',
            solution: '/help',
            bad: ['help', '/commands'],
          },
          {
            ask: 'The login bug is fixed and committed. Next you will work on an unrelated CSV export. Start fresh.',
            accept: [/^\/clear$/],
            near: [{ re: /^\/compact/, msg: 'Compact keeps a summary of the old task. The new task is unrelated, so you want none of it.' }],
            out: '(conversation cleared)',
            hint: 'You want nothing from the old task left over.',
            solution: '/clear',
            bad: ['/compact', '/reset'],
          },
          {
            ask: 'You are deep into a big refactor and the session is long. Shrink it, but keep the gist.',
            accept: [/^\/compact( .+)?$/],
            near: [{ re: /^\/clear$/, msg: 'That would throw away everything, including what you still need for the refactor.' }],
            out: 'Compacted. Summary keeps: goal, files changed so far, remaining steps.',
            hint: 'The one that summarises.',
            solution: '/compact',
            bad: ['/clear', '/summarize'],
          },
          {
            ask: 'You are curious how full the context window is and what is using it.',
            accept: [/^\/context$/],
            out: 'Context usage: 41%\n  System + tools   ▓▓░░░░░░░░   9%\n  Memory files     ▓░░░░░░░░░   2%\n  Messages         ▓▓▓▓▓▓░░░░  30%',
            hint: 'It is named after the thing you want to inspect.',
            solution: '/context',
            bad: ['/usage window', '/status'],
          },
          {
            ask: 'You want to switch to a different Claude model for this session.',
            accept: [/^\/model( \S+)?$/],
            out: 'Select a model:\n  ❯ Default (recommended)\n    Opus\n    Sonnet\n    Haiku',
            hint: 'Also named after the thing itself.',
            solution: '/model',
            bad: ['/switch', '/config model'],
          },
        ],
      },
      {
        type: 'quiz',
        title: 'Check: clear or compact?',
        q: 'What is the real difference between /clear and /compact?',
        options: [
          '/clear discards the conversation; /compact replaces it with a summary',
          '/clear deletes changed files; /compact zips them',
          '/clear logs you out; /compact keeps you logged in',
          'They do the same thing',
        ],
        answer: 0,
        explain: 'Both only affect conversation memory. Clear forgets, compact condenses.',
      },
      {
        type: 'lesson',
        title: 'Picking up where you left off',
        body: `
          <p>Sessions are saved automatically. You can return to one from the shell when starting Claude Code:</p>
          <table>
            <tr><td><code>claude -c</code> or <code>claude --continue</code></td><td>reopen the most recent conversation in this folder</td></tr>
            <tr><td><code>claude -r</code> or <code>claude --resume</code></td><td>choose from a list of past conversations</td></tr>
          </table>
          <p>Inside a running session, <code>/resume</code> opens the same picker.</p>`,
      },
      {
        type: 'terminal',
        title: 'Task: come back tomorrow',
        brief: 'It is the next morning. You are in your project folder at a normal shell prompt.',
        mode: 'shell',
        cmds: [
          {
            ask: 'Start Claude Code and carry straight on with your most recent conversation.',
            accept: [/^claude (-c|--continue)$/],
            near: [
              { re: /^claude (-r|--resume)$/, msg: 'That works too, but it shows a picker. There is a flag that jumps straight into the latest one.' },
              { re: /^claude$/, msg: 'That starts a brand new conversation. Add a flag.' },
            ],
            out: '✻ Resuming conversation from yesterday, 17:42\n  "refactor the cart module"',
            hint: 'c for continue.',
            solution: 'claude -c',
            bad: ['claude', 'claude -r'],
          },
          {
            ask: 'Now suppose you wanted an older conversation instead. Start Claude with the picker.',
            accept: [/^claude (-r|--resume)$/],
            out: 'Resume a conversation:\n  ❯ refactor the cart module        (yesterday)\n    fix blank page on /login        (3 days ago)\n    set up CI                       (last week)',
            hint: 'r for resume.',
            solution: 'claude -r',
            bad: ['claude -c', '/resume'],
            near: [{ re: /^\/resume$/, msg: '/resume only works inside a session. You are at the shell, so use the flag.' }],
          },
        ],
      },
      {
        type: 'boss',
        title: 'Boss fight: Slash Commands',
        boss: 'palmer',
        questions: [
          {
            q: 'You just finished a feature and are about to start a totally different one. Best move?',
            options: ['/clear', '/compact', 'Keep going in the same conversation', '/doctor'],
            answer: 0,
            explain: 'Unrelated task, fresh context.',
          },
          {
            q: 'Does /clear undo the file edits Claude made?',
            options: [
              'No. It only clears the conversation',
              'Yes. All edits are reverted',
              'Only edits from the last message',
              'Only if you have not committed',
            ],
            answer: 0,
            explain: 'Files on disk are untouched.',
          },
          {
            q: 'Which shell command jumps straight back into your latest conversation?',
            options: ['claude -c', 'claude -p', 'claude --new', 'claude /resume'],
            answer: 0,
            explain: '-c is --continue.',
          },
          {
            q: 'Why does a cluttered context window matter?',
            options: [
              'Claude works best when the context holds only what is relevant to the task',
              'It slows down your hard drive',
              'It uses up your disk space',
              'It does not matter at all',
            ],
            answer: 0,
            explain: 'Old, irrelevant material competes for attention with what matters now.',
          },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ 4 */
  {
    id: 'modes',
    icon: '⇧',
    title: 'Permissions & Modes',
    tagline: 'Stay in control: approve, plan, interrupt, rewind.',
    steps: [
      {
        type: 'lesson',
        title: 'Claude asks first',
        body: `
          <p>Reading files is free. But before Claude <strong>edits a file</strong> or <strong>runs a command</strong>, it stops and asks:</p>
          <pre>Claude wants to run:  npm install lodash

  ❯ 1. Yes
    2. Yes, and don't ask again for npm install commands
    3. No, and tell Claude what to do differently</pre>
          <ul>
            <li><strong>Yes</strong> approves this one action.</li>
            <li><strong>Don't ask again</strong> saves a rule so similar actions run without a prompt.</li>
            <li><strong>No</strong> is not a dead end. You can say what you want instead and Claude adjusts.</li>
          </ul>
          <p>If you do not understand a command, say no and ask Claude to explain it. That is always a fine answer.</p>`,
      },
      {
        type: 'quiz',
        title: 'Check: an unfamiliar command',
        q: 'Claude asks to run rm -rf build/ and you are not sure what that will do. What is the best response?',
        options: [
          'Choose No and ask Claude what the command does and why it is needed',
          'Choose Yes, because Claude probably knows best',
          'Choose "don\'t ask again" so it stops interrupting',
          'Close the terminal window',
        ],
        answer: 0,
        explain: 'Permission prompts are there so you can make an informed choice. Asking costs nothing.',
      },
      {
        type: 'lesson',
        title: 'Permission modes',
        body: `
          <p>How often Claude asks depends on the current <strong>permission mode</strong>. Press <kbd>Shift</kbd>+<kbd>Tab</kbd> to cycle through them. The mode is shown under the prompt.</p>
          <table>
            <tr><td><strong>Default</strong></td><td>asks before edits and commands</td></tr>
            <tr><td><strong>Accept edits</strong></td><td>file edits go through without asking; commands still ask</td></tr>
            <tr><td><strong>Plan mode</strong></td><td>Claude can only read and research, then proposes a plan for you to approve</td></tr>
          </table>
          <p>Plan mode is the one to remember. For anything bigger than a small fix, having Claude investigate and write a plan <em>before</em> it touches code catches misunderstandings while they are still cheap.</p>`,
      },
      {
        type: 'keys',
        title: 'Task: switch to plan mode',
        brief: 'The mock prompt below starts in default mode. Use the real keyboard shortcut to cycle until plan mode is on.',
        scenario: 'plan',
      },
      {
        type: 'lesson',
        title: 'Interrupt and rewind',
        body: `
          <p>Two shortcuts let you correct course at any moment.</p>
          <p><kbd>Esc</kbd> <strong>stops Claude mid-action.</strong> Nothing is lost: the conversation is kept and you can type a correction straight away. Use it the instant you see Claude heading the wrong way.</p>
          <p><kbd>Esc</kbd> <kbd>Esc</kbd> <strong>opens rewind.</strong> Claude Code checkpoints your files before each edit. Rewind lets you jump back to an earlier point and restore the code, the conversation, or both. The <code>/rewind</code> command opens the same menu.</p>
          <p class="note">Checkpoints cover edits Claude made to files. They do not undo side effects of commands, such as a database change or a deployment. Git is still your real safety net.</p>`,
      },
      {
        type: 'keys',
        title: 'Task: stop a runaway',
        brief: 'You asked Claude to tidy one file. It has started deleting a whole folder instead. Interrupt it.',
        scenario: 'interrupt',
      },
      {
        type: 'keys',
        title: 'Task: open rewind',
        brief: 'Some of those deletions already happened. Open the rewind menu to restore an earlier checkpoint.',
        scenario: 'rewind',
      },
      {
        type: 'boss',
        title: 'Boss fight: Permissions & Modes',
        boss: 'peter',
        questions: [
          {
            q: 'What can Claude do in plan mode?',
            options: [
              'Read and research, then propose a plan, without changing anything',
              'Edit files freely without asking',
              'Run any command without asking',
              'Nothing until you type /plan',
            ],
            answer: 0,
            explain: 'Plan mode is read-only until you approve the plan.',
          },
          {
            q: 'Which shortcut cycles between permission modes?',
            options: ['Shift+Tab', 'Ctrl+M', 'Esc Esc', 'Alt+P'],
            answer: 0,
            explain: 'Shift+Tab cycles default, accept edits, and plan mode.',
          },
          {
            q: 'What does pressing Esc twice at an empty prompt do?',
            options: [
              'Opens rewind so you can restore an earlier checkpoint',
              'Exits Claude Code',
              'Clears the conversation',
              'Approves the pending action',
            ],
            answer: 0,
            explain: 'Single Esc interrupts. Double Esc rewinds.',
          },
          {
            q: 'Rewind restores files that Claude edited. What does it NOT undo?',
            options: [
              'Side effects of commands, such as a database migration that already ran',
              'Edits to JavaScript files',
              'The most recent edit',
              'Anything, it undoes everything',
            ],
            answer: 0,
            explain: 'Checkpoints track file edits, not the outside world.',
          },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ 5 */
  {
    id: 'memory',
    icon: '☰',
    title: 'Project Memory',
    tagline: 'Teach Claude your project once with CLAUDE.md.',
    steps: [
      {
        type: 'lesson',
        title: 'The file Claude always reads',
        body: `
          <p>Each new session starts with no memory of the last one. If you find yourself repeating "we use pnpm, not npm" every morning, that belongs in <strong>CLAUDE.md</strong>.</p>
          <p><code>CLAUDE.md</code> is a plain Markdown file in your project root. Claude Code loads it automatically at the start of every session. Good things to put in it:</p>
          <ul>
            <li>commands: how to build, test, lint and run the project</li>
            <li>conventions: naming, code style, folder layout</li>
            <li>gotchas: "never edit files in generated/", "the API needs Docker running"</li>
          </ul>
          <p>The quickest way to get one is <code>/init</code>. Claude explores the project and writes a first draft for you to edit.</p>`,
      },
      {
        type: 'terminal',
        title: 'Task: generate a CLAUDE.md',
        brief: 'This project has no memory file yet.',
        mode: 'claude',
        cmds: [
          {
            ask: 'Have Claude analyse the project and create one.',
            accept: [/^\/init$/],
            out: '● Read(package.json)\n● Read(README.md)\n● Search(pattern: "**/*.config.*")\n● Write(CLAUDE.md)\n\nCreated CLAUDE.md with build commands, test commands and an overview\nof the architecture. Review it and adjust anything I got wrong.',
            hint: 'Short for "initialise".',
            solution: '/init',
            bad: ['/memory', 'init'],
            near: [{ re: /^\/memory$/, msg: '/memory opens existing memory files for editing. There is not one yet. Which command creates it?' }],
          },
        ],
      },
      {
        type: 'editor',
        title: 'Task: add two rules',
        brief: 'Edit the draft below. Add <strong>(1)</strong> that tests are run with <code>npm test</code>, and <strong>(2)</strong> a rule that new code must be written in TypeScript.',
        filename: 'CLAUDE.md',
        starter: '# Reading List App\n\nExpress server with a SQLite database.\n\n## Commands\n- Start the dev server: npm run dev\n\n## Conventions\n- Use 2-space indentation\n',
        validate(text) {
          if (!/npm (run )?test/.test(text)) return 'Add a line under Commands saying tests run with npm test.';
          if (!/typescript/i.test(text)) return 'Add a line under Conventions about writing new code in TypeScript.';
          return null;
        },
        hint: 'Two short bullet points are enough, one in each section.',
        solution: '# Reading List App\n\nExpress server with a SQLite database.\n\n## Commands\n- Start the dev server: npm run dev\n- Run tests: npm test\n\n## Conventions\n- Use 2-space indentation\n- Write new code in TypeScript\n',
      },
      {
        type: 'lesson',
        title: 'Where memory lives',
        body: `
          <p>There can be more than one memory file. All that apply are loaded together.</p>
          <table>
            <tr><td><code>./CLAUDE.md</code></td><td>project memory. Commit it so the whole team shares it.</td></tr>
            <tr><td><code>./CLAUDE.local.md</code></td><td>your private notes for this project. Keep it out of git.</td></tr>
            <tr><td><code>~/.claude/CLAUDE.md</code></td><td>your personal preferences, applied to every project.</td></tr>
          </table>
          <p>A CLAUDE.md can pull in other files with an import line such as <code>@docs/api-conventions.md</code>. And <code>/memory</code> opens your memory files for editing from inside a session.</p>
          <p><strong>Keep it short.</strong> Every line is read every session. A good test for each line: would Claude make a mistake without it? If not, cut it.</p>`,
      },
      {
        type: 'quiz',
        title: 'Check: the right file',
        q: 'You personally like commit messages written in a certain style, in every project you work on. Where does that preference go?',
        options: ['~/.claude/CLAUDE.md', './CLAUDE.md in each project', 'README.md', 'package.json'],
        answer: 0,
        explain: 'The file in your home folder applies to all projects and is not shared with teammates.',
      },
      {
        type: 'quiz',
        title: 'Check: what to leave out',
        q: 'Which of these does NOT belong in CLAUDE.md?',
        options: [
          'A full copy of the API documentation, 3,000 lines long',
          'The command that runs the test suite',
          'A note that the generated/ folder must never be edited by hand',
          'The branch naming convention the team uses',
        ],
        answer: 0,
        explain: 'It is loaded every session, so bulk reference material wastes context. Link or import the doc instead and let Claude read it when needed.',
      },
      {
        type: 'boss',
        title: 'Boss fight: Project Memory',
        boss: 'jensen',
        questions: [
          {
            q: 'When is CLAUDE.md read?',
            options: [
              'Automatically, at the start of every session',
              'Only when you @ mention it',
              'Only the first time you run claude in a project',
              'Never, it is documentation for humans',
            ],
            answer: 0,
            explain: 'That is what makes it memory.',
          },
          {
            q: 'Which command writes a first-draft CLAUDE.md by exploring your project?',
            options: ['/init', '/memory', '/config', '/compact'],
            answer: 0,
            explain: '/init creates, /memory edits.',
          },
          {
            q: 'Why keep CLAUDE.md concise?',
            options: [
              'Every line takes up context in every session, and important rules get lost in a long file',
              'Files over 100 lines are rejected',
              'Claude only reads the first paragraph',
              'Long files slow down git',
            ],
            answer: 0,
            explain: 'Short and specific beats long and thorough.',
          },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ 6 */
  {
    id: 'flow',
    icon: '↻',
    title: 'The Core Workflow',
    tagline: 'Explore, plan, code, verify, commit.',
    steps: [
      {
        type: 'lesson',
        title: 'A workflow that holds up',
        body: `
          <p>Asking for the finished feature in one go works for small changes. For anything bigger, this sequence gives much better results:</p>
          <ol>
            <li><strong>Explore.</strong> "Read src/payments/ and explain how refunds work." No code changes yet.</li>
            <li><strong>Plan.</strong> In plan mode: "How would you add partial refunds?" Read the plan and push back on it.</li>
            <li><strong>Code.</strong> Approve the plan and let Claude implement it.</li>
            <li><strong>Verify.</strong> Run the tests, check the result, look at the diff.</li>
            <li><strong>Commit.</strong> Save the working state to git.</li>
          </ol>
          <p>The early steps feel slow, but a wrong assumption caught in the plan costs a sentence to fix. Caught after implementation, it costs a rewrite.</p>`,
      },
      {
        type: 'order',
        title: 'Task: put the steps in order',
        brief: 'Click the steps in the order you would do them for a mid-sized feature.',
        items: [
          'Ask Claude to read the relevant code and explain it',
          'Switch to plan mode and ask for an implementation plan',
          'Approve the plan and let Claude write the code',
          'Run the tests and review the diff',
          'Commit the change',
        ],
      },
      {
        type: 'lesson',
        title: 'Give Claude a way to check itself',
        body: `
          <p>Claude is far more reliable when it can <strong>verify its own work</strong>. If it can run something and see pass or fail, it will keep iterating until it passes, instead of stopping at "this looks right".</p>
          <p>Ways to give it that feedback loop:</p>
          <ul>
            <li><strong>Tests:</strong> "write a failing test for the bug first, then make it pass"</li>
            <li><strong>Expected output:</strong> "formatDate('2026-01-05') should return 'Jan 5, 2026'"</li>
            <li><strong>A command:</strong> "run npm run lint and fix everything it reports"</li>
            <li><strong>A picture:</strong> paste a screenshot of the design and ask Claude to compare</li>
          </ul>`,
      },
      {
        type: 'quiz',
        title: 'Check: built-in verification',
        q: 'Which prompt gives Claude the best chance of getting it right without your help?',
        options: [
          'Fix parsePrice so "$1,299.50" returns 1299.5. Add that case to tests/price.test.js and run the tests until they pass.',
          'Fix parsePrice, it is broken.',
          'parsePrice has a bug somewhere, please look carefully.',
          'Rewrite parsePrice to be better.',
        ],
        answer: 0,
        explain: 'It states the expected behaviour and tells Claude how to prove it.',
      },
      {
        type: 'lesson',
        title: 'Git, in plain English',
        body: `
          <p>Claude can drive git for you. Just say what you want:</p>
          <pre>&gt; commit these changes with a clear message
&gt; create a branch called fix/login-redirect
&gt; what changed in src/auth.js since last week?
&gt; open a pull request for this branch</pre>
          <p>For commits, Claude looks at the diff and writes a message that describes it. Pull requests use the GitHub CLI (<code>gh</code>) if you have it installed.</p>
          <p><strong>Commit often.</strong> A commit after each working step gives you a point to return to that no rewind can beat.</p>`,
      },
      {
        type: 'terminal',
        title: 'Task: save your work',
        brief: 'The tests pass. Time to save this state.',
        mode: 'claude',
        cmds: [
          {
            ask: 'Ask Claude, in plain English, to commit the changes.',
            accept: [/^(?![\/!]).*\bcommit\b.*\S|^(?![\/!])\S.*\bcommit\b/i],
            near: [
              { re: /^! ?git commit/, msg: 'That would work, but you would have to write the message yourself. Ask Claude to do it instead.' },
              { re: /^\/commit/, msg: 'No slash needed here. Just ask in a sentence.' },
            ],
            out: '● Bash(git status)\n● Bash(git diff)\n● Bash(git add src/price.js tests/price.test.js)\n● Bash(git commit -m "Fix parsePrice for thousands separators")\n\nCommitted 2 files on branch main: "Fix parsePrice for thousands separators"',
            hint: 'For example: commit my changes',
            solution: 'commit my changes with a clear message',
            bad: ['!git commit', '/commit'],
          },
        ],
      },
      {
        type: 'lesson',
        title: 'When it goes wrong',
        body: `
          <p>Sometimes Claude misunderstands. The fix is to correct it <strong>early</strong>:</p>
          <ul>
            <li><kbd>Esc</kbd> the moment it heads off course, then redirect.</li>
            <li><kbd>Esc</kbd> <kbd>Esc</kbd> to rewind if it already changed things.</li>
            <li>If you have corrected the same problem twice and it is still wrong, stop. The conversation is now full of failed attempts. Run <code>/clear</code> and write a better first prompt using what you learned.</li>
          </ul>
          <p>A fresh start with a sharper prompt nearly always beats a third correction.</p>`,
      },
      {
        type: 'quiz',
        title: 'Check: third time unlucky',
        q: 'You have corrected Claude twice on the same issue and the third attempt is still wrong. What now?',
        options: [
          '/clear, then start again with a more specific prompt',
          'Repeat the same correction in capital letters',
          'Switch to accept-edits mode',
          'Keep correcting until the context window is full',
        ],
        answer: 0,
        explain: 'Failed attempts pollute the context. Fresh context plus a better prompt wins.',
      },
      {
        type: 'boss',
        title: 'Boss fight: The Core Workflow',
        boss: 'elon',
        questions: [
          {
            q: 'Why plan before coding on a larger change?',
            options: [
              'Wrong assumptions are much cheaper to fix in a plan than in finished code',
              'Claude refuses to write code without a plan',
              'Plans are required by git',
              'It uses less electricity',
            ],
            answer: 0,
            explain: 'A plan is a cheap place to catch misunderstandings.',
          },
          {
            q: 'What most improves the reliability of Claude\'s work?',
            options: [
              'Giving it a way to verify the result, such as tests to run',
              'Typing faster',
              'Using shorter prompts',
              'Approving every permission without reading',
            ],
            answer: 0,
            explain: 'A pass/fail signal lets Claude iterate on its own.',
          },
          {
            q: 'How do you get Claude to write a commit for you?',
            options: [
              'Ask in plain English, for example "commit these changes"',
              'You cannot. Claude is not allowed to use git',
              'Only by typing the full git command after !',
              'By editing CLAUDE.md',
            ],
            answer: 0,
            explain: 'Claude reads the diff and writes the message.',
          },
          {
            q: 'What is the first step when working in code you do not know?',
            options: [
              'Have Claude read and explain the relevant code',
              'Ask for the whole feature immediately',
              'Commit',
              'Run /compact',
            ],
            answer: 0,
            explain: 'Explore first.',
          },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ 7 */
  {
    id: 'settings',
    icon: '⚙',
    title: 'Settings & Rules',
    tagline: 'Write permission rules so Claude asks less and stays safe.',
    steps: [
      {
        type: 'lesson',
        title: 'settings.json',
        body: `
          <p>Lasting configuration lives in JSON files. Like memory, there are layers:</p>
          <table>
            <tr><td><code>~/.claude/settings.json</code></td><td>you, in every project</td></tr>
            <tr><td><code>.claude/settings.json</code></td><td>this project, shared with the team through git</td></tr>
            <tr><td><code>.claude/settings.local.json</code></td><td>this project, just you (not committed)</td></tr>
          </table>
          <p>The part you will touch first is <strong>permissions</strong>: rules that decide in advance what Claude may do without asking.</p>
          <pre>{
  "permissions": {
    "allow": ["Bash(npm run lint)", "Bash(git diff *)"],
    "ask":   ["Bash(git push *)"],
    "deny":  ["Read(./.env)"]
  }
}</pre>`,
      },
      {
        type: 'lesson',
        title: 'Reading a rule',
        body: `
          <p>A rule is a tool name, optionally followed by a pattern in brackets:</p>
          <table>
            <tr><td><code>Bash(npm test)</code></td><td>exactly this command</td></tr>
            <tr><td><code>Bash(npm run *)</code></td><td>any command starting with "npm run"</td></tr>
            <tr><td><code>Read(./.env)</code></td><td>reading this one file</td></tr>
            <tr><td><code>Edit(src/**)</code></td><td>editing anything under src/</td></tr>
            <tr><td><code>Bash</code></td><td>every shell command (careful!)</td></tr>
          </table>
          <p>The three lists are checked in a fixed order: <strong>deny</strong> first, then <strong>ask</strong>, then <strong>allow</strong>. So a deny rule always wins, however broad your allow rules are.</p>
          <p>You can also manage rules interactively with <code>/permissions</code>, and choosing "don't ask again" on a prompt writes an allow rule for you.</p>`,
      },
      {
        type: 'quiz',
        title: 'Check: which file?',
        q: 'Your whole team should be able to run the linter without a permission prompt. Where does that allow rule go?',
        options: ['.claude/settings.json', '.claude/settings.local.json', '~/.claude/settings.json', 'CLAUDE.md'],
        answer: 0,
        explain: 'The project settings file is committed, so everyone gets it. CLAUDE.md is guidance, not enforcement.',
      },
      {
        type: 'editor',
        title: 'Task: write the rules',
        brief: 'Fill in this settings file so that Claude can <strong>run <code>npm test</code> without asking</strong>, and can <strong>never read <code>./.env</code></strong>.',
        filename: '.claude/settings.json',
        starter: '{\n  "permissions": {\n    "allow": [],\n    "deny": []\n  }\n}\n',
        validate(text) {
          const r = parseJson(text);
          if (r.error) return r.error;
          const p = r.value && r.value.permissions;
          if (!p || !Array.isArray(p.allow) || !Array.isArray(p.deny)) return 'Keep the structure: a "permissions" object with "allow" and "deny" arrays.';
          const str = (a) => a.filter((x) => typeof x === 'string').map((x) => x.trim());
          if (!str(p.allow).some((x) => /^Bash\(npm (run )?test( ?\*|:\*)?\)$/.test(x))) {
            if (str(p.allow).some((x) => /npm (run )?test/.test(x))) return 'Nearly. The rule needs the tool name around it: "Bash(npm test)".';
            return 'Add "Bash(npm test)" to the allow array.';
          }
          if (str(p.allow).some((x) => /\.env/.test(x))) return 'The .env rule is in allow. It needs to be in deny.';
          if (!str(p.deny).some((x) => /^Read\((\.\/)?\.env\*?\)$/.test(x))) {
            if (str(p.deny).some((x) => /\.env/.test(x))) return 'Nearly. Reading files uses the Read tool: "Read(./.env)".';
            return 'Add "Read(./.env)" to the deny array.';
          }
          return null;
        },
        hint: 'Each rule is a string in quotes: "Bash(npm test)" in allow, "Read(./.env)" in deny.',
        solution: '{\n  "permissions": {\n    "allow": ["Bash(npm test)"],\n    "deny": ["Read(./.env)"]\n  }\n}\n',
      },
      {
        type: 'quiz',
        title: 'Check: who wins?',
        q: 'allow contains "Bash(git *)" and deny contains "Bash(git push *)". Claude tries to run git push origin main. What happens?',
        options: [
          'It is blocked, because deny rules are checked first',
          'It runs, because the allow rule is broader',
          'It runs, because allow is listed first in the file',
          'Claude Code crashes on the conflict',
        ],
        answer: 0,
        explain: 'Deny, then ask, then allow. This is how you allow a family of commands and carve out the dangerous ones.',
      },
      {
        type: 'terminal',
        title: 'Task: inspect the rules',
        brief: 'You want to see which permission rules are active and where each came from, without opening any files.',
        mode: 'claude',
        cmds: [
          {
            ask: 'Open the interactive permission manager.',
            accept: [/^\/permissions$/],
            out: 'Permissions\n  Allow   Bash(npm test)            .claude/settings.json\n  Allow   Bash(git diff *)          ~/.claude/settings.json\n  Deny    Read(./.env)              .claude/settings.json',
            hint: 'The command has the same name as the settings key.',
            solution: '/permissions',
            bad: ['/config', '/settings'],
            near: [{ re: /^\/(config|settings)$/, msg: 'That opens general settings. There is a dedicated command for permission rules.' }],
          },
        ],
      },
      {
        type: 'boss',
        title: 'Boss fight: Settings & Rules',
        boss: 'sam',
        questions: [
          {
            q: 'What does the rule "Bash(npm run *)" in allow do?',
            options: [
              'Lets any command beginning with "npm run" execute without a prompt',
              'Lets every shell command run without a prompt',
              'Blocks npm entirely',
              'Runs npm automatically when a session starts',
            ],
            answer: 0,
            explain: 'The * is a wildcard for the rest of the command.',
          },
          {
            q: 'In what order are permission lists checked?',
            options: ['deny, ask, allow', 'allow, ask, deny', 'ask, allow, deny', 'Whatever order they appear in the file'],
            answer: 0,
            explain: 'Deny always gets the first say.',
          },
          {
            q: 'Which settings file is personal AND applies to only one project?',
            options: ['.claude/settings.local.json', '.claude/settings.json', '~/.claude/settings.json', 'CLAUDE.local.md'],
            answer: 0,
            explain: 'Local means yours, and it stays out of git.',
          },
          {
            q: 'You want to be certain Claude never reads your secrets file. What is the reliable way?',
            options: [
              'A deny rule in settings.json',
              'A polite note in CLAUDE.md',
              'Mentioning it at the start of each session',
              'Renaming the file to something boring',
            ],
            answer: 0,
            explain: 'CLAUDE.md is advice. Permission rules are enforced by Claude Code itself.',
          },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ 8 */
  {
    id: 'skills',
    icon: '✦',
    title: 'Custom Commands & Skills',
    tagline: 'Package a prompt you repeat into your own /command.',
    steps: [
      {
        type: 'lesson',
        title: 'Stop retyping',
        body: `
          <p>If you keep typing the same long instructions ("look up the issue, find the code, write a test, fix it, run the tests..."), turn them into a <strong>skill</strong>.</p>
          <p>A skill is a folder containing a <code>SKILL.md</code> file:</p>
          <pre>.claude/skills/fix-issue/SKILL.md</pre>
          <pre>---
name: fix-issue
description: Fix a GitHub issue by number. Use when asked to fix or resolve an issue.
---

Fix GitHub issue $ARGUMENTS.

1. Read the issue with: gh issue view $ARGUMENTS
2. Find the relevant code
3. Write a failing test, then make it pass
4. Run the full test suite</pre>
          <p>The part between the <code>---</code> lines is the header. Everything below is the prompt Claude receives.</p>`,
      },
      {
        type: 'lesson',
        title: 'Two ways a skill runs',
        body: `
          <p><strong>You invoke it.</strong> The folder name becomes a slash command. Whatever you type after it replaces <code>$ARGUMENTS</code>:</p>
          <pre>&gt; /fix-issue 482</pre>
          <p><strong>Claude picks it up.</strong> Claude sees the <code>description</code> of every skill. When your request matches one, it loads that skill on its own. This is why the description should say <em>when</em> to use it, not only what it is.</p>
          <p>Where the folder lives decides who gets it:</p>
          <table>
            <tr><td><code>.claude/skills/</code></td><td>this project, shared with the team</td></tr>
            <tr><td><code>~/.claude/skills/</code></td><td>you, in every project</td></tr>
          </table>
          <p class="note">You may also see single-file commands in <code>.claude/commands/name.md</code>. That older form still works the same way when invoked with /name.</p>`,
      },
      {
        type: 'terminal',
        title: 'Task: make the folder',
        brief: 'You are at a shell prompt in your project root. Create the folder for a project skill named <code>fix-issue</code>.',
        mode: 'shell',
        cmds: [
          {
            ask: 'Create the skill folder (parents included).',
            accept: [/^mkdir (-p |--parents )?(\.\/)?\.claude\/skills\/fix-issue\/?$/],
            near: [
              { re: /commands/, msg: 'That is the older single-file location. Skills live in .claude/skills/<name>/.' },
              { re: /^mkdir (-p )?(\.\/)?claude\/skills/, msg: 'The config folder starts with a dot: .claude' },
              { re: /~\/\.claude/, msg: 'That would make it a personal skill. This one is for the project, so use a path relative to the project root.' },
            ],
            out: '',
            hint: 'mkdir -p creates nested folders. The path is .claude/skills/ plus the skill name.',
            solution: 'mkdir -p .claude/skills/fix-issue',
            bad: ['mkdir .claude/commands/fix-issue', 'mkdir fix-issue'],
          },
        ],
      },
      {
        type: 'editor',
        title: 'Task: write the SKILL.md',
        brief: 'Complete the file. It needs a <strong>name</strong> of <code>fix-issue</code>, a <strong>description</strong> saying when to use it, and a body that uses <code>$ARGUMENTS</code> for the issue number.',
        filename: '.claude/skills/fix-issue/SKILL.md',
        starter: '---\nname: \ndescription: \n---\n\nFix GitHub issue number ...\n',
        validate(text) {
          const m = text.match(/^\s*---\s*\n([\s\S]*?)\n---\s*(?:\n([\s\S]*))?$/);
          if (!m) return 'Keep the header: a line of ---, the fields, then another line of ---.';
          const head = m[1];
          const body = m[2] || '';
          const name = (head.match(/^name:[ \t]*(.*)$/m) || [])[1];
          const desc = (head.match(/^description:[ \t]*(.*)$/m) || [])[1];
          if (name === undefined) return 'The header needs a name: line.';
          if (name.trim() !== 'fix-issue') return 'Set name to fix-issue so it matches the folder.';
          if (desc === undefined) return 'The header needs a description: line.';
          if (desc.trim().split(/\s+/).filter(Boolean).length < 4) return 'Write a fuller description. Say what it does and when Claude should use it.';
          if (!/\$ARGUMENTS/.test(body)) return 'Use $ARGUMENTS in the body (below the header) where the issue number should go.';
          return null;
        },
        hint: 'name: fix-issue, a one-sentence description, and replace the "..." in the body with $ARGUMENTS.',
        solution: '---\nname: fix-issue\ndescription: Fix a GitHub issue by number. Use when asked to fix an issue.\n---\n\nFix GitHub issue number $ARGUMENTS.\nWrite a failing test first, then make it pass.\n',
      },
      {
        type: 'terminal',
        title: 'Task: run your skill',
        brief: 'Back in a Claude Code session. Issue <strong>482</strong> just came in.',
        mode: 'claude',
        cmds: [
          {
            ask: 'Invoke your new skill on issue 482.',
            accept: [/^\/fix-issue #?482$/],
            near: [
              { re: /^\/fix-issue$/, msg: 'Claude needs to know which issue. Add the number after the command; it becomes $ARGUMENTS.' },
              { re: /^fix-issue/, msg: 'Skills are invoked as slash commands.' },
            ],
            out: '● Skill(fix-issue)\n● Bash(gh issue view 482)\n  "Export button does nothing on Safari"\n● Read(src/export.js)\n● Write(tests/export.test.js)\n● Edit(src/export.js)\n● Bash(npm test)\n  ✓ 48 passed\n\nFixed #482. The click handler used an API Safari lacks; replaced it\nand added a regression test.',
            hint: 'Slash, the skill name, a space, the number.',
            solution: '/fix-issue 482',
            bad: ['/fix-issue', 'fix-issue 482'],
          },
        ],
      },
      {
        type: 'quiz',
        title: 'Check: automatic use',
        q: 'What does Claude look at to decide whether to load a skill on its own?',
        options: [
          'The description in the skill header',
          'The size of the SKILL.md file',
          'How recently the skill was created',
          'Nothing. Skills only ever run when you type the slash command',
        ],
        answer: 0,
        explain: 'Descriptions are always visible to Claude; the body is loaded only when the skill is used.',
      },
      {
        type: 'boss',
        title: 'Boss fight: Custom Commands & Skills',
        boss: 'mark',
        questions: [
          {
            q: 'You type /fix-issue 482. What does $ARGUMENTS become in the skill body?',
            options: ['482', 'fix-issue', '/fix-issue 482', 'It stays as the literal text $ARGUMENTS'],
            answer: 0,
            explain: 'Everything after the command name is substituted in.',
          },
          {
            q: 'Where does a skill go if only you should have it, across all your projects?',
            options: ['~/.claude/skills/', '.claude/skills/', '.claude/settings.json', 'CLAUDE.md'],
            answer: 0,
            explain: 'Home folder means personal and global.',
          },
          {
            q: 'When is something worth turning into a skill?',
            options: [
              'When you keep giving Claude the same multi-step instructions',
              'For every prompt you ever write',
              'Only for tasks involving GitHub',
              'When you want to block a command',
            ],
            answer: 0,
            explain: 'Skills package repeatable workflows.',
          },
          {
            q: 'What file must a skill folder contain?',
            options: ['SKILL.md', 'README.md', 'skill.json', 'index.js'],
            answer: 0,
            explain: 'SKILL.md holds the header and the instructions.',
          },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ 9 */
  {
    id: 'extend',
    icon: '⧉',
    title: 'Subagents, Hooks & MCP',
    tagline: 'Delegate work, automate rules, connect outside tools.',
    steps: [
      {
        type: 'lesson',
        title: 'Subagents: delegate the digging',
        body: `
          <p>A <strong>subagent</strong> is a helper Claude can hand a task to. It works in its <strong>own separate context window</strong> and reports back with just the result.</p>
          <p>Why that matters: investigating a question might mean reading forty files. Done in your main conversation, all forty stay in context. Done by a subagent, only the answer comes back.</p>
          <pre>&gt; use a subagent to find every place we call the old billing API</pre>
          <p>You can define your own specialists, such as a code reviewer or a test writer, each with its own instructions and allowed tools. They are Markdown files in <code>.claude/agents/</code>, and <code>/agents</code> helps you create and manage them.</p>`,
      },
      {
        type: 'quiz',
        title: 'Check: why delegate?',
        q: 'What is the main benefit of giving a research task to a subagent?',
        options: [
          'The reading happens in a separate context, so your main conversation stays clean',
          'Subagents are allowed to skip permission rules',
          'Subagents can access the internet and Claude cannot',
          'It makes the task free',
        ],
        answer: 0,
        explain: 'Context isolation: only the summary returns to the main conversation.',
      },
      {
        type: 'lesson',
        title: 'Hooks: things that must always happen',
        body: `
          <p>An instruction in CLAUDE.md is a request. Claude usually follows it, but nothing guarantees it. A <strong>hook</strong> is a shell command that Claude Code itself runs at a fixed moment, every time, no matter what.</p>
          <table>
            <tr><td><code>PreToolUse</code></td><td>before a tool runs (can block it)</td></tr>
            <tr><td><code>PostToolUse</code></td><td>after a tool finishes</td></tr>
            <tr><td><code>UserPromptSubmit</code></td><td>when you send a message</td></tr>
            <tr><td><code>Stop</code></td><td>when Claude finishes responding</td></tr>
            <tr><td><code>SessionStart</code></td><td>when a session begins</td></tr>
          </table>
          <p>Hooks live in settings.json. This one runs the formatter after every file edit:</p>
          <pre>{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "npm run format" }
        ]
      }
    ]
  }
}</pre>
          <p>The <code>matcher</code> picks which tools trigger it. <code>/hooks</code> shows what is configured.</p>`,
      },
      {
        type: 'editor',
        title: 'Task: wire up a hook',
        brief: 'Complete this hook so that <strong>after</strong> Claude uses the <strong>Edit or Write</strong> tool, the command <code>npm run lint</code> runs. Replace each <code>___</code>.',
        filename: '.claude/settings.json',
        starter: '{\n  "hooks": {\n    "___": [\n      {\n        "matcher": "___",\n        "hooks": [\n          { "type": "command", "command": "___" }\n        ]\n      }\n    ]\n  }\n}\n',
        validate(text) {
          const r = parseJson(text);
          if (r.error) return r.error;
          const h = r.value && r.value.hooks;
          if (!h || typeof h !== 'object') return 'Keep the top-level "hooks" object.';
          if (h.___) return 'Replace the first ___ with the event name. Which event fires after a tool finishes?';
          if (h.PreToolUse) return 'PreToolUse fires before the tool runs. You want the lint to run after the edit.';
          const groups = h.PostToolUse;
          if (!Array.isArray(groups) || !groups.length) return 'The event name should be PostToolUse (spelling and capitals matter).';
          const g = groups[0] || {};
          const m = String(g.matcher || '');
          if (!/\bEdit\b/.test(m) || !/\bWrite\b/.test(m)) return 'The matcher should cover both tools, separated by a pipe: "Edit|Write".';
          const inner = Array.isArray(g.hooks) ? g.hooks[0] || {} : {};
          if (inner.type !== 'command') return 'Keep "type": "command" on the inner hook.';
          if (!/^npm run lint\b/.test(String(inner.command || '').trim())) return 'Set "command" to npm run lint.';
          return null;
        },
        hint: 'Event: PostToolUse. Matcher: Edit|Write. Command: npm run lint.',
        solution: '{\n  "hooks": {\n    "PostToolUse": [\n      {\n        "matcher": "Edit|Write",\n        "hooks": [\n          { "type": "command", "command": "npm run lint" }\n        ]\n      }\n    ]\n  }\n}\n',
      },
      {
        type: 'lesson',
        title: 'MCP: plug in outside tools',
        body: `
          <p>Out of the box Claude Code knows your files and your shell. <strong>MCP</strong> (Model Context Protocol) servers give it more tools: your issue tracker, error monitoring, a database, design files, a browser.</p>
          <p>Servers are added from the shell:</p>
          <pre>claude mcp add --transport http sentry https://mcp.sentry.dev/mcp</pre>
          <p>That reads as: add a server, reached over <strong>http</strong>, call it <strong>sentry</strong>, at this URL. Other useful pieces:</p>
          <table>
            <tr><td><code>claude mcp list</code></td><td>show configured servers</td></tr>
            <tr><td><code>claude mcp remove sentry</code></td><td>remove one</td></tr>
            <tr><td><code>/mcp</code></td><td>inside a session: check status and log in to servers</td></tr>
            <tr><td><code>--scope project</code></td><td>save to <code>.mcp.json</code> so the team shares it</td></tr>
          </table>
          <p class="note">An MCP server can see what you send it and can feed text back to Claude. Only add servers you trust.</p>`,
      },
      {
        type: 'terminal',
        title: 'Task: connect a server',
        brief: 'Your team uses Sentry for error tracking. Its MCP server is at <code>https://mcp.sentry.dev/mcp</code> and uses the http transport.',
        mode: 'shell',
        cmds: [
          {
            ask: 'Add the server, naming it sentry.',
            accept: [
              /^claude mcp add (--transport|-t) http (--scope \w+ |-s \w+ )?sentry https:\/\/mcp\.sentry\.dev\/mcp$/,
              /^claude mcp add (--scope \w+ |-s \w+ )(--transport|-t) http sentry https:\/\/mcp\.sentry\.dev\/mcp$/,
              /^claude mcp add sentry https:\/\/mcp\.sentry\.dev\/mcp (--transport|-t) http$/,
            ],
            near: [
              { re: /^claude mcp add sentry https:\/\/mcp\.sentry\.dev\/mcp$/, msg: 'Close, but without a transport flag Claude Code assumes a local program (stdio). Say it is http.' },
              { re: /^\/mcp/, msg: '/mcp works inside a session. You are at the shell, so the command starts with claude mcp.' },
              { re: /^claude mcp add .*https:\/\/mcp\.sentry\.dev\/mcp/, msg: 'Nearly. The order is: claude mcp add --transport http <name> <url>.' },
            ],
            out: 'Added HTTP MCP server sentry with URL: https://mcp.sentry.dev/mcp to local config',
            hint: 'claude mcp add --transport http <name> <url>',
            solution: 'claude mcp add --transport http sentry https://mcp.sentry.dev/mcp',
            bad: ['claude mcp add sentry https://mcp.sentry.dev/mcp', '/mcp add sentry'],
          },
          {
            ask: 'Confirm it is there by listing your MCP servers.',
            accept: [/^claude mcp list$/],
            out: 'sentry: https://mcp.sentry.dev/mcp (HTTP) - ! Needs authentication\n\nRun /mcp inside a session to log in.',
            hint: 'Same command family, different last word.',
            solution: 'claude mcp list',
            bad: ['claude mcp', 'claude list'],
          },
        ],
      },
      {
        type: 'quiz',
        title: 'Check: instruction or hook?',
        q: 'Every file Claude edits must be formatted, with no exceptions. Which approach guarantees it?',
        options: [
          'A PostToolUse hook that runs the formatter',
          'A line in CLAUDE.md saying "always format files"',
          'Reminding Claude at the start of each session',
          'A skill named /format',
        ],
        answer: 0,
        explain: 'CLAUDE.md is advice Claude follows. A hook is executed by Claude Code itself, every time.',
      },
      {
        type: 'boss',
        title: 'Boss fight: Subagents, Hooks & MCP',
        boss: 'elon',
        questions: [
          {
            q: 'What is an MCP server for?',
            options: [
              'Giving Claude access to external tools and data, such as an issue tracker',
              'Making Claude respond faster',
              'Storing your conversation history',
              'Replacing settings.json',
            ],
            answer: 0,
            explain: 'MCP extends what Claude can reach.',
          },
          {
            q: 'Which hook event can block an action before it happens?',
            options: ['PreToolUse', 'PostToolUse', 'Stop', 'SessionStart'],
            answer: 0,
            explain: 'Pre means before. A PreToolUse hook can refuse the tool call.',
          },
          {
            q: 'A subagent finishes its research. What comes back to your main conversation?',
            options: [
              'Its final report, not everything it read along the way',
              'Every file it opened, in full',
              'Nothing. You have to open a separate session to see it',
              'A zip file',
            ],
            answer: 0,
            explain: 'That is the whole point: the reading stays in the subagent.',
          },
          {
            q: 'Which command lists the MCP servers you have configured?',
            options: ['claude mcp list', 'claude --servers', 'claude mcp show-all', 'claude list mcp'],
            answer: 0,
            explain: 'claude mcp list from the shell, or /mcp in a session.',
          },
        ],
      },
    ],
  },

  /* ----------------------------------------------------------------- 10 */
  {
    id: 'auto',
    icon: '▶',
    title: 'Automation & Final Exam',
    tagline: 'Run Claude from scripts, then prove what you know.',
    steps: [
      {
        type: 'lesson',
        title: 'Headless mode',
        body: `
          <p>So far Claude Code has been a conversation. With the <code>-p</code> flag (short for <code>--print</code>) it becomes an ordinary command-line tool: it takes a prompt, does the work, prints the answer and exits.</p>
          <pre>claude -p "summarise what changed in the last 5 commits"</pre>
          <p>Because it is a normal command, it fits anywhere commands do: shell scripts, git hooks, CI pipelines, cron jobs.</p>
          <p>It also reads from a pipe, so you can feed it the output of another program:</p>
          <pre>cat error.log | claude -p "what is the root cause?"
git diff | claude -p "review this diff for bugs"</pre>`,
      },
      {
        type: 'terminal',
        title: 'Task: one-shot prompt',
        brief: 'You are at a shell prompt and want a quick answer without opening a session.',
        mode: 'shell',
        cmds: [
          {
            ask: 'Run Claude non-interactively with a prompt asking it to list the TODO comments in this project. Put the prompt in quotes.',
            accept: [/^claude (-p|--print) (["']).*\S+\s+\S+.*\2$/],
            near: [
              { re: /^claude (["']).+\1$/, msg: 'That starts an interactive session with an opening message. Which flag makes it print and exit?' },
              { re: /^claude (-p|--print) [^"']/, msg: 'Wrap the prompt in quotes so the shell passes it as one argument.' },
            ],
            out: 'Found 3 TODO comments:\n  src/server.js:41     TODO: rate-limit this endpoint\n  src/routes/books.js:88   TODO: paginate results\n  src/db.js:12         TODO: close connection on exit',
            hint: 'claude -p "your prompt here"',
            solution: 'claude -p "list the TODO comments in this project"',
            bad: ['claude "list the TODO comments"', 'claude -p list todos'],
          },
        ],
      },
      {
        type: 'terminal',
        title: 'Task: pipe something in',
        brief: 'The build just failed and wrote its output to <code>build.log</code>.',
        mode: 'shell',
        cmds: [
          {
            ask: 'Pipe build.log into Claude and ask why the build failed.',
            accept: [
              /^cat (\.\/)?build\.log \| claude (-p|--print) (["']).*\S.*\3$/,
              /^claude (-p|--print) (["']).*\S.*\2 < (\.\/)?build\.log$/,
            ],
            near: [
              { re: /^cat (\.\/)?build\.log \| claude( (["']).*\3)?$/, msg: 'The pipe is right. Add the flag that makes Claude print an answer and exit.' },
              { re: /^claude (-p|--print) .*build\.log/, msg: 'That asks Claude to go and find the file, which can work. But the task is to pipe it: cat build.log | claude ...' },
            ],
            out: 'The build failed because src/export.ts imports "./utils/csv" but the\nfile was renamed to csv-writer.ts in the last commit. Update the import\non line 3.',
            hint: 'cat build.log | claude -p "..."',
            solution: 'cat build.log | claude -p "why did the build fail?"',
            bad: ['cat build.log | claude', 'claude build.log'],
          },
        ],
      },
      {
        type: 'lesson',
        title: 'Output and permissions in scripts',
        body: `
          <p><strong>Machine-readable output.</strong> Scripts often want structured data, not prose:</p>
          <pre>claude -p "list the exported functions in src/api.js" --output-format json</pre>
          <p>The JSON includes the result plus metadata such as the session ID and cost.</p>
          <p><strong>Permissions.</strong> In headless mode nobody is there to click "Yes". Anything that would need approval is simply refused, unless you allow it in advance:</p>
          <pre>claude -p "run the tests and fix any failures" \\
  --allowedTools "Edit" "Bash(npm test)"</pre>
          <p>Allow only what the job needs. Your settings.json rules apply here too.</p>`,
      },
      {
        type: 'terminal',
        title: 'Task: JSON for a script',
        brief: 'A script of yours needs to parse Claude\'s answer.',
        mode: 'shell',
        cmds: [
          {
            ask: 'Ask Claude headlessly to count the test files, with the output as JSON.',
            accept: [
              /^claude (-p|--print) (["']).*\S.*\2 --output-format[ =]json$/,
              /^claude --output-format[ =]json (-p|--print) (["']).*\S.*\2$/,
            ],
            near: [
              { re: /--json/, msg: 'The flag is --output-format, followed by json.' },
              { re: /^claude (-p|--print) (["']).*\2$/, msg: 'Good so far. Now add the flag that sets the output format to json.' },
              { re: /--output-format[ =]json/, msg: 'The format flag is right. Check the rest: claude -p "prompt" --output-format json' },
            ],
            out: '{"type":"result","subtype":"success","is_error":false,\n "result":"There are 14 test files.",\n "session_id":"0b1e…","total_cost_usd":0.0123}',
            hint: 'claude -p "..." --output-format json',
            solution: 'claude -p "count the test files" --output-format json',
            bad: ['claude -p "count the test files" --json', 'claude -p "count the test files"'],
          },
        ],
      },
      {
        type: 'quiz',
        title: 'Check: nobody to ask',
        q: 'A CI job runs claude -p "fix the lint errors" and nothing gets edited. What is the most likely reason?',
        options: [
          'Editing needs permission, and in headless mode it must be granted up front, for example with --allowedTools',
          'Claude cannot edit files in headless mode at all',
          'The -p flag means "preview only"',
          'CI servers cannot run Claude Code',
        ],
        answer: 0,
        explain: 'No human, no prompt. Pre-approve exactly the tools the job needs.',
      },
      {
        type: 'boss',
        title: 'Final boss: the exam',
        boss: ['mark', 'jeff', 'palmer', 'peter', 'jensen', 'elon', 'sam'],
        questions: [
          {
            q: 'You open your terminal to work on a project with Claude. What are the first two commands?',
            options: ['cd into the project, then claude', 'claude, then cd into the project', 'npm start, then claude', '/init, then claude'],
            answer: 0,
            explain: 'Claude works on the folder it starts in.',
          },
          {
            q: 'Match the prefix: which character attaches a file to your message?',
            options: ['@', '!', '/', '#'],
            answer: 0,
            explain: '@ for files, ! for shell, / for commands.',
          },
          {
            q: 'You are about to start an unrelated task in the same session. What do you run?',
            options: ['/clear', '/compact', '/init', '/rewind'],
            answer: 0,
            explain: 'New task, clean context.',
          },
          {
            q: 'You want Claude to research and propose an approach before changing any file. What do you use?',
            options: ['Plan mode (Shift+Tab)', 'Accept-edits mode', 'Headless mode', 'A PostToolUse hook'],
            answer: 0,
            explain: 'Plan mode is read-only until you approve.',
          },
          {
            q: 'Where do you record "run tests with pnpm test" so Claude knows it in every session of this project?',
            options: ['CLAUDE.md', 'A sticky note', '.claude/settings.local.json', 'The first prompt of each session'],
            answer: 0,
            explain: 'Project memory is loaded automatically.',
          },
          {
            q: 'Which is enforced by Claude Code rather than merely suggested to Claude?',
            options: [
              'A deny rule in settings.json',
              'A sentence in CLAUDE.md',
              'A comment in your code',
              'A firm tone of voice',
            ],
            answer: 0,
            explain: 'Permission rules and hooks are enforced. Memory files are guidance.',
          },
          {
            q: 'You keep typing the same six-step release checklist. What should it become?',
            options: ['A skill, invoked as a slash command', 'An MCP server', 'A deny rule', 'A longer CLAUDE.md'],
            answer: 0,
            explain: 'Skills package repeatable workflows.',
          },
          {
            q: 'Which command runs Claude once from a script and exits?',
            options: ['claude -p "..."', 'claude -c', 'claude --resume', 'claude mcp add'],
            answer: 0,
            explain: '-p is print mode: prompt in, answer out.',
          },
          {
            q: 'Claude starts editing the wrong files. What is the fastest correct reaction?',
            options: [
              'Press Esc, then tell it what you actually want',
              'Wait for it to finish, then complain',
              'Close the terminal',
              'Run /compact',
            ],
            answer: 0,
            explain: 'Interrupt early. Use Esc Esc to rewind if damage is done.',
          },
          {
            q: 'What single habit most improves results on larger tasks?',
            options: [
              'Explore and plan first, and give Claude a way to verify its work',
              'Write the shortest prompt possible',
              'Never use /clear',
              'Approve everything quickly',
            ],
            answer: 0,
            explain: 'Explore, plan, code, verify, commit.',
          },
        ],
      },
    ],
  },
];

if (typeof module !== 'undefined') module.exports = LEVELS;
