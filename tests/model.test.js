const assert = require('node:assert/strict');
const { simulate } = require('../dist/model.js');
const p = {
  cash: 65000,
  income: 8000,
  expenses: 4800,
  care: 900,
  retirement: 900,
  months: 6,
  partTimeRate: 50
};

assert.equal(simulate(p, 'now').cash, 30800);
assert.equal(simulate(p, 'part').cash, 54800);
assert.equal(simulate(p, 'prepare').cash, 50000);
assert.equal(simulate(p, 'now').missed, 5400);
assert.equal(simulate(p, 'part').missed, 2700);
assert.equal(simulate({ ...p, months: 18 }, 'now').cash, -37600);
assert.equal(simulate(p, 'prepare').series[6], 84200);

const hybrid = simulate(p, 'hybrid');
assert.equal(hybrid.cash, 74000);
assert.equal(hybrid.missed, 2700);
assert.equal(hybrid.months, 12);

const phased = simulate(p, 'phased');
assert.equal(phased.cash, 42800);
assert.equal(phased.missed, 4050);
assert.equal(phased.series[3], 47900);
assert.equal(phased.series[4], 46200);

const oddPhased = simulate({ ...p, months: 5 }, 'phased');
assert.equal(oddPhased.cash, 44500);
assert.equal(oddPhased.missed, 3600);

const adjustedRate = simulate({ ...p, partTimeRate: 75 }, 'part');
assert.equal(adjustedRate.cash, 66800);
assert.equal(adjustedRate.missed, 1350);
assert.equal(simulate({ ...p, partTimeRate: 75 }, 'hybrid').cash, 86000);

const legacyProfile = { ...p };
delete legacyProfile.partTimeRate;
assert.equal(simulate(legacyProfile, 'part').cash, 54800);

console.log('18 model assertions passed');
