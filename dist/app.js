const $ = id => document.getElementById(id);
const defaults = {
  cash: 65000,
  income: 8000,
  expenses: 4800,
  care: 900,
  retirement: 900,
  buffer: 6,
  months: 6,
  partTimeRate: 50,
  goal: "I want to care for my father while protecting my family's emergency savings.",
  notes: '',
  selected: 'now',
  checks: []
};
let p;
try {
  p = { ...defaults, ...JSON.parse(localStorage.getItem('futurelife-v1') || '{}') };
} catch {
  p = { ...defaults };
}

const modes = ['now', 'part', 'prepare', 'hybrid', 'phased'];
const names = {
  now: 'Take the break now',
  part: 'Work part-time',
  prepare: 'Prepare for 6 months',
  hybrid: 'Prepare + part-time',
  phased: 'Phased return'
};
const colors = ['#21685b', '#b98632', '#7e8eae', '#537f9d', '#9b5d43'];
const money = n => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
}).format(n);
const tasks = [
  'Confirm leave, health coverage and employment benefits',
  'Review care costs and emergency savings needs',
  'Discuss the contribution gap and recovery plan with an advisor'
];
const partTimeRate = () => p.partTimeRate;

function save() {
  try {
    localStorage.setItem('futurelife-v1', JSON.stringify(p));
  } catch {}
}

function scenarioDetails(mode) {
  const rate = partTimeRate();
  if (mode === 'now') return 'No take-home income during the break';
  if (mode === 'part') return `${rate}% take-home income retained throughout the break`;
  if (mode === 'prepare') return '6 months of normal income first; no income during the break';
  if (mode === 'hybrid') return `6 months of preparation, then ${rate}% income during the break`;
  const noIncomeMonths = Math.ceil(p.months / 2);
  const partTimeMonths = p.months - noIncomeMonths;
  return partTimeMonths
    ? `No income for ${noIncomeMonths} months, then ${rate}% for ${partTimeMonths} months`
    : `No income throughout the ${p.months}-month break`;
}

const fields = [
  ['cash', 'Accessible savings ($)', 0, 10000000],
  ['income', 'Monthly take-home income ($)', 0, 1000000],
  ['expenses', 'Monthly living expenses ($)', 1, 1000000],
  ['care', 'Additional monthly care costs ($)', 0, 1000000],
  ['retirement', 'Monthly employee retirement contribution ($)', 0, 100000],
  ['buffer', 'Desired emergency buffer (months)', 1, 24],
  ['partTimeRate', 'Part-time take-home income retained (%)', 0, 100]
];

fields.forEach(([key, title, min, max]) => {
  const field = document.createElement('div');
  const step = key === 'buffer' ? 1 : key === 'partTimeRate' ? 5 : 100;
  field.innerHTML = `<label for="${key}">${title}</label><input type="number" id="${key}" min="${min}" max="${max}" step="${step}" value="${p[key]}">`;
  $('inputs').append(field);
  $(key).oninput = () => {
    const value = Number($(key).value);
    if (!Number.isFinite(value)) return;
    p[key] = Math.min(max, Math.max(min, value));
    save();
    render();
  };
  $(key).onchange = () => {
    $(key).value = p[key];
  };
});

$('months').value = p.months;
$('goal').value = p.goal;
$('notes').value = p.notes;
['goal', 'notes'].forEach(key => {
  $(key).oninput = () => {
    p[key] = $(key).value;
    save();
    if (key === 'goal') brief();
  };
});
$('months').oninput = () => {
  p.months = +$('months').value;
  save();
  render();
};
document.querySelectorAll('[data-month]').forEach(button => {
  button.onclick = () => {
    p.months = +button.dataset.month;
    $('months').value = p.months;
    save();
    render();
  };
});

tasks.forEach((task, index) => {
  const label = document.createElement('label');
  label.className = 'check';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = p.checks.includes(index);
  checkbox.onchange = () => {
    p.checks = checkbox.checked
      ? [...p.checks, index]
      : p.checks.filter(item => item !== index);
    save();
    brief();
  };
  label.append(checkbox, document.createTextNode(task));
  $('checks').append(label);
});

function results() {
  return Object.fromEntries(modes.map(mode => [mode, simulate(p, mode)]));
}

function render() {
  const scenarios = results();
  const selected = scenarios[p.selected] || scenarios.now;
  const floor = p.buffer * (p.expenses + p.care);
  $('duration').textContent = p.months;
  $('cards').replaceChildren();

  modes.forEach((mode, index) => {
    const button = document.createElement('button');
    button.className = `card${p.selected === mode ? ' selected' : ''}`;
    button.setAttribute('aria-pressed', p.selected === mode);
    button.innerHTML = `<span style="color:${colors[index]}">${names[mode]}</span><strong>${money(scenarios[mode].cash)}</strong><small>Ending savings · month ${scenarios[mode].months}<br>${scenarioDetails(mode)}</small>`;
    button.onclick = () => {
      p.selected = mode;
      save();
      render();
    };
    $('cards').append(button);
  });

  $('metrics').innerHTML = `<div class="metric"><span class="eyebrow">Ending buffer</span><b>${selected.buffer.toFixed(1)} months</b><small>of living + care expenses</small></div><div class="metric"><span class="eyebrow">Contribution gap</span><b>${money(selected.missed)}</b><small>employee contributions only</small></div><div class="metric"><span class="eyebrow">Emergency floor</span><b>${money(floor)}</b><small>your ${p.buffer}-month target</small></div>`;
  $('insight').textContent = (selected.cash < 0
    ? `This scenario has an unfunded cash gap of ${money(-selected.cash)}.`
    : selected.cash < floor
      ? `Ending savings fall ${money(floor - selected.cash)} below your chosen emergency floor.`
      : `Ending savings remain ${money(selected.cash - floor)} above your chosen emergency floor.`)
    + ' Review benefits, affordability and retirement assumptions with an advisor. This is a scenario explanation, not a recommendation.';

  const legend = modes.map((mode, index) =>
    `<span style="color:${colors[index]}">● ${names[mode]}</span>`
  ).join('');
  document.querySelector('.legend').innerHTML = legend + '<span>--- Emergency floor</span>';

  const values = Object.values(scenarios).flatMap(result => result.series);
  const low = Math.min(0, ...values);
  const high = Math.max(floor, ...values, 1);
  const horizon = p.months + 6;
  const x = month => 60 + month / horizon * 680;
  const y = value => 195 - (value - low) / (high - low) * 165;
  let svg = '';
  for (let index = 0; index < 4; index++) {
    const value = low + (high - low) * index / 3;
    svg += `<line x1="60" y1="${y(value)}" x2="740" y2="${y(value)}" stroke="#e2e9df"/><text x="2" y="${y(value) + 4}" font-size="11" fill="#657970">${Math.round(value / 1000)}k</text>`;
  }
  svg += `<line x1="60" x2="740" y1="${y(floor)}" y2="${y(floor)}" stroke="#a18756" stroke-dasharray="5 5"/>`;
  modes.forEach((mode, index) => {
    svg += `<polyline fill="none" stroke="${colors[index]}" stroke-width="${p.selected === mode ? 4 : 2}" points="${scenarios[mode].series.map((value, month) => `${x(month)},${y(value)}`).join(' ')}"/>`;
  });
  [0, Math.round(horizon / 2), horizon].forEach(month => {
    svg += `<text x="${x(month)}" y="225" font-size="11" fill="#657970">Month ${month}</text>`;
  });
  $('chart').setAttribute('viewBox', '0 0 780 240');
  $('chart').innerHTML = svg;
  document.querySelector('details p').textContent = `Cash changes monthly by take-home income minus living expenses and, during the break, care costs. Part-time income and employee contributions use the selected ${partTimeRate()}% retention rate. Prepare delays the break six months; the combined strategy also retains part-time income during the break. Phased return has no income for the first ${Math.ceil(p.months / 2)} break months, then retains ${partTimeRate()}% for any remaining break months. The emergency floor equals ${p.buffer} months of living plus care expenses. Contribution gaps are shown separately and are not deducted again from take-home pay. No investment returns, taxes, inflation, employer match, benefits changes or penalties are modeled. Negative balances indicate an unfunded gap, not available credit. Scenario end dates differ; compare common months on the chart. Outputs are illustrative, not validated financial planning.`;
  brief();
}

function brief() {
  const result = simulate(p, p.selected);
  $('brief').textContent = `MAYA · AGE 47 · SYNTHETIC HOUSEHOLD

Priority: ${p.goal}
Selected rehearsal: ${names[p.selected]}
Scenario assumption: ${scenarioDetails(p.selected)}
Career break: ${p.months} months | Scenario horizon: ${result.months} months

INPUTS — participant-editable sample values
Accessible savings: ${money(p.cash)}
Monthly take-home income: ${money(p.income)}
Living expenses: ${money(p.expenses)} / month
Additional care costs: ${money(p.care)} / break month
Employee retirement contributions: ${money(p.retirement)} / month
Part-time income and contribution retention: ${partTimeRate()}%
Emergency floor: ${p.buffer} months

ILLUSTRATIVE RESULTS
Ending accessible savings: ${money(result.cash)}
Ending expense buffer: ${result.buffer.toFixed(1)} months
Employee contribution gap: ${money(result.missed)}

PREPARATION PROGRESS
${tasks.map((task, index) => (p.checks.includes(index) ? '[Reviewed] ' : '[Open] ') + task).join('\n')}

QUESTIONS TO VALIDATE
What happens to employer benefits and match?
Are care costs and household income complete?
What contribution recovery plan is affordable?

MODEL LIMITS
No returns, taxes, inflation, employer match, benefits changes or penalties. Part-time income and contributions use the selected retention rate. Prepare assumes 6 months of normal income before the break. Phased return assumes no income for the first half of the break, then the selected part-time rate for the rest. No recommendation or transaction has been made.`;
}

function view(name) {
  $('studio').classList.toggle('hidden', name !== 'studio');
  $('advisor').classList.toggle('hidden', name !== 'advisor');
  $('studioTab').classList.toggle('active', name === 'studio');
  $('advisorTab').classList.toggle('active', name === 'advisor');
  brief();
  window.scrollTo(0, 0);
}

$('studioTab').onclick = $('back').onclick = () => view('studio');
$('advisorTab').onclick = $('prepare').onclick = () => view('advisor');
$('reset').onclick = () => {
  localStorage.removeItem('futurelife-v1');
  location.reload();
};
$('download').onclick = () => {
  if (!$('consent').checked) {
    $('status').textContent = 'Please review the brief and select the confirmation above.';
    return;
  }
  const blob = new Blob([`${$('brief').textContent}\n\nADDITIONAL QUESTIONS\n${p.notes}`], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'FutureLife_Advisor_Brief.txt';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $('status').textContent = 'Discussion brief downloaded. Nothing was sent to an advisor.';
};
render();
