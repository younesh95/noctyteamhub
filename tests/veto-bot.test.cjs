const { test } = require("node:test");
const assert = require("node:assert/strict");
const pool = [
  "Dust2",
  "Mirage",
  "Anubis",
  "Cache",
  "Ancient",
  "Nuke",
  "Inferno",
];
const engine = () => import("../features/veto/engine.mjs");
const bot = () => import("../features/veto/bot.mjs");

test("bot respects ranked bans and skips unavailable maps", async () => {
  const { defaultBot, chooseMap } = await bot(),
    { defaultSteps } = await engine();
  const config = defaultBot();
  config.variation = 0;
  config.profiles.A.bans = ["Nuke", "Dust2"];
  config.profiles.B.bans = ["Cache", "Inferno"];
  assert.equal(chooseMap(pool, defaultSteps("BO1"), [], config).map, "Nuke");
  assert.equal(
    chooseMap(pool, defaultSteps("BO1"), ["Cache"], config).map,
    "Inferno",
  );
  config.profiles.A.bans.reverse();
  assert.equal(chooseMap(pool, defaultSteps("BO1"), [], config).map, "Dust2");
});
test("bot picks strengths and adapts bans to opponent strengths", async () => {
  const { defaultBot, chooseMap } = await bot(),
    { defaultSteps } = await engine();
  const config = defaultBot();
  config.variation = 0;
  config.profiles.A.strengths = ["Anubis", "Mirage"];
  config.profiles.B.strengths = ["Inferno", "Nuke"];
  assert.equal(
    chooseMap(pool, defaultSteps("BO3"), ["Dust2", "Cache"], config).map,
    "Anubis",
  );
  assert.equal(chooseMap(pool, defaultSteps("BO3"), [], config).map, "Inferno");
  config.profiles.B.strengths = ["Nuke", "Inferno"];
  assert.equal(chooseMap(pool, defaultSteps("BO3"), [], config).map, "Nuke");
});
test("seeded simulations are reproducible including undo and JSON reload", async () => {
  const { defaultBot, chooseMap } = await bot(),
    { defaultSteps } = await engine();
  const config = defaultBot(),
    steps = defaultSteps("BO3"),
    history = ["Dust2"];
  const first = chooseMap(pool, steps, history, config);
  assert.deepEqual(
    first,
    chooseMap(pool, steps, history, JSON.parse(JSON.stringify(config))),
  );
  const appended = [...history, first.map];
  appended.pop();
  assert.deepEqual(first, chooseMap(pool, steps, appended, config));
  const outcomes = new Set(
    Array.from(
      { length: 100 },
      (_, i) => chooseMap(pool, steps, [], { ...config, seed: `seed${i}` }).map,
    ),
  );
  assert.ok(outcomes.size > 1);
});
test("all standard and custom sequences terminate legally for 100 seeds", async () => {
  const { defaultBot, chooseMap } = await bot(),
    { defaultSteps, simulate } = await engine();
  for (const format of ["BO1", "BO3"])
    for (let seed = 0; seed < 100; seed++) {
      const config = defaultBot();
      config.seed = String(seed);
      config.profiles.A.bans = ["Ancient", "Nuke"];
      config.profiles.B.strengths = ["Mirage", "Cache"];
      const steps = defaultSteps(format).map((s, i) => ({
        ...s,
        team: seed % 2 ? "B" : i % 3 ? "A" : "B",
      }));
      const history = [];
      while (history.length < 6)
        history.push(chooseMap(pool, steps, history, config).map);
      const result = simulate(format, pool, steps, history);
      assert.equal(new Set([...history, result.decider]).size, 7);
      assert.equal(result.picks.length, format === "BO3" ? 2 : 0);
      assert.equal(chooseMap(pool, steps, history, config), null);
    }
});
test("invalid bot profiles reject duplicates, foreign maps and invalid parameters", async () => {
  const { defaultBot, validateBot, chooseMap } = await bot(),
    { defaultSteps } = await engine();
  for (const list of [["Nuke", "Nuke"], ["Train"], null]) {
    const c = defaultBot();
    c.profiles.B.bans = list;
    assert.notEqual(validateBot(c, pool), "");
    assert.throws(() => chooseMap(pool, defaultSteps("BO1"), [], c));
  }
  for (const change of [
    { variation: 31 },
    { variation: -1 },
    { variation: NaN },
    { seed: "" },
    { mode: "unknown" },
  ])
    assert.notEqual(validateBot({ ...defaultBot(), ...change }, pool), "");
  assert.throws(() =>
    chooseMap(pool, defaultSteps("BO1"), ["Nuke", "Nuke"], defaultBot()),
  );
});
