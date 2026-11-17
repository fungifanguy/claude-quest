// Sanity checks for the level data: every task must be solvable by its own
// model answer, and must reject its listed wrong answers.
//   node claude-quest/tests/levels.test.js
const LEVELS = require('../js/levels.js');

const BOSS_IDS = ['mark', 'jeff', 'palmer', 'peter', 'jensen', 'elon', 'sam']; // keep in step with BOSSES in js/fx.js
const TYPES = ['lesson', 'quiz', 'terminal', 'keys', 'editor', 'order', 'boss'];
const norm = (s) => s.replace(/\s+/g, ' ').trim();
let checks = 0;
const problems = [];
const check = (cond, msg) => { checks++; if (!cond) problems.push(msg); };

function checkQuestion(q, where) {
  check(typeof q.q === 'string' && q.q.length > 10, where + ': missing question text');
  check(Array.isArray(q.options) && q.options.length >= 3, where + ': needs 3+ options');
  check(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length, where + ': bad answer index');
  check(new Set(q.options).size === q.options.length, where + ': duplicate options');
  check(!!q.explain, where + ': missing explanation');
}

const ids = new Set();
LEVELS.forEach((L, li) => {
  check(L.id && !ids.has(L.id), `level ${li}: missing or duplicate id`);
  ids.add(L.id);
  check(L.title && L.tagline && L.icon, `level ${L.id}: missing title/tagline/icon`);
  check(L.steps[L.steps.length - 1].type === 'boss', `level ${L.id}: must end with a gate test`);

  L.steps.forEach((s, si) => {
    const where = `${L.id}[${si}] "${s.title}"`;
    check(TYPES.includes(s.type), where + ': unknown type ' + s.type);
    check(!!s.title, where + ': missing title');

    if (s.type === 'lesson') check(s.body && s.body.length > 80, where + ': lesson body too short');
    if (s.type === 'quiz') checkQuestion(s, where);
    if (s.type === 'boss') s.questions.forEach((q, qi) => checkQuestion(q, `${where} q${qi}`));
    if (s.type === 'boss') {
      const who = [].concat(s.boss || []);
      check(who.length > 0 && who.every((b) => BOSS_IDS.includes(b)), `${where}: boss must name known bosses`);
      check(who.length <= Math.ceil(s.questions.length * 0.75), `${where}: more bosses than hits needed`);
    }
    if (s.type === 'keys') check(['plan', 'interrupt', 'rewind'].includes(s.scenario), where + ': unknown scenario');
    if (s.type === 'order') check(s.items.length >= 3, where + ': needs 3+ items');

    if (s.type === 'terminal') {
      check(['shell', 'claude'].includes(s.mode), where + ': bad mode');
      s.cmds.forEach((c, ci) => {
        const w = `${where} cmd${ci}`;
        const ok = (v) => c.accept.some((re) => re.test(norm(v)));
        check(c.ask && c.hint && c.solution, w + ': missing ask/hint/solution');
        check(ok(c.solution), w + ': solution rejected: ' + c.solution);
        (c.bad || []).forEach((b) => check(!ok(b), w + ': wrong answer accepted: ' + b));
        check((c.bad || []).length > 0, w + ': list at least one wrong answer');
      });
    }

    if (s.type === 'editor') {
      check(s.validate(s.solution) === null, where + ': solution rejected: ' + s.validate(s.solution));
      check(typeof s.validate(s.starter) === 'string', where + ': untouched starter accepted');
      check(typeof s.validate('') === 'string', where + ': empty file accepted');
      check(s.hint && s.filename, where + ': missing hint/filename');
    }
  });
});

// Cheat sheet and "try it for real" data must line up with the levels.
const EXTRAS = require('../js/extras.js');
LEVELS.forEach((L) => {
  const X = EXTRAS[L.id];
  check(!!X, `extras: nothing for level ${L.id}`);
  if (!X) return;
  check(X.tryIt.length >= 3, `extras ${L.id}: needs 3+ try-it items`);
  check(X.sheet.length >= 3, `extras ${L.id}: needs 3+ cheat-sheet entries`);
  X.sheet.forEach(([si, cmd, desc]) => {
    const step = L.steps[si];
    check(!!step && step.type !== 'lesson' && step.type !== 'boss', `extras ${L.id}: "${cmd}" must unlock on a task step, got index ${si}`);
    check(cmd && desc, `extras ${L.id}: entry missing text`);
  });
});
check(Object.keys(EXTRAS).length === LEVELS.length, 'extras: has a level id that does not exist');

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} problem(s) in ${checks} checks`);
  process.exit(1);
}
const steps = LEVELS.reduce((n, l) => n + l.steps.length, 0);
console.log(`ok: ${LEVELS.length} levels, ${steps} steps, ${checks} checks`);
