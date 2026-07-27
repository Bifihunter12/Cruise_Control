# Conqur Rebuild Roadmap — Single-Quest Habit-Replacement Model

**Status:** Phase 1, Phase 2, and a first slice of Phase 3 (real AI via "Talk it through") are built and verified live against real OpenAI responses (Section 6, 7, 10). Phase 3 is not fully complete — personality/intensity picker and AI-interpreted onboarding free text are still deferred. See Section 10 for exact scope and known issues before expanding it further.

**Context:** the master rebuild prompt asks Conqur to move from "pick several unrelated habits and check them off" to "one Main Quest built around replacing a single automatic behavior pattern, with an optional AI coaching layer." This is a core product/architecture pivot, not a styling or copy change. Conqur has zero real users yet, so there's no live-data migration risk.

---

## 1. What exists today

| Area | Current reality |
|---|---|
| **Core loop** | Multiple simultaneous "challenges" (`state.challenges`), each with several habits (binary/tiered/distance/measurement types) checked off daily — the exact "pick five unrelated habits" pattern being retired. |
| **Templates** | 43 pre-built challenge templates (`TEMPLATES`), each with 3-7 fixed habits, a tier, difficulty, safety warnings. Real, reusable content — a library of *what to do*, not *how to change one behavior* — treated as an asset to audit, not a finished product. |
| **Onboarding** | 4 questions (goal → intensity → time-per-day → cue) → one recommended template. Recommends a *bundle of habits*, not a single behavior-replacement Quest; no "reflect understanding back, user confirms" loop yet. |
| **Daily interaction** | A full checklist — no "Done / Not today / Let's talk" three-action model. |
| **Progress language** | Already matches this doc's vocabulary table (Promise, Rhythm, Stage, Milestone, unit-free Progress) — done this session, no further work needed. |
| **Stage/Path system** | 6-stage progression (`STAGE_BANDS`) built this session, reusing level-up/chapter-milestone triggers. Reusable pattern for per-Quest chapters later. |
| **AI / "Let's Talk"** | Does not exist. Zero LLM calls anywhere. Static PWA (Netlify) + Supabase for auth/cloud sync only. |
| **Cue → replacement data model** | Does not exist. Habits today are flat (`title`, `emoji`, `quip`, `points`) — no cue, need, default replacement, or alternatives concept. |
| **Privacy stance** | Already compliant — no calendar/screen-time/contacts/location access anywhere. |

---

## 2. Decisions — approved this round

1. **Architecture: Option B technically, Option A experientially.** The existing habit/challenge engine (days, streaks, badges, Stage progression) is preserved and reused as infrastructure. The single-Quest experience is Conqur's **only primary front door** — no second equal entry point. **MVP restricts every user to exactly one active Main Quest.** An old structured program does not run in parallel with it; selecting one from Explore *becomes* the user's Main Quest (demoting whatever was active, not deleting it). The 43 templates are preserved but hidden from the primary experience until individually audited and reframed — they are assets, not automatically-approved products.
2. **AI: approved architecture, not yet implemented.** **Netlify Functions** (updated 2026-07-27 — was originally proposed as Supabase Edge Functions; switched to match the exact pattern already proven on the sibling Runner app, and because Conqur's repo already has a `netlify/functions/` directory with a `package.json`, just currently dormant — `sync.js`/`auth.js` were superseded by direct Supabase calls, so this reuses existing scaffolding rather than adding a new one) + **OpenAI API** (also updated 2026-07-27 — was originally Anthropic, changed since the user already has existing OpenAI usage/infrastructure), built behind a provider-independent `AIService` interface so the model is swappable infrastructure, never a visible brand element. `gpt-4o-mini` is the default for both onboarding reflection and ordinary "Let's Talk" support; escalate to `gpt-4o`/`o1` only for harder/more nuanced turns, never automatically for emotionally serious topics. **No AI code ships in Phase 1 or 2 — still not started.** Needs a **dedicated `OPENAI_API_KEY` for the Conqur/Habits Netlify site** (not shared with Runner's key) — same as Runner's setup, not done yet, see Section 9.
3. **Starter library: seven areas, curated not converted.** Doomscrolling, overworking, procrastination, connection/loneliness, morning routine/caffeine, intentional eating, drinking less. Eating and alcohol carry extra requirements: neutral language, no food morality, no calorie framing, no disordered-eating or dependence-treatment implication, no abrupt-cessation guidance, and explicit escalation copy when a response signals something beyond ordinary habit change. Quality over volume — seven considered Quests beat 43 lightly reframed templates.
4. **Validation checkpoint before expansion.** Build and prove exactly two Quests end-to-end before building the rest of the library: **"Stop Doomscrolling"** (digital habit) and **"Stop Working Through the Evening"** (lifestyle-boundary habit). Neither touches the eating/alcohol categories, which is deliberate — those ship later, after the safety-sensitive copy gets its own dedicated pass, not folded into the first validation slice.
5. **Data model uses named, separated concepts** — Quest, Pattern, Cue, Need, Promise, Default Replacement, Alternatives, Side Missions, Daily Outcome — not "habit/challenge/Quest/Promise" used interchangeably. See Section 3.
6. **Checkpoints are mandatory, not optional.** Stop for review after Phase 1. Stop again after the rebuilt onboarding (Phase 2). AI implementation (Phase 3) does not start until the non-AI Quest experience works end-to-end and has been reviewed.

---

## 3. Data model

Named concepts, mapped onto what already exists in `app.js` so this is additive, not a rewrite:

| Concept | Definition | Maps onto |
|---|---|---|
| **Quest** | The overall transformation journey (e.g. "Sarah's Quest: Stop Doomscrolling"). | Existing `challenge` object, extended with `isMainQuest`, `pattern`, `cue`, `need`. |
| **Pattern** | The automatic behavior being changed. | New: `quest.pattern = { description, category }` — `category` is one of the seven starter areas + `"custom"`. |
| **Cue** | When/where the pattern happens. | New: `quest.cue = { trigger, timeOfDay }` — extends the onboarding cue-capture that already exists (`renderObCue`). |
| **Need** | What the old behavior may be providing (optional, reflective, not required to start). | New: `quest.need` — free text or short tag; filled at onboarding or later via reflection/Let's Talk, never presented as diagnosis. |
| **Promise** | What the user commits to practicing daily. | Existing `challenge.habits[0]` (the single primary habit) — reuses `title`/`type`/`points` as-is. |
| **Default Replacement** | The recommended intentional action. | New: `promise.defaultReplacement` (string). |
| **Alternatives** | Up to two backups. | New: `promise.alternatives[]` (max 2, `{label, prompt}`). |
| **Side Missions** | Optional, small supporting actions. | Existing `challenge.habits[1..]`, flagged `isSideMission: true`, capped at 2-3, excluded from the core Promise/streak framing. |
| **Daily Outcome** | Done / Not today / support requested. | Extends existing `challenge.days[dateKey]` — adds `notToday: boolean` and `supportRequested: boolean` alongside the existing `done[]` array (marking the Promise "Done" still just pushes its habit id into `done[]`, so all existing streak/Rhythm/badge logic keeps working unchanged). |

This keeps every existing engine function (`calcChallengeStreak`, `calcWeeklySuccessStreak`, the badge system, the Stage system, the weekly-grace logic) working exactly as-is — Quest, Pattern, Cue, Need, Promise, Default Replacement, and Alternatives are all *new fields*, not replacements of what streak/badge code already reads.

---

## 4. Phase 1 — Product foundation (detailed, for approval)

**Goal:** ship the two validation Quests (Doomscrolling, Working Through the Evening) end-to-end, non-AI, with "one Main Quest" actually enforced.

### Scope
- New Quest data shape (Section 3) layered onto `challenge`/`habit`, via `normalizeChallenge()`/`normalizeDay()` extensions with safe defaults (no migration needed — old test data just gets `isMainQuest: false`, `pattern: null`, etc. by default).
- Two curated Quest definitions (Doomscrolling, Working Through the Evening) hand-written with real `cue`/`defaultReplacement`/`alternatives` content — not generated, not pulled from the 43 templates.
- New Main Quest home screen: Quest name + subtitle, today's cue, default replacement, up to 2 alternative buttons, three actions (Done / Not today / Let's Talk).
- "Let's Talk" in Phase 1 is **non-AI and fully functional**, not a disabled placeholder: a rules-based options sheet (Section 15's own list works without AI) — *make today's step smaller*, *choose another replacement*, *move it to another time*, *keep the plan*, *pause the Quest* — each one actually mutates the Quest (swaps `defaultReplacement` for an alternative, sets `status: "paused"`, etc.).
- "One Main Quest" enforcement: starting a new Main Quest sets the previous one's `isMainQuest: false` and `status: "paused"` (data fully retained, not deleted), with clear non-punitive copy explaining the swap.
- Explore entry point exists but is deliberately thin in Phase 1 — just the two curated Quests, not the 43-template library (that audit is Phase 5 work).

### Affected files
- **`app.js`**
  - `normalizeChallenge()` / `normalizeDay()` — add the new fields with safe defaults.
  - New: `createQuest()`, `promoteToMainQuest()`, `demoteMainQuest()` (built on existing `createChallenge()`).
  - New render functions: `renderMainQuestHome()` (new primary home view), `renderQuestPromiseCard()`, `renderLetsTalkSheet()` (non-AI options menu).
  - New handlers: `[data-quest-done]`, `[data-quest-not-today]`, `[data-quest-lets-talk]`, `[data-quest-adjust-*]`.
  - Two new curated-content constants (the Doomscrolling and Evening-Work Quest definitions).
  - Nav/routing: the bottom-nav home tab points at `renderMainQuestHome()` when a Main Quest exists.
  - Existing `renderThisWeek()`/`renderToday()`/`renderTodayAll()` and the multi-challenge pill UI are **left untouched, not deleted** — they become the Explore/secondary path per Section 2's decision, dormant until a later phase reconnects them.
- **`style.css`** — new styles for the Main Quest card and Let's Talk sheet, reusing the flat hairline-row and `wrc-reflect`-chip patterns already built this session rather than inventing new visual language.
- **No `index.html` changes** in Phase 1 (no AI SDK yet).

### Risks
1. **Divergent code paths.** Retrofitting new fields onto `challenge` risks the untouched multi-challenge rendering paths (`getActiveChallenges()`, `renderChallengePills()`, `renderTodayAll()`'s >1-challenge case) drifting out of sync with the new single-Quest paths since both now read the same underlying data shape. Mitigation: Phase 1 changes are additive only — no edits to the existing multi-challenge render functions, just new functions that read the same `challenge` records through the new lens.
2. **Demotion feeling like data loss.** Swapping Main Quests needs carefully tested copy ("Starting a new Main Quest will pause X — your progress is saved and you can return to it anytime") — this is exactly the kind of moment the doc is most protective of; needs real scrutiny before shipping, not just a confirm dialog.
3. **Scope creep into Phase 2.** It will be tempting to build the real onboarding assessment now. Phase 1 explicitly ships with a two-item picker, not the full readiness assessment — that discipline is what makes the Phase 1 checkpoint meaningful.
4. **Regression risk.** The Stage/Rhythm/Milestone/flat-visual work finished earlier this session must keep working unchanged for the (now-secondary) structured-program path.

### Acceptance tests
1. A fresh user with no active Quest sees a two-item picker (Doomscrolling / Working Through the Evening) — not the 43-template library.
2. Selecting one creates a Quest with `isMainQuest: true` and correctly populated `pattern`/`cue`/`promise.defaultReplacement`/`alternatives`.
3. Home screen shows Quest name, subtitle, today's cue, default replacement, up to 2 alternatives, and the three actions.
4. Choosing an alternative before "Done" logs it correctly and still counts as the Promise kept — streak/Rhythm/badges all function via the reused engine.
5. "Not today" sets `notToday: true`, shows non-punitive copy, does not break the weekly-grace Rhythm logic, does not demand a reason.
6. "Let's Talk" opens the rules-based menu and every option visibly changes something (no dead-end placeholder).
7. Returning after a missed day shows the existing comeback-banner language, not a failure state.
8. Starting a second Main Quest correctly demotes the first (`isMainQuest: false`, `status: "paused"`, data intact) and the new one becomes the sole home-screen focus.
9. The demoted Quest's history (days logged, streak) is fully inspectable afterward — proving no data loss.
10. This session's Stage/Progress/Rhythm/Milestone vocabulary and flat visual system render correctly on the new Main Quest home screen, reused rather than duplicated.

---

## 5. Phases 2–5 (adjusted per approved decisions)

### Phase 2 — Onboarding rebuild
*Checkpoint required before this starts.*
- Replace the 4-question flow with the ~3-minute structured assessment (readiness, capacity, cost, prior blockers).
- Rules-based "reflect understanding back, user confirms" step (Section 12) — no AI needed yet, templated from structured answers.
- Readiness-based Quest selection (Section 11) against the seven-area starter library — but the library itself is still just the two validated Quests plus placeholders until Phase 5 fleshes out the rest.

### Phase 3 — AI support layer
*Does not start until Phase 1 + Phase 2 are reviewed and working end-to-end (done) — still needs its own explicit go-ahead.*
- Build the `AIService` interface first — model-agnostic, so no specific vendor name ever appears in the product surface, only "Conqur."
- **Backend updated 2026-07-27: Netlify Functions, not Supabase Edge Functions** — matches the exact pattern already shipped and proven on the sibling Runner app (`netlify/functions/why-workout.js`, `weekly-recap.js`, `reschedule-workout.js`, `coach.js`, calling OpenAI `gpt-4o-mini`, `OPENAI_API_KEY` as a Netlify env var). Conqur's repo already has `netlify/functions/` with a `package.json` (currently just `@netlify/blobs`, plus dormant `sync.js`/`auth.js` from before Supabase replaced them) — new AI functions get added there directly, no new hosting concept.
- **Provider: OpenAI API, not Anthropic** — the user already has existing OpenAI usage/infrastructure elsewhere. `gpt-4o-mini` as default for onboarding interpretation and ordinary Let's Talk turns, escalate to `gpt-4o` (or `o1`/`o3-mini` for real reasoning depth) on the same trigger conditions already agreed: user explicitly requests "go deeper," a structured low-confidence result from the default model, several competing issues the default model can't summarize coherently, or two consecutive responses marked unhelpful. **Never** automatic escalation just because a topic is emotionally serious.
- Hard-coded keyword/pattern safety pre-filter for substance dependence, disordered eating, self-harm, crisis language → routes to professional-support copy independent of model output, provider-agnostic by construction, especially relevant once eating/drinking Quests ship in Phase 5.
- **Needs a dedicated `OPENAI_API_KEY` for the Conqur/Habits Netlify site before any function can be written** — not shared with Runner's key, same reasoning as keeping per-project keys separate (usage/cost tracking, blast radius if one leaks). See Section 9 for the setup steps.

### Phase 4 — Progression depth
- Per-Quest chapters, reusing the existing chapter-milestone pattern keyed per-Quest instead of globally per-level.
- Weekly "Did this Quest help?" reflection, reusing the already-built and already-extended `renderWeeklyRecap` chip pattern.

### Phase 5 — Content & cleanup
- Author the remaining five Quest areas (procrastination, connection, morning/caffeine, intentional eating, drinking less) with the same care as the two validation Quests — eating and drinking get their own dedicated safety-copy pass, not a template swap.
- Audit-and-reframe pass on the 43 existing templates before any reappear in Explore.
- Restructure the template browser into the secondary Explore surface.

---

## 6. Phase 1 — Build report (complete, verified live)

**Files changed:**
- `app.js` — `normalizeDay`/`normalizeHabit`/`normalizeChallenge` extended with the new fields (Section 3); `QUEST_LIBRARY` constant (the two approved Quest definitions); `getMainQuest`/`getMainQuestOwnerLabel`/`createQuest`/`promoteToMainQuest`/`demoteMainQuest` helpers; `renderMainQuestTab`/`renderQuestPicker`/`renderQuestSetup`/`renderMainQuestHome`/`renderQuestReplacementOptions`/`renderLetsTalkSheet`/`renderQuestSwitchConfirm`; ~14 new event handlers; dispatcher and nav rewired (Section 3 below).
- `style.css` — new `.quest-*`/`.lets-talk-*` rules, reusing existing flat/chip/panel patterns.
- `sw.js`, `app-version.json`, `index.html` — version bump to `2026.06.27.29`.
- The old `renderToday()`, `renderChallenges()`, `renderChallengeDetail()`, `renderBuilder()`, and their handlers are **untouched, still defined, not deleted** — confirmed unreachable (see Known Issues for the one caveat).

**Data-model changes:** exactly as specified in Section 3 — all additive, no migration needed. `challenge.isMainQuest`/`pattern`/`cue`/`need`/`questDefId`; `habit.defaultReplacement`/`alternatives`/`isSideMission`; `day.notToday`/`supportRequested`/`replacementUsed`. Verified live: marking a Quest "Done" via an alternative still writes a single `promise` id into `day.done` (not three separate habits) — amendment #2 confirmed working correctly.

**Walkthrough of every new state (all verified live in-browser, screenshots taken during the session):**
1. Fresh user, no Main Quest → two-card picker ("Stop Doomscrolling" / "Stop Working Through the Evening"), no 43-template library visible.
2. Tap a card → setup step (cue-time input, prefilled with the approved default; personalize-replacement field only for the Evening-Work Quest, per `allowPersonalizeReplacement`).
3. "Start This Quest" (no Main Quest active) → creates directly, home screen shows owner label ("Your Quest" — see Known Issues on this), Quest title, Promise statement, home-screen prompt line, default + 2 alternatives, Not today / Let's talk.
4. Tapping an alternative → "Done for today" state showing which replacement was actually used; streak/Progress/badges all fire via the reused engine.
5. "Not today" → "That's okay. Your Quest continues." — no interrogation, replacement options stay available in case the user changes their mind same day.
6. "Let's Talk" → non-AI menu with all five options; each one visibly does something: smaller (logs the minimum-version Promise), choose-another-replacement (closes back to the visible options), move-the-time (inline time input, regenerates the Promise statement text), keep-the-plan (closes), pause (demotes, returns to picker).
7. Starting a second Main Quest while one is active → exact approved switch-confirm copy, "Pause and start the new Quest" demotes the first (data verified fully intact afterward) and promotes the second; "Keep my current Quest" cancels cleanly.
8. Explore tab always shows the two-Quest picker plus any paused Quests (resumable), regardless of whether a Main Quest is currently active — confirmed no template browser or old challenge list reachable from it.
9. Milestones tab — untouched, confirmed still working (badge earned and displayed correctly during testing).

**Acceptance-test results:** all 10 from Section 4 pass, verified live (not just read from code) — including the two riskiest ones: #4 (alternative selection logs one habit, not three) and #8/#9 (Main Quest switch demotes-not-deletes, data fully inspectable afterward).

**Known issues / needs your attention:**
1. **Owner label fallback.** The approved content literally says "Sarah's Quest" for Quest 1, but that's an example name from the doc, not something to ship for real users. Implemented as `${state.settings.name}'s Quest`, falling back to **"Your Quest"** when no name is set (Phase 1 has no onboarding step that collects a name yet, so every current user sees "Your Quest"). Confirm this fallback is right, or tell me where a name should come from in Phase 1.
2. **Weekly-goal recalibration.** The reused weekly-pace engine defaults to a 100-point goal (correct for the old multi-habit model, meaningless for a single 5-point Promise). Recalibrated to `points × 7` per Quest so the pace math and comeback banner stay meaningful — flagging since it's a real behavior change to a system you didn't explicitly ask me to touch, done to prevent the comeback banner from reading as "behind" almost permanently.
3. **Comeback banner suppressed on Quest's first day.** Found live: the reused banner logic compares elapsed-vs-expected pace and can trigger before a brand-new user has had any chance to act. Gated it to not show until the Quest has run at least one full day. Same category of fix as #2 — flagging rather than silently deciding it's fine.
4. **Two real bugs found and fixed during verification, not before:** (a) the Let's Talk sheet's `stopPropagation()` was silently blocking every button inside it, not just backdrop-clicks — none of the five options worked until fixed; (b) the Explore tab never checked for a pending Quest setup, so picking a Quest there dead-ended instead of reaching the setup step. Both confirmed fixed and retested live. Flagging because both would have shipped broken if I'd only read the code instead of clicking through it.
5. **Completion-modal edge case (unlikely, not hit in testing).** Quest challenges are created with `noEndDate: true` specifically to avoid the old "challenge complete" modal (which has a "Browse all challenges" button back into the old builder) ever firing for a Main Quest. This should make it unreachable, but it's a reused code path I didn't rewrite, only sidestepped — worth a second look before real users are on this for months.
6. **No visual/UX polish pass done** — Phase 1 was scoped to function correctly, not to be pixel-perfect. `.more-card` (used in the setup screen) still has the pre-existing glassmorphism effect that the rest of the app's cards dropped earlier this session; left as-is rather than doing an unscoped visual sweep.

## 7. Phase 2 — Onboarding rebuild (complete, verified live)

**Files changed:** `app.js` only — `onboardingAnswers` extended with `pattern`/`obstacle`/`capacity` keys (old `goal`/`intensity`/`time`/`cue` keys left in place, now unused); `OBSTACLE_OPTIONS`/`OBSTACLE_PHRASES`/`buildReflectBack()` added; four new onboarding screens (`renderObPattern`, `renderObObstacle`, `renderObCapacity`, `renderObReflect`) inserted before the old `renderObGoal`/`renderObIntensity`/`renderObTime`/`renderObCue`/`renderObRecommendation` (all preserved, now unreachable); `renderOnboarding()`'s step 2-5 dispatch repointed at the new screens; `renderObExplainer()` (step 1) copy corrected — it was still describing "pick a challenge, a set of daily habits," actively wrong for the new model, found and fixed during this pass, not before; three new handlers (`data-ob-confirm-quest`, `data-ob-see-available`, `data-ob-redo`) added, handing off directly into Phase 1's existing `renderQuestSetup()`/`createQuest()` rather than duplicating that logic. Version bumped to `2026.06.27.30`.

**Data-model changes:** none beyond the two new `onboardingAnswers` keys — no new persisted fields. The assessment answers are transient (used to build the reflect-back message and pick a `QUEST_LIBRARY` id), not stored on the Quest itself once created.

**Walkthrough (verified live):**
1. Hero (step 0, unchanged) → explainer (step 1, copy corrected to describe one Promise instead of "a set of daily habits") → **"What's been feeling most automatic lately?"** (step 2) — three options: the two built Quests phrased as relatable situations, plus an honest "Something else."
2. **"What's made this hard to change before?"** (step 3) — the doc's exact 8-item obstacle list, single-select.
3. **"How much capacity do you have right now?"** (step 4) — low/some/good.
4. **Reflect-back** (step 5) — rules-based, no AI: combines pattern + obstacle + capacity into one warm paragraph ending in "Does this feel right?", e.g. *"It sounds like scrolling automatically at night and losing time, rest, or connection — and motivation fading after the first few days has made it hard to change before. Let's start small: Stop Doomscrolling, and you're ready to really commit. Does this feel right?"* — confirmed reads naturally for multiple obstacle/capacity combinations.
5. "Yes, let's start" → hands off directly into the existing Quest setup screen (cue-time entry) → "Start This Quest" → Quest created, confirmed correct `pattern`/`promise` text end-to-end.
6. "Show me something else" → returns to step 2 (pattern question), not a dead end.
7. Picking "Something else" at step 2 → reflect-back honestly says a Quest isn't built for that pattern yet, offers "See what's ready today" → correctly shows the two-Quest picker (fresh user) or the existing Main Quest home (if one's already active), never a dead end or fake recommendation.

**Acceptance-test results:** full flow (hero → explainer → pattern → obstacle → capacity → reflect → confirm → setup → Quest created) verified end-to-end live for both built Quests, plus both branches of the "something else" fallback (with and without an existing Main Quest). No console errors.

**Known issues / needs your attention:**
1. **Obstacle question is single-select, not multi-select.** The doc's Section 9 lists 8 obstacles without specifying whether more than one can apply — realistically several usually do. Built as single-select (pick the closest one) to reuse the existing `renderObChoice` single-select UI pattern rather than building new multi-select machinery. If you want true multi-select, that's a real UI addition, not a copy change — flagging rather than silently deciding it's fine.
2. **`renderObExplainer()` copy was actively wrong and I fixed it without being asked.** It described the old "pick a challenge, a set of daily habits" model immediately before the new pattern-recognition question — a real inconsistency a new user would have hit first. Fixed to describe the new model. Flagging since it's a change beyond the literal Phase 2 task list.
3. **No name/account capture in this flow.** The old onboarding could route into account creation after starting a challenge (`_skipAccountAfterStart`); the new flow exits straight to the Quest home and doesn't touch that mechanism. Name/account collection still exists (steps 7-8, reachable via Settings), just isn't wired into the new Quest-confirmation moment. Not in Phase 2's stated scope, but worth deciding deliberately rather than by omission.
4. **`onboardingAnswers.goal/intensity/time/cue`** are now dead keys (nothing writes to them from the reachable flow) — left in place rather than removed, matching the "preserve, don't delete" pattern used everywhere else, but flagging so it's a documented decision, not an oversight.

## 8. Remaining open items

1. **Exact escalation trigger for `gpt-4o-mini` → `gpt-4o`** (Phase 3) — needs a concrete rule before implementation, not just "harder requests."
2. ~~Exact copy for the Main Quest demotion moment~~ — done, see the approved switch-confirm copy in Section 2, item 1 and the live Phase 1 build report (Section 6).
3. ~~Curated content for the two validation Quests~~ — done, both Quests built, verified live on the deployed site (Section 6/7 build reports).

## 9. Phase 3 prerequisite — dedicated OpenAI API key (not done yet)

Before any Phase 3 code gets written, Conqur needs its own OpenAI API key, separate from any key used in other projects (Runner has its own `OPENAI_API_KEY` Netlify env var — same pattern here, not shared). This is an account-level action on the user's own OpenAI and Netlify accounts, so it has to happen outside this session:

1. **Create the key**: platform.openai.com → API keys → "Create new secret key" → name it something identifiable, e.g. `conqur-prod` (so it's distinguishable from Runner's and any other project's key in the OpenAI dashboard's usage/billing views).
2. **Add it to Netlify**: the Habits/Conqur site's Netlify dashboard → Site configuration → Environment variables → add `OPENAI_API_KEY` with the new key's value → scope it to the same contexts Runner's key uses (production + deploy previews, typically).
3. **Confirm**: once set, a Netlify Function can read it via `process.env.OPENAI_API_KEY` — matches exactly how Runner's `netlify/functions/*.js` do it.

Once this is done, Phase 3 implementation can actually start (writing the first Netlify Function + the `AIService` interface). Not blocking Phases 1/2, which are already complete and don't touch this.

**Done 2026-07-27** — `conqur`-style key created, `OPENAI_API_KEY` set on the Habits/Conqur Netlify site. See Section 10.

## 10. Phase 3 (first slice) — build report, complete, verified against real OpenAI responses

**Scope of this slice** (not the full Phase 3): a real AI conversation added as a 6th option — "Talk it through" — on the existing Let's Talk sheet, additive to the five working non-AI options, none of which were touched. Deliberately deferred from the full Phase 3 scope: the personality/intensity picker (ships with one default voice), and AI-interpreted onboarding free text (no input field exists for that yet — would need its own slice).

**Files changed:**
- `netlify/functions/quest-talk.js` (new) — the proxy function. Mirrors the safety/validation rigor of Runner's `coach.js` (input sanitization, hard server-side checks) but with one structural difference: a **hard-coded keyword/pattern safety pre-filter runs on every message before any OpenAI call** — a match short-circuits straight to a fixed crisis-resource response (US 988 line) with the model never seeing the message at all. This is stricter than Runner's approach (which relies on the model's own risk-level classification) and was a deliberate, explicit requirement from this project's approved decisions, not copied from Runner.
- `app.js` — `AIService` object (provider-agnostic wrapper — the rest of the app only ever calls `AIService.talk()`, never a vendor name), `_questChatMessages`/`_questChatLoading` state (in-memory only, never persisted or synced, same reasoning as Runner's `coachHistory`), `renderQuestChatSheet()`, ~6 new handlers, Enter-to-send wired into the existing keydown pattern.
- `style.css` — new `.quest-chat-*` rules (message bubbles, thread scroll area, input row), reusing the existing sheet/chip visual language.
- Version bumped to `2026.06.27.32`.

**Data-model changes:** none. Chat state is transient/in-memory, never written to `state`/localStorage/Supabase.

**Verified live, against the real deployed function (not mocks) — could not be tested locally, no Netlify CLI in this environment:**
1. Safety filter: sent explicit crisis language via curl directly to the deployed function — correctly returned the fixed 988-resource response with `safetyRouted:true`, confirmed via response inspection that OpenAI was never called for this path (the filter runs before the fetch to OpenAI in the function's own control flow).
2. Normal conversation via curl: real `gpt-4o-mini` response, correctly grounded in the actual Quest's real `defaultReplacement`/`alternatives` (never invented a new suggestion), asked exactly one clarifying question, matched the intended warm/non-hype voice.
3. Escalation via curl (`escalate:true`): confirmed `model:"gpt-4o"` in the response, appropriately handled a more complex multi-issue message.
4. Full UI walkthrough on the live site with real clicks: created a Quest → Let's Talk → Talk it through → typed and sent a real message → got a real grounded response referencing the Quest's actual cue time (18:30) → "Go deeper" appeared after 2 messages as designed. No console errors at any point.
5. Graceful degradation (verified in the dev preview before deploying, where the function genuinely isn't reachable): a failed/unreachable call shows a friendly in-thread error message, never a crash, never an unhandled rejection in console.

**Known issues / needs your attention:**
1. ~~Safety pattern list is a first pass~~ — **expanded 2026-07-27** (suicide/self-harm/substance/eating-disorder/abuse categories all broadened with more phrasings — e.g. indirect suicidal ideation like "don't want to be here anymore," more self-harm verbs, "addicted"/"relapse," "domestic violence"/"afraid of"). Still calibrated to unambiguous risk language, not generic distress/venting words, so ordinary hard days still get real conversation rather than being redirected. **Still not a clinically reviewed list** — that qualifier doesn't go away just because coverage improved; worth real expert review before wide traffic.
2. ~~No rate limiting or per-user cost cap~~ — **fixed 2026-07-27.** `quest-talk.js` now checks a per-IP daily cap (20 messages/day) via Netlify Blobs (`conqur-ratelimit` store — reuses the same `@netlify/blobs` dependency `sync.js` already uses, no new infra) before doing any work. Over the cap returns a warm, non-punitive message ("thanks for using it so much today, resets tomorrow") rather than an error. Deliberately fails open (allows the request) if Blobs itself is unreachable — this is a cost guardrail, not a security boundary, so an infra hiccup shouldn't block real users. **Not yet live-verified** — needs deployment first (no Netlify CLI in this environment), same limitation noted for the original slice.
3. **`gpt-4o-mini`/`gpt-4o` model strings should be re-verified before relying on them long-term** — same caution already noted in Runner's memory for the identical models; OpenAI's naming/pricing can change.
4. **Conversation history resets on page reload** (by design, matching Runner's `coachHistory` precedent) — if a user closes the app mid-conversation and reopens later, the AI has no memory of the earlier exchange. Acceptable for a "quick check-in" framing; would need real persistence if this becomes a longer-running relationship feature.
5. **The "one default voice" simplification** means the doc's three-personality/three-intensity concept (Calm Coach / Supportive Companion / Practical Assistant × Gentle/Balanced/Firm) isn't implemented yet — current voice reads closest to "Supportive Companion, Balanced." Building the picker is a real follow-up slice, not done here.
6. **Rate limit is IP-based, not per-user** — on shared/NAT'd networks (offices, some mobile carriers), multiple real people could share one IP and hit the cap together. Acceptable tradeoff for a no-accounts-required app; a real per-user limit would need to key off the optional Supabase sign-in instead, only covering signed-in users.
