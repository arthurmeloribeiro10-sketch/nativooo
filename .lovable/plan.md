# NATIVO experience and data consistency upgrade

## Goal
Make the daily experience clearer and safer while preserving existing accounts, records, history, authentication, photo uploads, and working AI features.

## Implementation sequence

1. **Fix UV and outdoor guidance first**
   - Replace sunrise/sunset-based advice with hourly UV-aware states.
   - Show current UV, forecast maximum, location, source, and update time separately.
   - Follow WHO thresholds: recommend protection from UV 3, and stronger precautions or avoiding midday exposure at UV 8+.
   - Remove universal exposure-duration and “without sunglasses” advice.
   - Add distinct loading, denied-location, unavailable-data, and high-UV states; never render invented forecast values.
   - Add manual city selection using the available weather/geocoding service when location access is denied.

2. **Correct the score model and empty states**
   - Audit the existing formula and replace implicit zeroes with explicit states: no data, partial data, completed, and explicitly not completed.
   - Present the numeric result only as progress across recorded habits, with criteria, period, contributions, and missing inputs.
   - Keep daily progress, streak, and 30-day protocol progress separate.
   - Preserve all historical records and allow routine continuation after gaps.

3. **Unify daily missions, habits, and indicators**
   - Establish one persisted completion source for related mission/habit states without double counting.
   - Keep step counts explicit; never infer steps from a checked mission.
   - Support complete/undo across pages, immediate synchronized refresh, discreet confirmation, retry on failure, and duplicate-click protection.
   - Group pending and completed missions; make deletion secondary.
   - Add recent-meal repeat, one-tap habit recording, and record editing where the existing data model supports it.

4. **Persist and restructure meal plans**
   - Add backward-compatible plan/profile fields and plan history through database migrations, with user isolation and grants.
   - Preserve existing meal logs; applying a plan creates/replaces only future planned meals after a confirmation preview.
   - Make an existing plan the primary diet view: summary, next meal, remaining meals, adjustments, then the assistant.
   - Support complete/undo, time and item edits, ingredient replacement, add/delete meal, and estimated-calorie labeling.
   - Remove any universal calorie target and explain planned versus logged estimates.
   - Combine AI personalization and templates in one creation area. Use short steps whose answers materially affect the plan.
   - Clarify the Ray Peat-inspired, pro-metabolic approach in plain language and distinguish preferences from general health guidance.
   - Keep the 8-hour eating window optional and explain that 20:00–12:00 is a 16-hour fast.
   - Preview changes and explain replacement before applying; surface exact AI errors and preserve input.

5. **Reorder and personalize the home screen**
   - Use first name only.
   - Order: greeting, day summary/next action, missions, recent evolution, pillar details.
   - Shrink photography to supporting content and place a personalized actionable CTA above the fold.
   - Choose actions from real records and local time; missing data prompts a first record without treating absence as failure.
   - Give each pillar its state, source data, and quick action; distinguish no record from explicit zero.
   - Add editable personal step and planned-meal targets; keep protocol progress independent.

6. **Improve community and navigation**
   - Prioritize real recent posts and sharing; collapse the composer until requested.
   - Show useful empty states and keep ranking complementary, with period and exact sorting criteria.
   - Do not invent challenges, creators, testimonials, or participants.
   - Rename Home to Início, replace Add with Adicionar, centralize Portuguese pluralization, and use a broader record icon.
   - Improve mobile active states, touch targets, bottom spacing, keyboard-safe forms, focus labels, contrast, and desktop two-column layouts where useful.

7. **Verification and safety**
   - Validate migrations preserve existing rows and enforce per-user access.
   - Test new user, partial records, cross-page mission undo, reload persistence, plan replacement without history loss, AI failure, denied location, unavailable/high UV, empty community, local day rollover, and mobile/desktop layouts.
   - Inspect build/runtime/network signals after changes and run the relevant tests.

## Technical details
- Reuse TanStack Start routes, existing Lovable Cloud authentication/storage, current query cache, and authenticated server functions.
- Use additive migrations and backfills only; no destructive reset or user-data rewrite.
- Use São Paulo-aware defaults only for legacy rows while storing each user’s chosen timezone for new daily calculations.
- Maintain current Natural Premium tokens while tightening spacing, shadows, borders, contrast, and state styling.
- Every content route will keep unique title, description, Open Graph metadata, `og:type`, and `twitter:card`.

## Deliverable
A functional, persisted upgrade—not mock states—with a final report separating implemented behavior, verified scenarios, and any unavailable external dependency.
