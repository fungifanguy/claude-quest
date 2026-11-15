/* Claude Code Quest — game engine. Depends on LEVELS from levels.js. */
(function () {
  'use strict';

  const KEY = 'ccquest.v1';
  const XP = { lesson: 5, quiz: 20, terminal: 30, keys: 25, editor: 40, order: 30, boss: 60 };
  const RANKS = [
    [0, 'Newcomer'],
    [0.1, 'Apprentice'],
    [0.28, 'Operator'],
    [0.5, 'Engineer'],
    [0.72, 'Architect'],
    [0.9, 'Claude Code Pro'],
  ];
  const MAX_XP = LEVELS.reduce((n, l) => n + l.steps.reduce((m, s) => m + XP[s.type], 0), 0);

  const $ = (sel, root) => (root || document).querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sid = (li, si) => LEVELS[li].id + '.' + si;

  /* ---------------------------------------------------------- state */
  let S = load();
  function load() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY));
      if (v && typeof v.done === 'object' && typeof v.xp === 'number') return v;
    } catch (e) { /* storage unavailable or corrupt: start fresh */ }
    return { done: {}, xp: 0 };
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* play on without persistence */ }
  }

  const isDone = (li, si) => !!S.done[sid(li, si)];
  const doneCount = (li) => LEVELS[li].steps.filter((_, si) => isDone(li, si)).length;
  const levelComplete = (li) => doneCount(li) === LEVELS[li].steps.length;
  const levelUnlocked = (li) => li === 0 || levelComplete(li - 1);
  function firstOpen(li) {
    const n = LEVELS[li].steps.length;
    for (let i = 0; i < n; i++) if (!isDone(li, i)) return i;
    return n; // n = the "level complete" screen
  }
  const allComplete = () => LEVELS.every((_, i) => levelComplete(i));

  let view = { level: 0, step: 0 };
  (function initialView() {
    let li = LEVELS.findIndex((_, i) => !levelComplete(i));
    if (li < 0) li = LEVELS.length - 1;
    view = { level: li, step: firstOpen(li) };
  })();

  let cleanups = [];
  function cleanup() {
    cleanups.forEach((fn) => fn());
    cleanups = [];
  }

  /* ---------------------------------------------------------- chrome */
  function rankFor(xp) {
    let name = RANKS[0][1];
    for (const [frac, n] of RANKS) if (xp >= Math.round(frac * MAX_XP)) name = n;
    return name;
  }

  function renderTop() {
    $('#rank').textContent = rankFor(S.xp);
    $('#xp-text').textContent = S.xp + ' / ' + MAX_XP + ' XP';
    $('#xp-fill').style.width = Math.min(100, (S.xp / MAX_XP) * 100) + '%';
  }

  function renderMap() {
    const map = $('#map');
    map.innerHTML = '';
    LEVELS.forEach((L, li) => {
      const unlocked = levelUnlocked(li);
      const complete = levelComplete(li);
      const b = document.createElement('button');
      b.className = 'lvl' + (li === view.level ? ' current' : '') + (complete ? ' complete' : '') + (unlocked ? '' : ' locked');
      b.disabled = !unlocked;
      const state = !unlocked ? 'Locked' : complete ? 'Complete' : doneCount(li) + ' / ' + L.steps.length;
      b.innerHTML =
        '<span class="lvl-icon">' + (unlocked ? esc(L.icon) : '🔒') + '</span>' +
        '<span class="lvl-text"><span class="lvl-n">Level ' + (li + 1) + '</span>' +
        '<span class="lvl-title">' + esc(L.title) + '</span>' +
        '<span class="lvl-state">' + state + '</span></span>';
      if (!unlocked) b.title = 'Finish level ' + li + ' to unlock';
      b.addEventListener('click', () => {
        view = { level: li, step: Math.min(firstOpen(li), L.steps.length - (complete ? 0 : 1)) };
        if (complete) view.step = 0; // revisit from the start
        render();
      });
      map.appendChild(b);
    });
  }

  /* ---------------------------------------------------------- stage */
  function render() {
    renderTop();
    renderMap();
    renderStage();
    const cur = $('.lvl.current');
    if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function renderStage() {
    cleanup();
    const stage = $('#stage');
    const li = view.level;
    const L = LEVELS[li];
    if (view.step >= L.steps.length) return renderLevelDone(stage, li);

    const si = view.step;
    const step = L.steps[si];
    const open = firstOpen(li);

    stage.innerHTML =
      '<div class="stage-head">' +
      '<div class="crumb">Level ' + (li + 1) + ' · ' + esc(L.title) + '</div>' +
      '<div class="dots" role="tablist"></div>' +
      '</div>' +
      '<section class="card step-' + step.type + '">' +
      '<div class="tag">' + tagFor(step) + '</div>' +
      '<h1>' + esc(step.title) + '</h1>' +
      '<div class="body"></div>' +
      '</section>' +
      '<div class="foot">' +
      '<button class="ghost" id="back">← Back</button>' +
      '<div class="feedback" id="feedback" role="status" aria-live="polite"></div>' +
      '<button class="primary" id="next">Continue →</button>' +
      '</div>';

    const dots = $('.dots', stage);
    L.steps.forEach((s, i) => {
      const d = document.createElement('button');
      d.className = 'dot' + (isDone(li, i) ? ' done' : '') + (i === si ? ' here' : '') + (s.type === 'boss' ? ' boss' : '');
      d.disabled = i > open;
      d.title = s.title + (i > open ? ' (locked)' : '');
      d.setAttribute('aria-label', d.title);
      d.addEventListener('click', () => { view.step = i; renderStage(); });
      dots.appendChild(d);
    });

    const back = $('#back', stage);
    const next = $('#next', stage);
    const feedback = $('#feedback', stage);
    back.disabled = si === 0;
    back.addEventListener('click', () => { view.step = si - 1; renderStage(); });

    const already = isDone(li, si);
    next.disabled = !(already || step.type === 'lesson');
    if (already && step.type !== 'lesson') feedback.innerHTML = '<span class="ok">✓ Completed. Replay it or continue.</span>';

    function award(penalised) {
      if (isDone(li, si)) return 0;
      const xp = Math.round(XP[step.type] * (penalised ? 0.5 : 1));
      S.done[sid(li, si)] = true;
      S.xp += xp;
      save();
      renderTop();
      renderMap();
      const dot = dots.children[si];
      if (dot) dot.classList.add('done');
      return xp;
    }

    const ctx = {
      finish(penalised, msg) {
        const xp = award(penalised);
        feedback.innerHTML = '<span class="ok">✓ ' + esc(msg || 'Correct!') + (xp ? ' <b>+' + xp + ' XP</b>' : '') + '</span>';
        next.disabled = false;
        next.focus({ preventScroll: true });
      },
      fail(msg) {
        feedback.innerHTML = '<span class="bad">✗ ' + esc(msg) + '</span>';
      },
      note(msg) {
        feedback.textContent = msg || '';
      },
    };

    next.addEventListener('click', () => {
      if (step.type === 'lesson') award(false);
      view.step = si + 1;
      renderStage();
      window.scrollTo(0, 0);
    });

    RENDER[step.type](step, $('.body', stage), ctx);
  }

  function tagFor(step) {
    return {
      lesson: 'Lesson',
      quiz: 'Quick check · ' + XP.quiz + ' XP',
      terminal: 'Terminal task · ' + XP.terminal + ' XP',
      keys: 'Keyboard task · ' + XP.keys + ' XP',
      editor: 'File task · ' + XP.editor + ' XP',
      order: 'Ordering task · ' + XP.order + ' XP',
      boss: 'Gate test · ' + XP.boss + ' XP · pass to unlock the next level',
    }[step.type];
  }

  function renderLevelDone(stage, li) {
    const L = LEVELS[li];
    const last = li === LEVELS.length - 1;
    if (last && allComplete()) {
      const pct = Math.round((S.xp / MAX_XP) * 100);
      stage.innerHTML =
        '<section class="card finale">' +
        '<div class="big-icon">✻</div>' +
        '<h1>Quest complete</h1>' +
        '<p>You cleared all ' + LEVELS.length + ' levels and passed the final exam.</p>' +
        '<div class="cert"><div class="cert-rank">' + esc(rankFor(S.xp)) + '</div>' +
        '<div class="cert-xp">' + S.xp + ' of ' + MAX_XP + ' XP · ' + pct + '%</div></div>' +
        '<p>The real thing is one command away. Open a terminal, <code>cd</code> into a project and type <code>claude</code>. ' +
        'Start with <code>/init</code>, then try the explore, plan, code, verify, commit loop on something small.</p>' +
        '<p class="note">Lost XP to hints? Reset and replay for a perfect run.</p>' +
        '</section>';
      return;
    }
    stage.innerHTML =
      '<section class="card finale">' +
      '<div class="big-icon">' + esc(L.icon) + '</div>' +
      '<h1>Level ' + (li + 1) + ' complete</h1>' +
      '<p>' + esc(L.title) + ' is done. Rank: <strong>' + esc(rankFor(S.xp)) + '</strong> · ' + S.xp + ' XP</p>' +
      '<p class="up-next">Unlocked: <strong>Level ' + (li + 2) + ' · ' + esc(LEVELS[li + 1].title) + '</strong><br>' + esc(LEVELS[li + 1].tagline) + '</p>' +
      '<button class="primary" id="go">Start level ' + (li + 2) + ' →</button>' +
      '</section>';
    $('#go', stage).addEventListener('click', () => {
      view = { level: li + 1, step: firstOpen(li + 1) };
      render();
      window.scrollTo(0, 0);
    });
    $('#go', stage).focus({ preventScroll: true });
  }

  /* ---------------------------------------------------------- helpers */
  function shuffled(n, avoidIdentity) {
    const a = Array.from({ length: n }, (_, i) => i);
    do {
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
    } while (avoidIdentity && n > 1 && a.every((v, i) => v === i));
    return a;
  }

  function normalise(s) {
    return s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
  }

  /** Renders answer buttons for one question. onPick(correct, firstTry). */
  function optionButtons(q, host, { retry, onPick }) {
    const wrap = document.createElement('div');
    wrap.className = 'options';
    let tries = 0;
    shuffled(q.options.length).forEach((oi) => {
      const b = document.createElement('button');
      b.className = 'opt';
      b.textContent = q.options[oi];
      b.addEventListener('click', () => {
        tries++;
        const right = oi === q.answer;
        b.classList.add(right ? 'right' : 'wrong');
        b.disabled = true;
        if (right || !retry) {
          wrap.querySelectorAll('.opt').forEach((x) => (x.disabled = true));
          if (!right) wrap.children[wrap.dataset.correct].classList.add('right');
        }
        onPick(right, tries === 1);
      });
      if (oi === q.answer) wrap.dataset.correct = wrap.children.length;
      wrap.appendChild(b);
    });
    host.appendChild(wrap);
    return wrap;
  }

  function helperRow(host, { hint, onReveal }) {
    const row = document.createElement('div');
    row.className = 'helpers';
    const box = document.createElement('div');
    box.className = 'hintbox';
    box.hidden = true;
    const hb = document.createElement('button');
    hb.className = 'ghost small';
    hb.textContent = 'Hint (−50% XP)';
    const rb = document.createElement('button');
    rb.className = 'ghost small';
    rb.textContent = 'Show answer';
    rb.hidden = true;
    row.append(hb, rb);
    host.append(row, box);
    const api = {
      used: false,
      setHint(h) { hint = h; box.hidden = true; },
      offerReveal() { rb.hidden = false; },
      hide() { row.hidden = true; },
    };
    hb.addEventListener('click', () => { api.used = true; box.textContent = '💡 ' + hint; box.hidden = false; });
    rb.addEventListener('click', () => { api.used = true; onReveal(); });
    return api;
  }

  /* ---------------------------------------------------------- renderers */
  const RENDER = {
    lesson(step, host) {
      host.innerHTML = '<div class="prose">' + step.body + '</div>';
    },

    quiz(step, host, ctx) {
      host.innerHTML = '<p class="question">' + esc(step.q) + '</p>';
      let penalised = false;
      const explain = document.createElement('p');
      explain.className = 'explain';
      explain.hidden = true;
      optionButtons(step, host, {
        retry: true,
        onPick(right) {
          if (right) {
            explain.textContent = step.explain;
            explain.hidden = false;
            ctx.finish(penalised);
          } else {
            penalised = true;
            ctx.fail('Not that one. Try again.');
          }
        },
      });
      host.appendChild(explain);
    },

    boss(step, host, ctx) {
      const total = step.questions.length;
      const need = Math.ceil(total * 0.75);
      let qi = 0;
      let score = 0;
      const order = shuffled(total);

      function intro() {
        host.innerHTML =
          '<div class="prose"><p>' + total + ' questions on everything in this level. No hints, one attempt per question.</p>' +
          '<p>Pass mark: <strong>' + need + ' of ' + total + '</strong>. Fail and you can retake it straight away.</p></div>';
        const b = document.createElement('button');
        b.className = 'primary';
        b.textContent = 'Begin test';
        b.addEventListener('click', ask);
        host.appendChild(b);
      }

      function ask() {
        ctx.note('');
        const q = step.questions[order[qi]];
        host.innerHTML =
          '<div class="boss-meta">Question ' + (qi + 1) + ' of ' + total + ' · score ' + score + '</div>' +
          '<p class="question">' + esc(q.q) + '</p>';
        const explain = document.createElement('p');
        explain.className = 'explain';
        explain.hidden = true;
        const cont = document.createElement('button');
        cont.className = 'primary';
        cont.hidden = true;
        cont.textContent = qi + 1 < total ? 'Next question' : 'See result';
        cont.addEventListener('click', () => { qi++; qi < total ? ask() : result(); });
        optionButtons(q, host, {
          retry: false,
          onPick(right) {
            if (right) score++;
            explain.textContent = (right ? '✓ ' : '✗ ') + q.explain;
            explain.classList.toggle('miss', !right);
            explain.hidden = false;
            cont.hidden = false;
            cont.focus({ preventScroll: true });
          },
        });
        host.append(explain, cont);
      }

      function result() {
        const pass = score >= need;
        host.innerHTML =
          '<div class="result ' + (pass ? 'pass' : 'failr') + '">' +
          '<div class="score">' + score + ' / ' + total + '</div>' +
          '<div>' + (pass ? 'Passed.' : 'Not enough this time. You need ' + need + '.') + '</div></div>';
        if (pass) {
          ctx.finish(false, score === total ? 'Perfect score!' : 'Test passed!');
        } else {
          ctx.fail('Review the lessons with the dots above, or retake now.');
          const b = document.createElement('button');
          b.className = 'primary';
          b.textContent = 'Retake test';
          b.addEventListener('click', () => { qi = 0; score = 0; order.splice(0, total, ...shuffled(total)); ask(); });
          host.appendChild(b);
        }
      }

      intro();
    },

    terminal(step, host, ctx) {
      let ci = 0;
      let fails = 0;
      host.innerHTML =
        '<div class="prose"><p>' + step.brief + '</p></div>' +
        '<div class="objective"></div>' +
        '<div class="term ' + step.mode + '">' +
        '<div class="term-bar"><i></i><i></i><i></i><span>' + (step.mode === 'claude' ? 'claude — ~/my-app' : 'bash — ~/my-app') + '</span></div>' +
        '<div class="term-log"></div>' +
        '<form class="term-row"><span class="ps">' + (step.mode === 'claude' ? '&gt;' : '$') + '</span>' +
        '<input type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Terminal input"></form>' +
        '</div>';
      const objective = $('.objective', host);
      const log = $('.term-log', host);
      const form = $('.term-row', host);
      const input = $('input', form);
      const term = $('.term', host);

      const help = helperRow(host, {
        hint: step.cmds[0].hint,
        onReveal() { input.value = step.cmds[ci].solution; input.focus(); },
      });

      function line(text, cls) {
        const d = document.createElement('div');
        d.className = 'ln ' + (cls || '');
        d.textContent = text;
        log.appendChild(d);
        log.scrollTop = log.scrollHeight;
      }

      function showObjective() {
        const many = step.cmds.length > 1;
        objective.innerHTML = '<span class="obj-n">' + (many ? 'Step ' + (ci + 1) + ' of ' + step.cmds.length : 'Objective') + '</span> ' + esc(step.cmds[ci].ask);
        help.setHint(step.cmds[ci].hint);
      }

      if (step.mode === 'claude') line('✻ Claude Code   (simulated session)', 'dim');
      showObjective();

      term.addEventListener('click', () => { if (!String(window.getSelection())) input.focus(); });
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const raw = input.value;
        const val = normalise(raw);
        if (!val) return;
        const cmd = step.cmds[ci];
        line((step.mode === 'claude' ? '> ' : '$ ') + raw, 'echo');
        input.value = '';
        if (cmd.accept.some((re) => re.test(val))) {
          if (cmd.out) line(cmd.out, 'out');
          ci++;
          fails = 0;
          if (ci >= step.cmds.length) {
            input.disabled = true;
            input.placeholder = 'task complete';
            objective.innerHTML = '<span class="obj-n">Done</span> All objectives met.';
            help.hide();
            ctx.finish(help.used);
          } else {
            ctx.note('');
            showObjective();
          }
        } else {
          fails++;
          const near = (cmd.near || []).find((n) => n.re.test(val));
          const msg = near ? near.msg : 'That is not the command for this objective. Check the lesson, or use a hint.';
          line(msg, 'err');
          ctx.fail('Not quite. Read the message in the terminal.');
          if (fails >= 2) help.offerReveal();
        }
      });
      input.focus({ preventScroll: true });
    },

    editor(step, host, ctx) {
      host.innerHTML =
        '<div class="prose"><p>' + step.brief + '</p></div>' +
        '<div class="editor"><div class="term-bar"><i></i><i></i><i></i><span>' + esc(step.filename) + '</span></div>' +
        '<textarea spellcheck="false" autocapitalize="off" autocorrect="off" aria-label="File contents"></textarea></div>' +
        '<div class="editor-actions"><button class="primary" id="check">Check file</button>' +
        '<button class="ghost small" id="restart">Start over</button></div>' +
        '<div class="editor-msg" role="status"></div>';
      const ta = $('textarea', host);
      const msg = $('.editor-msg', host);
      let fails = 0;
      ta.value = step.starter;
      ta.rows = Math.max(8, step.solution.split('\n').length + 2);
      const help = helperRow(host, { hint: step.hint, onReveal() { ta.value = step.solution; } });

      // Tab inserts two spaces instead of leaving the field.
      ta.addEventListener('keydown', (e) => {
        if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          const s = ta.selectionStart;
          ta.setRangeText('  ', s, ta.selectionEnd, 'end');
        }
      });
      $('#restart', host).addEventListener('click', () => { ta.value = step.starter; msg.textContent = ''; });
      $('#check', host).addEventListener('click', () => {
        const err = step.validate(ta.value);
        if (err) {
          fails++;
          msg.className = 'editor-msg bad';
          msg.textContent = '✗ ' + err;
          ctx.fail('The file is not right yet.');
          if (fails >= 2) help.offerReveal();
        } else {
          msg.className = 'editor-msg ok';
          msg.textContent = '✓ File looks good.';
          ctx.finish(help.used);
        }
      });
    },

    order(step, host, ctx) {
      host.innerHTML = '<div class="prose"><p>' + step.brief + '</p></div><ol class="picked"></ol><div class="pool"></div>';
      const picked = $('.picked', host);
      const pool = $('.pool', host);
      let nextIdx = 0;
      let mistakes = 0;
      shuffled(step.items.length, true).forEach((ii) => {
        const b = document.createElement('button');
        b.className = 'chip';
        b.textContent = step.items[ii];
        b.addEventListener('click', () => {
          if (ii === nextIdx) {
            const liEl = document.createElement('li');
            liEl.textContent = step.items[ii];
            picked.appendChild(liEl);
            b.remove();
            nextIdx++;
            ctx.note('');
            if (nextIdx === step.items.length) ctx.finish(mistakes > 1, 'Right order!');
          } else {
            mistakes++;
            b.classList.remove('shake');
            void b.offsetWidth; // restart the animation
            b.classList.add('shake');
            ctx.fail(nextIdx === 0 ? 'That is not where you would start.' : 'Something else comes before that.');
          }
        });
        pool.appendChild(b);
      });
    },

    keys(step, host, ctx) {
      host.innerHTML =
        '<div class="prose"><p>' + step.brief + '</p></div>' +
        '<div class="term claude keys"><div class="term-bar"><i></i><i></i><i></i><span>claude — ~/my-app</span></div>' +
        '<div class="term-log"></div>' +
        '<div class="mock-input"><span class="ps">&gt;</span><span class="caret"></span></div>' +
        '<div class="mode-line"></div></div>' +
        '<div class="touch-keys"><span>No keyboard? Tap:</span></div>';
      const log = $('.term-log', host);
      const modeLine = $('.mode-line', host);
      const touch = $('.touch-keys', host);
      let finished = false;

      function line(text, cls) {
        const d = document.createElement('div');
        d.className = 'ln ' + (cls || '');
        d.textContent = text;
        log.appendChild(d);
        while (log.children.length > 9) log.removeChild(log.firstChild);
      }
      function touchKey(label, name) {
        const b = document.createElement('button');
        b.className = 'keycap';
        b.textContent = label;
        b.addEventListener('click', () => act(name));
        touch.appendChild(b);
      }
      function done(msg) {
        if (finished) return;
        finished = true;
        ctx.finish(false, msg);
      }

      let act = () => {};

      if (step.scenario === 'plan') {
        const MODES = [
          ['', '? for shortcuts'],
          ['edits', '⏵⏵ accept edits on (shift+tab to cycle)'],
          ['plan', '⏸ plan mode on (shift+tab to cycle)'],
        ];
        let mi = 0;
        const paint = () => { modeLine.textContent = MODES[mi][1]; modeLine.className = 'mode-line ' + MODES[mi][0]; };
        paint();
        line('Press Shift+Tab and watch the line under the prompt.', 'dim');
        touchKey('Shift + Tab', 'shift+tab');
        act = (k) => {
          if (k === 'esc') return ctx.note('Esc does something else. The mode shortcut is Shift+Tab.');
          if (k !== 'shift+tab') return;
          mi = (mi + 1) % MODES.length;
          paint();
          if (mi === 2) done('Plan mode is on.');
          else if (!finished) ctx.note('That is accept-edits mode. Keep going.');
        };
      }

      if (step.scenario === 'interrupt') {
        const files = ['index.js', 'utils.js', 'legacy/parser.js', 'legacy/format.js', 'routes/books.js', 'routes/users.js', 'db.js', 'server.js'];
        let n = 0;
        modeLine.textContent = '✻ Working… (esc to interrupt)';
        modeLine.className = 'mode-line busy';
        line('> tidy up src/utils.js', 'echo');
        line('● I\'ll clean up the whole src folder while I\'m here.', 'out');
        const timer = setInterval(() => { line('● Bash(rm src/' + files[n++ % files.length] + ')', 'err'); }, 700);
        cleanups.push(() => clearInterval(timer));
        touchKey('Esc', 'esc');
        act = (k) => {
          if (finished) return;
          if (k !== 'esc') return ctx.note('That switches modes. To stop Claude right now, use a different key.');
          clearInterval(timer);
          line('  ⎿ Interrupted · What should Claude do instead?', 'dim');
          modeLine.textContent = '? for shortcuts';
          modeLine.className = 'mode-line';
          done('Stopped after ' + n + ' deletion' + (n === 1 ? '' : 's') + '. Faster is better.');
        };
      }

      if (step.scenario === 'rewind') {
        let last = 0;
        modeLine.textContent = '? for shortcuts';
        line('  ⎿ Interrupted · What should Claude do instead?', 'dim');
        line('The prompt is empty. Two quick presses of the same key open rewind.', 'dim');
        touchKey('Esc', 'esc');
        act = (k) => {
          if (finished) return;
          if (k !== 'esc') return ctx.note('Not that one. Rewind is on the Esc key.');
          const now = Date.now();
          if (now - last < 900) {
            line('Rewind — restore code and/or conversation to:', 'out');
            line('  ❯ before "tidy up src/utils.js"        (3 files changed)', 'out');
            line('    before "fix parsePrice"              (2 files changed)', 'out');
            line('    start of session', 'out');
            done('Rewind menu open.');
          } else {
            last = now;
            ctx.note('Once… now again, quickly.');
          }
        };
      }

      function onKey(e) {
        if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); act('shift+tab'); }
        else if (e.key === 'Escape') { e.preventDefault(); act('esc'); }
      }
      document.addEventListener('keydown', onKey);
      cleanups.push(() => document.removeEventListener('keydown', onKey));
    },
  };

  /* ---------------------------------------------------------- boot */
  $('#reset').addEventListener('click', () => {
    if (!window.confirm('Erase all progress and XP and start again from level 1?')) return;
    S = { done: {}, xp: 0 };
    save();
    view = { level: 0, step: 0 };
    render();
  });

  render();
})();
