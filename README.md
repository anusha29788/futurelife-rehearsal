# FutureLife Rehearsal
Buildless BFSI demonstration workspace. Serve dist with a static HTTP server.

Implemented: editable synthetic household profile, five career-break scenarios, monthly cash-flow chart, emergency floor, separate employee contribution gap, local browser persistence, preparation checklist, advisor workspace and consent-gated text export. AI conversation is simulated; no model API or account integration is configured.

Scenarios: take the break now; work part-time; prepare for six months; prepare for six months and then work part-time; or phase back by taking no income during the first half of the break and retaining part-time income during the second half. Part-time income retention is editable from 0% to 100% and applies proportionally to employee retirement contributions.

Model: cash[t+1] = cash[t] + retained take-home income - living expenses - care expense during leave. Preparation scenarios delay leave six months and save normal income first. No returns, tax, inflation, benefits, employer match or penalties are modeled. Scenarios have different end dates. Negative balances show unmet funding needs.

Production next steps: validated planning engine, authenticated customer data, approved content retrieval, consent/audit controls, advisor integration, model evaluation and specialist review. No financial actions are executed.

Demo: change six months to nine, compare scenarios, edit care costs, review assumptions, select preparation actions, open advisor brief and download it.

Verification: node tests/model.test.js
