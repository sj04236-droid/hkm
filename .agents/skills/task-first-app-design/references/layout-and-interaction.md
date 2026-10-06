# Layout and interaction rules

## Navigation and responsive layout

Choose breakpoints when content stops fitting, not by device brand. Start with one content column on narrow screens; use list/detail or input/preview columns when both remain readable. For a mobile app, respect platform back gestures and safe areas. For web, keep browser navigation and meaningful links functional.

Use a small stable set of bottom destinations only for frequently used areas. A sidebar works well for wider operational tools. Distinguish global destinations, local tabs and primary action. Preserve active state using text plus a visual cue; do not rely on color alone.

Keep sticky controls out of the keyboard, bottom navigation and safe area. Reserve space at the bottom so the final field remains reachable. Ensure that floating feedback does not cover submit controls. Avoid a sticky preview if its scroll area becomes unusably small; collapse to a normal document on narrow screens. Disable workspace chrome for print/export.

## Information hierarchy

Use a short page title, critical state, working controls and useful content before optional recommendations. Cards group information; they are not mandatory wrappers for every row. In dense tools, prefer compact rows and a separate detail panel. Use numerals aligned for comparison. Never change the meaning of revenue, cost, profit or other domain metrics to fit a visual.

Use a neutral background and subtle surface separation. Reserve accent color for selected state and primary actions. Body text around 14–16 CSS pixels and controls around 44–48 pixels are useful web starting points; verify legibility and touch use rather than treating these as exact source measurements. Check WCAG AA contrast, keyboard focus, zoom/reflow and platform text scaling. Important errors and statuses require words, not color alone.

## Forms and import review

Place the fastest valid entry path first. Group related fields with visible section labels and an understandable order. Do not hide a required field behind a collapsed section. Explain errors beside fields. Preserve values on failure. Keep save actions disabled only while relevant work is actually running.

An import flow must distinguish reading, partial result, failed recognition and confirmed save. Display the original or its available reference next to editable extracted fields when practical. Require review for identity or financial information. Uploaded companions are independent records unless the domain explicitly requires linking; do not infer person identity from similar names.

When adding a second visible save control, forward it to the existing form handler and native validation. Test both controls. Never send sensitive records to a third party for analysis without the required authorization. Use fictional fixtures for screenshots and repository tests.

## Search and assistants

State what search covers. Menu search, record search and factual Q&A are different scopes and must be labeled accurately. Show a helpful no-match state and preserve the query. Suggestions should represent known supported tasks; a suggestion is not evidence that an answer exists.

For reference answers, show the useful result first, then concise explanation, example and provenance. Put copy or the next allowed task near the result. Deduplicate the primary answer from related results. Distinguish supported facts from inferred matches; show uncertainty instead of fabricating commands or rules.

## Verification scenarios

- First visit with no records: meaningful starting action, no false count or fake pending status.
- Existing records: correct object and filters survive detail/return.
- Narrow viewport and zoom: controls remain reachable and tables scroll within their container.
- Keyboard: every interactive control has a label and visible focus; dialogs trap focus and close with Escape.
- Import fails or partly succeeds: clear feedback, editable values and retry/manual path.
- Save fails: preserve draft and avoid success feedback.
- Desktop preview and print: no clipped document, toolbars or fixed controls in exported content.

Choose scenarios relevant to the actual change. Explain unsupported flows rather than presenting mock behavior as verified.
