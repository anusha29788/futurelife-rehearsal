const $ = id => document.getElementById(id);
const defaults = {
  cash: 65000,
  income: 8000,
  expenses: 4800,
  care: 900,
  retirement: 900,
  buffer: 6,
  scenarioName: 'Take a career break',
  preparationMonths: 0,
  months: 6,
  incomeRate: 0,
  goal: "I want to care for my father while protecting my family's emergency savings.",
  notes: '',
  checks: []
};
let p;
try {
  const stored = JSON.parse(localStorage.getItem('futurelife-v1') || '{}');
  p = { ...defaults, ...stored };
  if (!Object.hasOwn(stored, 'scenarioName')) {
    const legacyMode = stored.selected;
    p.scenarioName = {
      now: 'Take the break now',
      part: 'Work part-time',
      prepare: 'Prepare for 6 months',
      hybrid: 'Prepare + part-time',
      phased: 'Phased return'
    }[legacyMode] || defaults.scenarioName;
    p.preparationMonths = ['prepare', 'hybrid'].includes(legacyMode) ? 6 : 0;
    p.incomeRate = ['part', 'hybrid'].includes(legacyMode)
      ? stored.partTimeRate ?? 50
      : legacyMode === 'phased'
        ? (stored.partTimeRate ?? 50) * Math.floor(p.months / 2) / p.months
        : 0;
    delete p.selected;
    delete p.partTimeRate;
  }
} catch {
  p = { ...defaults };
}

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

function save() {
  try {
    localStorage.setItem('futurelife-v1', JSON.stringify(p));
  } catch {}
}

const householdFields = [
  ['cash', 'Accessible savings ($)', 0, 10000000, 100],
  ['income', 'Monthly take-home income ($)', 0, 1000000, 100],
  ['expenses', 'Monthly living expenses ($)', 1, 1000000, 100],
  ['care', 'Additional monthly care costs ($)', 0, 1000000, 100],
  ['retirement', 'Monthly employee retirement contribution ($)', 0, 100000, 100],
  ['buffer', 'Desired emergency buffer (months)', 1, 24, 1]
];

function bindNumberInput(id, key, min, max) {
  const input = $(id);
  input.value = p[key];
  input.oninput = () => {
    if (input.value === '') return;
    const value = Number(input.value);
    if (!Number.isFinite(value)) return;
    p[key] = Math.min(max, Math.max(min, value));
    save();
    render();
  };
  input.onchange = () => {
    input.value = p[key];
  };
}

householdFields.forEach(([key, title, min, max, step]) => {
  const field = document.createElement('div');
  field.innerHTML = `<label for="${key}">${title}</label><input type="number" id="${key}" min="${min}" max="${max}" step="${step}">`;
  $('inputs').append(field);
  bindNumberInput(key, key, min, max);
});

$('scenarioName').value = p.scenarioName;
$('scenarioName').oninput = () => {
  p.scenarioName = $('scenarioName').value.slice(0, 80);
  save();
  render();
};
bindNumberInput('preparationMonths', 'preparationMonths', 0, 60);
bindNumberInput('incomeRate', 'incomeRate', 0, 100);
$('months').value = p.months;
$('months').oninput = () => {
  p.months = Number($('months').value);
  save();
  render();
};
$('goal').value = p.goal;
$('goal').oninput = () => {
  p.goal = $('goal').value;
  save();
  brief();
};
$('notes').value = p.notes;
$('notes').oninput = () => {
  p.notes = $('notes').value;
  save();
};

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

function hasScenario() {
  return Boolean(p.scenarioName.trim());
}

function scenarioDetails() {
  const preparation = p.preparationMonths
    ? `Work ${p.preparationMonths} months before the break`
    : 'Break starts now';
  return `${preparation}; ${p.months}-month break; ${p.incomeRate}% take-home income retained during the break`;
}

function renderChart(result, floor) {
  const svg = $('chart');
  svg.setAttribute('viewBox', '0 0 780 240');
  if (!result) {
    svg.setAttribute('aria-label', 'No scenario to display');
    svg.innerHTML = '<text x="60" y="115" fill="#657970">Name a scenario to see its savings projection.</text>';
    return;
  }

  svg.setAttribute('aria-label', `Projected savings for ${p.scenarioName}`);
  const low = Math.min(0, ...result.series);
  const high = Math.max(floor, ...result.series, 1);
  const horizon = result.months;
  const x = month => 60 + month / horizon * 680;
  const y = value => 195 - (value - low) / (high - low) * 165;
  let content = '';

  for (let index = 0; index < 4; index++) {
    const value = low + (high - low) * index / 3;
    content += `<line x1="60" y1="${y(value)}" x2="740" y2="${y(value)}" stroke="#e2e9df"/><text x="2" y="${y(value) + 4}" font-size="11" fill="#657970">${Math.round(value / 1000)}k</text>`;
  }

  content += `<line x1="60" x2="740" y1="${y(floor)}" y2="${y(floor)}" stroke="#a18756" stroke-dasharray="5 5"/>`;
  content += `<polyline fill="none" stroke="#21685b" stroke-width="4" points="${result.series.map((value, month) => `${x(month)},${y(value)}`).join(' ')}"/>`;
  [0, Math.round(horizon / 2), horizon].forEach(month => {
    content += `<text x="${x(month)}" y="225" font-size="11" fill="#657970">Month ${month}</text>`;
  });
  svg.innerHTML = content;
}

function render() {
  const active = hasScenario();
  const result = active ? simulate(p) : null;
  const floor = p.buffer * (p.expenses + p.care);
  $('duration').textContent = p.months;
  $('scenarioSummary').replaceChildren();

  if (result) {
    const title = document.createElement('span');
    title.className = 'eyebrow';
    title.textContent = p.scenarioName;
    const ending = document.createElement('strong');
    ending.textContent = money(result.cash);
    const details = document.createElement('small');
    details.textContent = `Ending savings · month ${result.months}. ${scenarioDetails()}`;
    $('scenarioSummary').append(title, ending, details);
    $('scenarioLegend').textContent = `● ${p.scenarioName} — accessible savings`;
    $('metrics').innerHTML = `<div class="metric"><span class="eyebrow">Ending buffer</span><b>${result.buffer.toFixed(1)} months</b><small>of living + care expenses</small></div><div class="metric"><span class="eyebrow">Contribution gap</span><b>${money(result.missed)}</b><small>employee contributions only</small></div><div class="metric"><span class="eyebrow">Emergency floor</span><b>${money(floor)}</b><small>your ${p.buffer}-month target</small></div>`;
    $('insight').textContent = (result.cash < 0
      ? `This scenario has an unfunded cash gap of ${money(-result.cash)}.`
      : result.cash < floor
        ? `Ending savings fall ${money(floor - result.cash)} below your chosen emergency floor.`
        : `Ending savings remain ${money(result.cash - floor)} above your chosen emergency floor.`)
      + ' Review benefits, affordability and retirement assumptions with an advisor. This is a scenario explanation, not a recommendation.';
  } else {
    const prompt = document.createElement('small');
    prompt.textContent = 'Enter a scenario name to calculate and display one scenario at a time.';
    $('scenarioSummary').append(prompt);
    $('scenarioLegend').textContent = 'No active scenario';
    $('metrics').innerHTML = '<div class="metric"><span class="eyebrow">Ending buffer</span><b>—</b></div><div class="metric"><span class="eyebrow">Contribution gap</span><b>—</b></div><div class="metric"><span class="eyebrow">Emergency floor</span><b>—</b></div>';
    $('insight').textContent = 'Set a scenario name and adjust the assumptions above to see an illustrative projection.';
  }

  renderChart(result, floor);
  $('assumptions').textContent = `Cash changes monthly by take-home income minus living expenses and, during the break, care costs. Income retained during the break is ${p.incomeRate}%. The scenario saves normal income for ${p.preparationMonths} month(s) before the break. The emergency floor equals ${p.buffer} months of living plus care expenses. Employee contribution gaps are shown separately and are not deducted again from take-home pay. No investment returns, taxes, inflation, employer match, benefits changes or penalties are modeled. Negative balances indicate an unfunded gap, not available credit. Outputs are illustrative, not validated financial planning.`;
  brief(result);
}

function brief(result = hasScenario() ? simulate(p) : null) {
  $('brief').textContent = `MAYA · AGE 47 · SYNTHETIC HOUSEHOLD

Priority: ${p.goal}
${result ? `Scenario: ${p.scenarioName}\nAssumptions: ${scenarioDetails()}\nScenario horizon: ${result.months} months` : 'No active scenario. Return to the rehearsal studio to define one.'}

INPUTS — participant-editable sample values
Accessible savings: ${money(p.cash)}
Monthly take-home income: ${money(p.income)}
Living expenses: ${money(p.expenses)} / month
Additional care costs: ${money(p.care)} / break month
Employee retirement contributions: ${money(p.retirement)} / month
Emergency floor: ${p.buffer} months

${result ? `ILLUSTRATIVE RESULTS\nEnding accessible savings: ${money(result.cash)}\nEnding expense buffer: ${result.buffer.toFixed(1)} months\nEmployee contribution gap: ${money(result.missed)}` : 'Create a named scenario to calculate illustrative results.'}

PREPARATION PROGRESS
${tasks.map((task, index) => (p.checks.includes(index) ? '[Reviewed] ' : '[Open] ') + task).join('\n')}

QUESTIONS TO VALIDATE
What happens to employer benefits and match?
Are care costs and household income complete?
What contribution recovery plan is affordable?

MODEL LIMITS
No returns, taxes, inflation, employer match, benefits changes or penalties. Income during the break follows the editable retention rate. Preparation assumes normal income continues for the specified months before the break. No recommendation or transaction has been made.`;
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
  p.scenarioName = '';
  p.preparationMonths = defaults.preparationMonths;
  p.months = defaults.months;
  p.incomeRate = defaults.incomeRate;
  $('scenarioName').value = '';
  $('preparationMonths').value = p.preparationMonths;
  $('months').value = p.months;
  $('incomeRate').value = p.incomeRate;
  save();
  render();
  $('scenarioName').focus();
};
$('download').onclick = () => {
  if (!hasScenario()) {
    $('status').textContent = 'Create a named scenario before downloading the brief.';
    return;
  }
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
