# CLAUDE.md

## Project overview

This repository contains **ATR Travel Ops**, a Korean travel-agency operations web application.

Primary workflow:

1. Search Amadeus / Sabre-Abacus entries.
2. Paste PNR, FQQ, or FQN output and summarize fare rules.
3. Manage customer CRM information.
4. Manage passport / APIS-related fields.
5. Build customer quotation sheets.
6. Track sales, purchases, VAT, and net profit.
7. Track ticketing deadlines and other operational due dates.

## Project structure

- `dist/index.html` — application markup.
- `dist/styles.css` — responsive UI and print styles.
- `dist/app.js` — browser-side application logic and local storage.
- `dist/workspace.js` / `dist/workspace.css` — task-first navigation, menu search, mobile actions and responsive presentation.
- `.agents/skills/task-first-app-design/SKILL.md` — reusable cross-domain app/web UX skill and source observations.
- `.openai/hosting.json` — OpenAI Sites hosting configuration.

## Development rules

- Keep the interface Korean-first and easy for non-technical travel-agency staff.
- Preserve the current left navigation and task-oriented workflow unless a change is explicitly requested.
- Prefer simple browser-native JavaScript over adding frameworks unless the project clearly needs server-side behavior.
- Keep the app responsive for desktop and mobile.
- Never hard-code API keys, passwords, bearer tokens, or customer secrets in committed source.
- `.env` files must stay untracked.
- Treat passport numbers, resident-registration data, insurance data, and other personal information as sensitive.
- Demo customer data must remain fictional.

## Validation

Before committing changes:

1. Run `node --check dist/app.js`.
2. Confirm `dist/index.html`, `dist/styles.css`, and `dist/app.js` are present.
3. Check `git status` and make sure `.env` is not staged.
4. Verify key flows manually: navigation, PNR analysis, CRM, quotation preview, ledger calculations, and deadline management.

## Deployment

The production prototype is hosted with OpenAI Sites. Keep `.openai/hosting.json` valid when changing hosting-related behavior.

