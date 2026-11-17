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
  // mode: 'full' = levels unlock in order; 'free' = any level, any time.
  // miss / solved track the current run of each level (for flawless runs);
  // perfect and tried are permanent records.
  const fresh = () => ({ done: {}, xp: 0, mode: null, avatar: 'classic', miss: {}, solved: {}, perfect: {}, tried: {}, muted: false });
  let S = load();
  function load() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY));
      if (v && typeof v.done === 'object' && typeof v.xp === 'number') {
        if (v.mode !== 'full' && v.mode !== 'free') v.mode = null;
        if (v.avatar !== 'blonde') v.avatar = 'classic';
        const base = fresh();
        ['miss', 'solved', 'perfect', 'tried'].forEach((k) => { if (!v[k] || typeof v[k] !== 'object') v[k] = base[k]; });
        v.muted = !!v.muted;
        return v;
      }
    } catch (e) { /* storage unavailable or corrupt: start fresh */ }
    return fresh();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* play on without persistence */ }
  }

  const isDone = (li, si) => !!S.done[sid(li, si)];
  const doneCount = (li) => LEVELS[li].steps.filter((_, si) => isDone(li, si)).length;
  const levelComplete = (li) => doneCount(li) === LEVELS[li].steps.length;
  const levelUnlocked = (li) => S.mode === 'free' || li === 0 || levelComplete(li - 1);
  function firstOpen(li) {
    const n = LEVELS[li].steps.length;
    for (let i = 0; i < n; i++) if (!isDone(li, i)) return i;
    return n; // n = the "level complete" screen
  }
  const allComplete = () => LEVELS.every((_, i) => levelComplete(i));

  function nextIncomplete() {
    const li = LEVELS.findIndex((_, i) => !levelComplete(i));
    return li < 0 ? LEVELS.length - 1 : li;
  }
  /** Jump into a level: resume where you left off, or replay from the top if it is finished. */
  function openLevel(li) {
    view = { screen: 'play', level: li, step: levelComplete(li) ? 0 : firstOpen(li) };
    if (view.step === 0) { // a fresh run (or a replay): the flawless record starts over
      S.miss[LEVELS[li].id] = 0;
      S.solved[LEVELS[li].id] = [];
      save();
    }
    render();
    window.scrollTo(0, 0);
  }

  let view = { screen: 'home', level: 0, step: 0 };
  if (S.mode === 'full') {
    const li = nextIncomplete();
    view = { screen: 'play', level: li, step: firstOpen(li) };
  }

  /* ---------------------------------------------------------- avatars */
  const AVATARS = { classic: 'Claude', blonde: 'Blonde Claude' };
  function avatarSVG(kind) {
    const blonde = kind === 'blonde';
    return (
      '<svg class="avatar" viewBox="0 0 24 24" shape-rendering="crispEdges" role="img" aria-label="' + AVATARS[blonde ? 'blonde' : 'classic'] + '">' +
      (blonde
        ? '<path fill="#f3d36b" d="M3 5h4v17H3zM17 5h4v17h-4zM5 3h14v4H5z"/>' +
          '<path fill="#dcb444" d="M4 9h1v12H4zM19 9h1v12h-1zM6 11h1v10H6zM17 11h1v10h-1z"/>'
        : '') +
      '<path fill="#d97757" d="M6 6h12v11H6zM3 11h3v3H3zM18 11h3v3h-3zM7 17h2v4H7zM10 17h1.5v4H10zM12.5 17H14v4h-1.5zM15 17h2v4h-2z"/>' +
      '<path fill="#2a1a14" d="M9 10h1.5v3H9zM13.5 10H15v3h-1.5z"/>' +
      (blonde ? '<path fill="#f3d36b" d="M5 4h14v4H5zM6 8h2v2H6zM16 8h2v2h-2z"/><path fill="#fae79a" d="M8 4h5v1H8z"/>' : '') +
      '</svg>'
    );
  }

  FX.setMuted(S.muted);

  /** True if every task in the level was solved in the current run with no mistakes or hints. */
  function flawlessRun(li) {
    const L = LEVELS[li];
    const solved = S.solved[L.id] || [];
    return (S.miss[L.id] || 0) === 0 && L.steps.every((s, i) => s.type === 'lesson' || solved.includes(i));
  }

  function sheetStats() {
    let got = 0;
    let total = 0;
    LEVELS.forEach((L, li) => EXTRAS[L.id].sheet.forEach(([si]) => { total++; if (isDone(li, si)) got++; }));
    return { got, total };
  }

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
    $('#avatar').innerHTML = S.mode === 'full' ? avatarSVG(S.avatar) : '';
    $('#mode').textContent = S.mode === 'full' ? 'Full quest' : S.mode === 'free' ? 'Specific quest' : '';
    $('#menu').hidden = view.screen === 'home';
    const st = sheetStats();
    $('#sheet-n').textContent = st.got + '/' + st.total;
    $('#mute').textContent = S.muted ? '🔇' : '🔊';
    $('#mute').title = S.muted ? 'Sound is off' : 'Sound is on';
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
      const state = !unlocked ? 'Locked' : complete ? (S.perfect[L.id] ? '★ Flawless' : 'Complete') : doneCount(li) + ' / ' + L.steps.length;
      b.innerHTML =
        '<span class="lvl-icon">' + (unlocked ? esc(L.icon) : '🔒') + '</span>' +
        '<span class="lvl-text"><span class="lvl-n">Level ' + (li + 1) + '</span>' +
        '<span class="lvl-title">' + esc(L.title) + '</span>' +
        '<span class="lvl-state">' + state + '</span></span>';
      if (!unlocked) b.title = 'Finish level ' + li + ' to unlock';
      b.addEventListener('click', () => openLevel(li));
      map.appendChild(b);
    });
  }

  /* ---------------------------------------------------------- stage */
  function render() {
    const solo = view.screen !== 'play';
    $('.layout').classList.toggle('solo', solo);
    renderTop();
    if (solo) {
      cleanup();
      $('#map').innerHTML = '';
      return view.screen === 'sheet' ? renderSheet($('#stage')) : renderHome($('#stage'));
    }
    renderMap();
    renderStage();
    const cur = $('.lvl.current');
    if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function renderHome(stage) {
    const started = Object.keys(S.done).length > 0;
    const resume = nextIncomplete();
    const fullDone = allComplete();
    stage.innerHTML =
      '<div class="home">' +
      '<div class="story"><div class="cage">' + FX.princessSVG(false) + '</div>' +
      '<p><strong>Princess Dario has been captured.</strong> Seven kings hold him in the last castle. ' +
      'Learn Claude Code, beat a king at the end of every level, and get him out.</p></div>' +
      '<h1>Choose how to play</h1>' +
      '<p class="home-sub">Progress and XP are shared between the two modes, so you can switch whenever you like.</p>' +
      '<div class="modes">' +
      '<section class="card mode-card">' +
      '<div class="tag">Mode 1</div><h2>Full Quest</h2>' +
      '<p>The whole game, start to finish. Levels unlock one at a time: pass each gate test to open the next.</p>' +
      '<div class="pick-label">Choose your avatar</div>' +
      '<div class="avatars" role="radiogroup" aria-label="Avatar"></div>' +
      '<button class="primary" id="start-full">' +
      (fullDone ? 'Replay the full quest' : started ? 'Continue · Level ' + (resume + 1) + ' →' : 'Start the full quest →') +
      '</button>' +
      '</section>' +
      '<section class="card mode-card">' +
      '<div class="tag">Mode 2</div><h2>Specific Quest</h2>' +
      '<p>Jump straight to the topic you need. Every level is open, in any order.</p>' +
      '<div class="pick-label">Pick a level</div>' +
      '<div class="level-grid"></div>' +
      '</section>' +
      '</div></div>';

    const av = $('.avatars', stage);
    Object.keys(AVATARS).forEach((kind) => {
      const b = document.createElement('button');
      b.className = 'avatar-pick' + (S.avatar === kind ? ' chosen' : '');
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(S.avatar === kind));
      b.innerHTML = avatarSVG(kind) + '<span>' + AVATARS[kind] + '</span>';
      b.addEventListener('click', () => {
        S.avatar = kind;
        save();
        av.querySelectorAll('.avatar-pick').forEach((x) => {
          x.classList.toggle('chosen', x === b);
          x.setAttribute('aria-checked', String(x === b));
        });
      });
      av.appendChild(b);
    });

    $('#start-full', stage).addEventListener('click', () => {
      S.mode = 'full';
      save();
      openLevel(fullDone ? 0 : resume);
    });

    const grid = $('.level-grid', stage);
    LEVELS.forEach((L, li) => {
      const complete = levelComplete(li);
      const b = document.createElement('button');
      b.className = 'lvl-pick' + (complete ? ' complete' : '');
      b.innerHTML =
        '<span class="lvl-icon">' + esc(L.icon) + '</span>' +
        '<span class="lvl-text"><span class="lvl-title">' + (li + 1) + '. ' + esc(L.title) + '</span>' +
        '<span class="lvl-tagline">' + esc(L.tagline) + '</span>' +
        '<span class="lvl-state">' + (complete ? (S.perfect[L.id] ? '★ Flawless' : 'Complete') : doneCount(li) + ' / ' + L.steps.length) + '</span></span>';
      b.addEventListener('click', () => {
        S.mode = 'free';
        save();
        openLevel(li);
      });
      grid.appendChild(b);
    });
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
      (S.mode === 'full' ? '<div class="guide">' + avatarSVG(S.avatar) + '</div>' : '') +
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

    const runSolved = S.solved[L.id] || (S.solved[L.id] = []);
    const ctx = {
      /** Record a mistake (or a hint) against this run of the level. */
      miss() {
        S.miss[L.id] = (S.miss[L.id] || 0) + 1;
        save();
      },
      finish(penalised, msg, quiet) {
        if (penalised) ctx.miss();
        if (!runSolved.includes(si)) runSolved.push(si);
        const xp = award(penalised);
        save();
        const unlocked = xp ? EXTRAS[L.id].sheet.filter((e) => e[0] === si).length : 0;
        feedback.innerHTML = '<span class="ok">✓ ' + esc(msg || 'Correct!') + (xp ? ' <b>+' + xp + ' XP</b>' : '') +
          (unlocked ? ' · 📒 +' + unlocked + ' on your cheat sheet' : '') + '</span>';
        if (!quiet) FX.sfx('ok');
        next.disabled = false;
        next.focus({ preventScroll: true });
      },
      fail(msg, quiet) {
        ctx.miss();
        if (!quiet) FX.sfx('bad');
        feedback.innerHTML = '<span class="bad">✗ ' + esc(msg) + '</span>';
      },
      note(msg) {
        feedback.textContent = msg || '';
      },
    };

    next.addEventListener('click', () => {
      if (step.type === 'lesson') award(false);
      if (si === L.steps.length - 1 && flawlessRun(li)) {
        // Fireworks only once per run: clearing the record stops a Back/Continue repeat.
        S.perfect[L.id] = true;
        S.solved[L.id] = [];
        save();
        renderMap();
        view.celebrate = true;
      }
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
      boss: 'Boss fight · ' + XP.boss + ' XP · win to unlock the next level',
    }[step.type];
  }

  /** The "now try it for real" checklist for a level. Ticks are saved; the game cannot verify them. */
  function tryItList(li) {
    const L = LEVELS[li];
    const ticks = S.tried[L.id] || (S.tried[L.id] = []);
    const box = document.createElement('div');
    box.className = 'tryit';
    box.innerHTML = '<h3>Now try it for real</h3><p>Open an actual terminal and do these in Claude Code. Tick them off as you go.</p>';
    EXTRAS[L.id].tryIt.forEach((text, i) => {
      const label = document.createElement('label');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = !!ticks[i];
      cb.addEventListener('change', () => { ticks[i] = cb.checked; save(); });
      const span = document.createElement('span');
      span.textContent = text;
      label.append(cb, span);
      box.appendChild(label);
    });
    return box;
  }

  /** Energy-drink cans rain onto the avatar, which then powers up. */
  function dropCans(heroStage) {
    const N = 6;
    const later = (fn, ms) => { const t = setTimeout(fn, ms); cleanups.push(() => clearTimeout(t)); };
    for (let i = 0; i < N; i++) {
      const can = document.createElement('div');
      can.className = 'can';
      can.innerHTML = FX.canSVG();
      can.style.left = 50 + (i - (N - 1) / 2) * 7 * (i % 2 ? 1 : -1) + '%';
      can.style.animationDelay = i * 0.17 + 's';
      heroStage.appendChild(can);
      later(() => FX.sfx('can'), i * 170 + 560);
    }
    later(() => { heroStage.classList.add('powerup'); FX.sfx('powerup'); }, N * 170 + 620);
  }

  function renderLevelDone(stage, li) {
    const L = LEVELS[li];
    const last = li === LEVELS.length - 1;
    const celebrate = !!view.celebrate;
    view.celebrate = false;
    const finale = allComplete() && (last || S.mode === 'free');
    const n = li + 1;

    let html =
      '<section class="card finale">' +
      '<div class="hero-stage"><div class="big-avatar">' + avatarSVG(S.avatar) + '</div>' +
      (finale ? '<div class="rescued">' + FX.princessSVG(true) + '</div>' : '') + '</div>' +
      (S.perfect[L.id] ? '<div class="flawless">★ Flawless run' + (celebrate ? ' · ' + n + ' firework' + (n === 1 ? '' : 's') + '!' : '') + '</div>' : '');

    if (finale) {
      const pct = Math.round((S.xp / MAX_XP) * 100);
      html +=
        '<h1>Quest complete</h1>' +
        '<p><strong>Princess Dario is free.</strong> You cleared all ' + LEVELS.length + ' levels and sent every king into the lava.</p>' +
        '<div class="cert"><div class="cert-rank">' + esc(rankFor(S.xp)) + '</div>' +
        '<div class="cert-xp">' + S.xp + ' of ' + MAX_XP + ' XP · ' + pct + '%</div></div>' +
        '<p>The real thing is one command away. Open a terminal, <code>cd</code> into a project and type <code>claude</code>. ' +
        'Your cheat sheet has everything you learned.</p>' +
        '<button class="primary" id="go">Open the cheat sheet</button>';
    } else {
      html +=
        '<h1>Level ' + n + ' complete</h1>' +
        (last ? '' : '<p class="castle">“Thank you, Claude! But Princess Dario is in another castle.”</p>') +
        '<p>' + esc(L.title) + ' is done. Rank: <strong>' + esc(rankFor(S.xp)) + '</strong> · ' + S.xp + ' XP</p>';
      if (S.mode === 'free') {
        const left = LEVELS.length - LEVELS.filter((_, i) => levelComplete(i)).length;
        html += '<p class="up-next">' + left + ' level' + (left === 1 ? '' : 's') + ' still to finish. Pick whichever you want next.</p>' +
          '<button class="primary" id="go">Pick another level</button>';
      } else {
        const N = LEVELS[li + 1];
        html += '<p class="up-next">Unlocked: <strong>Level ' + (n + 1) + ' · ' + esc(N.title) + '</strong><br>' + esc(N.tagline) + '</p>' +
          '<button class="primary" id="go">Start level ' + (n + 1) + ' →</button>';
      }
    }
    stage.innerHTML = html + '</section>';
    $('.finale', stage).appendChild(tryItList(li));

    const go = $('#go', stage);
    go.addEventListener('click', finale ? openSheet : S.mode === 'free' ? goHome : () => openLevel(li + 1));
    go.focus({ preventScroll: true });

    if (celebrate) {
      const heroStage = $('.hero-stage', stage);
      cleanups.push(FX.fireworks(n, () => dropCans(heroStage)));
    }
  }

  function openSheet() {
    view = { screen: 'sheet', level: view.level, step: 0 };
    render();
    window.scrollTo(0, 0);
  }

  function renderSheet(stage) {
    const st = sheetStats();
    stage.innerHTML =
      '<div class="sheet">' +
      '<h1>Cheat sheet</h1>' +
      '<p class="home-sub">' + st.got + ' of ' + st.total + ' entries unlocked. Each one appears when you pass the task that teaches it.</p>' +
      '<div class="sheet-tools"><input type="search" id="sheet-q" placeholder="Filter, e.g. clear or hook" aria-label="Filter the cheat sheet">' +
      '<button class="ghost small" id="print">Print</button></div>' +
      '<div class="sheet-body"></div></div>';
    const body = $('.sheet-body', stage);

    LEVELS.forEach((L, li) => {
      const sec = document.createElement('section');
      sec.className = 'card sheet-sec';
      sec.innerHTML = '<div class="tag">Level ' + (li + 1) + '</div><h2>' + esc(L.title) + '</h2>';
      const dl = document.createElement('div');
      dl.className = 'sheet-rows';
      EXTRAS[L.id].sheet.forEach(([si, cmd, desc]) => {
        const open = isDone(li, si);
        const row = document.createElement('div');
        row.className = 'sheet-row' + (open ? '' : ' locked');
        row.innerHTML = open
          ? '<code>' + esc(cmd) + '</code><span>' + esc(desc) + '</span>'
          : '<code>🔒 ? ? ?</code><span>Pass “' + esc(L.steps[si].title) + '” to unlock</span>';
        if (open) row.dataset.text = (cmd + ' ' + desc).toLowerCase();
        dl.appendChild(row);
      });
      sec.appendChild(dl);
      if (levelComplete(li)) sec.appendChild(tryItList(li));
      body.appendChild(sec);
    });

    $('#print', stage).addEventListener('click', () => window.print());
    $('#sheet-q', stage).addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      stage.querySelectorAll('.sheet-sec').forEach((sec) => {
        let shown = 0;
        sec.querySelectorAll('.sheet-row').forEach((row) => {
          const hit = !q || (row.dataset.text || '').includes(q);
          row.hidden = !hit;
          if (hit) shown++;
        });
        sec.hidden = shown === 0;
      });
    });
  }

  function goHome() {
    view = { screen: 'home', level: view.level, step: 0 };
    render();
    window.scrollTo(0, 0);
  }

  /* ---------------------------------------------------------- helpers */
  // Command history, kept for the whole visit so ↑ works across tasks.
  const HISTORY = { shell: [], claude: [] };
  const SHELL_BUILTINS = {
    pwd: () => '/home/you/my-app',
    ls: () => 'CLAUDE.md  README.md  build.log  package.json  src/  tests/',
    whoami: () => 'you',
    help: () => 'Keys:  ↑ ↓ history   Ctrl+L clear screen   Ctrl+U erase to start\n       Ctrl+K erase to end   Ctrl+A / Ctrl+E jump to start / end   Ctrl+C cancel line\nAlso:  clear, history, pwd, ls',
  };

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

    // The gate test is a boss fight. Each right answer lands a hit; each wrong
    // one costs a heart. Boss HP and hearts are sized so the fight is won at
    // exactly the 75% pass mark.
    boss(step, host, ctx) {
      const total = step.questions.length;
      const need = Math.ceil(total * 0.75);
      const maxHearts = total - need + 1;
      // One boss, or a line-up to beat one after another. The hits needed are
      // shared out across the line-up, with any extra going to the last ones.
      const lineup = [].concat(step.boss || 'sam');
      const hpOf = (i) => Math.floor(need / lineup.length) + (i >= lineup.length - (need % lineup.length) ? 1 : 0);
      const everyone = lineup.length > 1 ? 'All ' + lineup.length + ' kings' : FX.bossName(lineup[0]);
      let qi, hp, hearts, order, bi, bossHp;

      host.innerHTML =
        '<div class="arena">' +
        '<div class="hud"><span class="hearts"></span>' +
        '<span class="boss-hud"><span class="boss-name"></span><span class="hp"><span class="hp-fill"></span></span></span></div>' +
        '<div class="fighter hero">' + avatarSVG(S.avatar) + '</div>' +
        '<div class="spark">✻</div><div class="flame"></div>' +
        '<div class="fighter boss"></div>' +
        (lineup.length > 1 ? '<div class="cage hung">' + FX.princessSVG(false) + '</div>' : '') +
        '<div class="bridge bridge-l"></div><div class="bridge bridge-r"></div>' +
        '<div class="lava"></div>' +
        '</div>' +
        '<div class="fight"></div>';
      const arena = $('.arena', host);
      const fight = $('.fight', host);
      const bossEl = $('.boss', arena);
      let faceTimer = 0;
      cleanups.push(() => clearTimeout(faceTimer));

      const face = (state) => { bossEl.innerHTML = FX.bossSVG(state, lineup[bi]); };
      function hud() {
        $('.hearts', arena).textContent = '♥'.repeat(hearts) + '♡'.repeat(maxHearts - hearts);
        $('.boss-name', arena).textContent =
          FX.bossName(lineup[bi]).toUpperCase() + (lineup.length > 1 ? ' ' + (bi + 1) + '/' + lineup.length : '');
        $('.hp-fill', arena).style.width = (bossHp / hpOf(bi)) * 100 + '%';
      }
      /** Play a one-off animation class, show a face for its duration, then settle. */
      function act(cls, state, ms, settle) {
        clearTimeout(faceTimer);
        arena.classList.remove('hit', 'burn', 'enter', 'ko');
        void arena.offsetWidth; // restart the animation
        arena.classList.add(cls);
        face(state);
        faceTimer = setTimeout(() => { arena.classList.remove(cls); if (settle) face(settle); }, ms);
      }
      function reset() {
        clearTimeout(faceTimer);
        qi = 0;
        bi = 0;
        hp = need;
        bossHp = hpOf(0);
        hearts = maxHearts;
        order = shuffled(total);
        arena.className = 'arena';
        if ($('.cage', arena)) $('.cage', arena).innerHTML = FX.princessSVG(false);
        face('idle');
        hud();
      }

      function intro() {
        reset();
        fight.innerHTML =
          '<div class="prose"><p>' +
          (lineup.length > 1
            ? '<strong>' + everyone + '</strong> block the bridge, one after another: ' + lineup.map(FX.bossName).join(', ') + '. Every right answer lands a hit; every wrong one and you get fire.'
            : '<strong>' + everyone + '</strong> blocks the bridge. Every right answer lands a hit; every wrong one and he breathes fire.') +
          '</p>' +
          '<p>Land <strong>' + need + ' hit' + (need === 1 ? '' : 's') + '</strong> before you lose your <strong>' + maxHearts + ' heart' + (maxHearts === 1 ? '' : 's') + '</strong>. No hints.</p></div>';
        const b = document.createElement('button');
        b.className = 'primary';
        b.textContent = 'Fight!';
        b.addEventListener('click', ask);
        fight.appendChild(b);
      }

      function ask() {
        ctx.note('');
        const q = step.questions[order[qi]];
        fight.innerHTML = '<p class="question">' + esc(q.q) + '</p>';
        const explain = document.createElement('p');
        explain.className = 'explain';
        explain.hidden = true;
        const cont = document.createElement('button');
        cont.className = 'primary';
        cont.hidden = true;
        cont.addEventListener('click', () => {
          qi++;
          if (hp === 0 || hearts === 0) return result();
          if (bossHp === 0) {
            // The next king in the line-up drops in.
            bi++;
            bossHp = hpOf(bi);
            hud();
            act('enter', 'jump', 600, 'idle');
          }
          ask();
        });
        optionButtons(q, fight, {
          retry: false,
          onPick(right) {
            if (right) {
              hp--;
              bossHp--;
              hud();
              if (bossHp === 0) {
                // 'won' ends the fight; 'ko' clears the bridge for the next king.
                clearTimeout(faceTimer);
                arena.classList.remove('hit', 'burn', 'enter');
                arena.classList.add(hp === 0 ? 'won' : 'ko');
                face('beaten');
                const cage = hp === 0 && $('.cage', arena);
                if (cage) cage.innerHTML = FX.princessSVG(true); // the last king is down: he is out
                FX.sfx('hit');
                FX.sfx('fall');
                faceTimer = setTimeout(() => FX.sfx('splash'), 1000);
              } else {
                FX.sfx('hit');
                act('hit', 'jump', 700, 'idle');
              }
            } else {
              hearts--;
              hud();
              ctx.miss();
              FX.sfx('fire');
              act('burn', 'fire', 1000, 'idle');
              if (hearts === 0) arena.classList.add('lost');
            }
            explain.textContent = (right ? '✓ ' : '✗ ') + q.explain;
            explain.classList.toggle('miss', !right);
            explain.hidden = false;
            cont.textContent = hp === 0 ? 'Claim your victory' : hearts === 0 ? 'See result' : bossHp === 0 ? 'Next boss' : 'Next question';
            cont.hidden = false;
            cont.focus({ preventScroll: true });
          },
        });
        fight.append(explain, cont);
      }

      function result() {
        const pass = hp === 0;
        const landed = need - hp;
        fight.innerHTML =
          '<div class="result ' + (pass ? 'pass' : 'failr') + '">' +
          '<div class="score">' + landed + ' / ' + need + ' hits</div>' +
          '<div>' + (pass
            ? everyone + (lineup.length > 1 ? ' are' : ' is') + ' in the lava.'
            : 'Out of hearts. ' + FX.bossName(lineup[bi]) + ' is still standing.') + '</div></div>';
        if (pass) {
          FX.sfx('win');
          ctx.finish(false, hearts === maxHearts ? 'Boss beaten without a scratch!' : 'Boss beaten!', true);
        } else {
          FX.sfx('lose');
          ctx.fail('Review the lessons with the dots above, or fight again.', true);
          const b = document.createElement('button');
          b.className = 'primary';
          b.textContent = 'Fight again';
          b.addEventListener('click', () => { reset(); ask(); });
          fight.appendChild(b);
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
        '</div>' +
        '<div class="term-keys"><kbd>↑</kbd> <kbd>↓</kbd> history · <kbd>Ctrl</kbd>+<kbd>L</kbd> clear · <kbd>Ctrl</kbd>+<kbd>U</kbd> erase line · <kbd>Ctrl</kbd>+<kbd>C</kbd> cancel</div>';
      const hist = HISTORY[step.mode];
      const ps = step.mode === 'claude' ? '> ' : '$ ';
      let hi = hist.length; // position in history; hist.length means "the line being typed"
      let draft = '';
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

      function setLine(text, caret) {
        input.value = text;
        const at = caret === undefined ? text.length : caret;
        input.setSelectionRange(at, at);
      }
      input.addEventListener('keydown', (e) => {
        const ctrl = e.ctrlKey && !e.altKey && !e.metaKey;
        const k = e.key.toLowerCase();
        const at = input.selectionStart;
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (hi === hist.length) draft = input.value;
          if (hi > 0) setLine(hist[--hi]);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (hi < hist.length) { hi++; setLine(hi === hist.length ? draft : hist[hi]); }
        } else if (ctrl && k === 'l') {
          e.preventDefault();
          log.innerHTML = '';
        } else if (ctrl && k === 'u') {
          e.preventDefault();
          setLine(input.value.slice(at), 0);
        } else if (ctrl && k === 'k') {
          e.preventDefault();
          setLine(input.value.slice(0, at));
        } else if (ctrl && k === 'a') {
          e.preventDefault();
          input.setSelectionRange(0, 0);
        } else if (ctrl && k === 'e') {
          e.preventDefault();
          setLine(input.value);
        } else if (ctrl && k === 'c' && at === input.selectionEnd && !String(window.getSelection())) {
          // Only when nothing is selected, so copying text still works.
          e.preventDefault();
          line(ps + input.value + '^C', 'dim');
          setLine('');
          hi = hist.length;
          draft = '';
        }
      });
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const raw = input.value;
        const val = normalise(raw);
        if (!val) return;
        const cmd = step.cmds[ci];
        line(ps + raw, 'echo');
        input.value = '';
        if (hist[hist.length - 1] !== raw.trim()) hist.push(raw.trim());
        hi = hist.length;
        draft = '';
        if (step.mode === 'shell') {
          if (val === 'clear') { log.innerHTML = ''; return; }
          if (val === 'history') { line(hist.map((h, i) => String(i + 1).padStart(4) + '  ' + h).join('\n'), 'out'); return; }
          if (SHELL_BUILTINS[val]) { line(SHELL_BUILTINS[val](), 'out'); return; }
        }
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
    S = fresh();
    save();
    goHome();
  });
  $('#menu').addEventListener('click', goHome);
  $('#sheet').addEventListener('click', openSheet);
  $('#mute').addEventListener('click', () => {
    S.muted = !S.muted;
    save();
    FX.setMuted(S.muted);
    renderTop();
    FX.sfx('ok');
  });
  $('#home').addEventListener('click', goHome);

  render();
})();
