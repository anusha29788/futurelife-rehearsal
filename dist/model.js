function simulate(p, mode) {
  let cash = p.cash;
  let missed = 0;
  const series = [cash];
  const delay = mode === 'prepare' || mode === 'hybrid' ? 6 : 0;
  const retained = (p.partTimeRate ?? 50) / 100;

  for (let month = 0; month < delay + p.months; month++) {
    const inBreak = month >= delay;
    let retainedIncome = 1;

    if (inBreak) {
      if (mode === 'part' || mode === 'hybrid') {
        retainedIncome = retained;
      } else if (mode === 'phased') {
        retainedIncome = month - delay >= Math.ceil(p.months / 2) ? retained : 0;
      } else {
        retainedIncome = 0;
      }
    }

    cash += p.income * retainedIncome - p.expenses - (inBreak ? p.care : 0);
    if (inBreak) missed += p.retirement * (1 - retainedIncome);
    series.push(cash);
  }

  return {
    cash,
    series,
    missed,
    buffer: cash / (p.expenses + p.care),
    months: delay + p.months
  };
}

if (typeof module !== 'undefined') module.exports = { simulate };
