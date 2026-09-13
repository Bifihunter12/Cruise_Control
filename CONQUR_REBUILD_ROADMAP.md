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
2. ~~No rate limiting or per-user cost cap~~ — **fixed and live-verified 2026-07-27**, after two real bugs found only by actually testing it (not just reading the code): (a) classic `exports.handler` Netlify Functions don't get Blobs auto-configured — `connectLambda(event)` must be called first, every invocation, per Netlify's own docs (`github.com/netlify/blobs#lambda-compatibility-mode`); without it the rate limiter silently failed open on 100% of requests. `sync.js` has the identical latent bug, flagged as a separate follow-up (dormant, never noticed since it's unused). (b) Blobs defaults to *eventual* consistency (up to 60s propagation) — wrong for a rate limiter specifically, since a rapid burst (exactly the abuse pattern this exists to catch) had every request read a stale pre-burst count and never accumulate; fixed with `{ consistency: "strong" }` on this store. **Confirmed live**: a 21-request burst correctly tripped the 20/day cap partway through and stayed blocked for every subsequent request, with the intended warm "resets tomorrow" message.
3. **`gpt-4o-mini`/`gpt-4o` model strings should be re-verified before relying on them long-term** — same caution already noted in Runner's memory for the identical models; OpenAI's naming/pricing can change.
4. **Conversation history resets on page reload** (by design, matching Runner's `coachHistory` precedent) — if a user closes the app mid-conversation and reopens later, the AI has no memory of the earlier exchange. Acceptable for a "quick check-in" framing; would need real persistence if this becomes a longer-running relationship feature.
5. **The "one default voice" simplification** means the doc's three-personality/three-intensity concept (Calm Coach / Supportive Companion / Practical Assistant × Gentle/Balanced/Firm) isn't implemented yet — current voice reads closest to "Supportive Companion, Balanced." Building the picker is a real follow-up slice, not done here.
6. **Rate limit is IP-based, not per-user** — on shared/NAT'd networks (offices, some mobile carriers), multiple real people could share one IP and hit the cap together. Acceptable tradeoff for a no-accounts-required app; a real per-user limit would need to key off the optional Supabase sign-in instead, only covering signed-in users.

## 11. Phase 4 (Progression depth) — build report, complete, verified live

**Scope:** the two pieces of Phase 4 from Section 5 — a weekly "did this help?" check-in and per-Quest narrative milestones — both additive to the existing Main Quest home, no changes to Phase 1–3 behavior.

**P4-1 — Weekly reflection (`renderQuestWeeklyReflect()`, app.js):**
- A lighter sibling of the pre-existing `renderWeeklyRecap()` (used by the legacy/unreachable multi-challenge Today view) — that card's points/goal/delta stats don't fit a single-Promise Quest, so this is a new, simpler function rather than a reuse, but it shares the same `.wrc-*` markup/CSS and the same `[data-reflect]`/`[data-dismiss-weekly-recap]` handlers unchanged (a Quest is a `challenge` object underneath, so those generic handlers work as-is).
- Shows once a full prior week exists, with a "days kept" count and the question "Did this Quest help this week?" — four canned chip answers, stored in `quest.reflections[weekNum]`, same storage shape the original recap already used.
- **Found and fixed a real pre-existing bug while building this**: `normalizeChallenge()` never included `reflections` or `completionReflection` in its returned object, so both fields were silently dropped every time state passed through normalization — on every full page reload, and on every cloud-sync pull merge. Any reflection a user had ever left (going back to the original PR-I weekly-recap work) would vanish the next time the app loaded. Fixed by adding both fields to `normalizeChallenge()`'s return shape; verified live that a reflection now survives a full page reload.

**P4-2 — Per-Quest chapters (`QUEST_CHAPTER_LEVELS`, `showQuestChapterModal()`, app.js):**
- A separate milestone pool from the existing global XP-level chapter system (`CHAPTER_LEVELS`/`showChapterModal()`), which stays untouched — a Quest chapter is keyed to *this Quest's own* cumulative kept-days count (`questKeptDaysCount()`, counts every day the Promise was kept, not the current streak, so a missed day never erases progress toward the next milestone — same no-forced-restart philosophy as the rest of the Quest system), not the app-wide XP level, which wouldn't mean anything specific to a particular replacement journey.
- Thresholds: 3 / 7 / 14 / 30 / 60 / 90 days kept, each with its own title + message (calm, Promise/replacement-focused copy, no "Stage"/"Rank" framing — see the const for exact copy).
- Tracked via a new per-Quest field `quest.lastQuestChapterSeen` (added to `normalizeChallenge()`), mirroring `state.lastChapterSeen`'s pattern but scoped to the Quest instead of global.
- Reuses the existing `.luo-*` overlay CSS (full-screen celebration card) with no new styles needed — same visual language as the global chapter/level-up modals, mutually exclusive with them via a new `_questChapterOverlay` guard so only one full-screen celebration can ever show at once.

**Data-model changes:** `challenge.reflections` and `challenge.completionReflection` now actually persist (bug fix, see above); new additive field `challenge.lastQuestChapterSeen` (number, defaults to 0).

**Verified live (local preview, real clicks unless noted):**
1. Full onboarding → Quest creation → done-for-today flow re-walked end to end on the version-bumped build — zero regressions, matches the Phase 1/2 build reports exactly.
2. Weekly reflect card: seeded a Quest with one full completed week via console (mirrors real usage after 8+ real days), confirmed the card renders with the correct day count and question, clicked a chip, confirmed it switches to the static rotating message, confirmed the answer survives a full page reload (proof the `normalizeChallenge` fix works).
3. Quest chapter modal: seeded a Quest crossing the 3-day and then the 7-day threshold, confirmed the modal fires exactly once per threshold with the correct title/message, confirmed closing it and re-rendering doesn't re-trigger it, confirmed a later threshold fires correctly without re-firing an earlier already-seen one.
4. Let's Talk sheet (all 6 options), Explore tab (both Quests listed), Milestones tab (Stage/badge counts) all re-checked for regressions — none found.
5. No console errors at any point in this pass.

**Version bump note:** `APP_VERSION` had silently stayed at `2026.06.27.32` through the entire vocabulary pivot, Main Quest Phase 1/2/3 work (3 real commits, all client-side `app.js` changes that should have bumped it per the project's own cache-busting convention) — an oversight from earlier in this project, not something Phase 4 introduced. Bumped to `2026.07.27.01` here across `app.js`, `app-version.json`, `sw.js`, and all 5 `?v=` params in `index.html`. Worth double-checking the version actually gets bumped at the end of future sessions that touch `app.js`.

**Known issues / not done:** none new. Phase 5 (remaining 5 Quest-library areas beyond doomscrolling/evening-work, content/cleanup pass) not started.

## 12. Phase 5, slice 1 (5 new Quest definitions) — build report, complete, verified live

**Scope:** the first of Phase 5's three pieces — authoring the 5 remaining Quest areas from Section 5's list (procrastination, connection, morning/caffeine, intentional eating, drinking less), bringing `QUEST_LIBRARY` from 2 to 7 entries. The other two Phase 5 pieces (legacy-template audit, Explore restructure) are separate follow-up slices, not started.

**Files changed:**
- `app.js` — 5 new `QUEST_LIBRARY` entries (`procrastination`, `connection`, `morning-caffeine`, `intentional-eating`, `drinking-less`), each with the same shape as the two existing Quests (`pattern`, `cuePrompt`/`cueDefault`, `promiseTemplate`, `defaultReplacement`, `alternatives`, `homeScreenPrompt`, `allowPersonalizeReplacement`). `renderObPattern()`'s options array extended with 5 matching pattern-selection cards, inserted before the existing "Something else" fallback. `renderQuestSetup()` extended to render an optional `def.safetyNote` line (reuses the existing `.quest-chat-disclaimer` caption style — no new CSS).
- No backend changes — `quest-talk.js`'s AI chat function builds its system-prompt context entirely from whatever `questTitle`/`pattern`/`promise`/`defaultReplacement`/`alternatives` the client sends, so all 5 new Quests are automatically grounded correctly with zero server-side work, confirmed by inspecting the exact context payload live for the "Eat With Intention" Quest.
- Version bumped to `2026.07.27.02`.

**Safety-copy pass (eating/drinking), per this section's explicit callout in Section 5:**
- Both Quests are framed around *noticing an automatic default* (mindless eating, reaching for a drink to unwind) rather than restriction, weight, calories, or sobriety — no numeric targets, no "good/bad" language, consistent with the rest of the app's replace-not-restrict philosophy.
- Added a new optional `def.safetyNote` field (only set on these two Quests), rendered as a small caption on the Quest setup screen before "Start This Quest": redirects to a doctor/real support line if the pattern is "genuinely out of your control" / "hard to control," explicit that Conqur isn't equipped for that — same honest, non-alarmist register as the existing AI chat disclaimer and system prompt.
- The AI chat safety pre-filter (`quest-talk.js`, Section 10) already covers disordered-eating and substance-dependence language generically, regardless of which Quest is active — no changes needed there, confirmed by re-reading its `SAFETY_PATTERNS` list.

**Data-model changes:** none — `QUEST_LIBRARY` is static app.js content, not persisted state.

**Verified live (local preview, real clicks):**
1. All 7 `QUEST_LIBRARY` keys load with no syntax errors; Explore tab lists all 7 with correct title/description text.
2. "Drink With Intention" and "Eat With Intention" setup screens both show their safety-note caption correctly.
3. Started "Drink With Intention" as a fresh Main Quest — Promise text, replacement options, and home screen all render correctly end-to-end.
4. Switched from "Drink With Intention" to "Eat With Intention" via the existing switch-confirm flow — correct pre-approved copy, old Quest paused (not deleted), new Quest became active, confirmed via state inspection.
5. Confirmed the exact context object the AI chat would send for "Eat With Intention" (questTitle/pattern/promise/defaultReplacement/alternatives) matches what `quest-talk.js` expects — didn't need a live OpenAI call to verify this, since it's the same generic path already proven in Phase 3.
6. No console errors at any point.

**Known issues / needs your attention:**
1. **Safety-note copy is not clinically reviewed** — same caveat as the AI chat's safety pattern list (Section 10). Worth a real pass before wide traffic, especially for the eating/drinking Quests specifically.
2. Icon choices for the 5 new pattern-picker cards (`ti-hourglass`, `ti-phone-call`, `ti-coffee`, `ti-salad`, `ti-glass`) are standard Tabler icon names, verified rendering correctly in the browser but not individually cross-checked against Tabler's full icon list — flag if any look wrong.
3. Paused-Quest icon fallback (`renderQuestPicker()`) still only special-cases the original doomscroll emoji (📵) vs. a generic target icon for everything else — the 5 new Quests all show the generic icon when paused. Cosmetic, matches how "evening-work" already behaved before this slice, not a regression.

## 13. Phase 5, slices 2+3 (legacy-template audit + Explore restructure) — build report, complete, verified live

**Scope:** the remaining two pieces of Phase 5 — auditing the 43-ish legacy templates for tone, and making the legacy template library reachable again as a secondary path from Explore. Both done together since the audit needed to happen before deciding what becomes reachable again.

**Audit findings (`TEMPLATES`, app.js):** the array has 98 total entries, but `isConqurTemplate()` (app.js:482) already excludes `deprecated` templates, `category:"expedition"` templates, and everything in `ENDUR_TEMPLATE_IDS` (endurance/expedition content that was forked out to the sibling Endur app) — so the actually-reachable set is 60 templates, not "43" as the roadmap's earlier phase outline guessed before this count was known. Read all 60 live templates' name/description/identity/quip text in full. Finding: the earlier vocabulary-pivot pass (Section 41, PR-F) fixed harsh copy in the *global* app shell but never touched this array — despite that gap, the templates turned out to already be in good shape. Only one real hit against the doc's banned "no excuses"-style language: `75-hard`'s identity line, `"I am someone who doesn't negotiate with excuses."` (app.js:747) → changed to `"I am someone who follows through, especially on the hard days."`. No fantasy-RPG vocabulary was ever present in template copy (that was only ever in the Frostborn theme system, already fixed). No other harsh/shaming language found — the "Zero compromises" phrasing that appears a few times was left as-is, since it's describing the real 75 Hard program's actual rules (factual), not a character judgment about the user, which is the distinction the earlier pivot was actually targeting.

**Explore restructure (`renderQuestPicker()`, app.js):**
- Added a "Looking for something else? Browse all challenges →" link at the bottom of Explore, wired to the existing `data-open-builder` handler — opens the old template browser (`renderBuilderTemplates()`, categories/filters/safety-icons/Custom-challenge option) completely unchanged, since none of that code needed to change, just needed a way in.
- Added a "Your Other Challenges" section above that link, listing the user's own active/paused legacy (non-Quest) challenges via the existing `renderChallengeCard()` — **this was necessary, not optional**: without it, a legacy challenge became permanently unreachable the moment the user navigated away from it, since nothing else in the new Quest-first nav lists non-Quest challenges.
- **Found and fixed a real dead-end bug while wiring this up**: `startChallenge()` (app.js, the function that finalizes legacy-template creation) set `activeTab = "today"` after creating a challenge — a holdover from before the Main Quest rebuild, when the "today" tab showed whatever challenge you'd just started. Post-rebuild, `activeTab === "today"` renders the Main Quest tab, which has no idea about the new legacy challenge — so completing the "start a legacy challenge" flow silently created the challenge and then stranded the user back on the Quest picker with no visible way to reach what they'd just made. Fixed by setting `viewChallengeId = c.id` (which the render dispatcher already prioritizes over `activeTab`) and `activeTab = "challenges"` (so backing out of the detail view lands on Explore, not the Quest tab) — confirmed this was the *only* place this bug could occur, since Main Quest creation (`createQuest()`) is entirely separate code that was never affected.
- Confirmed via live testing that Main Quest creation and legacy-challenge creation coexist cleanly: starting a Main Quest while a legacy challenge is active triggers no unwanted prompts (that logic — "you already have X running, continue anyway?" — is scoped to `startChallenge()` only, by design, and still fires correctly if you try to start a *second* legacy challenge).

**Data-model changes:** none.

**Verified live (local preview, real clicks):**
1. Explore tab shows the new "Browse all challenges" link; clicking it opens the full template browser with categories, filters, and safety icons intact.
2. Selected "75 Hard-Style" end to end — quickstart screen showed the corrected identity-adjacent copy and the real health-safety warning (`TEMPLATE_SAFETY["75-hard"]`), safety-confirmation modal fired correctly, challenge created successfully.
3. Confirmed the dead-end fix: landed directly on the new challenge's detail view (`renderChallengeDetail`) immediately after creation, showing real stats (Rhythm, Total Progress, Active days, Milestones) — not stranded on the Quest picker.
4. Backed out of the detail view → landed on Explore (not the Quest tab) → confirmed "Your Other Challenges" now lists "75 Hard-Style" → clicked it → reopened the same detail view correctly.
5. Started a Main Quest ("Stop Doomscrolling") while the legacy challenge was still active — no unwanted multi-challenge warning, both coexist correctly, "Quest" tab correctly showed the Main Quest home and Explore correctly kept listing both.
6. No console errors at any point.

**Known issues / needs your attention:**
1. **Terminology overlap, not resolved here**: the legacy template browser's header still reads "Choose Quest" (via `term('challenge')`, unchanged from the earlier vocabulary pivot, which renamed "Challenge" → "Quest" globally). Now that "Quest" also means something more specific (the Main Quest system), a user browsing the secondary template library sees the same word used two different ways in the same app. Didn't rename it unilaterally since it's a real product/wording decision, not a bug — flagging for your call.
2. **Eating/drinking-adjacent legacy templates don't have the new safety-note treatment**: `mindful-eating`, `dry-month`, `dry-reset-14`, the `no-sugar`/`sugar-reset-*` family, `weight-loss-30`, and `body-composition` cover similar ground to the new `intentional-eating`/`drinking-less` Quests (Section 12) but weren't given the same `safetyNote` caption, since that field only exists on `QUEST_LIBRARY` entries, not `TEMPLATES`. Worth deciding whether to extend the same pattern to these templates now that they're reachable again.
3. Audit was a tone/language read-through, not a clinical or legal review — same standing caveat as the AI safety filter and the new Quests' safety notes.

## 14. Phase 5 follow-ups (both flagged items resolved) — build report, complete, verified live

**Scope:** the two "flagged for your call" items from Section 13, both actioned.

**1. Terminology disambiguation:** rather than touch the shared `term('challenge')` helper everywhere (40+ call sites across the whole app, including onboarding/settings copy that has nothing to do with this specific confusion), scoped the fix to the screens a user actually reaches through the new legacy-challenge path: the builder flow (`renderBuilder`, `renderBuilderTemplates`, `renderBuilderCustomize`, `renderBuilderQuickstart`), the challenge detail/edit screens and their toasts (pause/resume/abandon/delete/update), the safety-confirmation modal, and the completion/share modals. All of these now say "Challenge"/"Challenges" as literal text instead of `term('challenge')`. Left every other `term('challenge')` call site alone — onboarding hero copy, the account-deletion warning, the "How Conqur Works" settings explainer, and a handful of functions confirmed still unreachable from any nav path (`renderToday`, `renderTodayAll`, `renderModeSelector`, `renderChallenges`) — since rewriting those would be re-opening the original vocabulary-pivot decision, not fixing the specific overlap that was flagged. The builder header — the exact screen a user lands on right after clicking "Browse all challenges" from Explore — now reads "Choose a Challenge" instead of "Choose Quest".

**2. Safety notes for eating/drinking/weight-adjacent legacy templates:** rather than invent a new mechanism, extended the existing `TEMPLATE_SAFETY` object (already wired into the safety icon on template rows, the quickstart warning banner, and the hard-confirm modal — all for free, zero new UI code) with entries for the 8 templates flagged: `mindful-eating`, `dry-month`, `dry-reset-14`, `no-sugar`, `sugar-reset-7`, `sugar-reset-strict`, `weight-loss-30`, `body-composition`. Copy follows the same terse, factual register as the existing entries (mostly written for physical/injury risk) but adapted for these specific concerns — disordered eating for the food-rule templates, alcohol dependence for the two dry-alcohol templates, body-image/tracking-compulsion for the two tracking-heavy ones. `TEMPLATE_SAFETY` went from 13 to 21 entries.

**Data-model changes:** none.

**Verified live:** confirmed the builder header reads "Choose a Challenge"; confirmed all 8 newly-flagged templates show the safety icon in the template list; walked "Mindful Eating" through the full flow (quickstart screen showing the new safety note → hard-confirm modal showing the same note plus "By starting this Challenge..." → challenge created → landed on its detail view showing Edit/Pause/Abandon). No console errors.

**Known issues:** none new. Both items from Section 13 are now closed.
