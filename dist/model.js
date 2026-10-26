function simulate(p) {
  let cash = p.cash;
  let missed = 0;
  const series = [cash];
  const preparationMonths = p.preparationMonths ?? 0;
  const incomeRate = (p.incomeRate ?? 0) / 100;

  for (let month = 0; month < preparationMonths + p.months; month++) {
    const inBreak = month >= preparationMonths;
    const retainedIncome = inBreak ? incomeRate : 1;
    cash += p.income * retainedIncome - p.expenses - (inBreak ? p.care : 0);
    if (inBreak) missed += p.retirement * (1 - retainedIncome);
    series.push(cash);
  }

  return {
    cash,
    series,
    missed,
    buffer: cash / (p.expenses + p.care),
    months: preparationMonths + p.months
  };
}

if (typeof module !== 'undefined') module.exports = { simulate };
