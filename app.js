"use strict";

const STORAGE_KEY = "cruise_mode_v1";
const START_DATE = "2026-06-01";
const END_DATE = "2026-08-25";
const TOTAL_DAYS = 86;
const RING_CIRC = 2 * Math.PI * 90;
const WEEKLY_GOAL = 175; // pts — requires standard days + 2 runs. minimum-only week = 133 pts.

const habits = [
  // ── Minimum Day — always, no exceptions ──────────────────────────────────
  { id: "yoga",      title: "Morning yoga",              emoji: "🧘", quip: "Sets the tone for everything after.",           minimum_day: true,  points: 2 },
  { id: "gratitude", title: "Gratitude",                 emoji: "🙏", quip: "Three things. Two minutes. Changes everything.", minimum_day: true,  points: 2 },
  { id: "weighin",   title: "Daily weigh-in",            emoji: "⚖️", quip: "Data beats guessing every time.",               minimum_day: true,  points: 2 },
  { id: "steps",     title: "Steps",                     emoji: "👟", quip: "10k min · 12k standard · 15k boss.",            minimum_day: true,  points: 2 },
  { id: "protein",   title: "Protein at every meal",     emoji: "🥩", quip: "Protein keeps the muscle, drops the fat.",      minimum_day: true,  points: 2 },
  { id: "water",     title: "Drink 3L water",            emoji: "💧", quip: "Most hunger is just thirst.",                   minimum_day: true,  points: 2 },
  { id: "noalcohol", title: "No alcohol or liquid cals", emoji: "🚫", quip: "Empty calories in every form. Skip them.",      minimum_day: true,  points: 2 },
  { id: "nolate",    title: "Stop eating at 8pm",        emoji: "⏰", quip: "Kitchen closes at 8.",                          minimum_day: true,  points: 2 },
  // ── Standard Day — full protocol ─────────────────────────────────────────
  { id: "sleep",     title: "7+ hours sleep",        emoji: "🌙", quip: "Sleep is the real supplement.",            minimum_day: false, points: 2 },
  { id: "mobility",  title: "Functional mobility",   emoji: "🦵", quip: "Recovery is training too.",                minimum_day: false, points: 2 },
  { id: "read",      title: "Read 10 pages",         emoji: "📖", quip: "10 pages a day is a book a month.",        minimum_day: false, points: 2 },
  // ── Boss Day exclusive ────────────────────────────────────────────────────
  { id: "run",       title: "Run session",           emoji: "🏃", quip: "Boss Day fuel. Go further.",               minimum_day: false, boss_only: true, points: 2 }
];


const microActions = [
  "Drink a full glass of water right now",
  "Take a 10-minute walk — even around the block",
  "Eat something with protein before the kitchen closes",
  "Put the snacks away and brush your teeth",
  "Log what you ate today, even if it wasn't perfect",
  "Do 5 minutes of stretching before bed",
  "Set a wake-up time and put the phone down",
  "One bad meal doesn't break the streak — water and sleep will"
];

const badges = [
  // ── Streaks ────────────────────────────────────────────────────────────────
  { id: "first-wave",       label: "🌊 First Wave",         test: (c) => c.dayNumber === 1 && c.complete },
  { id: "getting-started",  label: "✨ Getting Started",    test: (c) => c.streak >= 3 },
  { id: "work-week",        label: "📅 Work Week",          test: (c) => c.streak >= 5 },
  { id: "on-fire",          label: "🔥 On Fire",            test: (c) => c.streak >= 7 },
  { id: "iron-week",        label: "🦾 Iron Week",          test: (c) => c.streak >= 14 },
  { id: "three-weeks",      label: "🧠 Habit Locked",       test: (c) => c.streak >= 21 },
  { id: "locked-in",        label: "💪 Locked In",          test: (c) => c.streak >= 30 },
  { id: "45-days",          label: "⚡ 45 Days Strong",     test: (c) => c.streak >= 45 },
  { id: "two-months",       label: "📆 Two Months",         test: (c) => c.streak >= 60 },
  { id: "perfect-week",     label: "🌟 Perfect Week",       test: (c) => c.loggedLast7 >= 7 },
  { id: "75-soft",          label: "🏆 75 Soft",            test: (c) => c.streak >= 75 },
  { id: "halfway-mark",     label: "🌊 Halfway",            test: (c) => c.dayNumber >= 43 && c.complete },
  { id: "cruise-ready",     label: "🚢 Cruise Ready",       test: (c) => c.dayNumber === 86 && c.complete },
  // ── Boss ──────────────────────────────────────────────────────────────────
  { id: "boss-energy",      label: "👑 Boss Energy",        test: (c) => c.anyBoss },
  { id: "boss-week",        label: "👑 Boss Week",          test: (c) => c.bossWeek },
  { id: "boss-machine",     label: "🦾 Boss Machine",       test: (c) => c.bossCompleteDays >= 10 },
  { id: "boss-month",       label: "🔱 Boss Month",         test: (c) => c.bossCompleteDays >= 20 },
  // ── Points ────────────────────────────────────────────────────────────────
  { id: "first-points",     label: "⭐ First Points",       test: (c) => c.totalPts >= 10 },
  { id: "century",          label: "💯 Century",            test: (c) => c.totalPts >= 100 },
  { id: "point-collector",  label: "🏅 Point Collector",    test: (c) => c.totalPts >= 250 },
  { id: "high-scorer",      label: "🏆 High Scorer",        test: (c) => c.totalPts >= 500 },
  { id: "elite",            label: "💜 Elite",              test: (c) => c.totalPts >= 750 },
  { id: "unstoppable",      label: "🚀 Unstoppable",        test: (c) => c.totalPts >= 1000 },
  { id: "legend",           label: "🌌 Legend",             test: (c) => c.totalPts >= 1500 },
  // ── Running ───────────────────────────────────────────────────────────────
  { id: "first-run",         label: "👟 First Run",         test: (c) => c.runsLogged >= 1 },
  { id: "five-runs",         label: "🏃 Five Runs",         test: (c) => c.runsLogged >= 5 },
  { id: "run-week",          label: "🗓 Run Week",          test: (c) => c.runsLogged >= 7 },
  { id: "ten-runs",          label: "🔟 Ten Runs",          test: (c) => c.runsLogged >= 10 },
  { id: "fifteen-runs",      label: "🏃 15 Runs",           test: (c) => c.runsLogged >= 15 },
  { id: "twenty-runs",       label: "🏃 Twenty Runs",       test: (c) => c.runsLogged >= 20 },
  { id: "twenty-five-runs",  label: "💪 25 Runs",           test: (c) => c.runsLogged >= 25 },
  { id: "thirty-runs",       label: "🔥 30 Runs",           test: (c) => c.runsLogged >= 30 },
  { id: "run-streak",        label: "⚡ Boss Runner",        test: (c) => c.runsLogged >= 3 },
  { id: "run-streak-5",      label: "⚡ Regular Runner",     test: (c) => c.runsLogged >= 8 },
  { id: "run-streak-7",      label: "🌟 Dedicated Runner",   test: (c) => c.runsLogged >= 12 },
  { id: "distance-builder",  label: "📏 Distance Builder",  test: (c) => c.hasRun3k },
  { id: "speed-merchant",    label: "⚡ Speed Merchant",    test: (c) => c.run3kPlus >= 5 },
  { id: "ten-long-runs",     label: "💪 10 Long Runs",      test: (c) => c.run3kPlus >= 10 },
  { id: "twenty-long-runs",  label: "🚀 20 Long Runs",      test: (c) => c.run3kPlus >= 20 },
  { id: "5k-done",           label: "🏅 5k Done",           test: (c) => c.hasRun5k },
  { id: "5k-hat-trick",      label: "🎯 5k Hat Trick",      test: (c) => c.runsAt5k >= 3 },
  { id: "5k-specialist",     label: "🏅 5k Specialist",     test: (c) => c.runsAt5k >= 5 },
  { id: "beyond-5k",         label: "🔥 Beyond 5k",        test: (c) => c.hasRun5kPlus },
  { id: "beyond-repeat",     label: "🔥 Beyond Again",      test: (c) => c.runsAt5kPlus >= 3 },
  // ── Weight ────────────────────────────────────────────────────────────────
  { id: "on-the-scale",      label: "⚖️ On The Scale",     test: (c) => c.totalWeighIns >= 1 },
  { id: "first-pound",       label: "📉 First Pound",       test: (c) => c.weightLost >= 1 },
  { id: "2lbs-down",         label: "📉 2 lbs Down",        test: (c) => c.weightLost >= 2 },
  { id: "3lbs-down",         label: "📉 3 lbs Down",        test: (c) => c.weightLost >= 3 },
  { id: "5lbs-down",         label: "📉 5 lbs Down",        test: (c) => c.weightLost >= 5 },
  { id: "7lbs-down",         label: "💪 7 lbs Down",        test: (c) => c.weightLost >= 7 },
  { id: "halfway-weight",    label: "⚖️ Halfway to Goal",   test: (c) => c.weightLost >= 10 },
  { id: "12lbs-down",        label: "🔥 12 lbs Down",       test: (c) => c.weightLost >= 12 },
  { id: "15lbs-down",        label: "🔥 15 lbs Down",       test: (c) => c.weightLost >= 15 },
  { id: "17lbs-down",        label: "⚡ 17 lbs Down",       test: (c) => c.weightLost >= 17 },
  { id: "goal-reached",      label: "🎯 Goal Reached",      test: (c) => c.weightLost >= 20 },
  { id: "downward-trend",    label: "📈 Downward Trend",    test: (c) => c.downwardTrend >= 5 },
  { id: "data-driven",       label: "📊 Data Driven",       test: (c) => c.weighInStreak >= 7 },
  { id: "twoweek-logger",    label: "🔬 Two Week Logger",   test: (c) => c.weighInStreak >= 14 },
  { id: "month-logger",      label: "📆 Month of Data",     test: (c) => c.weighInStreak >= 30 },
  { id: "logged-in",         label: "🗒 20 Check-Ins",      test: (c) => c.totalWeighIns >= 20 },
  { id: "30-weighins",       label: "📋 30 Check-Ins",      test: (c) => c.totalWeighIns >= 30 },
  { id: "60-weighins",       label: "📊 60 Check-Ins",      test: (c) => c.totalWeighIns >= 60 },
  { id: "perfect-logger",    label: "🏆 Perfect Logger",    test: (c) => c.totalWeighIns >= 86 },
  // ── Habits ────────────────────────────────────────────────────────────────
  { id: "sober-week",       label: "🚫 Sober Week",         test: (c) => c.soberStreak >= 7 },
  { id: "sober-month",      label: "💎 Sober Month",        test: (c) => c.soberStreak >= 30 },
  { id: "morning-ritual",   label: "🧘 Morning Ritual",     test: (c) => c.yogaStreak >= 14 },
  { id: "devoted-yogi",     label: "🌸 Devoted Yogi",       test: (c) => c.totalYoga >= 30 },
  { id: "bookworm",         label: "📚 Bookworm",           test: (c) => c.readStreak >= 7 },
  { id: "deep-reader",      label: "📖 Deep Reader",        test: (c) => c.totalRead >= 30 },
  { id: "sleep-champion",   label: "😴 Sleep Champion",     test: (c) => c.sleepStreak >= 7 },
  { id: "hydration-nation", label: "💧 Hydration Nation",   test: (c) => c.waterStreak >= 14 },
  { id: "grateful-week",   label: "🙏 Grateful Week",      test: (c) => c.gratitudeStreak >= 7 },
  { id: "grateful-month",  label: "🌸 Grateful Month",     test: (c) => c.gratitudeStreak >= 30 },
  // ── Resilience ────────────────────────────────────────────────────────────
  { id: "comeback-kid",     label: "🧡 Comeback Kid",       test: (c) => c.anyRecovered },
  { id: "minimum-warrior",  label: "⚡ Minimum Warrior",    test: (c) => c.minimumCompleted >= 5 },
  { id: "iron-minimum",     label: "🛡 Iron Minimum",       test: (c) => c.minimumCompleted >= 10 },
  // ── Weekly & Monthly ──────────────────────────────────────────────────────
  { id: "week-1-done",      label: "📅 Week 1 Done",        test: (c) => c.completedWeeks >= 1 },
  { id: "week-3-done",      label: "📅 3 Weeks Done",       test: (c) => c.completedWeeks >= 3 },
  { id: "week-5-done",      label: "📆 5 Weeks Done",       test: (c) => c.completedWeeks >= 5 },
  { id: "week-8-done",      label: "📆 8 Weeks Done",       test: (c) => c.completedWeeks >= 8 },
  { id: "week-10-done",     label: "🔟 10 Weeks Done",      test: (c) => c.completedWeeks >= 10 },
  { id: "all-weeks",        label: "🏆 All 12 Weeks",       test: (c) => c.completedWeeks >= 12 },
  { id: "weekly-mvp",       label: "⭐ Weekly MVP",          test: (c) => c.bestWeekPts >= 200 },
  { id: "weekly-legend",    label: "🌟 Weekly Legend",      test: (c) => c.bestWeekPts >= 350 },
  { id: "june-complete",    label: "☀️ June Complete",      test: (c) => c.juneComplete },
  { id: "july-complete",    label: "🌙 July Complete",      test: (c) => c.julyComplete },
  { id: "august-done",      label: "🚢 August Done",        test: (c) => c.augustComplete },
];

const milestoneMessages = {
   1: "The mission begins.",
   3: "3 days in. Habits are forming.",
   5: "5 days. The streak is real.",
   7: "One week. You actually showed up.",
  10: "Double digits. This is happening.",
  14: "Two weeks. Your body is already changing.",
  18: "18 days. More than most people last.",
  21: "3 weeks. This is becoming who you are.",
  25: "25 days. A quarter of the way there.",
  28: "4 weeks of work in the bank.",
  30: "30 days. This is who you are now.",
  35: "35 days. Halfway to halfway.",
  40: "40 days strong. The momentum is real.",
  43: "Halfway. 43 down, 43 to go.",
  50: "50 days. The cruise is getting close.",
  54: "54 days. You've run further than you thought possible.",
  60: "60 days. Two thirds done.",
  63: "9 weeks in. The 5k is within reach.",
  67: "67 days. The finish line is visible.",
  70: "70 days. The final push begins now.",
  75: "75 days. You completed the 75 Soft. Keep going.",
  79: "One week left. This is not the time to ease up.",
  82: "82 days. Almost there. Don't stop.",
  83: "Final stretch. Pack your bags.",
  85: "Tomorrow is the last day. Make it count.",
  86: "August 25. CRUISE MODE ACTIVATED. 🚢",
};

let state = loadState();
let activeTab = "today";
let activeChartTab = "weight";
let sheetOpen = false;
let selectedMicroActions = pickRandom(microActions, 3);

// ── State ─────────────────────────────────────────────────────────────────

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try { return normalizeState(JSON.parse(stored)); }
    catch (e) {
      console.warn("State parse failed — backing up corrupt data.", e);
      localStorage.setItem(STORAGE_KEY + "_backup_" + Date.now(), stored);
    }
  }
  return normalizeState({});
}

function normalizeDay(raw) {
  if (!raw || typeof raw !== "object") raw = {};
  return {
    mode:       ["minimum","standard","boss"].includes(raw.mode) ? raw.mode : "standard",
    done:       Array.isArray(raw.done) ? raw.done : [],
    recovered:  raw.recovered === true,
    pts:        typeof raw.pts === "number" ? raw.pts : 0,
    runKm:      raw.runKm      ?? null,
    stepsCount: raw.stepsCount ?? null,
  };
}

function normalizeState(raw) {
  if (!raw || typeof raw !== "object") raw = {};
  const rawDays = (raw.days && typeof raw.days === "object") ? raw.days : {};
  const days = {};
  for (const [k, v] of Object.entries(rawDays)) days[k] = normalizeDay(v);
  return {
    settings: {
      startDate:   raw.settings?.startDate   || START_DATE,
      endDate:     raw.settings?.endDate     || END_DATE,
      startWeight: raw.settings?.startWeight ?? null,
      goalWeight:  raw.settings?.goalWeight  ?? null,
    },
    days,
    weighIns: Array.isArray(raw.weighIns) ? raw.weighIns : [],
    totalPts: typeof raw.totalPts === "number" ? raw.totalPts : 0,
    badges:   Array.isArray(raw.badges)   ? raw.badges   : [],
  };
}

function saveState() {
  state.totalPts = Object.values(state.days).reduce((s, d) => s + (d.pts || 0), 0);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayKey() { return toKey(new Date()); }

function toKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

function parseDate(key) {
  const [y,m,d] = key.split("-").map(Number);
  return new Date(y, m-1, d);
}

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

function diffDays(fromKey, toKeyVal) {
  return Math.round((parseDate(toKeyVal) - parseDate(fromKey)) / 86400000);
}

function getDay(key = todayKey()) {
  if (!state.days[key]) {
    state.days[key] = { mode: "standard", done: [], recovered: false, pts: 0, runKm: null, stepsCount: null };
    saveState();
  }
  return state.days[key];
}

function activeHabits(day = getDay()) {
  if (day.mode === "minimum")  return habits.filter(h => h.minimum_day);
  if (day.mode === "standard") return habits.filter(h => !h.boss_only);
  return habits; // boss — all habits unlocked
}

function runPoints(km) {
  if (!km)         return 0;
  if (km === "5+") return 7;
  if (km >= 5)     return 5;
  if (km >= 3)     return 3;
  return 2; // 1 km
}

function stepsPoints(count) {
  if (!count)    return 0;
  if (count >= 15) return 4;
  if (count >= 12) return 3;
  return 2; // 10k
}

function completionInfo(day = getDay()) {
  const active = activeHabits(day);
  const done = day.done.filter(id => active.some(h => h.id === id)).length;
  const total = active.length;
  const multiplier      = day.mode === "boss" ? 1.5 : 1;
  const completionBonus = (done === total && total > 0) ? 3 : 0;
  const basePoints = active.reduce((s, h) => {
    if (!day.done.includes(h.id)) return s;
    if (h.id === "run")   return s + runPoints(day.runKm);
    if (h.id === "steps") return s + (day.stepsCount ? stepsPoints(day.stepsCount) : h.points);
    return s + h.points;
  }, 0);
  const baseMax   = active.reduce((s, h) => {
    if (h.id === "run")   return s + 7;
    if (h.id === "steps") return s + 4;
    return s + h.points;
  }, 0);
  const points    = Math.round((basePoints + completionBonus) * multiplier);
  const maxPoints = Math.round((baseMax + 3) * multiplier);
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0, points, maxPoints, multiplier, completionBonus };
}

function updatePoints(day) {
  const info = completionInfo(day);
  day.pts = info.points;
}

// ── Render ─────────────────────────────────────────────────────────────────

function render() {
  const app = document.getElementById("app");
  app.innerHTML = `
    ${renderTopbar()}
    ${activeTab === "today" ? renderToday() : ""}
    ${activeTab === "week"  ? renderWeek()  : ""}
    ${activeTab === "stats" ? renderStats() : ""}
    ${activeTab === "more"  ? renderMore()  : ""}
    ${renderSaveDayButton()}
    ${sheetOpen ? renderSaveDaySheet() : ""}
    ${renderNav()}
  `;
  bindEvents();
  requestAnimationFrame(updateDynamicVisuals);
}

function renderTopbar() {
  return `
    <header class="topbar">
      <div class="brand">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 36 36" width="30" height="30">
            <defs>
              <linearGradient id="bm-g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#b44fff"/>
                <stop offset="100%" stop-color="#ff4fa3"/>
              </linearGradient>
            </defs>
            <rect width="36" height="36" rx="8" fill="#000000"/>
            <circle cx="18" cy="18" r="13" fill="none" stroke="#111111" stroke-width="2.5"/>
            <circle cx="18" cy="18" r="13" fill="none" stroke="url(#bm-g)" stroke-width="2.5"
                    stroke-linecap="round" stroke-dasharray="61 20"
                    transform="rotate(-90 18 18)"/>
            <text x="18" y="18"
                  text-anchor="middle"
                  dominant-baseline="central"
                  font-family="'Lato', system-ui, sans-serif"
                  font-weight="900" font-size="15" fill="url(#bm-g)">C</text>
          </svg>
        </span>
        <span>Cruise Mode</span>
      </div>
      <div class="date-chip">${formatDate(parseDate(todayKey()), { weekday:"long", month:"short", day:"numeric" })}</div>
    </header>
  `;
}

function renderToday() {
  const key = todayKey();
  const day = getDay(key);
  const info = completionInfo(day);
  const dayNumber = clamp(diffDays(START_DATE, key) + 1, 1, TOTAL_DAYS);
  const daysUntil = Math.max(0, diffDays(key, END_DATE));
  const journeyPct = clamp(Math.round((dayNumber / TOTAL_DAYS) * 100), 0, 100);
  const milestone = milestoneMessages[dayNumber] ? `<p class="milestone">${milestoneMessages[dayNumber]}</p>` : "";
  const speech = motivationalText(day, info);

  return `
    <main>
      <section class="hero">
        <div class="day-label">Mission progress</div>
        <div class="day-count">Day ${dayNumber} <span style="font-weight:300;font-size:0.55em;color:var(--text-dim)">of 86</span></div>
        <div class="subtitle">${daysUntil} days until cruise</div>
        <div class="greeting">${currentGreeting()}</div>
        <div class="journey-track" aria-label="Journey progress"><div class="journey-fill" style="width:${journeyPct}%"></div></div>
        ${milestone}
      </section>

      <section class="today-stage panel">
        ${renderRing(info, day)}
        ${renderWeightWidget()}
        ${renderCompleteBanner(day, info)}
        ${info.done === 0 ? `<p class="empty-copy">Nothing logged yet. What's first?</p>` : ""}
        ${speech ? `<div class="speech">${speech}</div>` : ""}
      </section>

      <section>
        <div class="section-head">
          <div class="section-label" style="margin:0">Daily Mode</div>
        </div>
        ${renderModeSelector(day)}
      </section>

      <section>
        <div class="section-head">
          <div class="section-label" style="margin:0">Habits</div>
          <div style="font-size:12px;font-weight:300;color:var(--text-dim)">${info.done} / ${info.total}</div>
        </div>
        <div class="habit-list">${habits.map(h => renderHabit(h, day)).join("")}</div>
      </section>
    </main>
  `;
}

function renderRing(info, day) {
  const streak    = calcStreak();
  const totalPts  = calcStats().totalPts;
  return `
    <div class="ring-wrap ${day.mode==="boss"?"boss":""}">
      <svg class="progress-ring" viewBox="0 0 220 220" aria-hidden="true">
        <defs>
          <linearGradient id="ring-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#b44fff"/>
            <stop offset="100%" stop-color="#ff4fa3"/>
          </linearGradient>
          <linearGradient id="nav-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#b44fff"/>
            <stop offset="100%" stop-color="#ff4fa3"/>
          </linearGradient>
        </defs>
        <circle class="ring-track" cx="110" cy="110" r="90"/>
        <circle class="ring-value ${day.mode==="boss"?"boss-mode":""} ${day.mode==="minimum"&&info.percent===100?"minimum-full":""}" cx="110" cy="110" r="90" data-percent="${info.percent}"/>
      </svg>
      <div class="ring-center">
        <div class="percent">${info.percent}%</div>
        <div class="ring-pts">${info.points}<span class="ring-pts-max">/${info.maxPoints}</span><span class="ring-pts-label"> pts</span></div>
      </div>
    </div>
    <div class="ring-stats">
      <div class="ring-stat">
        <div class="ring-stat-value">${info.done}<span class="ring-stat-sub">/${info.total}</span></div>
        <div class="ring-stat-label">habits</div>
      </div>
      <div class="ring-stat-sep"></div>
      <div class="ring-stat">
        <div class="ring-stat-value">${totalPts}${day.mode==="boss"?`<span class="boss-badge">×1.5</span>`:""}</div>
        <div class="ring-stat-label">journey pts</div>
      </div>
      <div class="ring-stat-sep"></div>
      <div class="ring-stat">
        <div class="ring-stat-value">${streak}</div>
        <div class="ring-stat-label">day streak</div>
      </div>
    </div>
  `;
}

// ── Today helpers ─────────────────────────────────────────────────────────

function motivationalText(day, info) {
  if (sheetOpen) return "Here's your minimum. Let's do this.";
  if (day.recovered) return "Comeback complete. Tomorrow we go again.";
  if (info.done === info.total && info.total > 0) return ""; // completion banner handles this
  if (info.done === 0) return "Nothing logged yet. Let's get started.";
  if (info.percent <= 25) return "Good start. Keep going.";
  if (info.percent <= 50) return "Building momentum. Keep going.";
  if (info.percent <= 80) return "Almost there. Strong finish.";
  if (info.done === info.total - 1) return "One away. You've got this.";
  return "All done. Full send.";
}

function renderModeSelector(day) {
  const modes = [["minimum","Minimum"],["standard","Standard"],["boss","Boss Day"]];
  return `<div class="mode-selector">${modes.map(([id,label]) =>
    `<button class="mode-button ${day.mode===id?"active":""}" data-mode="${id}">${label}</button>`
  ).join("")}</div>`;
}

function stepsTitle(mode) {
  if (mode === "boss")     return "15k steps";
  if (mode === "standard") return "12k steps";
  return "10k steps";
}

function renderStepsHabit(day) {
  const checked = day.done.includes("steps");
  const count   = day.stepsCount;
  return `
    <div class="habit-card run-habit ${checked ? "checked" : ""}">
      <span class="accent"></span>
      <span class="habit-emoji">👟</span>
      <div class="run-body">
        <span class="habit-title">${stepsTitle(day.mode)}</span>
        <div class="run-distances">
          <button class="run-dist ${count===10?"active":""}" data-steps-count="10">10k</button>
          <button class="run-dist ${count===12?"active":""}" data-steps-count="12">12k</button>
          <button class="run-dist ${count===15?"active":""}" data-steps-count="15">15k</button>
        </div>
      </div>
      <span class="check-circle">${checked ? stepsPoints(count)+"pts" : ""}</span>
    </div>
  `;
}

function renderHabit(habit, day) {
  if (habit.id === "run")   return renderRunHabit(day);
  if (habit.id === "steps") return renderStepsHabit(day);
  const locked  = day.mode === "minimum" && !habit.minimum_day;
  const checked = day.done.includes(habit.id);
  const title   = habit.title;
  return `
    <button class="habit-card ${checked?"checked":""} ${locked?"locked":""}" data-habit="${habit.id}" ${locked?`aria-disabled="true"`:""}>
      <span class="accent"></span>
      <span class="habit-emoji">${locked ? "🔒" : habit.emoji}</span>
      <span class="habit-info">
        <span class="habit-title">${title}</span>
        <span class="habit-quip">${locked ? "Minimum Day shield is up." : habit.quip}</span>
      </span>
      <span class="check-circle">${checked ? "✓" : ""}</span>
    </button>
  `;
}

function renderRunHabit(day) {
  const locked  = day.mode !== "boss";
  const checked = day.done.includes("run");
  const km      = day.runKm;
  if (locked) return `
    <div class="habit-card locked" aria-disabled="true">
      <span class="accent" style="background:linear-gradient(135deg,#ffcc44,#ff9500)"></span>
      <span class="habit-emoji">👑</span>
      <span class="habit-info">
        <span class="habit-title">Run session</span>
        <span class="habit-quip">${day.mode === "minimum" ? "Minimum Day — run locked." : "Switch to Boss Day to unlock."}</span>
      </span>
      <span class="check-circle"></span>
    </div>`;
  return `
    <div class="habit-card run-habit ${checked?"checked":""}">
      <span class="accent" style="background:linear-gradient(135deg,#ffcc44,#ff9500)"></span>
      <span class="habit-emoji">🏃</span>
      <div class="run-body">
        <span class="habit-title">Run session <span class="boss-pip">👑</span></span>
        <div class="run-distances">
          <button class="run-dist ${km===1?"active":""}"    data-run-km="1">1 km</button>
          <button class="run-dist ${km===3?"active":""}"    data-run-km="3">3 km</button>
          <button class="run-dist ${km===5?"active":""}"    data-run-km="5">5 km</button>
          <button class="run-dist ${km==="5+"?"active":""}" data-run-km="5+">5 km+</button>
        </div>
      </div>
      <span class="check-circle">${checked ? runPoints(km)+"pts" : ""}</span>
    </div>
  `;
}


function renderWeightWidget() {
  if (!state.weighIns.length) return "";
  const latest = state.weighIns[state.weighIns.length - 1];
  const sw = state.settings.startWeight;
  const gw = state.settings.goalWeight;
  const lost = sw ? parseFloat((sw - latest.weight).toFixed(1)) : null;
  const toGoal = (gw && latest.weight > gw) ? parseFloat((latest.weight - gw).toFixed(1)) : 0;
  const pct = (sw && gw && sw > gw) ? clamp(Math.round(((sw - latest.weight) / (sw - gw)) * 100), 0, 100) : null;
  const lostText = lost === null ? "" : lost > 0 ? `↓ ${lost} lbs lost` : lost < 0 ? `↑ ${Math.abs(lost)} lbs gained` : "Holding steady";
  return `
    <div class="weight-widget">
      <div class="ww-left">
        <div class="ww-value">${latest.weight}<span class="ww-unit"> lbs</span></div>
        <div class="ww-label">current weight</div>
      </div>
      <div class="ww-right">
        ${lost !== null ? `<div class="ww-lost ${lost > 0 ? "ww-good" : lost < 0 ? "ww-bad" : ""}">${lostText}</div>` : ""}
        ${pct !== null ? `
          <div class="ww-track"><div class="ww-fill" style="width:${pct}%"></div></div>
          <div class="ww-goal">${toGoal > 0 ? `${toGoal} lbs to go` : "🎯 Goal reached!"}</div>
        ` : ""}
      </div>
    </div>
  `;
}

function renderCompleteBanner(day, info) {
  if (info.done !== info.total || info.total === 0) return "";
  if (day.mode === "minimum") return `
    <div class="complete-banner minimum-complete">
      <span class="cb-icon">🛡</span>
      <div class="cb-body">
        <div class="cb-title">Minimum Day Done</div>
        <div class="cb-sub">Streak protected. See you tomorrow.</div>
      </div>
    </div>`;
  if (day.mode === "boss") return `
    <div class="complete-banner boss-complete">
      <span class="cb-icon">👑</span>
      <div class="cb-body">
        <div class="cb-title">BOSS DAY COMPLETE</div>
        <div class="cb-sub">${info.points} pts · All habits done. Absolute unit.</div>
      </div>
    </div>`;
  return `
    <div class="complete-banner">
      <span class="cb-icon">🔥</span>
      <div class="cb-body">
        <div class="cb-title">Full Send</div>
        <div class="cb-sub">All habits done · ${info.points} pts earned today</div>
      </div>
    </div>`;
}

function renderSaveDayButton() {
  const day = getDay();
  const info = completionInfo(day);
  if (!isAfterSix() || info.done >= 3 || day.recovered || activeTab !== "today") return "";
  return `<button class="save-day" data-open-sheet>Save My Day</button>`;
}

function renderSaveDaySheet() {
  return `
    <div class="sheet-backdrop" data-close-sheet>
      <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="save-title">
        <h2 id="save-title" style="font-size:16px;font-weight:700;margin:12px 0 4px">Here's your comeback:</h2>
        <div class="micro-list">
          ${selectedMicroActions.map(a => `<label class="micro-action"><input type="checkbox"> <span>${a}</span></label>`).join("")}
        </div>
        <button class="primary-button" data-recovered>That's enough. You showed up.</button>
      </section>
    </div>
  `;
}

// ── Week / history helpers ────────────────────────────────────────────────

function challengeWeeks() {
  const start  = parseDate(START_DATE);
  const end    = parseDate(END_DATE);
  const weeks  = [];
  const cursor = new Date(start);
  let   num    = 1;
  while (cursor <= end) {
    const wStart   = new Date(cursor);
    const wFullEnd = new Date(cursor); wFullEnd.setDate(wFullEnd.getDate() + 6);
    const wCapEnd  = wFullEnd < end ? wFullEnd : end;

    const allDays = [];
    const fd = new Date(wStart);
    while (fd <= wCapEnd) { allDays.push(toKey(fd)); fd.setDate(fd.getDate() + 1); }

    const days  = allDays.filter(k => k <= todayKey());
    const label = formatDate(wStart, { month:"short", day:"numeric" }) + " – " +
                  formatDate(wCapEnd, { month:"short", day:"numeric" });

    weeks.push({ num, label, days, allDays });
    cursor.setDate(cursor.getDate() + 7);
    num++;
  }
  return weeks;
}

function calcWeekStats(dayKeys) {
  const today   = todayKey();
  const logged  = dayKeys.filter(k => { const d = state.days[k]; return d && (d.done.length || d.recovered); }).length;
  const pts     = dayKeys.reduce((s, k) => s + (state.days[k] ? completionInfo(state.days[k]).points : 0), 0);
  const runs    = dayKeys.filter(k => state.days[k]?.done.includes("run")).length;
  const hasBoss = dayKeys.some(k => state.days[k]?.mode === "boss" && state.days[k]?.done.length);
  const past    = dayKeys.every(k => k < today);
  const perfect = past && logged === dayKeys.length && dayKeys.length > 0;
  return { logged, total: dayKeys.length, pts, runs, hasBoss, perfect };
}

function renderWeekDots(dayKeys) {
  const today = todayKey();
  return dayKeys.map(k => {
    if (k > today) return `<span class="wdot future"></span>`;
    const d = state.days[k];
    if (!d || (!d.done.length && !d.recovered)) return `<span class="wdot empty ${k===today?"now":""}"></span>`;
    const info = completionInfo(d);
    if (d.mode === "boss"    && info.percent === 100) return `<span class="wdot boss"></span>`;
    if (d.mode === "minimum" && info.percent === 100) return `<span class="wdot min"></span>`;
    if (info.percent === 100) return `<span class="wdot full ${k===today?"now":""}"></span>`;
    return `<span class="wdot partial ${k===today?"now":""}"></span>`;
  }).join("");
}

function renderWeekCard(week, isCurrent) {
  const ws       = calcWeekStats(week.days);
  const goalPct  = Math.min(100, Math.round((ws.pts / WEEKLY_GOAL) * 100));
  const hitGoal  = !isCurrent && ws.pts >= WEEKLY_GOAL;
  const cls      = isCurrent ? "week-card week-card-current" : "week-card";
  const badge    = hitGoal
    ? `<span class="wc-goal-hit">✓ Goal</span>`
    : `<span class="wc-days">${ws.logged}/${week.allDays.length}</span>`;
  return `
    <div class="${cls}">
      <div class="wc-top">
        <div>
          <span class="wc-num">Week ${week.num}</span>
          ${ws.hasBoss ? `<span class="wc-boss-pip">👑</span>` : ""}
        </div>
        ${badge}
      </div>
      <div class="wc-label">${week.label}</div>
      <div class="wc-dots">${renderWeekDots(week.allDays)}</div>
      <div class="wc-goal-row">
        <span class="wc-pts">${ws.pts} <span class="wc-goal-of">/ ${WEEKLY_GOAL} pts</span></span>
        ${ws.runs > 0 ? `<span class="wc-runs">🏃 ${ws.runs}</span>` : ""}
      </div>
      <div class="wc-goal-track">
        <div class="wc-goal-fill ${hitGoal ? "wc-goal-done" : ""}" style="width:${goalPct}%"></div>
      </div>
    </div>
  `;
}

function renderMonthCard(name, year, month) {
  const start      = parseDate(START_DATE);
  const end        = parseDate(END_DATE);
  const today      = parseDate(todayKey());
  const inMonth    = new Date(year, month + 1, 0).getDate();
  const keys       = [];
  for (let d = 1; d <= inMonth; d++) {
    const k    = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const date = parseDate(k);
    if (date >= start && date <= end && date <= today) keys.push(k);
  }
  if (!keys.length) return "";
  // Total challenge days in this month (not just elapsed) for the goal denominator
  const totalInMonth = Math.min(inMonth, (() => {
    let n = 0;
    for (let d = 1; d <= inMonth; d++) {
      const date = parseDate(`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`);
      if (date >= start && date <= end) n++;
    }
    return n;
  })());
  const monthGoal  = Math.round(WEEKLY_GOAL / 7 * totalInMonth);
  const ws         = calcWeekStats(keys);
  const goalPct    = Math.min(100, Math.round((ws.pts / monthGoal) * 100));
  const isPast     = keys[keys.length - 1] < todayKey();
  const hitGoal    = isPast && ws.pts >= monthGoal;
  return `
    <div class="month-card">
      <div class="mc-top">
        <span class="mc-name">${name}</span>
        ${hitGoal ? `<span class="mc-perfect">✓</span>` : ""}
      </div>
      <div class="mc-stats">${ws.pts} / ${monthGoal}<span class="mc-unit"> pts</span></div>
      <div class="mc-track"><div class="mc-fill ${hitGoal ? "mc-hit" : ""}" style="width:${goalPct}%"></div></div>
      <div class="mc-sub">${ws.logged}/${keys.length} days${ws.runs ? ` · 🏃 ${ws.runs}` : ""}</div>
    </div>
  `;
}

// ── Week view ─────────────────────────────────────────────────────────────

function renderWeek() {
  const stats  = calcStats();
  const weeks  = challengeWeeks();
  const today  = todayKey();
  const curIdx = weeks.findIndex(w => w.allDays.includes(today));

  return `
    <main>
      <div class="section-label">Overview</div>
      <div class="stats-grid">
        ${statCard("🔥 Streak",      stats.streak,    "days")}
        ${statCard("⭐ Total pts",    stats.totalPts,  "")}
        ${statCard("🏆 Best day",    stats.bestDay,   "habits")}
        ${statCard("📅 Days logged", stats.daysLogged, "")}
      </div>

      <div class="section-label">All weeks</div>
      <div class="week-history">
        ${weeks.map((w, i) => renderWeekCard(w, i === curIdx)).join("")}
      </div>

      <div class="section-label">By month</div>
      <div class="month-row">
        ${renderMonthCard("June",   2026, 5)}
        ${renderMonthCard("July",   2026, 6)}
        ${renderMonthCard("August", 2026, 7)}
      </div>
    </main>
  `;
}

function statCard(label, value, unit) {
  return `
    <div class="stat-card">
      <div class="label" style="font-size:11px;font-weight:300;color:var(--text-dim);margin-bottom:6px">${label}</div>
      <div class="stat-value">${value}<span style="font-size:13px;font-weight:300;color:var(--text-dim);margin-left:3px">${unit}</span></div>
    </div>
  `;
}

// ── Stats / body comp view ─────────────────────────────────────────────────

function renderStats() {
  const all    = state.weighIns;
  const latest = all[all.length - 1] ?? null;
  const prev   = all.length >= 2 ? all[all.length - 2] : null;

  const cw = latest?.weight   ?? null;
  const cb = latest?.bodyFat  ?? null;
  const cl = latest?.leanMass ?? null;
  const sw = state.settings.startWeight ?? cw;

  const wDelta = sw && cw ? cw - sw : null;
  const bDelta = prev?.bodyFat  != null && cb != null ? cb - prev.bodyFat  : null;
  const lDelta = prev?.leanMass != null && cl != null ? cl - prev.leanMass : null;

  return `
    <main>
      <div class="section-label">Body composition</div>
      <div class="metric-row">
        ${metricCard("Weight",    cw != null ? cw.toFixed(1) : "—", "lbs", wDelta, "weight")}
        ${metricCard("Body fat",  cb != null ? cb.toFixed(1) : "—", "%",   bDelta, "bf")}
        ${metricCard("Lean mass", cl != null ? cl.toFixed(1) : "—", "lbs", lDelta, "lean")}
      </div>

      <div class="chart-card">
        <div class="chart-tabs">
          <button class="chart-tab ${activeChartTab==="weight"?"active":""}" data-chart="weight">Weight</button>
          <button class="chart-tab ${activeChartTab==="bf"?"active":""}"     data-chart="bf">Body fat</button>
          <button class="chart-tab ${activeChartTab==="lean"?"active":""}"   data-chart="lean">Lean mass</button>
        </div>
        ${renderBodyCompChart()}
      </div>

      <div class="section-label">Log check-in</div>
      <div class="log-card">
        <div class="field-grid">
          <label class="field">Weight (lbs)<input id="weight-input" type="number" step="0.1" inputmode="decimal" placeholder="185.5"></label>
          <label class="field">Body fat %<input id="bf-input" type="number" step="0.1" inputmode="decimal" placeholder="Optional"></label>
        </div>
        <div class="field-grid" style="margin-top:10px">
          <label class="field">Start weight<input id="start-input" type="number" step="0.1" inputmode="decimal" value="${state.settings.startWeight??""}" placeholder="Set once"></label>
          <label class="field">Goal weight<input id="goal-input"   type="number" step="0.1" inputmode="decimal" value="${state.settings.goalWeight??""}" placeholder="Target"></label>
        </div>
        <button class="primary-button" data-log-weight style="margin-top:14px">Log Check-in</button>
      </div>

      ${all.length > 0 ? renderWeighInHistory(all) : ""}
    </main>
  `;
}

function metricCard(label, value, unit, delta, type) {
  let deltaClass = "";
  let deltaText = "No prior data";
  if (delta !== null) {
    const abs = Math.abs(delta).toFixed(1);
    const arrow = delta < 0 ? "↓" : delta > 0 ? "↑" : "→";
    deltaText = `${arrow} ${abs} ${unit}`;
    const isGood = (type === "weight" || type === "bf") ? delta < 0 : delta > 0;
    deltaClass = delta === 0 ? "" : isGood ? "good" : "bad";
  }
  return `
    <div class="metric-card">
      <div class="metric-label">${label}</div>
      <div class="metric-value">${value}<span class="metric-unit">${unit}</span></div>
      <div class="metric-delta ${deltaClass}">${deltaText}</div>
    </div>
  `;
}

function renderBodyCompChart() {
  const keys = { weight: "weight", bf: "bodyFat", lean: "leanMass" };
  const field = keys[activeChartTab];
  const labels = { weight: "lbs", bf: "%", lean: "lbs" };
  const points = state.weighIns
    .filter(w => w[field] != null)
    .map(w => ({ date: w.date, val: w[field] }));

  if (points.length < 2) {
    return `<div class="chart-empty">Log two check-ins to see your trend.</div>`;
  }

  const vals = points.map(p => p.val);
  const min  = Math.min(...vals);
  const max  = Math.max(...vals);
  const rng  = Math.max(0.5, max - min);
  const W = 300, H = 120, PAD = 16;

  const coords = points.map((p, i) => {
    const x = PAD + (i / (points.length - 1)) * (W - PAD * 2);
    const y = (H - PAD) - ((p.val - min) / rng) * (H - PAD * 2);
    return [x.toFixed(1), y.toFixed(1)];
  });

  const linePath = coords.map(([x,y], i) => `${i===0?"M":"L"} ${x} ${y}`).join(" ");
  const areaPath = `${linePath} L ${coords[coords.length-1][0]} ${H} L ${coords[0][0]} ${H} Z`;

  const first = vals[0].toFixed(1);
  const last  = vals[vals.length-1].toFixed(1);

  return `
    <svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-label="${activeChartTab} trend chart" style="height:120px">
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#b44fff"/>
          <stop offset="100%" stop-color="#ff4fa3"/>
        </linearGradient>
        <linearGradient id="cga" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#b44fff" stop-opacity="0.22"/>
          <stop offset="100%" stop-color="#ff4fa3" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <path d="${areaPath}" fill="url(#cga)"/>
      <path d="${linePath}" fill="none" stroke="url(#cg)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${coords.map(([x,y]) => `<circle cx="${x}" cy="${y}" r="3" fill="url(#cg)"/>`).join("")}
      <text x="${coords[0][0]}"                     y="${H-2}" fill="var(--text-faint)" font-size="9" text-anchor="middle">${first}</text>
      <text x="${coords[coords.length-1][0]}"       y="${H-2}" fill="var(--text-faint)" font-size="9" text-anchor="middle">${last}</text>
    </svg>
  `;
}

function renderWeighInHistory(all) {
  const recent = [...all].reverse().slice(0, 5);
  return `
    <div class="section-label">History</div>
    <div class="more-card" style="margin-bottom:0">
      <div class="summary-list">
        ${recent.map(w => `
          <div class="summary-row">
            <span>${w.date}</span>
            <strong>${w.weight} lbs${w.bodyFat != null ? ` · ${w.bodyFat}% fat` : ""}${w.leanMass != null ? ` · ${w.leanMass} lean` : ""}</strong>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

// ── More view ─────────────────────────────────────────────────────────────

function renderMore() {
  const earnedCount = state.badges.length;
  const totalCount  = badges.length;
  const earnedPct   = Math.round((earnedCount / totalCount) * 100);
  const cats = [
    { label: "🔥 Streaks",    ids: ["first-wave","getting-started","work-week","on-fire","iron-week","three-weeks","locked-in","45-days","two-months","perfect-week","75-soft","halfway-mark","cruise-ready"] },
    { label: "👑 Boss",       ids: ["boss-energy","boss-week","boss-machine","boss-month"] },
    { label: "⭐ Points",     ids: ["first-points","century","point-collector","high-scorer","elite","unstoppable","legend"] },
    { label: "🏃 Running",    ids: ["first-run","five-runs","run-week","ten-runs","fifteen-runs","twenty-runs","twenty-five-runs","thirty-runs","run-streak","run-streak-5","run-streak-7","distance-builder","speed-merchant","ten-long-runs","twenty-long-runs","5k-done","5k-hat-trick","5k-specialist","beyond-5k","beyond-repeat"] },
    { label: "⚖️ Weight",     ids: ["on-the-scale","first-pound","2lbs-down","3lbs-down","5lbs-down","7lbs-down","halfway-weight","12lbs-down","15lbs-down","17lbs-down","goal-reached","downward-trend","data-driven","twoweek-logger","month-logger","logged-in","30-weighins","60-weighins","perfect-logger"] },
    { label: "🌿 Habits",     ids: ["sober-week","sober-month","morning-ritual","devoted-yogi","bookworm","deep-reader","sleep-champion","hydration-nation","grateful-week","grateful-month"] },
    { label: "🧡 Resilience", ids: ["comeback-kid","minimum-warrior","iron-minimum"] },
    { label: "📆 Weekly & Monthly", ids: ["week-1-done","week-3-done","week-5-done","week-8-done","week-10-done","all-weeks","weekly-mvp","weekly-legend","june-complete","july-complete","august-done"] },
  ];
  return `
    <main>
      <div class="section-label">Badges</div>
      <div class="more-card">
        <div class="badge-overview">
          <div class="badge-overview-count"><span class="boc-num">${earnedCount}</span><span class="boc-total"> / ${totalCount}</span></div>
          <div class="badge-overview-label">badges earned</div>
        </div>
        <div class="badge-overall-track">
          <div class="badge-overall-fill" style="width:${earnedPct}%"></div>
        </div>

        ${cats.map(cat => {
          const catBadges = badges.filter(b => cat.ids.includes(b.id));
          const catEarned = catBadges.filter(b => state.badges.includes(b.id)).length;
          return `
            <div class="badge-cat">
              <div class="badge-cat-header">
                <span class="badge-cat-name">${cat.label}</span>
                <span class="badge-cat-count">${catEarned} / ${catBadges.length}</span>
              </div>
              <div class="badge-grid">
                ${catBadges.map(b => `<div class="badge ${state.badges.includes(b.id) ? "earned" : ""}">${b.label}</div>`).join("")}
              </div>
            </div>
          `;
        }).join("")}
      </div>

      <div class="section-label">Mission notes</div>
      <div class="more-card">
        <p style="font-size:13px;font-weight:300;color:var(--text-dim);line-height:1.6">Zero shame. Minimum days count. One snack cannot overthrow the government. Consistency beats perfection every single time.</p>
      </div>
    </main>
  `;
}

// ── Nav ─────────────────────────────────────────────────────────────────────

const NAV_ICONS = {
  today: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`,
  week:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
  stats: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
  more:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="5" cy="5" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="19" cy="5" r="1.5"/><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><circle cx="5" cy="19" r="1.5"/><circle cx="12" cy="19" r="1.5"/><circle cx="19" cy="19" r="1.5"/></svg>`
};

function renderNav() {
  const tabs = [["today","Today"],["week","Week"],["stats","Stats"],["more","More"]];
  return `
    <nav class="bottom-nav" aria-label="Cruise Mode sections">
      ${tabs.map(([id,label]) => `
        <button class="nav-button ${activeTab===id?"active":""}" data-tab="${id}">
          ${NAV_ICONS[id]}
          ${label}
        </button>
      `).join("")}
    </nav>
  `;
}

// ── Events ─────────────────────────────────────────────────────────────────

function bindEvents() {
  document.querySelectorAll("[data-tab]").forEach(b => {
    b.addEventListener("click", () => { activeTab = b.dataset.tab; sheetOpen = false; render(); });
  });
  document.querySelectorAll("[data-mode]").forEach(b => {
    b.addEventListener("click", () => setMode(b.dataset.mode));
  });
  document.querySelectorAll("[data-habit]").forEach(b => {
    b.addEventListener("click", () => toggleHabit(b.dataset.habit));
  });
  document.querySelectorAll("[data-run-km]").forEach(b => {
    b.addEventListener("click", e => { e.stopPropagation(); selectRunKm(b.dataset.runKm); });
  });
  document.querySelectorAll("[data-steps-count]").forEach(b => {
    b.addEventListener("click", e => { e.stopPropagation(); selectStepsCount(b.dataset.stepsCount); });
  });
  document.querySelectorAll("[data-chart]").forEach(b => {
    b.addEventListener("click", () => { activeChartTab = b.dataset.chart; render(); });
  });
  document.querySelector("[data-open-sheet]")?.addEventListener("click", () => {
    selectedMicroActions = pickRandom(microActions, 3);
    sheetOpen = true;
    render();
  });
  document.querySelector("[data-close-sheet]")?.addEventListener("click", e => {
    if (e.target.matches("[data-close-sheet]")) { sheetOpen = false; render(); }
  });
  document.querySelector("[data-recovered]")?.addEventListener("click", markRecovered);
  document.querySelector("[data-log-weight]")?.addEventListener("click", logWeight);
}

// ── Actions ─────────────────────────────────────────────────────────────────

function setMode(mode) {
  const day = getDay();
  day.mode = mode;
  if (mode === "minimum") day.done = day.done.filter(id => habits.find(h => h.id === id)?.minimum_day);
  if (mode === "standard") day.done = day.done.filter(id => !habits.find(h => h.id === id)?.boss_only);
  updatePoints(day);
  saveState();
  if (mode === "minimum") showToast("Minimum day set. Streak is safe.");
  if (mode === "boss")    showToast("Boss Day unlocked. Go big.");
  checkBadges();
  render();
}

function toggleHabit(id) {
  const day   = getDay();
  const habit = habits.find(h => h.id === id);
  if (!habit) return;
  if (day.mode === "minimum" && !habit.minimum_day) return;
  if (day.mode !== "boss"    &&  habit.boss_only)   return;
  if (day.done.includes(id)) day.done = day.done.filter(x => x !== id);
  else day.done.push(id);
  updatePoints(day);
  saveState();
  navigator.vibrate?.(10);
  checkBadges();
  render();
}


function selectStepsCount(rawCount) {
  const day   = getDay();
  const count = Number(rawCount);
  if (day.stepsCount === count) {
    day.stepsCount = null;
    day.done = day.done.filter(id => id !== "steps");
  } else {
    day.stepsCount = count;
    if (!day.done.includes("steps")) day.done.push("steps");
  }
  updatePoints(day);
  saveState();
  navigator.vibrate?.(10);
  checkBadges();
  render();
}

function selectRunKm(rawKm) {
  const day = getDay();
  if (day.mode !== "boss") return;
  const km = rawKm === "5+" ? "5+" : Number(rawKm);
  if (day.runKm === km) {
    // tap same distance → uncheck
    day.runKm = null;
    day.done  = day.done.filter(id => id !== "run");
  } else {
    day.runKm = km;
    if (!day.done.includes("run")) day.done.push("run");
  }
  updatePoints(day);
  saveState();
  navigator.vibrate?.(10);
  checkBadges();
  render();
}

function markRecovered() {
  const day = getDay();
  day.recovered = true;
  saveState();
  sheetOpen = false;
  showToast("Comeback complete. Tomorrow we go again.");
  checkBadges();
  render();
}

function logWeight() {
  const weight = Number(document.getElementById("weight-input").value);
  const bfVal  = document.getElementById("bf-input").value;
  const bodyFat = bfVal === "" ? null : Number(bfVal);
  const startVal = document.getElementById("start-input").value;
  const goalVal  = document.getElementById("goal-input").value;
  if (startVal !== "") state.settings.startWeight = Number(startVal);
  if (goalVal  !== "") state.settings.goalWeight  = Number(goalVal);
  if (!Number.isFinite(weight) || weight <= 0) {
    showToast("Enter a weight first.");
    saveState(); render(); return;
  }
  const leanMass = bodyFat !== null && Number.isFinite(bodyFat)
    ? Number((weight * (1 - bodyFat / 100)).toFixed(1)) : null;
  // Update today's entry if one already exists, otherwise append
  const todayIdx = state.weighIns.findIndex(w => w.date === todayKey());
  const entry = { date: todayKey(), weight: Number(weight.toFixed(1)), bodyFat, leanMass };
  if (todayIdx >= 0) state.weighIns[todayIdx] = entry;
  else state.weighIns.push(entry);
  if (state.settings.startWeight === null) state.settings.startWeight = Number(weight.toFixed(1));
  saveState();
  showToast(leanMass ? `Logged. Lean mass: ${leanMass} lbs.` : "Logged.");
  render();
}

// ── Dynamic visuals ─────────────────────────────────────────────────────────

function updateDynamicVisuals() {
  const ring = document.querySelector(".ring-value");
  if (!ring) return;
  const pct = Number(ring.dataset.percent || 0);
  ring.style.strokeDasharray  = RING_CIRC;
  ring.style.strokeDashoffset = RING_CIRC - (pct / 100) * RING_CIRC;
}

// ── Calculations ─────────────────────────────────────────────────────────────

function calcStats() {
  const days       = Object.entries(state.days);
  const daysLogged = days.filter(([,d]) => d.done.length || d.recovered).length;
  const bestDay    = days.reduce((m, [,d]) => Math.max(m, d.done.length), 0);
  const totalPts   = days.reduce((s, [,d]) => s + completionInfo(d).points, 0);
  return { streak: calcStreak(), daysLogged, bestDay, totalPts };
}

function calcStreak() {
  let streak = 0;
  const today = todayKey();
  const date  = parseDate(today);
  // If today hasn't been logged yet, start counting from yesterday
  // so a morning open doesn't wipe out the earned streak display
  const todayDay = state.days[today];
  const todayLogged = todayDay && (todayDay.done.length || todayDay.recovered);
  if (!todayLogged) date.setDate(date.getDate() - 1);
  for (let i = 0; i < TOTAL_DAYS; i++) {
    const key = toKey(date);
    const day = state.days[key];
    if (!day || (!day.done.length && !day.recovered)) break;
    streak++;
    date.setDate(date.getDate() - 1);
  }
  return streak;
}


function habitStreakCount(id) {
  let n = 0;
  const d = parseDate(todayKey());
  for (let i = 0; i < TOTAL_DAYS; i++) {
    const day = state.days[toKey(d)];
    if (!day || !day.done.includes(id)) break;
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

function checkBadges() {
  const day  = getDay();
  const info = completionInfo(day);
  const allDays = Object.values(state.days);
  const streak  = calcStreak();
  const stats   = calcStats();
  const ctx  = {
    dayNumber:        clamp(diffDays(START_DATE, todayKey()) + 1, 1, TOTAL_DAYS),
    complete:         info.done === info.total,
    streak,
    totalPts:         stats.totalPts,
    anyBoss:          allDays.some(d => d.mode === "boss" && d.done.length),
    bossWeek:         lastNDays(7).filter(k => state.days[k]?.mode === "boss" && state.days[k]?.done.length).length >= 3,
    bossCompleteDays: allDays.filter(d => d.mode === "boss" && completionInfo(d).percent === 100).length,
    anyRecovered:     allDays.some(d => d.recovered),
    minimumCompleted: allDays.filter(d => d.mode === "minimum" && completionInfo(d).percent === 100).length,
    loggedLast7:      lastNDays(7).filter(k => { const d = state.days[k]; return d && (d.done.length || d.recovered); }).length,
    runsLogged:       allDays.filter(d => d.done.includes("run")).length,
    hasRun5k:         allDays.some(d => d.runKm === 5 || d.runKm === "5+"),
    hasRun5kPlus:     allDays.some(d => d.runKm === "5+"),
    runsAt5k:         allDays.filter(d => d.runKm === 5 || d.runKm === "5+").length,
    runsAt5kPlus:     allDays.filter(d => d.runKm === "5+").length,
    hasRun3k:         allDays.some(d => d.runKm === 3 || d.runKm === 5 || d.runKm === "5+"),
    run3kPlus:        allDays.filter(d => d.runKm === 3 || d.runKm === 5 || d.runKm === "5+").length,
    runStreak:        habitStreakCount("run"),
    soberStreak:      habitStreakCount("noalcohol"),
    yogaStreak:       habitStreakCount("yoga"),
    readStreak:       habitStreakCount("read"),
    sleepStreak:      habitStreakCount("sleep"),
    waterStreak:      habitStreakCount("water"),
    weighInStreak:    habitStreakCount("weighin"),
    gratitudeStreak:  habitStreakCount("gratitude"),
    totalYoga:        allDays.filter(d => d.done.includes("yoga")).length,
    totalRead:        allDays.filter(d => d.done.includes("read")).length,
    totalWeighIns:    state.weighIns.length,
    weightLost:       (() => {
      if (!state.settings.startWeight || !state.weighIns.length) return 0;
      return Math.max(0, state.settings.startWeight - state.weighIns[state.weighIns.length - 1].weight);
    })(),
    downwardTrend:    (() => {
      let n = 0;
      for (let i = state.weighIns.length - 1; i > 0; i--) {
        if (state.weighIns[i].weight < state.weighIns[i - 1].weight) n++;
        else break;
      }
      return n;
    })(),
    completedWeeks:   (() => {
      return challengeWeeks().filter(w => {
        const past = w.days.every(k => k < todayKey());
        if (!past) return false;
        return w.days.every(k => { const d = state.days[k]; return d && (d.done.length || d.recovered); });
      }).length;
    })(),
    bestWeekPts:      Math.max(0, ...challengeWeeks().map(w =>
      w.days.reduce((s, k) => s + (state.days[k] ? completionInfo(state.days[k]).points : 0), 0)
    )),
    juneComplete:     (() => {
      const today = todayKey();
      if (today < "2026-07-01") return false;
      for (let d = 1; d <= 30; d++) {
        const k = `2026-06-${String(d).padStart(2,"0")}`;
        const day = state.days[k];
        if (!day || (!day.done.length && !day.recovered)) return false;
      }
      return true;
    })(),
    julyComplete:     (() => {
      const today = todayKey();
      if (today < "2026-08-01") return false;
      for (let d = 1; d <= 31; d++) {
        const k = `2026-07-${String(d).padStart(2,"0")}`;
        const day = state.days[k];
        if (!day || (!day.done.length && !day.recovered)) return false;
      }
      return true;
    })(),
    augustComplete:   (() => {
      const today = todayKey();
      if (today < "2026-08-25") return false;
      for (let d = 1; d <= 25; d++) {
        const k = `2026-08-${String(d).padStart(2,"0")}`;
        const day = state.days[k];
        if (!day || (!day.done.length && !day.recovered)) return false;
      }
      return true;
    })(),
  };
  badges.forEach(b => {
    if (!state.badges.includes(b.id) && b.test(ctx)) {
      state.badges.push(b.id);
      showToast(`${b.label} badge earned.`);
    }
  });
  saveState();
}

function lastNDays(n) {
  const date = parseDate(todayKey());
  return Array.from({ length: n }, () => {
    const key = toKey(date);
    date.setDate(date.getDate() - 1);
    return key;
  });
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function currentGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning — the mission continues.";
  if (h < 18) return "Afternoon check-in — how are we doing?";
  return "Evening — let's close this out.";
}

function isAfterSix() { return new Date().getHours() >= 18; }

function formatDate(date, opts) {
  return new Intl.DateTimeFormat(undefined, opts).format(date);
}

function pickRandom(arr, n) {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}


function showToast(msg) {
  const stack = document.getElementById("toast-stack");
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

function setDynamicIcon() {
  const link = document.querySelector("link[rel='icon']");
  if (!link) return;
  // Dark rounded square + gradient ring arc (75% filled, like the app's progress ring) + bold C centre
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#b44fff"/><stop offset="100%" stop-color="#ff4fa3"/></linearGradient></defs><rect width="192" height="192" rx="42" fill="#000000"/><circle cx="96" cy="96" r="76" fill="none" stroke="#111111" stroke-width="11"/><circle cx="96" cy="96" r="76" fill="none" stroke="url(#g)" stroke-width="11" stroke-linecap="round" stroke-dasharray="358 120" transform="rotate(-90 96 96)"/><text x="96" y="96" text-anchor="middle" dominant-baseline="central" font-family="'Lato',system-ui,sans-serif" font-weight="900" font-size="88" fill="url(#g)">C</text></svg>`;
  link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// ── Boot ─────────────────────────────────────────────────────────────────────

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(e => console.warn("SW failed", e));
  });
}

saveState();
setDynamicIcon();
render();
