# FutureLife Rehearsal
Buildless BFSI demonstration workspace. Serve dist with a static HTTP server.

Implemented: editable synthetic household profile, a single user-defined career-break scenario at a time, monthly cash-flow chart, emergency floor, separate employee contribution gap, local browser persistence, preparation checklist, advisor workspace and consent-gated text export. Name a scenario and adjust its break duration, months of preparation, and take-home income retained during the break; results update as assumptions change. Start a new scenario to clear the current scenario settings while keeping household inputs. AI conversation is simulated; no model API or account integration is configured.

Model: cash[t+1] = cash[t] + retained take-home income - living expenses - care expense during leave. The scenario editor applies normal income during the preparation period and the selected income-retention percentage during the break; employee contribution gaps use the same retention percentage. No returns, tax, inflation, benefits, employer match or penalties are modeled. Negative balances show unmet funding needs.

Production next steps: validated planning engine, authenticated customer data, approved content retrieval, consent/audit controls, advisor integration, model evaluation and specialist review. No financial actions are executed.

Demo: define a named scenario, adjust break duration, preparation time and retained income, edit household inputs, review assumptions, select preparation actions, open advisor brief and download it. Start a new scenario to clear its settings and enter another one.

Verification: node tests/model.test.js
