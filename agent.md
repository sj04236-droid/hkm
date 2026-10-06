# agent.md

## Purpose

Use this project as a practical travel-agency operations assistant rather than a generic booking website.

## Product priorities

1. Reduce repetitive ticketing and quotation work.
2. Make GDS entry lookup fast and reliable.
3. Turn PNR / fare-rule text into easy customer-facing summaries.
4. Reuse customer information safely.
5. Connect quotations to sales, purchases, fees, VAT, and net profit.
6. Make ticketing and payment deadlines highly visible.

## UX principles

- Put today's deadlines and financial summary first on the dashboard.
- Minimize the number of fields a staff member must type repeatedly.
- Use travel-industry terminology where staff expect it, but explain ambiguous items in plain Korean.
- Keep destructive actions obvious and reversible where possible.
- Make print/PDF quotation output clean and customer-friendly.

## GDS entry knowledge

- Do not invent Amadeus or Sabre/Abacus entries.
- Prefer verified entries from approved manuals or internal reference material.
- Store the source/system for each entry when the knowledge base is expanded.
- If an entry is uncertain, mark it as requiring verification instead of guessing.

## Data and privacy

- Never commit `.env` or credentials.
- Do not add real customer passport numbers, resident-registration numbers, card data, or insurance identifiers to source control.
- Production storage for sensitive data must use authentication, role-based access, encryption, audit logs, and a retention/deletion policy.
- Browser `localStorage` is acceptable only for the current prototype and demo data.

## Accounting behavior

- Keep transaction date, sales item, payment type, sales amount, purchase amount, supply value, VAT, fees, other costs, and net profit distinguishable.
- Current net-profit calculation is: `sales - purchase`. Purchase means recorded expense; fees are not deducted a second time.
- VAT calculation rules must remain editable because travel-industry tax treatment can differ by transaction type. Recording an expense does not establish tax deductibility.

## Change discipline

- Preserve existing working behavior unless the requested change requires altering it.
- Validate JavaScript syntax before committing.
- Keep changes small, understandable, and reviewable.
