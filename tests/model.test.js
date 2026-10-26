const assert = require('node:assert/strict');
const { simulate } = require('../dist/model.js');
const p = {
  cash: 65000,
  income: 8000,
  expenses: 4800,
  care: 900,
  retirement: 900,
  months: 6,
  preparationMonths: 0,
  incomeRate: 0
};

const noIncome = simulate(p);
assert.equal(noIncome.cash, 30800);
assert.equal(noIncome.missed, 5400);
assert.equal(noIncome.months, 6);

const partTime = simulate({ ...p, incomeRate: 50 });
assert.equal(partTime.cash, 54800);
assert.equal(partTime.missed, 2700);

const higherPartTime = simulate({ ...p, incomeRate: 75 });
assert.equal(higherPartTime.cash, 66800);
assert.equal(higherPartTime.missed, 1350);

const prepared = simulate({ ...p, preparationMonths: 6 });
assert.equal(prepared.cash, 50000);
assert.equal(prepared.series[6], 84200);
assert.equal(prepared.months, 12);

const preparedPartTime = simulate({ ...p, preparationMonths: 6, incomeRate: 50 });
assert.equal(preparedPartTime.cash, 74000);
assert.equal(preparedPartTime.missed, 2700);
assert.equal(preparedPartTime.series[6], 84200);

const longerBreak = simulate({ ...p, months: 18 });
assert.equal(longerBreak.cash, -37600);
assert.equal(longerBreak.months, 18);

console.log('15 dynamic scenario assertions passed');
