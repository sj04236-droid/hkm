---
name: task-first-app-design
description: Design or improve mobile apps, responsive web apps and operational dashboards using task-first navigation, contextual actions, search, reviewable forms and clear return paths. Use for user-flow and layout work across industries; do not use for visual-only artwork or static promotional pages.
---

# Task-first app design

Create a working interface that helps people understand their current state, choose the next action, complete it and return without losing context. Apply patterns observed in the Shinhan SuperSOL Android app, adapted to the user's domain and existing product. Do not copy its branding or assume all products need a banking layout.

## Start from the user's task

Identify the primary user, object being managed, frequent task, completion condition and interruption risks. Preserve existing authorization, calculations, data models and working features unless the requested change requires modifying them. Infer routine choices from the project and conversation; ask only about materially different outcomes.

For redesigns, inspect the current screens and code before changing them. Distinguish observed behavior, published descriptions and proposed design. Do not claim to have tested screens beyond login, authentication or other gates that were not crossed. Read [observed basis](references/observed-basis.md) when explaining the source patterns.

## Map the complete task

Write a compact flow for entry → selection/search → detail/input → review → save/submit → confirmation → return. Include empty, loading, partial, error, permission-needed and success states where relevant. Map the main object identifier through the flow so the correct record remains selected. Never add a feature solely to make the flow resemble a reference app.

Specify what persists when the user goes back: input values, selected category, query, filter, scroll position and record identity. Do not silently clear drafts or choose a different record. Use an existing suitable mechanism; server sessions, URL state and local storage have different privacy and persistence implications.

## Select layout around intent

- Overview: show actionable status and the user's most important numbers first. Put a relevant action beside each status. Avoid an introductory hero before the work.
- Browse: combine categories, search and concise lists when each adds value. Indicate the selected category clearly. Keep late categories discoverable.
- Detail: summarize the object, show evidence or supporting information progressively and keep the primary action visible. Preserve a clear return path.
- Input: place upload/import first when it supplies the fields. Follow with editable results, validation, review and explicit save. Manual entry must remain possible.
- Assistant: offer relevant example questions, respond with a short useful result, show sources when factual accuracy requires them and place the next action close to the answer. Do not hide the action under a long explanation.

For density, breakpoints, keyboard access and form behavior read [layout and interaction rules](references/layout-and-interaction.md). These are starting points, not a mandatory component inventory.

## Adapt across platforms and domains

Use bottom navigation for a small stable set of frequent mobile destinations; desktop can use a sidebar. Treat “all tasks” as a searchable overflow when justified. An occasional detail flow may replace global navigation with back and a primary action. Avoid two conflicting navigation systems.

Use semantic patterns rather than banking nouns: account → managed object, balance → key metric, transfer → contextual action, product → selectable offering, claim → evidence submission. In medical, legal, financial or identity workflows, obtain the appropriate human decisions and confirmations; UI pattern reuse does not authorize consequential actions.

Do not enable automatic personalization by default. Let users pin frequent tasks when useful and keep essential controls stable. Do not add animation, characters, promotional banners or gamification without a product reason.

## Implement and verify

Use the project's existing framework and design system. Preserve native labels, field validation and disabled states. Add loading and error feedback to real asynchronous work; never simulate a successful backend action. Integrate primary buttons with the existing save/submit logic rather than maintaining two implementations.

Verify at least one meaningful primary flow and its return path. Check a narrow mobile view and a desktop view: no clipped controls, hidden required fields, overlapping navigation or sticky actions, lost drafts, duplicate IDs or broken print output. Use appropriate existing tests for logic regressions; do not create tests that only assert headings or CSS class names. Report what was actually changed and tested, remaining limits and verified artifact URLs.

## Deliverables

When asked for analysis, provide observed screens, a task-flow diagram, friction points and prioritized changes. When asked to implement, finish the interface and validation, and follow the user's requested repository and publishing workflow. Never put private screenshots, account balances, customer records, device identifiers or credentials into a public repository.
