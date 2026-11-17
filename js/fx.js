/* Claude Code Quest — sound, fireworks and boss art. No game logic in here. */
const FX = (function () {
  'use strict';

  /* ---------------------------------------------------------- sound */
  // Everything is synthesised with WebAudio, so there are no audio files.
  let audio = null;
  let muted = false;

  function ac() {
    if (muted) return null;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      return audio;
    } catch (e) {
      return null; // no audio support: play silently
    }
  }

  function tone(freq, start, dur, type, vol, slideTo) {
    const a = ac();
    if (!a) return;
    const o = a.createOscillator();
    const g = a.createGain();
    const t = a.currentTime + start;
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol || 0.07, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + dur + 0.03);
  }

  function noise(start, dur, vol, cutoff) {
    const a = ac();
    if (!a) return;
    const len = Math.max(1, Math.floor(a.sampleRate * dur));
    const buf = a.createBuffer(1, len, a.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = a.createBufferSource();
    const filter = a.createBiquadFilter();
    const g = a.createGain();
    const t = a.currentTime + start;
    src.buffer = buf;
    filter.type = 'lowpass';
    filter.frequency.value = cutoff || 2000;
    g.gain.setValueAtTime(vol || 0.15, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(g).connect(a.destination);
    src.start(t);
  }

  const run = (notes, step, type, vol) => notes.forEach((f, i) => tone(f, i * step, step * 1.6, type, vol));

  const SOUNDS = {
    ok() { tone(660, 0, 0.08); tone(990, 0.08, 0.16); },
    bad() { tone(196, 0, 0.2, 'sawtooth', 0.06, 110); },
    hit() { tone(880, 0, 0.05); tone(300, 0.05, 0.16, 'square', 0.08, 120); },
    fire() { noise(0, 0.6, 0.2, 900); tone(140, 0, 0.5, 'sawtooth', 0.05, 70); },
    launch() { tone(320, 0, 0.45, 'sine', 0.035, 1500); },
    boom() { noise(0, 0.5, 0.22, 2600); tone(110, 0, 0.35, 'sine', 0.12, 45); },
    can() { tone(1200, 0, 0.04, 'triangle', 0.06); tone(700, 0.04, 0.05, 'triangle', 0.05); },
    // A rising power-up run: our own notes, in the spirit of the classic.
    powerup() { run([262, 330, 392, 523, 659, 784, 1047, 1319, 1568], 0.055, 'square', 0.06); tone(2093, 0.5, 0.3, 'square', 0.05); },
    fall() { tone(700, 0, 1.0, 'sawtooth', 0.06, 55); },
    splash() { noise(0, 0.7, 0.25, 500); },
    win() { run([523, 523, 523, 659, 587, 659, 784], 0.13, 'square', 0.07); },
    lose() { run([392, 349, 311, 262, 196], 0.16, 'triangle', 0.08); },
  };

  function sfx(name) {
    try { if (SOUNDS[name]) SOUNDS[name](); } catch (e) { /* sound is optional */ }
  }

  /* ---------------------------------------------------------- fireworks */
  const reducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Launches `count` fireworks one after another, then calls done(). Returns a cancel function. */
  function fireworks(count, done) {
    let finished = false;
    const finish = () => { if (!finished) { finished = true; if (done) done(); } };
    if (reducedMotion() || !window.requestAnimationFrame) { finish(); return () => {}; }

    const canvas = document.createElement('canvas');
    canvas.className = 'fx-canvas';
    document.body.appendChild(canvas);
    const g = canvas.getContext('2d');
    const W = (canvas.width = window.innerWidth);
    const H = (canvas.height = window.innerHeight);
    const COLOURS = ['#ff5a4f', '#ffd34f', '#5ad1ff', '#8cff7a', '#ff8be0', '#ffffff', '#ffa94d'];
    const rockets = [];
    const sparks = [];
    let launched = 0;
    let nextAt = 0;
    let prev = 0;
    let raf = 0;
    let cancelled = false;

    function frame(now) {
      if (cancelled) return;
      const dt = Math.min(0.05, prev ? (now - prev) / 1000 : 0.016);
      prev = now;

      if (launched < count && now >= nextAt) {
        launched++;
        nextAt = now + 480;
        rockets.push({
          x: W * (0.15 + 0.7 * Math.random()),
          y: H,
          top: H * (0.14 + 0.3 * Math.random()),
          colour: COLOURS[(launched - 1) % COLOURS.length],
        });
        sfx('launch');
      }

      g.clearRect(0, 0, W, H);

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.y -= H * 0.95 * dt;
        g.fillStyle = '#fff';
        g.fillRect(r.x - 2, r.y, 4, 10);
        if (r.y <= r.top) {
          rockets.splice(i, 1);
          sfx('boom');
          for (let k = 0; k < 70; k++) {
            const angle = (Math.PI * 2 * k) / 70;
            const speed = 90 + Math.random() * 190;
            sparks.push({ x: r.x, y: r.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, colour: k % 5 ? r.colour : '#fff' });
          }
        }
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life -= dt * 0.75;
        if (s.life <= 0) { sparks.splice(i, 1); continue; }
        s.vy += 150 * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        g.globalAlpha = Math.min(1, s.life * 1.4);
        g.fillStyle = s.colour;
        g.fillRect(Math.round(s.x / 4) * 4, Math.round(s.y / 4) * 4, 5, 5); // chunky pixels
      }
      g.globalAlpha = 1;

      if (launched >= count && !rockets.length && !sparks.length) {
        canvas.remove();
        finish();
        return;
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      canvas.remove();
    };
  }

  /* ---------------------------------------------------------- art */
  // An energy-drink can, drawn as a few flat blocks.
  function canSVG() {
    return (
      '<svg viewBox="0 0 12 22" shape-rendering="crispEdges" aria-hidden="true">' +
      '<path fill="#9aa3ad" d="M2 0h8v2H2zM1 20h10v2H1z"/>' +
      '<path fill="#d5dae0" d="M1 2h10v18H1z"/>' +
      '<path fill="#1f3f9c" d="M1 2h5v9H1zM6 11h5v9H6z"/>' +
      '<path fill="#d8342c" d="M4 9h4v4H4z"/>' +
      '<path fill="#f2c230" d="M5 10h2v2H5z"/>' +
      '</svg>'
    );
  }

  /* ---------------------------------------------------------- bosses
   * Drawn caricature heads on a dragon body, in flat cut-out style. The body
   * never changes; each head has four fixed expressions: 'idle', 'fire',
   * 'jump' and 'beaten'.
   *
   * A boss is: name, skin and ear colours, brow colour, eye radii [left, right],
   * an optional head shape, and three art layers:
   *   back   behind the head (long hair, collars)
   *   hair   on the head, under the face
   *   over   on top of the face (glasses)
   * plus the idle brows and mouth that give each one a resting expression.
   */
  const SMILE = '<path stroke="#7a3b2e" stroke-width="2.5" fill="none" stroke-linecap="round" d="M50 66c6 3 14 3 20 0"/>';
  const BOSSES = {
    mark: {
      name: 'King Zuck', skin: '#f6d9c2', ear: '#eec4a6', brow: '#7a5230', eyes: [8, 8], pupil: 2.1,
      hair:
        '<path fill="#8a5c36" d="M29 42C26 20 42 9 60 9s34 11 31 33c-2-8-5-13-9-16H38c-4 3-7 8-9 16z"/>' +
        [[34, 21], [40, 14], [48, 10], [56, 8], [64, 8], [72, 10], [80, 14], [86, 21]]
          .map(([x, y]) => '<circle cx="' + x + '" cy="' + y + '" r="5.2" fill="#8a5c36"/>').join('') +
        [38, 45, 52, 59, 66, 73, 80].map((x) => '<circle cx="' + (x + 1) + '" cy="26" r="4.2" fill="#8a5c36"/>').join('') +
        [[44, 15], [58, 12], [72, 15], [50, 22], [66, 22]]
          .map(([x, y]) => '<circle cx="' + x + '" cy="' + y + '" r="2.4" fill="#a8774a"/>').join(''),
      brows: 'M41 35h13M66 35h13',
      mouth: '<path stroke="#7a3b2e" stroke-width="2.5" stroke-linecap="round" d="M53 67h14"/>',
    },
    jeff: {
      name: 'King Jeff', skin: '#ebbd98', ear: '#dca882', brow: '#5d4a3c', eyes: [7.5, 5.5],
      hair:
        '<ellipse cx="47" cy="21" rx="9" ry="4" fill="#fff" opacity="0.4" transform="rotate(-18 47 21)"/>' +
        '<path fill="#8d7a6c" d="M29 36c-1 6 0 10 2 13l2-12zM91 36c1 6 0 10-2 13l-2-12z"/>',
      brows: 'M40 34c5-3 10-3 14-1M66 35c4-2 9-2 14 1',
      mouth:
        '<path fill="#5a1a14" d="M45 61c9 4 21 4 30 0-1 11-8 16-15 16s-14-5-15-16z"/>' +
        '<path fill="#fff" d="M47 62c8 3 18 3 26 0l-1 4c-8 2-16 2-24 0z"/>',
    },
    palmer: {
      name: 'King Palmer', skin: '#f3cba8', ear: '#e6b68f', brow: '#5a3d22', eyes: [7, 7],
      back: '<path fill="#6b4726" d="M25 44C21 18 40 6 60 6s39 12 35 38c0 14 3 24 6 33H79V40H41v37H19c3-9 6-19 6-33z"/>',
      hair:
        '<path fill="#6b4726" d="M29 40C28 21 43 10 60 10s32 11 31 30c-5-8-12-12-20-13-5 3-11 4-16 2-9 1-19 4-26 11z"/>' +
        // headset pushed up on the forehead
        '<path fill="#17171c" d="M29 22h62v5H29z"/>' +
        '<rect x="34" y="14" width="52" height="14" rx="5" fill="#2a2a33"/>' +
        '<rect x="38" y="17" width="44" height="4" rx="2" fill="#474756"/>' +
        // goatee
        '<path fill="#6b4726" d="M47 61c4-4 22-4 26 0l2 9c-2 9-8 13-15 13s-13-4-15-13z"/>',
      brows: 'M40 37l14-1M66 36l14 1',
      mouth: '<path stroke="#2e1b10" stroke-width="2.5" fill="none" stroke-linecap="round" d="M52 67c5 3 11 3 16 0"/>',
    },
    peter: {
      name: 'King Peter', skin: '#f4d6c0', ear: '#e8c2a6', brow: '#4a3320', eyes: [6, 6],
      hair:
        '<path fill="#5b4028" d="M29 41C26 20 42 10 60 10s34 10 31 31c-3-8-7-13-12-15-14 1-27-1-37-7-6 5-10 12-13 22z"/>' +
        '<path stroke="#7d5c3c" stroke-width="2" fill="none" stroke-linecap="round" d="M43 13c2 3 3 6 2 9"/>',
      brows: 'M40 36l14 3M66 39l14-3',
      mouth: '<path stroke="#7a3b2e" stroke-width="2.5" fill="none" stroke-linecap="round" d="M52 68c5-2 11-2 16 0"/>',
    },
    jensen: {
      name: 'King Jensen', skin: '#e9be94', ear: '#d9a87c', brow: '#7c8087', eyes: [6, 6],
      back: '<path fill="#17171c" d="M36 74l24 16 24-16 8 16H28z"/><path fill="#2c2c35" d="M36 74l10 14-12 2zM84 74L74 88l12 2z"/>',
      hair:
        '<path fill="#cfd3d8" d="M28 42C24 20 40 9 60 9c21 0 35 11 32 33-3-9-7-14-12-17-12 3-26 2-36-3-5 4-9 7-11 10s-4 6-5 10z"/>' +
        '<path fill="#eef0f2" d="M42 14c7-5 18-6 27-3-9 0-16 3-21 8z"/>',
      over:
        '<g fill="none" stroke="#1c1c22" stroke-width="2.4">' +
        '<rect x="37" y="38" width="21" height="16" rx="3"/><rect x="62" y="38" width="21" height="16" rx="3"/>' +
        '<path d="M58 44h4M37 43l-8-2M83 43l8-2"/></g>',
      brows: 'M40 33l14 1M66 34l14-1',
      mouth: SMILE,
    },
    elon: {
      name: 'King Elon', skin: '#f0c8a8', ear: '#e2b490', brow: '#2e2118', eyes: [6.5, 6.5],
      head: '<rect x="28" y="11" width="64" height="70" rx="25" ry="27" fill="#f0c8a8"/>',
      hair:
        '<path fill="#2e2118" d="M28 42C24 19 40 8 60 8c21 0 36 11 32 34-2-9-5-14-9-17-11 2-23 0-31-7-6 7-13 10-18 11-3 3-5 7-6 13z"/>' +
        '<path fill="#4a372a" d="M50 12c7-3 16-3 24 1-8-1-15 0-21 4z"/>',
      brows: 'M40 36l14-1M66 34l14-2',
      mouth: '<path stroke="#7a3b2e" stroke-width="2.5" fill="none" stroke-linecap="round" d="M49 66c7 3 15 2 22-4"/>',
    },
    sam: {
      name: 'King Sam', skin: '#f2c9a5', ear: '#e8b890', brow: '#4a3320', eyes: [7, 7],
      hair:
        '<path fill="#6a4a2c" d="M28 40c-4-22 14-34 34-33 20 0 34 12 31 33-4-10-10-15-18-16-6 4-14 3-20-1-8 5-14 3-19 6-4 2-6 6-8 11z"/>' +
        '<path fill="#7d5a37" d="M44 12c6-6 16-7 24-4-8 0-14 3-18 8z"/>',
      brows: 'M40 36l14 1M66 37l14-1',
      mouth: SMILE,
    },
  };

  function bossName(who) {
    return (BOSSES[who] || BOSSES.sam).name;
  }

  function bossSVG(state, who) {
    const b = BOSSES[who] || BOSSES.sam;
    const body =
      '<path fill="#2e7d3a" d="M84 104c14 2 24-4 30-14l-4 16c-6 10-18 12-28 8z"/>' + // tail
      '<path fill="#7b4bb0" d="M78 78l26-16-6 14 8 2-10 8 4 8-22-6z"/>' + // wing
      '<ellipse cx="60" cy="100" rx="30" ry="25" fill="#3f9d4a"/>' +
      '<ellipse cx="55" cy="104" rx="19" ry="19" fill="#f1dc8a"/>' +
      '<path fill="none" stroke="#d6bd62" stroke-width="2" d="M39 97h32M38 105h34M41 113h28"/>' +
      '<path fill="#3f9d4a" d="M36 118h14v10H32zM66 118h14l4 10H66z"/>' + // feet
      '<path fill="#fff" d="M32 126h4v3h-4zM38 126h4v3h-4zM72 126h4v3h-4zM78 126h4v3h-4z"/>' + // claws
      '<path fill="#3f9d4a" d="M30 88l-12 8 4 6 12-6zM88 90l10 10-5 5-9-9z"/>'; // arms

    const head =
      (b.back || '') +
      '<ellipse cx="29" cy="46" rx="5" ry="7" fill="' + b.ear + '"/><ellipse cx="91" cy="46" rx="5" ry="7" fill="' + b.ear + '"/>' +
      (b.head || '<ellipse cx="60" cy="46" rx="31" ry="34" fill="' + b.skin + '"/>') +
      b.hair +
      '<path fill="#f2c230" d="M42 8l4-10 7 7 7-9 7 9 7-7 4 10z"/><path fill="#d8342c" d="M58 2h4v4h-4z"/>'; // crown

    const pupil = b.pupil || 2.6;
    const eyesOpen = (k) =>
      '<circle cx="48" cy="46" r="' + b.eyes[0] * k + '" fill="#fff"/><circle cx="72" cy="46" r="' + b.eyes[1] * k + '" fill="#fff"/>' +
      '<circle cx="47" cy="47" r="' + pupil + '" fill="#2a1a14"/><circle cx="71" cy="47" r="' + pupil + '" fill="#2a1a14"/>';
    const brows = (d, w) => '<path stroke="' + b.brow + '" stroke-width="' + w + '" fill="none" stroke-linecap="round" d="' + d + '"/>';

    const FACES = {
      idle: eyesOpen(1) + brows(b.brows, 2.5) + b.mouth,
      fire:
        eyesOpen(0.93) +
        brows('M39 33l16 7M81 33l-16 7', 3.5) +
        '<ellipse cx="60" cy="68" rx="12" ry="10" fill="#5a1a14"/>' +
        '<path fill="#fff" d="M51 61h18v3H51z"/><ellipse cx="60" cy="74" rx="7" ry="3.5" fill="#e0564a"/>',
      jump:
        eyesOpen(1.28) +
        brows('M39 30c5-3 10-3 15 0M66 30c5-3 10-3 15 0', 2.5) +
        '<ellipse cx="60" cy="68" rx="5" ry="6" fill="#5a1a14"/>',
      beaten:
        '<path stroke="#2a1a14" stroke-width="3.5" stroke-linecap="round" d="M42 41l12 11M54 41L42 52M66 41l12 11M78 41L66 52"/>' +
        brows('M39 34l15-3M66 31l15 3', 2.5) +
        '<path stroke="#7a3b2e" stroke-width="2.5" fill="none" stroke-linecap="round" d="M46 68c4-4 7 4 11 0s7 4 11 0 5 3 7 1"/>' +
        '<path fill="#e0564a" d="M58 69h8v9c0 4-8 4-8 0z"/>',
    };

    return (
      '<svg viewBox="0 -4 120 136" role="img" aria-label="' + b.name + '">' +
      body +
      '<g class="boss-head">' + head + (FACES[state] || FACES.idle) + (b.over || '') + '</g>' +
      '</svg>'
    );
  }

  /**
   * Princess Dario, the one being rescued: a cartoon in a pink gown and crown.
   * `free` picks the pose: arms up and smiling, or worried behind bars.
   */
  function princessSVG(free) {
    const hair = [[20, 15], [24.5, 10.5], [30, 9], [35.5, 10.5], [40, 15], [18.5, 20], [41.5, 20]]
      .map(([x, y]) => '<circle cx="' + x + '" cy="' + y + '" r="4.6" fill="#3a2a1e"/>').join('');
    const hands = free ? [[10, 34], [50, 34]] : [[14, 55], [46, 55]];
    const arms = free ? 'M19 43L10 34M41 43l9-9' : 'M19 43l-5 12M41 43l5 12';
    return (
      '<svg viewBox="0 -4 60 94" role="img" aria-label="Princess Dario">' +
      '<path stroke="#f0c6a0" stroke-width="4" stroke-linecap="round" d="' + arms + '"/>' +
      hands.map(([x, y]) => '<circle cx="' + x + '" cy="' + y + '" r="3" fill="#f0c6a0"/>').join('') +
      '<path fill="#f28ab2" d="M22 47c-8 12-12 27-14 41h44c-2-14-6-29-14-41z"/>' + // skirt
      '<path fill="#f9b8d0" d="M9 82h42l1 6H8zM27 47h6l4 35H23z"/>' +
      '<rect x="22" y="37" width="16" height="13" rx="3" fill="#e56a9b"/>' + // bodice
      '<circle cx="19" cy="42" r="6" fill="#f9b8d0"/><circle cx="41" cy="42" r="6" fill="#f9b8d0"/>' + // puff sleeves
      '<circle cx="30" cy="41" r="2" fill="#f2c230"/>' +
      '<rect x="27" y="31" width="6" height="7" fill="#f0c6a0"/>' +
      hair +
      '<circle cx="30" cy="22" r="12" fill="#f0c6a0"/>' +
      '<path fill="#3a2a1e" opacity="0.22" d="M19 25c1 7 6 10 11 10s10-3 11-10c-3 4-7 6-11 6s-8-2-11-6z"/>' + // stubble
      '<path fill="#3a2a1e" d="M18 19c1-7 6-10 12-10s11 3 12 10c-3-4-7-5-12-5s-9 1-12 5z"/>' +
      '<g fill="#fff" stroke="#1c1c22" stroke-width="1.4"><circle cx="25" cy="22" r="4.2"/><circle cx="35" cy="22" r="4.2"/></g>' +
      '<path stroke="#1c1c22" stroke-width="1.4" d="M29.2 22h1.6"/>' +
      '<circle cx="25" cy="22.4" r="1.3" fill="#2a1a14"/><circle cx="35" cy="22.4" r="1.3" fill="#2a1a14"/>' +
      (free
        ? '<path stroke="#7a3b2e" stroke-width="1.6" fill="none" stroke-linecap="round" d="M25.5 28.5c3 2.6 6 2.6 9 0"/>'
        : '<path stroke="#7a3b2e" stroke-width="1.6" fill="none" stroke-linecap="round" d="M26.5 30c2.4-1.6 4.6-1.6 7 0"/>') +
      '<path fill="#f2c230" d="M22.5 8l1.5-8 3.2 4.5L30-2l2.8 6.5L36 0l1.5 8z"/><circle cx="30" cy="5" r="1.4" fill="#e0408a"/>' +
      '</svg>'
    );
  }

  return {
    sfx,
    fireworks,
    canSVG,
    princessSVG,
    bossSVG,
    bossName,
    bosses: Object.keys(BOSSES),
    setMuted(m) { muted = !!m; },
  };
})();
