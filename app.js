"use strict";

const APP_VERSION = "2026.06.27.19";
// Public URL shown on shared cards/text. UPDATE to your real domain before launch.
const SHARE_URL = "vermillion-marshmallow-d68dba.netlify.app";

// ── Field icons (Tabler outline) ─────────────────────────────────────────────
const TIER_ICON = { common:"ti-award", uncommon:"ti-award", rare:"ti-medal", epic:"ti-medal-2", legendary:"ti-trophy" };
const CATEGORY_ICON = { movement:"ti-run", endurance:"ti-stopwatch", health:"ti-heart-rate-monitor", expedition:"ti-map-2", transformation:"ti-flame", lifestyle:"ti-sun", mindset:"ti-brain" };
const CHALLENGE_ICON = {
  "dog-walk":"ti-dog","cycling":"ti-bike","walking":"ti-walk","running":"ti-run",
  "strength":"ti-barbell","yoga-flexibility":"ti-yoga","core-abs":"ti-stretching",
  "c25k":"ti-run","5k-prep":"ti-run","pilates":"ti-stretching","12-3-30":"ti-treadmill",
  "kettlebell":"ti-barbell","calisthenics":"ti-barbell","beginner-strength":"ti-barbell",
  "pushup-challenge":"ti-barbell","pullup-progression":"ti-barbell",
  "zone2":"ti-heart-rate-monitor","hyrox":"ti-stopwatch","half-marathon-prep":"ti-run",
  "marathon-training":"ti-run","10k-prep":"ti-run","swim-foundation":"ti-swimming","swim-1k":"ti-swimming","open-water-prep":"ti-lifebuoy",
  "weight-loss-30":"ti-scale","body-composition":"ti-scale","glucose-control":"ti-droplet",
  "sleep-tracker":"ti-moon","sleep-reset":"ti-moon","recovery-reset":"ti-bed","protein-challenge":"ti-meat",
  "hydration":"ti-droplet","posture-fix":"ti-stretching","digital-detox":"ti-device-mobile-off",
  "75-hard":"ti-flame","75-soft":"ti-flame","morning-routine":"ti-sun","morning-power-hour":"ti-sun",
  "everest-bc":"ti-mountain","west-highland-way":"ti-trekking","tour-du-mont-blanc":"ti-mountain",
  "john-muir-trail":"ti-trekking","camino":"ti-trekking","appalachian":"ti-trekking",
  "tour-de-france":"ti-bike","route66":"ti-road","amazon-river":"ti-kayak","pct":"ti-trekking",
  "everest-stairmaster":"ti-stairs","kilimanjaro-stairmaster":"ti-stairs","montblanc-stairmaster":"ti-stairs",
  "comrades-ultra":"ti-run","utmb":"ti-mountain","run-5-marathons":"ti-run","run-jogle":"ti-run","run-trans-america":"ti-run",
};
function challengeIcon(t) { return (t && (CHALLENGE_ICON[t.id] || CATEGORY_ICON[t.category])) || "ti-target"; }

// Rough daily time estimate for a template's habit list — parses explicit durations out of
// habit titles ("45 min", "2 hours") and falls back to a 5-min default for quick check-off
// habits with no stated duration. Sleep habits are excluded (they're not "active time today").
function estimateMinutesPerDay(habits) {
  let total = 0;
  for (const h of habits || []) {
    const text = h.title || "";
    if (/sleep/i.test(text)) continue;
    const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*h(?:r|ours?)?\b/i);
    const minMatch = text.match(/(\d+)\s*min/i);
    if (hourMatch) total += parseFloat(hourMatch[1]) * 60;
    else if (minMatch) total += parseInt(minMatch[1], 10);
    else total += 5;
  }
  return Math.max(5, Math.round(total / 5) * 5);
}
function stripBadgeEmoji(label) { return String(label || "").replace(/^\s*[←-⯿️\u{1F000}-\u{1FAFF}]+\s*/u, "").trim(); }
function scheduleIcon(type) {
  return ({
    easy:"ti-run", tempo:"ti-gauge", long:"ti-road", interval:"ti-bolt", cross:"ti-arrows-cross",
    rest:"ti-bed", strength:"ti-barbell", wod:"ti-stopwatch", simulate:"ti-trophy", combo:"ti-bolt"
  })[type] || "ti-calendar";
}
const STORAGE_KEY = "conqur_v1";
const OLD_KEY     = "cruise_mode_v1";
const RING_CIRC   = 2 * Math.PI * 90;
const UPDATE_CHECK_MS = 30 * 60 * 1000;

// ── XP Level System ──────────────────────────────────────────────────────────
const XP_LEVELS = [
  { level: 1,  xp: 0     },
  { level: 2,  xp: 10    },
  { level: 3,  xp: 30    },
  { level: 4,  xp: 60    },
  { level: 5,  xp: 100   },
  { level: 6,  xp: 150   },
  { level: 7,  xp: 210   },
  { level: 8,  xp: 280   },
  { level: 9,  xp: 360   },
  { level: 10, xp: 450   },
  { level: 11, xp: 550   },
  { level: 12, xp: 660   },
  { level: 13, xp: 780   },
  { level: 14, xp: 910   },
  { level: 15, xp: 1050  },
  { level: 16, xp: 1200  },
  { level: 17, xp: 1360  },
  { level: 18, xp: 1530  },
  { level: 19, xp: 1710  },
  { level: 20, xp: 1900  },
  { level: 21, xp: 2100  },
  { level: 22, xp: 2310  },
  { level: 23, xp: 2530  },
  { level: 24, xp: 2760  },
  { level: 25, xp: 3000  },
];

// One-time XP bonus when a challenge first completes (keyed by duration in days)
const COMPLETION_BONUS = {
  21: 50, 30: 75, 42: 100, 50: 100, 56: 100,
  60: 125, 75: 200, 84: 150, 90: 150, 120: 250, 365: 1000,
};

// Level chapter milestones shown once as an overlay
const CHAPTER_LEVELS = {
  5:  { title:"Building",  msg:"You're no longer a beginner." },
  10: { title:"Proving",   msg:"You've shown up more than most people ever will." },
  15: { title:"Elite",     msg:"You're in the top 10% of anyone who keeps going." },
  20: { title:"Legend",    msg:"This is who you are now." },
  25: { title:"Conqueror", msg:"You made it." },
};

// Per-category completion headline copy (deterministic pick via date seed)
const COMPLETE_COPY = {
  transformation: ["Locked in.",       "Built different.",    "Identity shift."],
  movement:       ["Work done.",        "Body moved.",         "Showed up."],
  endurance:      ["Miles banked.",     "Distance covered.",   "Body of evidence."],
  lifestyle:      ["Day designed.",     "System held.",        "Deliberate."],
  health:         ["Data logged.",      "Body tracked.",       "Consistent."],
  expedition:     ["Terrain covered.",  "Moving.",             "Closer."],
  mindset:        ["Clear.",            "Mind worked.",        "Presence: logged."],
};

// ── Journey themes — pick how you level up ─────────────────────────────────
const THEME_SWATCHES = {
  frostborn: ["#38BDF8","#7DD3FC"],
  phoenix:   ["#F97316","#FBBF24"],
  everest:   ["#94A3B8","#CBD5E1"],
  cosmos:    ["#A855F7","#E879F9"],
  martial:   ["#D97706","#FCD34D"],
};
const JOURNEY_THEMES = {
  frostborn: {
    label: "Frostborn", icon: "ti-axe", tagline: "Rise as a Viking",
    levels: [
      "Initiate","Oath-Sworn","Oathkeeper","Oath-Bound","Ice-Tempered",
      "Raider","Reaver","Sea-Wolf","Shieldbearer","Shield-Wall",
      "Iron Shield","Stormwalker","Storm-Born","Frost Strider","Jarl",
      "High Jarl","Warlord","War-Chief","Iron Warlord","Frostborn",
      "Deep Frostborn","Saga-Bound","Saga-Keeper","Saga-Eternal","Conqueror",
    ],
  },
  phoenix: {
    label: "Phoenix", icon: "ti-flame", tagline: "Rise From the Ashes",
    levels: [
      "Broken","Still Breathing","First Ember","Choosing to Rise","One Step",
      "Finding Footing","Healing Starts","Inner Spark","Rebuilding","Unbroken",
      "Wings Forming","First Flight","Rising Fast","Storm Rider","Reborn",
      "Scarlet Flame","Blazing Trail","Wildfire","Crown of Ash","Living Proof",
      "The Comeback","Eternal Flame","Legend of the Ash","The Undying","The Phoenix",
    ],
  },
  everest: {
    label: "Everest", icon: "ti-mountain", tagline: "Conquer the Summit",
    levels: [
      "Rookie","Wanderer","Trailblazer","Scout","Ranger","Climber","Adventurer",
      "Pathfinder","Mountaineer","Storm Rider","Iron Will","Blizzard Survivor",
      "Altitude Master","Ridge Walker","Summit Seeker","Above the Clouds",
      "Ice Axe","Death Zone","Near the Top","Final Push",
      "Summit Reached","The Conqueror","Everest Bound","Everest Champion","Conqueror of Everest",
    ],
  },
  cosmos: {
    label: "Cosmos", icon: "ti-rocket", tagline: "Reach for the Stars",
    levels: [
      "Space Dreamer","Mission Candidate","Cadet","Flight Trainee","Mission Specialist",
      "Launch Ready","Countdown","Orbit Reached","Spacewalker","Orbit Master",
      "Moon Bound","Lunar Approach","Moon Walker","Deep Space Pioneer","Asteroid Belt",
      "Jupiter Bound","Outer Rim","Mars Approach","Mars Orbit","Mars Landing",
      "Red Planet Pioneer","Mars Colony","Mars Legend","First Martian","First on Mars",
    ],
  },
  martial: {
    label: "Martial Arts", icon: "ti-yin-yang", tagline: "Master Your Mind",
    levels: [
      "White Belt","Yellow Belt","Orange Belt","Green Belt","Blue Belt",
      "Purple Belt","Red Belt","Brown Belt","Black Belt","1st Dan",
      "Iron Fist","Silent Mind","Dragon Spirit","Tiger Heart","Storm Breaker",
      "Shadow Walker","Unbroken","The Sensei","Shihan","Hanshi",
      "Iron Legend","Ancient Master","The Soke","Hall of Champions","Grandmaster",
    ],
  },
};

// Fixed line-icon set for the 4 onboarding/welcome feature bullets (challenges, points, rest days, privacy)
const OB_FEATURE_ICONS = ["ti-trophy", "ti-bolt", "ti-shield", "ti-lock"];

function getThemedLevelName(levelNum) {
  const theme = JOURNEY_THEMES[state?.settings?.journeyTheme] || JOURNEY_THEMES.frostborn;
  return theme.levels[levelNum - 1] || "";
}

// ── Per-theme vocabulary — each theme has its own words for the same concepts ──
const THEME_TERMS = {
  frostborn: {
    challenge:"Quest", challengePlural:"Quests", habit:"Oath", habitPlural:"Oaths",
    streak:"Fire", badge:"Rune", badgePlural:"Runes", level:"Rank",
    restDay:"Recovery Day", bossDay:"Raid Day", progressPhoto:"Proof", weeklyReview:"Saga Review",
  },
  phoenix: {
    challenge:"Ascent", challengePlural:"Ascents", habit:"Ember", habitPlural:"Embers",
    streak:"Flame", badge:"Feather", badgePlural:"Feathers", level:"Flight",
    restDay:"Ash Day", bossDay:"Rising Day", progressPhoto:"Transformation", weeklyReview:"Rising Review",
  },
  everest: {
    challenge:"Climb", challengePlural:"Climbs", habit:"Step", habitPlural:"Steps",
    streak:"Push", badge:"Peak", badgePlural:"Peaks", level:"Camp",
    restDay:"Camp Day", bossDay:"Summit Push", progressPhoto:"Ascent Photo", weeklyReview:"Basecamp Review",
  },
  cosmos: {
    challenge:"Mission", challengePlural:"Missions", habit:"Task", habitPlural:"Tasks",
    streak:"Orbit", badge:"Star", badgePlural:"Stars", level:"Clearance",
    restDay:"Docking Day", bossDay:"Launch Day", progressPhoto:"Mission Log", weeklyReview:"Flight Review",
  },
  martial: {
    challenge:"Discipline", challengePlural:"Disciplines", habit:"Drill", habitPlural:"Drills",
    streak:"Chain", badge:"Medal", badgePlural:"Medals", level:"Belt",
    restDay:"Meditation Day", bossDay:"Trial Day", progressPhoto:"Form Photo", weeklyReview:"Dojo Review",
  },
};
function term(key) {
  const t = THEME_TERMS[state?.settings?.journeyTheme] || THEME_TERMS.frostborn;
  return t[key] !== undefined ? t[key] : THEME_TERMS.frostborn[key];
}

// ── Per-theme flavor text — metaphor-heavy prose that can't be a simple word swap ──
const THEME_COPY = {
  frostborn: {
    comebackHard: (missed) => `<strong>Welcome back.</strong> Your Fire went out ${missed} days ago — that's okay. <span class="cb-alive">Your Quest is still running.</span> Begin again. Stronger.`,
    comebackSoft: (streak) => `Your Fire weakened at ${streak} days. Keep today's Oaths to relight it. <span class="cb-alive">Your Quest is still running.</span>`,
    welcomeFallback: "Keep your Oaths. Protect your Fire. Rise in Rank.",
    emptyTitle: "No Quest Active",
    emptySub: "Choose your next Quest and enter the Hall.",
    heroTagline: "Enter the Hall.<br>Build who you're becoming.",
    fireBullet: "<strong>Keep your Fire</strong> — your streak burns as long as you show up",
  },
  phoenix: {
    comebackHard: (missed) => `<strong>Welcome back.</strong> Your Flame went out ${missed} days ago — that's okay. <span class="cb-alive">Your Ascent is still running.</span> Rise again. Stronger.`,
    comebackSoft: (streak) => `Your Flame dimmed at ${streak} days. Keep today's Embers to reignite it. <span class="cb-alive">Your Ascent is still running.</span>`,
    welcomeFallback: "Keep your Embers. Guard your Flame. Take Flight.",
    emptyTitle: "No Ascent Active",
    emptySub: "Choose your next Ascent and begin your rise.",
    heroTagline: "Rise From the Ashes.<br>Build who you're becoming.",
    fireBullet: "<strong>Keep your Flame</strong> — it burns as long as you show up",
  },
  everest: {
    comebackHard: (missed) => `<strong>Welcome back.</strong> Your Push stalled ${missed} days ago — that's okay. <span class="cb-alive">Your Climb is still running.</span> Begin again. Stronger.`,
    comebackSoft: (streak) => `Your Push slowed at ${streak} days. Keep today's Steps to get moving again. <span class="cb-alive">Your Climb is still running.</span>`,
    welcomeFallback: "Keep your Steps. Protect your Push. Rise in Camp.",
    emptyTitle: "No Climb Active",
    emptySub: "Choose your next Climb and start the ascent.",
    heroTagline: "Conquer the Summit.<br>Build who you're becoming.",
    fireBullet: "<strong>Keep your Push</strong> — momentum holds as long as you show up",
  },
  cosmos: {
    comebackHard: (missed) => `<strong>Welcome back.</strong> Your Orbit decayed ${missed} days ago — that's okay. <span class="cb-alive">Your Mission is still running.</span> Relaunch. Stronger.`,
    comebackSoft: (streak) => `Your Orbit slipped at ${streak} days. Keep today's Tasks to stabilize it. <span class="cb-alive">Your Mission is still running.</span>`,
    welcomeFallback: "Keep your Tasks. Hold your Orbit. Earn Clearance.",
    emptyTitle: "No Mission Active",
    emptySub: "Choose your next Mission and start the countdown.",
    heroTagline: "Reach for the Stars.<br>Build who you're becoming.",
    fireBullet: "<strong>Keep your Orbit</strong> — it holds as long as you show up",
  },
  martial: {
    comebackHard: (missed) => `<strong>Welcome back.</strong> Your Chain broke ${missed} days ago — that's okay. <span class="cb-alive">Your Discipline is still running.</span> Begin again. Stronger.`,
    comebackSoft: (streak) => `Your Chain weakened at ${streak} days. Keep today's Drills to reforge it. <span class="cb-alive">Your Discipline is still running.</span>`,
    welcomeFallback: "Keep your Drills. Protect your Chain. Earn your Belt.",
    emptyTitle: "No Discipline Active",
    emptySub: "Choose your next Discipline and step onto the mat.",
    heroTagline: "Master Your Mind.<br>Build who you're becoming.",
    fireBullet: "<strong>Keep your Chain</strong> — it holds as long as you show up",
  },
};
// UNIVERSAL_BADGES is a top-level const evaluated before `state` exists, so its
// label/desc strings can't call term() directly — reword them at render time instead.
function rethemeBadgeText(text) {
  return String(text || "")
    .replace(/\bOaths\b/g, term('habitPlural')).replace(/\bOath\b/g, term('habit'))
    .replace(/\bFire\b/g, term('streak'))
    .replace(/\bQuests\b/g, term('challengePlural')).replace(/\bQuest\b/g, term('challenge'));
}
function rethemeBadges(defs) {
  return defs.map(b => ({ ...b, label: rethemeBadgeText(b.label), desc: rethemeBadgeText(b.desc) }));
}
function copy(key, ...args) {
  const c = THEME_COPY[state?.settings?.journeyTheme] || THEME_COPY.frostborn;
  const val = c[key] !== undefined ? c[key] : THEME_COPY.frostborn[key];
  return typeof val === "function" ? val(...args) : val;
}

function getLevelInfo(xp) {
  let current = XP_LEVELS[0];
  for (const lvl of XP_LEVELS) {
    if (xp >= lvl.xp) current = lvl;
    else break;
  }
  const nextIdx   = XP_LEVELS.indexOf(current) + 1;
  const next      = XP_LEVELS[nextIdx] || null;
  const xpInLevel = next ? xp - current.xp : 0;
  const xpNeeded  = next ? next.xp - current.xp : 1;
  const pct       = next ? Math.min(100, Math.round((xpInLevel / xpNeeded) * 100)) : 100;
  const name      = getThemedLevelName(current.level);
  const nextName  = next ? getThemedLevelName(next.level) : null;
  return { ...current, name, next: next ? { ...next, name: nextName } : null, xpInLevel, xpNeeded, pct };
}

function getStreakMultiplier(challenge) {
  const yesterday = addDays(todayKey(), -1);
  let count = 0;
  let cursor = yesterday;
  while (cursor >= challenge.startDate) {
    const d = challenge.days[cursor];
    if (d?.mode === "rest") { cursor = addDays(cursor, -1); continue; }
    if (!d || !dayLogged(d)) break;
    count++;
    cursor = addDays(cursor, -1);
  }
  return count >= 75 ? 1.40 : count >= 30 ? 1.25 : count >= 14 ? 1.15 : count >= 7 ? 1.10 : 1.0;
}

function recalcXP() {
  let total = 0;
  for (const challenge of Object.values(state.challenges)) {
    for (const day of Object.values(challenge.days)) {
      total += completionInfo(challenge, day).points || 0;
    }
  }
  return total;
}

function avgDailyXP() {
  const today = todayKey();
  let total = 0, active = 0;
  for (let i = 0; i < 14; i++) {
    const d = new Date(parseDate(today)); d.setDate(d.getDate() - i);
    const dk = toKey(d);
    let dayXP = 0;
    for (const ch of Object.values(state.challenges)) {
      const day = ch.days[dk];
      if (day) dayXP += completionInfo(ch, day).points || 0;
    }
    if (dayXP > 0) active++;
    total += dayXP;
  }
  return active >= 3 ? total / 14 : null;
}

// ── Rarity Tiers (Field: monochrome + ember intensity ramp, no rainbow) ─────
// Rune rarity hierarchy: steel (common) → ice blue (uncommon) → emerald (rare) → purple-blue (epic) → amber fire (legendary)
const TIERS = {
  common:    { label:"Common",    color:"var(--text-faint)", border:"var(--text-faint)" },
  uncommon:  { label:"Uncommon",  color:"var(--primary)",    border:"var(--primary)" },
  rare:      { label:"Rare",      color:"var(--success)",    border:"var(--success)" },
  epic:      { label:"Epic",      color:"var(--epic)",       border:"var(--epic)" },
  legendary: { label:"Legendary", color:"var(--fire)",       border:"var(--fire)" },
};

// Plain-English descriptions of each tier for the builder
const TIER_DESC = {
  common:    "Beginner-friendly",
  uncommon:  "Everyday challenge",
  rare:      "Demanding",
  epic:      "Elite-level",
  legendary: "Extreme athletes only",
};

// Reference ranges for health measurement units
const UNIT_RANGES = {
  "mmHg":   "Normal: <120/80 mmHg",
  "mg/dL":  "Fasting normal: 70–99 mg/dL",
  "hrs":    "Recommended: 7–9 hrs",
  "/10":    "Log from 1 (awful) to 10 (perfect)",
  "%":      null,
};

// Returns an inline tag for epic/legendary challenges, empty string otherwise
function tierTag(templateId) {
  const tier = templateId ? TEMPLATE_TIERS[templateId] : null;
  if (tier !== "epic" && tier !== "legendary") return "";
  const td = TIERS[tier];
  return `<span class="tier-tag" style="color:${td.color}">${td.label}</span>`;
}

// Challenge difficulty (independent of WoW rarity tier)
const TEMPLATE_DIFFICULTY = {
  // Beginner — no fitness baseline required
  "dog-walk":"beginner","walking":"beginner","reading":"beginner",
  "journaling":"beginner","meditation":"beginner","sleep-reset":"beginner",
  "morning-routine":"beginner","hydration":"beginner","meal-prep":"beginner",
  "no-spend":"beginner","dry-month":"beginner","creative":"beginner",
  "sleep-tracker":"beginner","no-sugar":"beginner","digital-detox":"beginner",
  "blood-pressure":"beginner","c25k":"beginner","pilates":"beginner",
  "sugar-reset-7":"beginner","caffeine-reset":"beginner","processed-food-reset":"beginner",
  "dry-reset-14":"beginner",
  // Intermediate — consistent effort or existing fitness base needed
  "running":"intermediate","cycling":"intermediate","yoga-flexibility":"intermediate",
  "core-abs":"intermediate","strength":"intermediate","30-pushups":"intermediate",
  "30-squats":"intermediate","30-plank":"intermediate","spin":"intermediate",
  "12-3-30":"intermediate","5k-prep":"intermediate","protein-challenge":"intermediate",
  "weight-loss-30":"intermediate","body-composition":"intermediate",
  "glucose-control":"intermediate","sugar-reset-strict":"intermediate",
  "everest-bc":"intermediate","west-highland-way":"intermediate","everest-stairmaster":"intermediate","kilimanjaro-stairmaster":"intermediate","montblanc-stairmaster":"intermediate","thames-row":"intermediate",
  // Advanced — high consistency demands or health-sensitive protocols
  "75-soft":"advanced","10k-prep":"advanced","run-streak":"advanced",
  "cold-exposure":"advanced","half-marathon-prep":"advanced",
  "cruise-control":"advanced","intermittent-fasting":"advanced",
  "monk-mode":"advanced","project-50":"advanced",
  "camino":"advanced","tour-du-mont-blanc":"advanced","john-muir-trail":"advanced",
  "route66":"advanced","raid-pyrenees":"advanced",
  "danube-row":"advanced","comrades-ultra":"advanced","appalachian":"advanced",
  "tour-de-france":"advanced",
  // Extreme — elite output, multi-month commitment, or medical risk
  "75-hard":"extreme","marathon-training":"extreme",
  // HYROX — advanced functional racing
  "hyrox":"advanced",
  "ironman-703":"extreme","ironman-full":"extreme",
  "tough-mudder":"extreme","spartan-race":"extreme",
  "utmb":"extreme","run-5-marathons":"extreme","run-jogle":"extreme",
  "run-trans-america":"extreme","trans-am-bike":"extreme","pct":"extreme",
  "amazon-river":"extreme",
  // New challenges
  "steps-10k":"beginner","zone2":"intermediate","recovery-reset":"beginner",
  "fiber-challenge":"beginner","declutter":"beginner",
  // Strength single-movement progressions
  "pull-up-challenge":"intermediate","burpee-challenge":"intermediate","dip-challenge":"intermediate",
  "kettlebell":"intermediate","calisthenics":"advanced",
  // New challenges
  "self-care-30":"beginner","gratitude-reset":"beginner","mental-health-30":"beginner",
  "morning-power-hour":"intermediate","posture-fix":"beginner",
  // New challenge templates
  "beginner-strength":"beginner","pushup-challenge":"beginner","pullup-progression":"intermediate",
  "language-learning":"intermediate","budget-reset":"beginner","mindful-eating":"beginner",
  "nature-reset":"beginner",
  "start-small":"beginner","reset-week":"beginner","momentum-builder":"intermediate",
  "lean-start":"intermediate","fat-loss-foundation":"intermediate","stress-reset":"beginner",
  "deep-work-sprint":"intermediate","strength-foundation":"beginner",
};
const DIFF_LABEL = { beginner:"Beginner", intermediate:"Intermediate", advanced:"Advanced", extreme:"Extreme" };
const DIFF_COLOR = { beginner:"var(--text-dim)", intermediate:"var(--text)", advanced:"var(--secondary)", extreme:"var(--primary)" };

// Safety warnings for high-risk or health-sensitive challenges
const TEMPLATE_SAFETY = {
  "intermittent-fasting": "Not suitable if you are pregnant, have a history of eating disorders, take diabetes medication, or have any chronic illness. Consult your doctor before starting.",
  "cold-exposure": "Never combine breathwork with cold water immersion — risk of fainting or drowning. Breathe normally during cold showers or plunges. Start gradually (end showers cold for 30 seconds, building over time). Consult your doctor before starting if you have cardiovascular, respiratory, or circulatory conditions.",
  "75-hard": "Two 45-min workouts daily plus strict dieting. High injury and burnout risk if untrained. Get medical clearance if you have any pre-existing health conditions.",
  "blood-pressure": "Tracking only — does not replace medical care. If readings are high or you have symptoms (chest pain, headache, dizziness), see a doctor immediately.",
  "glucose-control": "Tracking only. Never adjust medication or insulin based on app readings. Always consult your healthcare provider.",
  "hydration": "Personalise your target to your size and climate. Do not exceed 3–4L per day without medical guidance — excess water can cause hyponatremia.",
  "marathon-training": "High volume increases injury risk. Rest days are mandatory. Consult a doctor before starting if you have cardiovascular or joint conditions.",
  "ironman-703": "Extreme training volume. Medical clearance recommended. Never skip recovery days.",
  "ironman-full": "Maximum endurance stress. Medical clearance is strongly recommended. Overtraining and injury risk is very high.",
  "tough-mudder": "Includes cold water obstacles and contact elements. Consult a doctor if you have cardiovascular, joint, or cold-sensitivity conditions.",
  "spartan-race": "High-intensity obstacle training. Consult a doctor if you have cardiovascular or joint conditions.",
  "cruise-control": "Intense multi-habit daily protocol. Not suitable if you have joint issues, cardiovascular conditions, or are new to exercise.",
  "hyrox": "High-intensity functional fitness with heavy sleds, carries, and running. Consult a doctor before starting if you have cardiovascular, joint, or lower-back conditions. Progress loads gradually — do not start at race weight.",
};

const ENDUR_TEMPLATE_IDS = new Set([
  "dog-walk","cycling","running","zone2","hyrox","half-marathon-prep","marathon-training",
  "ironman-703","ironman-full","tough-mudder","spartan-race","c25k","5k-prep","10k-prep",
  "everest-bc","west-highland-way","tour-du-mont-blanc","john-muir-trail","camino","appalachian",
  "tour-de-france","route66","amazon-river","pct","everest-stairmaster","kilimanjaro-stairmaster",
  "montblanc-stairmaster","comrades-ultra","utmb","run-5-marathons","run-jogle","run-trans-america",
  "raid-pyrenees","trans-am-bike","thames-row","danube-row"
]);

function isConqurTemplate(t) {
  return !!t && !t.deprecated && t.category !== "expedition" && !ENDUR_TEMPLATE_IDS.has(t.id);
}

// Challenge template → tier
const TEMPLATE_TIERS = {
  // ── Common: 30-day-or-less lifestyle, beginner-friendly
  "dry-month":"common","reading":"common","creative":"common",
  "meditation":"common","sleep-reset":"common","yoga-flexibility":"common",
  "digital-detox":"common","walking":"common","journaling":"common",
  "sugar-reset-7":"common","caffeine-reset":"common","processed-food-reset":"common",
  "dry-reset-14":"common",
  // ── Uncommon: 30-day fitness / requires real consistency
  "30-pushups":"uncommon","dog-walk":"uncommon","cycling":"uncommon",
  "running":"uncommon","strength":"uncommon","no-sugar":"uncommon",
  "morning-routine":"uncommon","core-abs":"uncommon","sugar-reset-strict":"uncommon",
  // ── Rare: mentally demanding, 75-day, or short expedition
  "cold-exposure":"rare","intermittent-fasting":"rare",
  "75-soft":"rare","everest-bc":"rare","monk-mode":"rare","montblanc-stairmaster":"rare",
  // ── Epic: strict 75-day, 86-day transformation, long expeditions
  "75-hard":"epic","cruise-control":"epic","camino":"epic","tour-de-france":"epic","tour-du-mont-blanc":"epic","john-muir-trail":"epic","kilimanjaro-stairmaster":"epic",
  // ── Legendary: year-long or extreme challenges
  "appalachian":"legendary","route66":"legendary",
  "amazon-river":"legendary","everest-stairmaster":"legendary","pct":"legendary",
  "run-trans-america":"legendary","trans-am-bike":"legendary",
  // ── Epic: demanding multi-month expeditions
  "run-jogle":"epic","danube-row":"epic",
  // ── Rare: shorter expedition routes
  "west-highland-way":"rare","run-5-marathons":"rare","raid-pyrenees":"rare","thames-row":"rare",
  "comrades-ultra":"rare",
  // ── New movement challenges
  "c25k":"uncommon","5k-prep":"uncommon","10k-prep":"rare",
  "run-streak":"uncommon","30-squats":"uncommon","30-plank":"uncommon",
  "pilates":"common","12-3-30":"uncommon","spin":"uncommon",
  // ── New nutrition / health habits
  "protein-challenge":"common","meal-prep":"common","hydration":"common",
  // ── New lifestyle / transformation
  "project-50":"rare","no-spend":"common",
  // ── Health tracking
  "weight-loss-30":"common","sleep-tracker":"common",
  "blood-pressure":"uncommon","glucose-control":"uncommon",
  "body-composition":"rare",
  // ── Endurance sport training
  "half-marathon-prep":"uncommon","marathon-training":"rare",
  "tough-mudder":"rare","spartan-race":"epic",
  "ironman-703":"epic","ironman-full":"legendary","hyrox":"epic",
  // ── Epic expedition
  "utmb":"epic",
  // New challenges
  "steps-10k":"common","zone2":"uncommon","recovery-reset":"common",
  "fiber-challenge":"common","declutter":"common",
  // Strength single-movement progressions
  "pull-up-challenge":"uncommon","burpee-challenge":"uncommon","dip-challenge":"uncommon",
  "kettlebell":"uncommon","calisthenics":"rare",
  // New challenges
  "self-care-30":"common","gratitude-reset":"common","mental-health-30":"common",
  "morning-power-hour":"uncommon","posture-fix":"common",
  // New challenge templates
  "beginner-strength":"common","pushup-challenge":"common","pullup-progression":"uncommon",
  "language-learning":"uncommon","budget-reset":"common","mindful-eating":"common",
  "nature-reset":"common",
  "start-small":"common","reset-week":"common","momentum-builder":"uncommon",
  "lean-start":"uncommon","fat-loss-foundation":"rare","stress-reset":"common",
  "deep-work-sprint":"uncommon","strength-foundation":"common",
};

// Universal / Lifetime badge → tier (template badges inherit their template's tier)
const BADGE_TIERS = {
  // Universal — streaks
  "u-3d":"common","u-7d":"common","u-14d":"uncommon","u-21d":"uncommon",
  "u-30d":"rare","u-60d":"epic","u-75d":"legendary",
  // Universal — points
  "u-p10":"common","u-p100":"uncommon","u-p500":"rare","u-p1k":"epic",
  // Universal — body
  "u-scale":"common","u-1lb":"common","u-5lb":"uncommon","u-10lb":"rare","u-wgoal":"epic",
  // Universal — modes & behavior
  "u-cmback":"common",
  // Universal — challenge milestones
  "u-first":"common","u-done1":"uncommon","u-done3":"rare","u-multi":"uncommon",
  // Lifetime
  "lt-100h":"uncommon","lt-500h":"rare","lt-5c":"epic","lt-cats":"rare",
  "lt-wk10":"uncommon","lt-perf":"legendary","lt-freeze":"uncommon",
};

// ── Built-in Templates ─────────────────────────────────────────────────────

const TEMPLATES = [
  {
    id: "cruise-control", name: "Mental Toughness", emoji: "🔱", category: "transformation",
    description: "30 days that change everything. Body, habits, and an unbreakable mind.",
    duration: 30, weeklyGoal: 90, defaultMode: "soft",
    habits: [
      { id:"yoga",      title:"Yoga or mobility",          emoji:"🧘", quip:"Sets the tone for everything after.",      type:"binary", points:2 },
      { id:"steps",     title:"Steps",                     emoji:"👟", quip:"8k / 10k / 15k steps.",                  type:"tiered", points:2,
        tiers:[{value:8,label:"8k",points:2},{value:10,label:"10k",points:3},{value:15,label:"15k",points:4}] },
      { id:"protein",   title:"Protein at every meal",     emoji:"🥩", quip:"Protein keeps the muscle, drops the fat.", type:"binary", points:2 },
      { id:"noalcohol", title:"No alcohol or sugary drinks",emoji:"🚫", quip:"Empty calories in every form. Skip them.", type:"binary", points:2 },
      { id:"read",      title:"Read 10 pages",             emoji:"📖", quip:"10 pages a day is a book a month.",       type:"binary", points:2 },
      { id:"run",       title:"Training session",          emoji:"🏃", quip:"Run, lift, ride — push yourself.",        type:"tiered",  points:2,
        tiers:[{value:1,label:"1 km",points:2},{value:3,label:"3 km",points:3},{value:5,label:"5 km",points:5},{value:"5+",label:"5 km+",points:7}] },
    ]
  },
  {
    id: "75-hard", name: "75 Hard-Style", emoji: "💪", category: "transformation",
    description: "The original mental toughness program. 75 days. Zero compromises.",
    duration: 75, weeklyGoal: 91, defaultMode: "strict", noRestDay: true,
    habits: [
      { id:"w1",       title:"Workout 1 — 45 min",          emoji:"🏋️", quip:"First session done.",               type:"binary", points:3 },
      { id:"w2",       title:"Workout 2 — 45 min outdoors", emoji:"🌤️", quip:"Outdoor. No exceptions.",            type:"binary", points:3 },
      { id:"diet",     title:"Follow diet. No sugar, no alcohol, no fast food.",emoji:"🥗", quip:"Whole foods only. Pre-plan your meals if needed.",        type:"binary", points:2 },
      { id:"read10",   title:"Read 10 pages (non-fiction)", emoji:"📖", quip:"10 pages of growth.",               type:"binary", points:2 },
      { id:"water75",  title:"Drink 1 gallon (3.8L) water", emoji:"💧", quip:"One gallon. Every day. No exceptions. This is the 5th pillar.", type:"tiered", points:2,
        tiers:[{label:"2–3L",pts:1},{label:"3–3.5L",pts:2},{label:"3.8L+ (1 gallon)",pts:3}] },
    ]
  },
  {
    id: "75-soft", name: "75 Soft", emoji: "🧘", category: "transformation",
    description: "The balanced version. 75 days of consistent, sustainable habits.",
    duration: 75, weeklyGoal: 70, defaultMode: "soft",
    habits: [
      { id:"workout",  title:"Workout 45 min",                  emoji:"🏃", quip:"Move your body.",               type:"binary", points:3 },
      { id:"diet75s",  title:"Whole-food meals (1 social meal/wk ok)", emoji:"🥗", quip:"Balanced and real. Not perfect.", type:"binary", points:2 },
      { id:"read10s",  title:"Read 10 pages",                   emoji:"📖", quip:"10 pages a day.",              type:"binary", points:2 },
      { id:"hydrate75s",title:"Hydration target",               emoji:"💧", quip:"2L minimum. More on training days.",   type:"binary", points:1 },
    ]
  },
  {
    id: "dry-month", name: "Dry Month", emoji: "🥃", category: "lifestyle",
    description: "30 days, zero alcohol. Feel the difference.",
    duration: 30, weeklyGoal: 40, defaultMode: "strict",
    habits: [
      { id:"noalc",    title:"No alcohol",                  emoji:"🚫", quip:"Not today.",                        type:"binary", points:4 },
      { id:"journal",  title:"Journal 5 min",               emoji:"✍️", quip:"Write it out.",                   type:"binary", points:2 },
    ]
  },
  {
    id: "reading", name: "Reading Challenge", emoji: "📚", category: "lifestyle",
    description: "Read every day for 30 days. 10 pages minimum.",
    duration: 30, weeklyGoal: 60, defaultMode: "soft",
    habits: [
      { id:"readpg",   title:"Read 10 pages",               emoji:"📖", quip:"10 pages a day is a book a month.", type:"binary", points:4 },
      { id:"noscreen", title:"No screens 1 hr before bed",  emoji:"📵", quip:"Protect your sleep and focus.",    type:"binary", points:2 },
      { id:"reflect",  title:"Reflect on what you read",    emoji:"🧠", quip:"Understanding beats volume.",      type:"binary", points:2 },
    ]
  },
  {
    id: "dog-walk", name: "Dog Walk Challenge", emoji: "🐕", category: "movement",
    description: "30 days of daily walks with your dog. Fresh air, consistency, and happy paws.",
    duration: 30, weeklyGoal: 75, defaultMode: "soft",
    habits: [
      { id:"dw-walk",    title:"Morning walk",              emoji:"🌅", quip:"Start the day right — both of you.", type:"binary", points:3 },
      { id:"dw-dist",    title:"Log walk distance",         emoji:"📍", quip:"Short is fine. Going is everything.", type:"tiered", points:2,
        tiers:[{value:1,label:"1 km",points:2},{value:2,label:"2 km",points:3},{value:4,label:"4 km",points:4},{value:6,label:"6 km+",points:6}] },
      { id:"dw-evening", title:"Evening walk",              emoji:"🌆", quip:"Wind down together.",               type:"binary", points:2 },
      { id:"dw-water",   title:"Fresh water for your dog",  emoji:"💧", quip:"Hydration matters for them too.",   type:"binary", points:1 },
    ]
  },
  {
    id: "cycling", name: "Cycling Challenge", emoji: "🚴", category: "movement",
    description: "30 days in the saddle. Build endurance, torch calories, go farther than yesterday.",
    duration: 30, weeklyGoal: 90, defaultMode: "soft",
    habits: [
      { id:"cy-ride",    title:"Bike ride",                 emoji:"🚲", quip:"Clip in. Show up.",                  type:"tiered", points:3,
        tiers:[{value:5,label:"5 km",points:3},{value:15,label:"15 km",points:4},{value:30,label:"30 km",points:6},{value:50,label:"50 km+",points:9}] },
      { id:"cy-stretch", title:"Stretch & recover",         emoji:"🦵", quip:"The ride you can do tomorrow depends on this.", type:"binary", points:2 },
      { id:"cy-log",     title:"Log distance or time",      emoji:"📊", quip:"Track it. Every session tells a story.",        type:"binary", points:1 },
    ]
  },
  {
    id: "walking", name: "Walking Challenge", emoji: "🚶", category: "movement",
    description: "30 days of daily walking. The simplest habit with the biggest returns.",
    duration: 30, weeklyGoal: 50, defaultMode: "soft",
    habits: [
      { id:"wk-dist",    title:"Daily walk",                emoji:"👟", quip:"Every step counts.",                 type:"tiered", points:2,
        tiers:[{value:2,label:"2 km",points:2},{value:5,label:"5 km",points:3},{value:8,label:"8 km",points:4},{value:10,label:"10 km+",points:6}] },
      { id:"wk-phone",   title:"Phone-free walk",           emoji:"📵", quip:"Just you and your thoughts.",       type:"binary", points:2 },
      { id:"wk-stairs",  title:"Take the stairs all day",   emoji:"🏢", quip:"Small choices add up.",             type:"binary", points:1 },
    ]
  },
  {
    id: "steps-10k", name: "10,000 Steps", emoji: "👟", category: "movement", deprecated: true,
    description: "30 days of hitting 10,000 steps every day. The most evidence-backed daily movement habit there is.",
    duration: 30, weeklyGoal: 28, defaultMode: "soft",
    habits: [
      { id:"ts-steps",   title:"Hit step target",           emoji:"👟", quip:"10k is the goal. Beat it when you can.", type:"tiered", points:4,
        tiers:[{label:"5,000–7,999",pts:2},{label:"8,000–9,999",pts:3},{label:"10,000+",pts:5}] },
      { id:"ts-outside", title:"30 min outside",            emoji:"🌳", quip:"Fresh air and daylight improve focus and mood.",              type:"binary", points:1 },
    ]
  },
  {
    id: "running", name: "Running Challenge", emoji: "🏃", category: "movement",
    description: "30 days of running. Build the habit, find the pace, feel the difference. Rest days are encouraged — 4–5 sessions per week is plenty and helps prevent injury.",
    duration: 30, weeklyGoal: 80, defaultMode: "soft",
    habits: [
      { id:"rn-run",     title:"Run session",               emoji:"👟", quip:"Shoes on. Door open. Go.",           type:"tiered", points:3,
        tiers:[{value:1,label:"1 km",points:3},{value:3,label:"3 km",points:4},{value:5,label:"5 km",points:6},{value:10,label:"10 km+",points:9}] },
      { id:"rn-log",     title:"Log your mileage",          emoji:"📊", quip:"What gets tracked gets improved.",   type:"binary", points:1 },
      { id:"rn-stretch", title:"Post-run stretch",          emoji:"🧘", quip:"Skipping this is how injuries happen.", type:"binary", points:2 },
    ]
  },
  {
    id: "creative", name: "Creative Challenge", emoji: "🎨", category: "lifestyle",
    description: "30 days of daily creative practice. Write, draw, build, make — just create something.",
    duration: 30, weeklyGoal: 70, defaultMode: "soft",
    habits: [
      { id:"cr-create",  title:"Create something today",    emoji:"✨", quip:"It doesn't have to be good. It has to exist.", type:"binary", points:4 },
      { id:"cr-idea",    title:"Brainstorm 10 ideas",       emoji:"💡", quip:"Most will be bad. That's the point.", type:"binary", points:2 },
      { id:"cr-study",   title:"Study your craft (20+ min)", emoji:"📚", quip:"The greats never stop learning.",    type:"binary", points:2 },
      { id:"cr-noscroll",title:"No social media scrolling",     emoji:"📵", quip:"Consumption kills creation.",        type:"binary", points:2 },
    ]
  },
  {
    id: "strength", name: "Strength Training", emoji: "🏋️", category: "movement",
    description: "30 days of consistent lifting. Build the habit, then build the muscle. Rest and recovery days are part of the process — 3–4 training days per week is realistic and sustainable.",
    duration: 30, weeklyGoal: 55, defaultMode: "soft",
    habits: [
      { id:"st-lift",    title:"Lift session",              emoji:"🏋️", quip:"Show up. Lift. Repeat.",               type:"binary", points:5 },
      { id:"st-overload",title:"Progressive overload logged",emoji:"📊", quip:"Did you do more than last time? Log it.",type:"binary", points:2 },
      { id:"st-stretch", title:"Post-lift stretch",         emoji:"🦵", quip:"Skipping this is how injuries happen.",type:"binary", points:1 },
    ]
  },
  {
    id: "meditation", name: "Meditation", emoji: "🧘", category: "lifestyle",
    description: "30 days of daily stillness. Calm the mind, sharpen the focus.",
    duration: 30, weeklyGoal: 60, defaultMode: "soft",
    habits: [
      { id:"med-sit",    title:"Meditate 10 min",           emoji:"🧘", quip:"10 minutes. Eyes closed. Phone away.", type:"binary", points:4 },
      { id:"med-breath", title:"Breathing exercise",        emoji:"💨", quip:"4-7-8 or box breathing. Just breathe.",type:"binary", points:2 },
      { id:"med-journal",title:"Gratitude journal",         emoji:"✍️", quip:"Three things. Two minutes.",           type:"binary", points:2 },
    ]
  },
  {
    id: "cold-exposure", name: "Cold Exposure", emoji: "🧊", category: "transformation",
    description: "30 days of cold showers. Builds mental resilience like nothing else.",
    duration: 30, weeklyGoal: 65, defaultMode: "soft",
    habits: [
      { id:"ce-cold",    title:"Cold shower",               emoji:"🧊", quip:"Get in. Don't think about it.",        type:"binary", points:5 },
      { id:"ce-breath",  title:"Pre-cold breathing",         emoji:"💨", quip:"Do this before stepping in — never during cold water.", type:"binary", points:2 },
      { id:"ce-reflect", title:"Post-session reflection",   emoji:"🧠", quip:"Hardship processed becomes growth.",   type:"binary", points:2 },
    ]
  },
  {
    id: "sleep-reset", name: "Sleep Reset", emoji: "😴", category: "lifestyle",
    description: "21 days to fix your sleep. Consistent schedule, no screens, real rest.",
    duration: 21, weeklyGoal: 70, defaultMode: "soft",
    habits: [
      { id:"sl-hours",   title:"7+ hour sleep opportunity", emoji:"🌙", quip:"In bed for 7+ hours. Sleep does the rest.", type:"binary", points:4 },
      { id:"sl-screen",  title:"No screens after 9pm",      emoji:"📵", quip:"Blue light kills melatonin.",          type:"binary", points:3 },
      { id:"sl-caffeine",title:"No caffeine after 2pm",     emoji:"☕", quip:"It stays in your system 6+ hours.",    type:"binary", points:2 },
      { id:"sl-routine", title:"Same wake-up time",         emoji:"⏰", quip:"Consistency locks the rhythm.",        type:"binary", points:2 },
    ]
  },
  {
    id: "no-sugar", name: "No Added Sugar", emoji: "🚫🍬", category: "lifestyle",
    description: "30 days without added sugar. Clearer skin, steadier energy, fewer crashes.",
    duration: 30, weeklyGoal: 35, defaultMode: "strict",
    habits: [
      { id:"ns-nosugar",  title:"No added sugar today",      emoji:"🚫", quip:"Read the label. It's in everything.",   type:"binary", points:5 },
      { id:"ns-fruit",    title:"Eat whole fruit (no juice)",emoji:"🍎", quip:"Fibre intact. Spike avoided.",          type:"binary", points:1 },
      { id:"ns-label",    title:"Read every food label",     emoji:"🔍", quip:"Knowledge is the weapon.",             type:"binary", points:1 },
    ]
  },
  {
    id: "sugar-reset-7", name: "Sugar Reset — 7 Day Starter", emoji: "🍬", category: "lifestyle",
    description: "A gentle 7-day on-ramp before you commit to 30. Cut added sugar, keep it simple.",
    duration: 7, weeklyGoal: 21, defaultMode: "soft",
    habits: [
      { id:"sr7-nosugar", title:"No added sugar today",              emoji:"🚫", quip:"Read the label. It's in everything.", type:"binary", points:4 },
      { id:"sr7-craving", title:"Swap a craving for fruit or water", emoji:"🍎", quip:"Give the urge somewhere to go.",       type:"binary", points:2 },
    ]
  },
  {
    id: "sugar-reset-strict", name: "Zero Sugar — 30 Day Strict", emoji: "🚫", category: "lifestyle",
    description: "No added sugar, no artificial sweeteners, no fruit juice. The hard version of a sugar reset.",
    duration: 30, weeklyGoal: 55, defaultMode: "strict",
    habits: [
      { id:"zs-nosugar", title:"No added sugar or sweeteners", emoji:"🚫", quip:"Real or artificial — both stay off the list.", type:"binary", points:5 },
      { id:"zs-nojuice", title:"No fruit juice or soda",       emoji:"🥤", quip:"Whole fruit only. Juice is sugar water.",       type:"binary", points:2 },
      { id:"zs-label",   title:"Read every food label",       emoji:"🔍", quip:"It hides under 60 different names.",            type:"binary", points:1 },
    ]
  },
  {
    id: "caffeine-reset", name: "Caffeine Reset", emoji: "☕", category: "lifestyle",
    description: "14 days to reset your tolerance. Cut the afternoon crash, sleep like it's supposed to feel.",
    duration: 14, weeklyGoal: 30, defaultMode: "soft",
    habits: [
      { id:"cr-cutoff",  title:"No caffeine after 12pm",           emoji:"⏰", quip:"It's still in your system 8 hours later.", type:"binary", points:3 },
      { id:"cr-hydrate", title:"Water before you reach for coffee", emoji:"💧", quip:"Half the time you're just thirsty.",       type:"binary", points:2 },
      { id:"cr-sleep",   title:"Sleep 7+ hours",                   emoji:"😴", quip:"This is the whole point. Watch it improve.", type:"binary", points:2 },
    ]
  },
  {
    id: "processed-food-reset", name: "Processed Food Reset", emoji: "🥗", category: "lifestyle",
    description: "21 days of whole foods only. Read less, cook more.",
    duration: 21, weeklyGoal: 45, defaultMode: "soft",
    habits: [
      { id:"pfr-whole", title:"Whole-food meals only",          emoji:"🥦", quip:"If it has a wrapper, it's probably not it.", type:"binary", points:4 },
      { id:"pfr-cook",  title:"Cook at least one meal at home", emoji:"🍳", quip:"You control what goes in.",                  type:"binary", points:3 },
      { id:"pfr-label", title:"Check the ingredient list",      emoji:"🔍", quip:"5 ingredients or fewer is a good sign.",      type:"binary", points:1 },
    ]
  },
  {
    id: "dry-reset-14", name: "Dry Reset — 14 Day", emoji: "🥃", category: "lifestyle",
    description: "A shorter on-ramp before Dry Month. 14 days, zero alcohol.",
    duration: 14, weeklyGoal: 18, defaultMode: "soft",
    habits: [
      { id:"dr14-noalc",   title:"No alcohol",    emoji:"🚫", quip:"Not today.",   type:"binary", points:4 },
      { id:"dr14-journal", title:"Journal 5 min", emoji:"✍️", quip:"Write it out.", type:"binary", points:2 },
    ]
  },
  {
    id: "morning-routine", name: "Morning Routine", emoji: "🌅", category: "lifestyle",
    description: "30 days of owning the first hour. Win the morning, win the day.",
    duration: 30, weeklyGoal: 80, defaultMode: "soft",
    habits: [
      { id:"mr-wake",     title:"Wake up on time — no snooze",emoji:"⏰", quip:"First decision of the day. Make it right.", type:"binary", points:3 },
      { id:"mr-move",     title:"Move for 10 min",            emoji:"🏃", quip:"Walk, stretch, yoga, or workout — anything counts.", type:"binary", points:3 },
      { id:"mr-nophone",  title:"No phone for first 30 min",  emoji:"📵", quip:"Protect your mind before the world gets in.", type:"binary", points:2 },
      { id:"mr-hydrate",  title:"Drink water before coffee",  emoji:"💧", quip:"You wake up dehydrated every time.",   type:"binary", points:1 },
      { id:"mr-journal",  title:"Write 3 priorities for today",emoji:"📓",quip:"Clear mind. Clear direction.",          type:"binary", points:2 },
    ]
  },
  {
    id: "yoga-flexibility", name: "Yoga & Mobility", emoji: "🧘‍♀️", category: "movement",
    description: "30 days of yoga, stretching, and mobility work. Move better, recover faster, feel lighter.",
    duration: 30, weeklyGoal: 42, defaultMode: "soft",
    habits: [
      { id:"yf-yoga",     title:"Yoga or mobility (10 min+)", emoji:"🧘", quip:"Mat out. 10 minutes is enough. Just start.", type:"binary", points:4 },
      { id:"yf-stretch",  title:"Full-body stretch",          emoji:"🦵", quip:"Tight muscles are slow muscles.",           type:"binary", points:2 },
      { id:"yf-breathe",  title:"Breathwork (5 min)",         emoji:"💨", quip:"Breath controls everything else.",          type:"binary", points:2 },
    ]
  },
  {
    id: "digital-detox", name: "Digital Detox", emoji: "📵", category: "lifestyle",
    description: "30 days of intentional screen use. Take back your attention.",
    duration: 30, weeklyGoal: 70, defaultMode: "soft",
    habits: [
      { id:"dd-limit",    title:"Max 1h social media",        emoji:"📱", quip:"Your attention is the product. Guard it.", type:"binary", points:4 },
      { id:"dd-morning",  title:"No phone first 30 min",      emoji:"🌅", quip:"Start the day on your terms.",            type:"binary", points:3 },
      { id:"dd-nobed",    title:"No phone in bed",            emoji:"🛏️", quip:"Better sleep starts here.",               type:"binary", points:2 },
      { id:"dd-outside",  title:"Spend 30 min outside",       emoji:"🌳", quip:"Real world. Real rest.",                  type:"binary", points:2 },
    ]
  },
  {
    id: "intermittent-fasting", name: "Intermittent Fasting", emoji: "⏱️", category: "transformation",
    description: "30 days of 16:8. Eat in an 8-hour window, fast for 16. Simple, effective.",
    duration: 30, weeklyGoal: 70, defaultMode: "soft",
    habits: [
      { id:"if-fast",     title:"16-hour fast completed",     emoji:"⏱️", quip:"The window is the whole game.",          type:"binary", points:5 },
      { id:"if-water",    title:"Drink water during fast",    emoji:"💧", quip:"Water, black coffee, and tea only.",     type:"binary", points:2 },
      { id:"if-nosnack",  title:"No snacking outside window", emoji:"🚫", quip:"Discipline between meals matters.",      type:"binary", points:2 },
      { id:"if-protein",  title:"Protein-first meal",         emoji:"🥩", quip:"Break the fast right.",                  type:"binary", points:1 },
    ]
  },
  {
    id: "core-abs", name: "Core & Abs", emoji: "🔥", category: "movement",
    description: "30 days of core work. Planks, crunches, leg raises — build real strength. Rest days are welcome; muscles grow during recovery, not just during training.",
    duration: 30, weeklyGoal: 70, defaultMode: "soft",
    habits: [
      { id:"ca-core",     title:"Core workout (15 min)",      emoji:"💪", quip:"15 minutes. No excuses.",                type:"binary", points:5 },
      { id:"ca-plank",    title:"Plank hold",                 emoji:"⏱️", quip:"The plank is honest.",                   type:"tiered", points:2,
        tiers:[{label:"Under 1 min",pts:2},{label:"1–2 min",pts:4},{label:"2+ min",pts:6}] },
      { id:"ca-stretch",  title:"Hip flexor stretch",         emoji:"🦵", quip:"Core work tightens everything. Stretch.", type:"binary", points:1 },
    ]
  },

  {
    id: "journaling", name: "Daily Journaling", emoji: "✍️", category: "lifestyle",
    description: "30 days of daily writing. Process your thoughts, track your growth, find clarity.",
    duration: 30, weeklyGoal: 70, defaultMode: "soft",
    habits: [
      { id:"jn-write",  title:"Write in journal",         emoji:"📓", quip:"Even five minutes counts. Just start.",          type:"binary", points:4 },
      { id:"jn-prompt", title:"Answer a writing prompt",  emoji:"💡", quip:"A question asked is a thought unlocked.",        type:"binary", points:2 },
      { id:"jn-gratit", title:"List 3 gratitudes",        emoji:"🙏", quip:"What you appreciate, appreciates.",              type:"binary", points:2 },
      { id:"jn-review", title:"Review yesterday's entry", emoji:"🔄", quip:"Reflection compounds the learning.",            type:"binary", points:1 },
    ]
  },
  {
    id: "monk-mode", name: "Monk Mode", emoji: "🧠", category: "transformation",
    description: "30 days of intense focus. No social media, no distractions — just deep work, learning, and execution.",
    duration: 30, weeklyGoal: 100, defaultMode: "soft",
    habits: [
      { id:"mm-focus",   title:"Deep work — 2 hours",    emoji:"💻", quip:"Two hours. Zero distractions. Phone off.",        type:"binary", points:5 },
      { id:"mm-nosocial",title:"No social media",        emoji:"📵", quip:"Your attention is your most valuable asset.",      type:"binary", points:3 },
      { id:"mm-learn",   title:"Deliberate learning — 1h",emoji:"📚",quip:"One hour of intentional study every day.",        type:"binary", points:3 },
      { id:"mm-move",    title:"Move for 30 min",        emoji:"🏃", quip:"The mind needs a body that moves.",               type:"binary", points:2 },
      { id:"mm-reflect", title:"Evening reflection",     emoji:"✍️", quip:"What did you build today?",                       type:"binary", points:2 },
    ]
  },

  // ── Endurance Sport Training ─────────────────────────────────────────────
  {
    id: "zone2", name: "Zone 2 Base Builder", emoji: "💚", category: "endurance",
    description: "30 days of low-intensity cardio at conversational pace. The aerobic foundation that makes every other fitness goal easier.",
    duration: 30, weeklyGoal: 65, defaultMode: "soft",
    habits: [
      { id:"z2-session",  title:"Zone 2 session",            emoji:"💚", quip:"Conversational pace. Nasal breathing. 30–60 min.", type:"tiered", points:5,
        tiers:[{label:"20–30 min",pts:5},{label:"30–45 min",pts:7},{label:"45–60 min",pts:9}] },
      { id:"z2-check",    title:"Zone 2 effort check",        emoji:"🗣️", quip:"Could you hold a conversation? If not, slow down next time.", type:"binary", points:1 },
      { id:"z2-mobility", title:"Mobility (5 min)",           emoji:"🧘", quip:"Keep the body feeling good as volume builds.",            type:"binary", points:2 },
    ]
  },
  {
    id: "hyrox", name: "HYROX Training", emoji: "⚡", category: "endurance",
    description: "12 weeks of race-ready functional fitness. 4 training days per week: strength, running, WOD circuits, and full race simulations.",
    duration: 84, weeklyGoal: 70, defaultMode: "soft",
    weekSchedule: [
      { day:1, type:"strength",  label:"Strength",          emoji:"🏋️", desc:"Squats, deadlifts, overhead press. Build the base that powers every HYROX station." },
      { day:2, type:"easy",      label:"Easy Run",           emoji:"🟢", desc:"6–8 km at conversational pace. RPE 3–4. HYROX is 8 km of running — build it now." },
      { day:3, type:"wod",       label:"HYROX WOD",          emoji:"⚡", desc:"Station circuit: SkiErg, sled push/pull, burpee broad jumps, row, farmers carry, sandbag lunges, wall balls." },
      { day:4, type:"rest",      label:"Rest Day",           emoji:"⚪", desc:"Full rest or easy walk. Recovery is where adaptation happens." },
      { day:5, type:"interval",  label:"Run Intervals",      emoji:"🟠", desc:"8×400m at race pace + 60 sec rest, or 4×1km tempo. RPE 7–8." },
      { day:6, type:"simulate",  label:"Race Simulation",    emoji:"🏆", desc:"Full HYROX: 8×1km run interleaved with all 8 stations at race pace. This is what it's all for." },
      { day:7, type:"rest",      label:"Rest Day",           emoji:"⚪", desc:"Full rest. Eat well. Sleep 8 hours. You've earned it." },
    ],
    habits: [
      { id:"hx-session",  title:"Training session",          emoji:"⚡", quip:"Strength, WOD, run, or race sim — log what you did.",
        type:"tiered", points:5, tiers:[{label:"Easy 30 min",pts:5},{label:"WOD or run 45+ min",pts:7},{label:"Race simulation 60+ min",pts:10}] },
      { id:"hx-run",      title:"Run distance",              emoji:"🏃", quip:"HYROX is 8 km of running. Build the base every week.",
        type:"tiered", points:4, tiers:[{label:"3 km",pts:4},{label:"5 km",pts:6},{label:"8 km+",pts:8}] },
      { id:"hx-stations", title:"Station drills",            emoji:"🔔", quip:"SkiErg, sled, row, burpees, carries, lunges, wall balls.", type:"binary", points:4 },
      { id:"hx-recover",  title:"Post-session recovery",     emoji:"🦵", quip:"Foam roll, stretch, and eat. Recovery builds the athlete.", type:"binary", points:2 },
    ]
  },
  {
    id: "half-marathon-prep", name: "Half Marathon Prep", emoji: "🏃", category: "endurance",
    description: "12 weeks to race day. Built-in weekly schedule: easy runs, tempo, long run, cross-train, and 2 rest days.",
    duration: 84, weeklyGoal: 75, defaultMode: "soft",
    weekSchedule: [
      { day:1, type:"easy",  label:"Easy Run",    emoji:"🟢", desc:"30–40 min at conversational pace. RPE 3–4." },
      { day:2, type:"rest",  label:"Rest Day",    emoji:"⚪", desc:"Full rest or easy walk. Recovery is training." },
      { day:3, type:"tempo", label:"Tempo Run",   emoji:"🟡", desc:"20–30 min at comfortably hard pace. RPE 6–7." },
      { day:4, type:"easy",  label:"Easy Run",    emoji:"🟢", desc:"30–40 min easy. Keep it conversational." },
      { day:5, type:"rest",  label:"Rest Day",    emoji:"⚪", desc:"Rest day. Prep mentally for tomorrow's long run." },
      { day:6, type:"long",  label:"Long Run",    emoji:"🔴", desc:"The week's key session. Slow and steady. Add 1–2 km each week." },
      { day:7, type:"cross", label:"Cross-Train", emoji:"🔵", desc:"Swim, bike, yoga, or strength. Easy effort only." },
    ],
    habits: [
      { id:"hm-run",    title:"Scheduled run",              emoji:"🏃", quip:"Log the type of run you completed.", type:"tiered", points:5,
        tiers:[{label:"Easy 20–30 min",pts:5},{label:"Tempo 30–40 min",pts:7},{label:"Long run 60+ min",pts:9},{label:"Interval session",pts:7}] },
      { id:"hm-xt",     title:"Cross-train session",        emoji:"🚴", quip:"Swim, bike, yoga, or strength — anything non-run.", type:"binary", points:3 },
      { id:"hm-stretch",title:"Mobility work",              emoji:"🦵", quip:"Tight hips = slower times.",        type:"binary", points:2 },
      { id:"hm-fuel",   title:"Fuel + hydrate",             emoji:"🥗", quip:"Hit protein + 2L+ water. Carbs before long runs.", type:"binary", points:2 },
      { id:"hm-pain",   title:"Pain check",                 emoji:"💚", quip:"Yellow or red: drop the pace today.", type:"binary", points:1 },
    ]
  },
  {
    id: "marathon-training", name: "Marathon Training", emoji: "🏅", category: "endurance",
    description: "16 weeks to 42.2 km. Built-in schedule: easy runs, quality session, long run, cross-train, and 2 rest days.",
    duration: 112, weeklyGoal: 70, defaultMode: "soft",
    weekSchedule: [
      { day:1, type:"easy",     label:"Easy Run",      emoji:"🟢", desc:"45–60 min easy pace. Conversational. RPE 3–4." },
      { day:2, type:"rest",     label:"Rest Day",      emoji:"⚪", desc:"Full rest or foam rolling. Recovery is where you improve." },
      { day:3, type:"interval", label:"Quality Run",   emoji:"🟠", desc:"Intervals, tempo, or strides. RPE 7–8." },
      { day:4, type:"easy",     label:"Easy Run",      emoji:"🟢", desc:"30–45 min easy. Keep it easy — no heroics." },
      { day:5, type:"cross",    label:"Cross-Train",   emoji:"🔵", desc:"Swim, bike, strength, or yoga. 30–60 min easy effort." },
      { day:6, type:"long",     label:"Long Run",      emoji:"🔴", desc:"The week's anchor session. Slow, steady, and fuelled." },
      { day:7, type:"rest",     label:"Rest Day",      emoji:"⚪", desc:"Full rest. Eat well. Sleep. You've earned it." },
    ],
    habits: [
      { id:"mt-run",    title:"Scheduled session",     emoji:"🏃", quip:"Log the type of session you completed.", type:"tiered", points:5,
        tiers:[{label:"Easy 30–45 min",pts:5},{label:"Quality 40+ min",pts:7},{label:"Long run 90+ min",pts:9}] },
      { id:"mt-xt",     title:"Cross-train session",   emoji:"🏊", quip:"Active recovery is still recovery.",  type:"binary", points:3 },
      { id:"mt-stretch",title:"Stretch & foam roll",   emoji:"🦵", quip:"15 min saves your IT bands.",         type:"binary", points:2 },
      { id:"mt-fuel",   title:"Fuel & hydrate",        emoji:"🍌", quip:"Hit protein + carbs. Race-nutrition practice on long runs.", type:"binary", points:2 },
      { id:"mt-pain",   title:"No pain or injury",     emoji:"💚", quip:"Pain is information. Dial back if needed.", type:"binary", points:1 },
    ]
  },
  {
    id: "ironman-703", name: "Ironman 70.3", emoji: "🏊", category: "endurance",
    description: "20 weeks of swim, bike, run. Half the distance — all the glory.",
    duration: 140, weeklyGoal: 65, defaultMode: "soft",
    habits: [
      { id:"703-session",title:"Complete scheduled session", emoji:"🏊", quip:"Swim, bike, or run — log what the plan says.", type:"tiered", points:6,
        tiers:[{label:"30–45 min",pts:6},{label:"60–90 min",pts:8},{label:"90+ min",pts:10}] },
      { id:"703-log",    title:"Log sport and duration",    emoji:"📊", quip:"Track it. Your triathlon is built session by session.", type:"binary", points:2 },
      { id:"703-recover",title:"Recovery & stretch",        emoji:"🦵", quip:"Three sports means three ways to injure.",             type:"binary", points:2 },
    ]
  },
  {
    id: "ironman-full", name: "Full Ironman", emoji: "🏅", category: "endurance",
    description: "24 weeks to conquer 3.8 km swim, 180 km bike, and a full marathon. The ultimate endurance test.",
    duration: 168, weeklyGoal: 60, defaultMode: "soft",
    habits: [
      { id:"im-session", title:"Complete scheduled session", emoji:"🏊", quip:"Swim, bike, or run — log what the plan says.", type:"tiered", points:6,
        tiers:[{label:"45–60 min",pts:6},{label:"60–120 min",pts:8},{label:"120+ min",pts:10}] },
      { id:"im-strength",title:"Strength training",          emoji:"🏋️", quip:"Injury prevention starts in the gym.",        type:"binary", points:3 },
      { id:"im-recover", title:"Active recovery",            emoji:"🛁", quip:"Ice, compression, soft-tissue work — do at least one.", type:"binary", points:2 },
    ]
  },
  {
    id: "tough-mudder", name: "Tough Mudder Prep", emoji: "🪖", category: "endurance",
    description: "8 weeks to become obstacle-ready. Mud, walls, electric shocks — bring it on.",
    duration: 56, weeklyGoal: 70, defaultMode: "soft",
    habits: [
      { id:"tm-cardio",  title:"Cardio session",       emoji:"🏃", quip:"You'll be running 16–19 km on race day.",  type:"binary", points:5 },
      { id:"tm-strength",title:"Strength & lift",      emoji:"🏋️", quip:"Carry your teammates over walls.",        type:"binary", points:5 },
      { id:"tm-grip",    title:"Grip & obstacle drills",emoji:"🧗", quip:"Monkey bars are harder than they look.",  type:"binary", points:4 },
      { id:"tm-mental",  title:"Minimum session logged",emoji:"🧠", quip:"Even a short session counts. Show up every day.", type:"binary", points:3 },
    ]
  },
  {
    id: "spartan-race", name: "Spartan Race Prep", emoji: "⚔️", category: "endurance",
    description: "12 weeks of OCR training. 30 burpees per missed obstacle — don't miss any.",
    duration: 84, weeklyGoal: 65, defaultMode: "soft",
    habits: [
      { id:"sr-wod",     title:"Training session",     emoji:"⚔️", quip:"AROO!",                                   type:"binary", points:5 },
      { id:"sr-obstacle",title:"Obstacle conditioning", emoji:"🧗", quip:"Spear throw, rope climb, sandbag carry.", type:"binary", points:4 },
      { id:"sr-run",     title:"Trail or road run",    emoji:"🏃", quip:"Spartans run on rough terrain.",           type:"binary", points:5 },
      { id:"sr-strength",title:"Strength circuit",     emoji:"🏋️", quip:"Burpees count. Weakness does not.",       type:"binary", points:3 },
      { id:"sr-fuel",    title:"Protein + whole-food meals", emoji:"🥩", quip:"Real food only. Spartan diet.",      type:"binary", points:3 },
    ]
  },

  // ── Health Tracking ──────────────────────────────────────────────────────
  {
    id: "weight-loss-30", name: "Weight Loss 30 — Track & Build", emoji: "⚖️", category: "health",
    description: "30 days, with daily weigh-ins and a deficit target. See the number move while you build the routine.",
    duration: 30, weeklyGoal: 80, defaultMode: "soft",
    habits: [
      { id:"wl-weight",   title:"Log weight",          emoji:"⚖️", quip:"Same time each morning.", type:"measurement", unit:"weight", decimals:1 },
      { id:"wl-deficit",  title:"Nutrition target hit", emoji:"🥗", quip:"Track calories + 0.8 g protein per lb. Log before you eat.", type:"binary", points:5 },
      { id:"wl-steps",    title:"8,000 steps",          emoji:"👟", quip:"Walking burns fat and helps your daily deficit.", type:"binary", points:3 },
      { id:"wl-exercise", title:"Exercise 30 min",      emoji:"🏃", quip:"Cardio, weights, walk — it all counts.",          type:"binary", points:5 },
      { id:"wl-hydration",title:"Drink 2L water",       emoji:"💧", quip:"Staying hydrated reduces false hunger signals and supports overall health.", type:"binary", points:2 },
    ]
  },
  {
    id: "body-composition", name: "Body Composition", emoji: "📊", category: "health",
    description: "90 days tracking weight, body fat %, and lean muscle mass. Know your numbers.",
    duration: 90, weeklyGoal: 70, defaultMode: "soft",
    habits: [
      { id:"bc-weight",   title:"Log weight",          emoji:"⚖️", quip:"Weekly is fine — daily is better.",                  type:"measurement", unit:"weight", decimals:1 },
      { id:"bc-fat",      title:"Log body fat %",      emoji:"📉", quip:"DEXA, calipers, smart scale — pick one, stick to it.", type:"measurement", unit:"%",    decimals:1 },
      { id:"bc-lean",     title:"Log lean mass",       emoji:"💪", quip:"Weight × (1 − fat% ÷ 100).",                        type:"measurement", unit:"weight", decimals:1 },
      { id:"bc-protein",  title:"Hit protein goal",    emoji:"🥩", quip:"1g per lb of bodyweight — the evidence-based target for muscle building.",           type:"binary", points:5 },
      { id:"bc-lift",     title:"Lift session",        emoji:"🏋️", quip:"Muscle doesn't build itself.",                       type:"binary", points:5 },
      { id:"bc-steps",    title:"8,000 steps",         emoji:"👟", quip:"Daily movement shifts body comp even without gym sessions.", type:"binary", points:3 },
      { id:"bc-hydration",title:"Drink enough water",  emoji:"💧", quip:"Muscle is 75% water. Stay hydrated.",               type:"binary", points:2 },
    ]
  },
  {
    id: "blood-pressure", name: "Blood Pressure Monitor", emoji: "🩺", category: "health", deprecated: true,
    description: "30 days of daily blood pressure logging plus heart-healthy habits. Share the data with your doctor.",
    duration: 30, weeklyGoal: 75, defaultMode: "soft",
    habits: [
      { id:"bp-sys",     title:"Log systolic (top #)",   emoji:"❤️", quip:"Normal: below 120 mmHg.",                        type:"measurement", unit:"mmHg",    decimals:0 },
      { id:"bp-dia",     title:"Log diastolic (bottom #)",emoji:"💙", quip:"Normal: below 80 mmHg.",                        type:"measurement", unit:"mmHg",    decimals:0 },
      { id:"bp-walk",    title:"30-min walk",            emoji:"🚶", quip:"Regular walks lower BP more than most meds.",    type:"binary",      points:5 },
      { id:"bp-sodium",  title:"Sodium-conscious meals", emoji:"🧂", quip:"Under 1,500 mg Na/day for high-BP. Avoid processed food.", type:"binary", points:5 },
      { id:"bp-stress",  title:"Stress downshift (10 min)", emoji:"🧘", quip:"Meditation, breathing, gentle walk, or quiet time.", type:"binary", points:3 },
    ]
  },
  {
    id: "glucose-control", name: "Glucose Control", emoji: "🩸", category: "health",
    description: "60 days of fasting glucose tracking and blood-sugar-friendly habits. Export to share with your doctor.",
    duration: 60, weeklyGoal: 75, defaultMode: "soft",
    habits: [
      { id:"gc-glucose",title:"Log fasting glucose",    emoji:"🩸", quip:"Measure before eating, first thing in the morning.", type:"measurement", unit:"mg/dL",  decimals:0 },
      { id:"gc-meals",  title:"Protein + fiber meals",  emoji:"🥦", quip:"Protein and fiber blunt blood sugar spikes.",        type:"binary",      points:5 },
      { id:"gc-exercise",title:"Exercise 30 min",       emoji:"🏃", quip:"Muscle is the biggest glucose sink in the body.",    type:"binary",      points:5 },
      { id:"gc-walk",   title:"Post-meal walk",         emoji:"🚶", quip:"10 min walk after meals lowers blood sugar.",        type:"binary",      points:3 },
      { id:"gc-sugar",  title:"No added sugar",         emoji:"🚫", quip:"Check labels. Sugar hides everywhere.",             type:"binary",      points:5 },
    ]
  },
  {
    id: "sleep-tracker", name: "Sleep Tracker", emoji: "💤", category: "health",
    description: "30 days of sleep logging plus habits that actually improve sleep quality.",
    duration: 30, weeklyGoal: 70, defaultMode: "soft",
    habits: [
      { id:"st-hours",  title:"Log hours slept",       emoji:"😴", quip:"Aim for 7–9 hours. Log it honestly.",              type:"measurement", unit:"hrs",     decimals:1 },
      { id:"st-quality",title:"Log sleep quality 1–10",emoji:"⭐", quip:"How rested do you feel? 10 = fully charged.",       type:"measurement", unit:"/10",     decimals:0 },
      { id:"st-bedtime",title:"Consistent bedtime",    emoji:"⏰", quip:"Same time ±30 min — even weekends.",               type:"binary",      points:5 },
      { id:"st-screen", title:"No screens 1h before bed",emoji:"📵",quip:"Blue light delays melatonin by 90 min.",          type:"binary",      points:5 },
      { id:"st-light",  title:"Morning sunlight 10 min",emoji:"☀️",quip:"Sets your circadian clock for the next 24 hours.", type:"binary",      points:3 },
    ]
  },

  // ── Movement: beginner / body-weight progressions ───────────────────────
  {
    id: "recovery-reset", name: "Recovery Reset", emoji: "🌿", category: "health",
    description: "21 days of deliberate recovery. Sleep, mobility, easy movement, and stress reduction — the habits that let the hard work pay off.",
    duration: 21, weeklyGoal: 65, defaultMode: "soft",
    habits: [
      { id:"rr-sleep",    title:"7+ hours sleep opportunity", emoji:"🌙", quip:"You can't out-train poor sleep.",              type:"binary",      points:4 },
      { id:"rr-walk",     title:"Easy walk (20–30 min)",      emoji:"🚶", quip:"Low intensity keeps the blood moving.",        type:"binary",      points:3 },
      { id:"rr-mobility", title:"Mobility work (10 min)",     emoji:"🧘", quip:"Hips, thoracic spine, shoulders. Pick two.",   type:"binary",      points:3 },
      { id:"rr-stress",   title:"Stress downshift (5 min)",   emoji:"💨", quip:"Breathing, journaling, or just quiet time.",  type:"binary",      points:2 },
      { id:"rr-soreness", title:"Rate soreness 1–10",         emoji:"📊", quip:"Tracking how you feel is data too.",           type:"measurement", unit:"/10", decimals:0 },
    ]
  },
  {
    id: "c25k", name: "Couch to 5K", emoji: "🏃", category: "movement",
    description: "9 weeks of run/walk intervals that take beginners from the sofa to a 5K finish line. 3 sessions per week — rest days are part of the plan. Week 1–2: 60–90 sec run / 90 sec–2 min walk × 8. Week 3–5: intervals build to 5 then 20 min continuous. Week 6–9: run 25–30 min straight.",
    duration: 63, weeklyGoal: 50, defaultMode: "soft",
    habits: [
      { id:"c25k-run",     title:"Run/walk session",   emoji:"👟", quip:"Follow today's plan. Slow is fine — consistent is everything.",
        type:"tiered", points:5, tiers:[{label:"Partial (stopped early)",pts:3},{label:"Full session completed",pts:5},{label:"Exceeded the plan",pts:7}] },
      { id:"c25k-stretch", title:"Post-run stretch",   emoji:"🦵", quip:"5 minutes now saves weeks of injury later.", type:"binary", points:2 },
    ]
  },
  {
    id: "5k-prep", name: "5K Prep", emoji: "🎽", category: "movement",
    description: "6 weeks to a faster 5K. Run 4× a week, add strides, and race-day yourself at the end.",
    duration: 42, weeklyGoal: 65, defaultMode: "soft",
    habits: [
      { id:"5k-run",     title:"Run session",             emoji:"🏃", quip:"Shoes on. Door open. Go.",                       type:"tiered", points:3,
        tiers:[{label:"Easy 20 min",pts:3},{label:"Tempo 30 min",pts:5},{label:"Interval session",pts:7}] },
      { id:"5k-strides", title:"Strides after easy runs", emoji:"⚡", quip:"6 × 20-second pick-ups. More speed than you think.", type:"binary", points:2 },
      { id:"5k-stretch", title:"Post-run stretch",        emoji:"🦵", quip:"Tight calves slow you down. Fix them.",             type:"binary", points:2 },
    ]
  },
  {
    id: "10k-prep", name: "10K Prep", emoji: "🏅", category: "endurance",
    description: "8 weeks to your best 10K. Build weekly mileage, sharpen with intervals, and trust the process.",
    duration: 56, weeklyGoal: 65, defaultMode: "soft",
    habits: [
      { id:"10k-run",    title:"Run session",            emoji:"🏃", quip:"Every kilometre is a deposit.",                       type:"tiered", points:3,
        tiers:[{label:"Easy 30 min",pts:3},{label:"Tempo 40 min",pts:5},{label:"Long run 60+ min",pts:7}] },
      { id:"10k-xt",     title:"Cross-train",            emoji:"🚴", quip:"Bike, swim, or yoga — protect the legs.",             type:"binary", points:2 },
      { id:"10k-stretch",title:"Stretch & foam-roll",    emoji:"🦵", quip:"15 minutes now = fewer physio bills later.",          type:"binary", points:2 },
    ]
  },
  {
    id: "pilates", name: "Pilates", emoji: "🌸", category: "movement",
    description: "30 days of mat Pilates — build deep core strength, improve posture, and move better every day.",
    duration: 30, weeklyGoal: 55, defaultMode: "soft",
    habits: [
      { id:"pil-session", title:"Pilates session (20 min+)", emoji:"🌸", quip:"Mat out. Clothes on. Start the video.",           type:"binary", points:5 },
      { id:"pil-breath",  title:"Pilates breathing (5 min)", emoji:"💨", quip:"Breath is the engine of every Pilates movement.", type:"binary", points:2 },
      { id:"pil-stretch", title:"Full-body stretch",         emoji:"🦵", quip:"End every session lengthened, not compressed.",   type:"binary", points:2 },
    ]
  },
  {
    id: "12-3-30", name: "12-3-30 Challenge", emoji: "🏔️", category: "movement",
    description: "Treadmill at 12% incline, 3 mph, for 30 minutes. The treadmill niche that actually works. Daily sessions are aspirational — rest days are fine and recommended to avoid overuse injuries.",
    duration: 30, weeklyGoal: 45, defaultMode: "soft",
    habits: [
      { id:"1230-walk",   title:"12-3-30 session",        emoji:"🏔️", quip:"12% incline. 3 mph. 30 minutes. No shortcuts.",    type:"binary", points:6 },
      { id:"1230-stretch",title:"Stretch calves & hamstrings",emoji:"🦵",quip:"High incline walks are brutal on calves.",       type:"binary", points:2 },
    ]
  },

  // ── Strength: single-movement progressions ──────────────────────────────
  {
    id: "kettlebell", name: "Kettlebell Challenge", emoji: "🔔", category: "movement",
    description: "30 days of kettlebell training. Swings, presses, carries — full-body strength built the old way.",
    duration: 30, weeklyGoal: 60, defaultMode: "soft",
    habits: [
      { id:"kb-swing",   title:"KB swings",               emoji:"🔔", quip:"Hips drive the bell. Not the arms.",          type:"tiered", points:5,
        tiers:[{label:"50 reps",pts:5},{label:"100 reps",pts:7},{label:"200 reps",pts:9}] },
      { id:"kb-press",   title:"KB strength move",          emoji:"💪", quip:"Press, clean & press, or snatch. 3 sets each side.", type:"binary", points:3 },
      { id:"kb-mobility",title:"Hip & thoracic mobility",  emoji:"🧘", quip:"KB training locks the hips. Undo it daily.", type:"binary", points:2 },
    ]
  },
  {
    id: "calisthenics", name: "Calisthenics", emoji: "🤸", category: "movement",
    description: "30 days of bodyweight strength. Push, pull, and stabilise — no equipment needed.",
    duration: 30, weeklyGoal: 65, defaultMode: "soft",
    habits: [
      { id:"cal-push",   title:"Push-ups",                emoji:"💪", quip:"Chest to floor. Lock out at the top.",          type:"tiered", points:4,
        tiers:[{label:"5–15 reps",pts:4},{label:"16–30 reps",pts:6},{label:"30+ reps",pts:8}] },
      { id:"cal-pull",   title:"Pull-ups or rows",        emoji:"🏋️", quip:"Chin over bar. Or ring rows if you're building.", type:"tiered", points:4,
        tiers:[{label:"1–5 reps",pts:4},{label:"6–10 reps",pts:6},{label:"10+ reps",pts:8}] },
      { id:"cal-dip",    title:"Dips or plank",           emoji:"🤸", quip:"Dips for strength. Plank for stability. Pick one.", type:"tiered", points:3,
        tiers:[{label:"Plank 30+ sec / 5 dips",pts:3},{label:"Plank 1 min / 10 dips",pts:5},{label:"Plank 2 min / 20 dips",pts:7}] },
    ]
  },

  // ── Nutrition / Health habits ────────────────────────────────────────────
  {
    id: "protein-challenge", name: "Protein Challenge", emoji: "🥩", category: "health",
    description: "30 days of hitting your protein target every single day. Build muscle, cut cravings, and eat smarter.",
    duration: 30, weeklyGoal: 65, defaultMode: "strict",
    habits: [
      { id:"pc-hit",     title:"Hit daily protein target", emoji:"🥩", quip:"0.8–1g per lb of bodyweight. Every day.",          type:"tiered", points:4,
        tiers:[{label:"80–100g",pts:4},{label:"100–140g",pts:6},{label:"140g+",pts:8}] },
      { id:"pc-breakfast",title:"Protein-first breakfast",emoji:"🍳", quip:"30g at breakfast kills cravings all day.",           type:"binary", points:2 },
      { id:"pc-log",     title:"Log meals",                emoji:"📊", quip:"You can't hit what you don't track.",               type:"binary", points:2 },
    ]
  },
  {
    id: "fiber-challenge", name: "Fiber Challenge", emoji: "🥦", category: "health",
    description: "30 days of hitting your daily fiber target. Better gut health, lower blood sugar, steadier energy, and fewer cravings.",
    duration: 30, weeklyGoal: 60, defaultMode: "soft",
    habits: [
      { id:"fb-fiber",    title:"Hit fiber target",            emoji:"🥦", quip:"Most people eat 10–15g/day. Aim for 25–35g.", type:"tiered", points:4,
        tiers:[{label:"15–20g",pts:2},{label:"20–25g",pts:4},{label:"25g+",pts:6}] },
      { id:"fb-veg",      title:"3+ vegetable servings",       emoji:"🥗", quip:"A fist-sized serving at every main meal.",    type:"binary", points:3 },
      { id:"fb-whole",    title:"Whole-grain or legume meal",  emoji:"🫘", quip:"Oats, lentils, beans, quinoa, brown rice.",    type:"binary", points:2 },
      { id:"fb-label",    title:"Check fiber on one label",    emoji:"🔍", quip:"Most packaged food hides the fiber count.",   type:"binary", points:1 },
    ]
  },
  {
    id: "meal-prep", name: "Meal Prep Challenge", emoji: "🥡", category: "lifestyle",
    description: "30 days of cooking and eating real food you prepared yourself. Less takeout. Less guessing. More control.",
    duration: 30, weeklyGoal: 55, defaultMode: "soft",
    habits: [
      { id:"mp-home",    title:"Eat home-prepped food",   emoji:"🍽️", quip:"Food you cooked is food you control.",              type:"binary", points:4 },
      { id:"mp-notake",  title:"No takeout today",        emoji:"🚫", quip:"Every delivery skipped is money and macros saved.", type:"binary", points:3 },
      { id:"mp-plan",    title:"Plan tomorrow's meals",   emoji:"📋", quip:"5 minutes of planning = zero decision fatigue.",    type:"binary", points:2 },
    ]
  },
  {
    id: "hydration", name: "Hydration Challenge", emoji: "💧", category: "health",
    description: "30 days of hitting your water target every day. Better skin, energy, focus, and recovery.",
    duration: 30, weeklyGoal: 55, defaultMode: "soft",
    habits: [
      { id:"hy-water",   title:"Hit daily water target",  emoji:"💧", quip:"Personalise to your size and climate.",             type:"tiered", points:4,
        tiers:[{label:"1.5–2L",pts:4},{label:"2–3L",pts:6},{label:"3L+",pts:8}] },
      { id:"hy-morning", title:"2 glasses before coffee", emoji:"🌅", quip:"You wake up dehydrated every single morning.",      type:"binary", points:2 },
      { id:"hy-nosoda",  title:"No soda or juice",        emoji:"🚫", quip:"Liquid calories don't satisfy hunger. Cut them.",   type:"binary", points:2 },
    ]
  },

  // ── Lifestyle: financial + productivity ──────────────────────────────────
  {
    id: "project-50", name: "Project 50", emoji: "🚀", category: "transformation",
    description: "50 days of non-negotiable daily disciplines — exercise, reading, sobriety, and a morning routine. Less extreme than 75 Hard. More sustainable than nothing.",
    duration: 50, weeklyGoal: 70, defaultMode: "soft",
    habits: [
      { id:"p50-move",   title:"Exercise 30 min",         emoji:"🏋️", quip:"Any movement counts. Showing up is the whole job.", type:"binary", points:4 },
      { id:"p50-read",   title:"Read 10 pages",           emoji:"📖", quip:"10 pages a day is a book a month.",                 type:"binary", points:2 },
      { id:"p50-noalc",  title:"No alcohol",              emoji:"🚫", quip:"50 days sober changes your baseline.",               type:"binary", points:3 },
      { id:"p50-nosnooze",title:"No snooze — wake up on time",emoji:"⏰", quip:"First decision of the day. Make it right.",    type:"binary", points:2 },
      { id:"p50-morning",title:"Phone-free first 30 min", emoji:"🌅", quip:"Start before the world gets loud.",                  type:"binary", points:2 },
    ]
  },
  {
    id: "no-spend", name: "No-Spend Challenge", emoji: "💰", category: "lifestyle",
    description: "30 days of cutting non-essential spending. Buy only what you need. Cook at home. Build the savings habit.",
    duration: 30, weeklyGoal: 50, defaultMode: "soft",
    habits: [
      { id:"ns-nospend", title:"No non-essential purchases",emoji:"💰",quip:"Need vs want. Today it's want. Skip it.",          type:"binary", points:5 },
      { id:"ns-cook",    title:"Cook at home",             emoji:"🍳", quip:"The restaurant markup is your savings.",            type:"binary", points:2 },
      { id:"ns-log",     title:"Log spending",             emoji:"📊", quip:"Where does the money actually go? Find out.",      type:"binary", points:2 },
    ]
  },

  {
    id: "declutter", name: "Declutter Challenge", emoji: "📦", category: "lifestyle",
    description: "30 days of clearing the clutter. One area at a time, one day at a time. Less stuff, more clarity.",
    duration: 30, weeklyGoal: 55, defaultMode: "soft",
    habits: [
      { id:"dc-clear",   title:"Clear one area today",              emoji:"📦", quip:"Drawer, shelf, bag, inbox — pick one. Do it.", type:"binary", points:4 },
      { id:"dc-out",     title:"Remove 3+ items (donate or trash)", emoji:"🗑️", quip:"If you haven't used it in a year, let it go.", type:"binary", points:3 },
      { id:"dc-digital", title:"Clear 10+ digital files or emails", emoji:"💻", quip:"Digital clutter is still clutter.",           type:"binary", points:2 },
    ]
  },

  // ── Expedition Routes ────────────────────────────────────────────────────
  {
    id: "everest-bc", name: "Everest Base Camp", emoji: "🏔️", category: "expedition", deprecated: true,
    description: "Trek 130 km through the Himalayas to the foot of the world's highest peak.",
    duration: 45, weeklyGoal: 5, defaultMode: "soft", routeKm: 130,
    milestones: [
      { km: 10,  name: "Phakding",          emoji: "🏡" },
      { km: 40,  name: "Namche Bazaar",      emoji: "🏙️" },
      { km: 65,  name: "Tengboche",          emoji: "⛩️" },
      { km: 100, name: "Gorak Shep",         emoji: "⛺" },
      { km: 130, name: "Everest Base Camp",  emoji: "🏔️" },
    ],
    habits: [
      { id:"dist",      title:"Log distance",  emoji:"🏃", quip:"Walk, run, cycle, swim or row — it all counts.", type:"distance", points:1, unit:"km" },
      { id:"exp-sleep", title:"Sleep 7+ hours", emoji:"😴", quip:"Recovery is part of the journey.", type:"binary", points:2 },
      { id:"exp-fuel",  title:"Fuel well today", emoji:"🍽️", quip:"Protein + carbs. Serious ground ahead.", type:"binary", points:2 },
    ],
  },
  {
    id: "west-highland-way", name: "West Highland Way", emoji: "🌄", category: "expedition", deprecated: true,
    description: "Walk 154 km through the Scottish Highlands from Milngavie to Fort William — lochs, glens, and mountain passes.",
    duration: 30, weeklyGoal: 5, defaultMode: "soft", routeKm: 154,
    milestones: [
      { km: 20,  name: "Balmaha",        emoji: "🌊" },
      { km: 50,  name: "Inverarnan",     emoji: "🏞️" },
      { km: 80,  name: "Tyndrum",        emoji: "🏘️" },
      { km: 120, name: "Kinlochleven",   emoji: "⛰️" },
      { km: 154, name: "Fort William",   emoji: "🎉" },
    ],
    habits: [
      { id:"dist",      title:"Log distance",  emoji:"🥾", quip:"Every loch and glen earned one step at a time.", type:"distance", points:1, unit:"km" },
      { id:"exp-sleep", title:"Sleep 7+ hours", emoji:"😴", quip:"Recovery is part of the journey.", type:"binary", points:2 },
      { id:"exp-fuel",  title:"Fuel well today", emoji:"🍽️", quip:"Protein + carbs. Serious ground ahead.", type:"binary", points:2 },
    ],
  },
  {
    id: "tour-du-mont-blanc", name: "Tour du Mont Blanc", emoji: "🗻", category: "expedition", deprecated: true,
    description: "Circle the Mont Blanc massif across France, Italy and Switzerland — 170 km of alpine trail through 3 countries.",
    duration: 60, weeklyGoal: 5, defaultMode: "soft", routeKm: 170,
    milestones: [
      { km: 30,  name: "Les Contamines",  emoji: "🌲" },
      { km: 60,  name: "Courmayeur",      emoji: "🇮🇹" },
      { km: 90,  name: "La Fouly",        emoji: "🇨🇭" },
      { km: 130, name: "Champex-Lac",     emoji: "🏞️" },
      { km: 170, name: "Chamonix",        emoji: "🏔️" },
    ],
    habits: [
      { id:"dist",      title:"Log distance",  emoji:"🥾", quip:"Three countries. One mountain. Endless views.", type:"distance", points:1, unit:"km" },
      { id:"exp-sleep", title:"Sleep 7+ hours", emoji:"😴", quip:"Recovery is part of the journey.", type:"binary", points:2 },
      { id:"exp-fuel",  title:"Fuel well today", emoji:"🍽️", quip:"Protein + carbs. Serious ground ahead.", type:"binary", points:2 },
    ],
  },
  {
    id: "john-muir-trail", name: "John Muir Trail", emoji: "🦅", category: "expedition", deprecated: true,
    description: "Hike 340 km through California's Sierra Nevada — from Yosemite Valley to the summit of Mount Whitney.",
    duration: 90, weeklyGoal: 5, defaultMode: "soft", routeKm: 340,
    milestones: [
      { km: 50,  name: "Tuolumne Meadows",  emoji: "🌿" },
      { km: 120, name: "Evolution Valley",  emoji: "🏔️" },
      { km: 180, name: "Muir Trail Ranch",  emoji: "🏕️" },
      { km: 250, name: "Pinchot Pass",      emoji: "❄️" },
      { km: 340, name: "Mount Whitney",     emoji: "🦅" },
    ],
    habits: [
      { id:"dist",      title:"Log distance",  emoji:"🥾", quip:"The Range of Light. Worth every step.", type:"distance", points:1, unit:"km" },
      { id:"exp-sleep", title:"Sleep 7+ hours", emoji:"😴", quip:"Recovery is part of the journey.", type:"binary", points:2 },
      { id:"exp-fuel",  title:"Fuel well today", emoji:"🍽️", quip:"Protein + carbs. Serious ground ahead.", type:"binary", points:2 },
    ],
  },
  {
    id: "camino", name: "Camino de Santiago", emoji: "⛪", category: "expedition", deprecated: true,
    description: "Walk 790 km across Spain on the ancient pilgrimage route to Santiago de Compostela.",
    duration: 90, weeklyGoal: 5, defaultMode: "soft", routeKm: 790,
    milestones: [
      { km: 75,  name: "Pamplona",               emoji: "🏟️" },
      { km: 250, name: "Burgos",                  emoji: "🏰" },
      { km: 400, name: "León",                    emoji: "🦁" },
      { km: 590, name: "Ponferrada",              emoji: "🏯" },
      { km: 790, name: "Santiago de Compostela",  emoji: "⛪" },
    ],
    habits: [
      { id:"dist",      title:"Log distance",  emoji:"🚶", quip:"Every step brings you closer to Santiago.", type:"distance", points:1, unit:"km" },
      { id:"exp-sleep", title:"Sleep 7+ hours", emoji:"😴", quip:"Recovery is part of the journey.", type:"binary", points:2 },
      { id:"exp-fuel",  title:"Fuel well today", emoji:"🍽️", quip:"Protein + carbs. Serious ground ahead.", type:"binary", points:2 },
    ],
  },
  {
    id: "appalachian", name: "Appalachian Trail", emoji: "🌲", category: "expedition", deprecated: true,
    description: "Hike the full 3,540 km from Georgia to Maine — one of the world's great long trails.",
    duration: 365, weeklyGoal: 5, defaultMode: "soft", routeKm: 3540,
    milestones: [
      { km: 300,  name: "Shenandoah Valley",    emoji: "🌿" },
      { km: 900,  name: "Pennsylvania",          emoji: "🪨" },
      { km: 1800, name: "New England",           emoji: "🍂" },
      { km: 2600, name: "White Mountains, NH",   emoji: "❄️" },
      { km: 3540, name: "Mount Katahdin, Maine", emoji: "🏔️" },
    ],
    habits: [
      { id:"dist",      title:"Log distance",  emoji:"🥾", quip:"Miles in the legs. Wilderness in the soul.", type:"distance", points:1, unit:"km" },
      { id:"exp-sleep", title:"Sleep 7+ hours", emoji:"😴", quip:"Recovery is part of the journey.", type:"binary", points:2 },
      { id:"exp-fuel",  title:"Fuel well today", emoji:"🍽️", quip:"Protein + carbs. Serious ground ahead.", type:"binary", points:2 },
    ],
  },
  {
    id: "tour-de-france", name: "Tour de France", emoji: "🚴", category: "expedition", deprecated: true,
    description: "Ride the full 3,490 km route of the world's most iconic cycling race.",
    duration: 120, weeklyGoal: 5, defaultMode: "soft", routeKm: 3490,
    milestones: [
      { km: 400,  name: "Brittany Coast",     emoji: "🌊" },
      { km: 900,  name: "Massif Central",     emoji: "🗺️" },
      { km: 1600, name: "The Pyrenees",       emoji: "⛰️" },
      { km: 2400, name: "The Alps",           emoji: "🏔️" },
      { km: 3490, name: "Paris — Champs-Élysées", emoji: "🗼" },
    ],
    habits: [
      { id:"dist",      title:"Log distance",  emoji:"🚴", quip:"Clip in. Every km is a stage.", type:"distance", points:1, unit:"km" },
      { id:"exp-sleep", title:"Sleep 7+ hours", emoji:"😴", quip:"Recovery is part of the journey.", type:"binary", points:2 },
      { id:"exp-fuel",  title:"Fuel well today", emoji:"🍽️", quip:"Protein + carbs. Serious ground ahead.", type:"binary", points:2 },
    ],
  },
  {
    id: "route66", name: "Route 66", emoji: "🚗", category: "expedition", deprecated: true,
    description: "Travel the 3,940 km Mother Road from Chicago, Illinois to Santa Monica, California.",
    duration: 180, weeklyGoal: 5, defaultMode: "soft", routeKm: 3940,
    milestones: [
      { km: 500,  name: "Springfield, IL",   emoji: "🌽" },
      { km: 1100, name: "Oklahoma City",      emoji: "🏙️" },
      { km: 1900, name: "Amarillo, TX",       emoji: "🤠" },
      { km: 2700, name: "Albuquerque, NM",    emoji: "🌵" },
      { km: 3940, name: "Santa Monica Pier",  emoji: "🎡" },
    ],
    habits: [
      { id:"dist",      title:"Log distance",  emoji:"🚗", quip:"Get your kicks. Road is open.", type:"distance", points:1, unit:"km" },
      { id:"exp-sleep", title:"Sleep 7+ hours", emoji:"😴", quip:"Recovery is part of the journey.", type:"binary", points:2 },
      { id:"exp-fuel",  title:"Fuel well today", emoji:"🍽️", quip:"Protein + carbs. Serious ground ahead.", type:"binary", points:2 },
    ],
  },
  {
    id: "amazon-river", name: "Amazon River", emoji: "🌿", category: "expedition", deprecated: true,
    description: "Navigate 6,437 km down the world's greatest river from the Andes to the Atlantic.",
    duration: 365, weeklyGoal: 5, defaultMode: "soft", routeKm: 6437,
    milestones: [
      { km: 500,  name: "Iquitos, Peru",   emoji: "🐊" },
      { km: 1500, name: "Leticia",          emoji: "🦜" },
      { km: 3000, name: "Manaus",           emoji: "🏙️" },
      { km: 5000, name: "Santarém",         emoji: "🌊" },
      { km: 6437, name: "Atlantic Ocean",   emoji: "🌊" },
    ],
    habits: [
      { id:"dist",      title:"Log distance",  emoji:"🚣", quip:"The river never stops. Neither do you.", type:"distance", points:1, unit:"km" },
      { id:"exp-sleep", title:"Sleep 7+ hours", emoji:"😴", quip:"Recovery is part of the journey.", type:"binary", points:2 },
      { id:"exp-fuel",  title:"Fuel well today", emoji:"🍽️", quip:"Protein + carbs. Serious ground ahead.", type:"binary", points:2 },
    ],
  },
  {
    id: "pct", name: "Pacific Crest Trail", emoji: "🌲", category: "expedition", deprecated: true,
    description: "Walk 4,286 km from the Mexican border to the Canadian border — through the Sierra Nevada and Cascades. 5 months. No shortcuts.",
    duration: 150, weeklyGoal: 5, defaultMode: "soft", routeKm: 4286,
    milestones: [
      { km:  160, name: "San Diego foothills", emoji: "🌵" },
      { km:  700, name: "Los Angeles area",    emoji: "🌆" },
      { km: 1300, name: "Mojave Desert",       emoji: "☀️" },
      { km: 2000, name: "Sierra Nevada",       emoji: "⛰️" },
      { km: 2600, name: "Northern California", emoji: "🌲" },
      { km: 3100, name: "Oregon",              emoji: "🌋" },
      { km: 3800, name: "Washington",          emoji: "🏔️" },
      { km: 4286, name: "Canadian Border",     emoji: "🍁" },
    ],
    habits: [
      { id:"dist",      title:"Log distance",  emoji:"🥾", quip:"Every step north is progress.", type:"distance", points:1, unit:"km" },
      { id:"exp-sleep", title:"Sleep 7+ hours", emoji:"😴", quip:"Recovery is part of the journey.", type:"binary", points:2 },
      { id:"exp-fuel",  title:"Fuel well today", emoji:"🍽️", quip:"Protein + carbs. Serious ground ahead.", type:"binary", points:2 },
    ],
  },
  {
    id: "everest-stairmaster", name: "Everest StairMaster", emoji: "🏋️", category: "expedition", deprecated: true,
    description: "Climb 2,903 floors — the StairMaster equivalent of summiting Mount Everest from sea level. No oxygen tank. No shortcuts.",
    duration: 112, weeklyGoal: 5, defaultMode: "soft", routeKm: 2903.2,
    milestones: [
      { km: 100,  name: "Foothills",             emoji: "⛰️" },
      { km: 500,  name: "Camp I",                emoji: "⛺" },
      { km: 1000, name: "Camp II",               emoji: "🏕️" },
      { km: 1500, name: "Camp III",              emoji: "❄️" },
      { km: 2000, name: "Death Zone",            emoji: "☠️" },
      { km: 2903, name: "Summit — 8,849 m",     emoji: "🏔️" },
    ],
    habits: [
      { id:"floors",    title:"Floors climbed today", emoji:"🏢", quip:"One floor at a time. 2,903 to go.", type:"distance", points:1, unit:"floors" },
      { id:"exp-sleep", title:"Sleep 7+ hours",       emoji:"😴", quip:"Recovery is part of the journey.", type:"binary", points:2 },
      { id:"exp-fuel",  title:"Fuel well today",       emoji:"🍽️", quip:"Protein + carbs. Serious ground ahead.", type:"binary", points:2 },
    ],
  },
  {
    id: "kilimanjaro-stairmaster", name: "Kilimanjaro StairMaster", emoji: "🌋", category: "expedition", deprecated: true,
    description: "Climb 1,934 floors — the StairMaster equivalent of Africa's highest peak, Uhuru at 5,895 m. Less oxygen, less mercy than Everest, but still Africa's crown.",
    duration: 240, weeklyGoal: 5, defaultMode: "strict", routeKm: 1934,
    milestones: [
      { km: 100,  name: "Foothills",               emoji: "🌿" },
      { km: 600,  name: "Marangu Gate",             emoji: "🌲" },
      { km: 900,  name: "Mandara Hut (2,720 m)",   emoji: "🏕️" },
      { km: 1200, name: "Horombo Hut (3,720 m)",   emoji: "⛺" },
      { km: 1548, name: "Kibo Hut (4,720 m)",      emoji: "❄️" },
      { km: 1934, name: "Uhuru Peak — 5,895 m",    emoji: "🌋" },
    ],
    habits: [
      { id:"floors",    title:"Floors climbed today", emoji:"🏢", quip:"One floor at a time. 1,934 to go.", type:"distance", points:1, unit:"floors" },
      { id:"exp-sleep", title:"Sleep 7+ hours",       emoji:"😴", quip:"Recovery is part of the journey.", type:"binary", points:2 },
      { id:"exp-fuel",  title:"Fuel well today",       emoji:"🍽️", quip:"Protein + carbs. Serious ground ahead.", type:"binary", points:2 },
    ],
  },
  {
    id: "montblanc-stairmaster", name: "Mont Blanc StairMaster", emoji: "⛰️", category: "expedition", deprecated: true,
    description: "Climb 1,577 floors — the StairMaster equivalent of Mont Blanc, the highest peak in the Alps at 4,808 m. A serious mountain, but friendlier than the giants above.",
    duration: 180, weeklyGoal: 5, defaultMode: "strict", routeKm: 1577,
    milestones: [
      { km: 100,  name: "Chamonix Valley",           emoji: "🏘️" },
      { km: 400,  name: "Les Houches (1,220 m)",     emoji: "🌲" },
      { km: 780,  name: "Nid d'Aigle (2,380 m)",     emoji: "🦅" },
      { km: 1252, name: "Refuge du Goûter (3,817 m)",emoji: "🏔️" },
      { km: 1577, name: "Summit — 4,808 m",          emoji: "⛰️" },
    ],
    habits: [
      { id:"floors",    title:"Floors climbed today", emoji:"🏢", quip:"One floor at a time. 1,577 to go.", type:"distance", points:1, unit:"floors" },
      { id:"exp-sleep", title:"Sleep 7+ hours",       emoji:"😴", quip:"Recovery is part of the journey.", type:"binary", points:2 },
      { id:"exp-fuel",  title:"Fuel well today",       emoji:"🍽️", quip:"Protein + carbs. Serious ground ahead.", type:"binary", points:2 },
    ],
  },

  // ── Running Expeditions ──────────────────────────────────────────────────
  {
    id: "comrades-ultra", name: "Comrades Ultra", emoji: "🏃", category: "expedition", deprecated: true,
    description: "Run the legendary 89 km Comrades Marathon from Pietermaritzburg to Durban, South Africa.",
    duration: 21, weeklyGoal: 5, defaultMode: "soft", routeKm: 89,
    milestones: [
      { km: 17,  name: "Drummond",     emoji: "🌿" },
      { km: 36,  name: "Botha's Hill", emoji: "⛰️" },
      { km: 55,  name: "Fields Hill",  emoji: "🏔️" },
      { km: 82,  name: "Tollgate",     emoji: "🚦" },
      { km: 89,  name: "Durban!",      emoji: "🌊" },
    ],
    habits: [
      { id:"cu-run",    title:"Log running distance", emoji:"🏃", quip:"Every step toward Durban.", type:"distance", points:1, unit:"km" },
      { id:"exp-sleep", title:"Sleep 7+ hours",       emoji:"😴", quip:"Recovery is part of the journey.", type:"binary", points:2 },
      { id:"exp-fuel",  title:"Fuel well today",       emoji:"🍽️", quip:"Protein + carbs. Serious ground ahead.", type:"binary", points:2 },
    ]
  },
  {
    id: "utmb", name: "Ultra Trail du Mont Blanc", emoji: "⛰️", category: "expedition", deprecated: true,
    description: "Tackle the 171 km UTMB course circling Mont Blanc through France, Italy and Switzerland.",
    duration: 40, weeklyGoal: 5, defaultMode: "soft", routeKm: 171,
    milestones: [
      { km: 22,  name: "Les Houches",  emoji: "🌲" },
      { km: 50,  name: "Courmayeur",   emoji: "🇮🇹" },
      { km: 80,  name: "Champex-Lac",  emoji: "🏊" },
      { km: 122, name: "Vallorcine",   emoji: "🏔️" },
      { km: 152, name: "La Flégère",   emoji: "⛷️" },
      { km: 171, name: "Chamonix!",    emoji: "🎉" },
    ],
    habits: [
      { id:"utmb-run",  title:"Log running distance", emoji:"🏃", quip:"The mountains are waiting.", type:"distance", points:1, unit:"km" },
      { id:"exp-sleep", title:"Sleep 7+ hours",       emoji:"😴", quip:"Recovery is part of the journey.", type:"binary", points:2 },
      { id:"exp-fuel",  title:"Fuel well today",       emoji:"🍽️", quip:"Protein + carbs. Serious ground ahead.", type:"binary", points:2 },
    ]
  },
  {
    id: "run-5-marathons", name: "5 Marathon Challenge", emoji: "🏃", category: "expedition", deprecated: true,
    description: "Run the equivalent of 5 consecutive marathons — 211 km total. Pace doesn't matter. Showing up does.",
    duration: 45, weeklyGoal: 5, defaultMode: "soft", routeKm: 211,
    milestones: [
      { km: 42,  name: "Marathon 1", emoji: "🏅" },
      { km: 84,  name: "Marathon 2", emoji: "🏅" },
      { km: 126, name: "Marathon 3", emoji: "🏅" },
      { km: 168, name: "Marathon 4", emoji: "🏅" },
      { km: 211, name: "Marathon 5", emoji: "🎖️" },
    ],
    habits: [
      { id:"dist",      title:"Log distance",  emoji:"🏃", quip:"Every km counts. Log it.", type:"distance", points:1, unit:"km" },
      { id:"exp-sleep", title:"Sleep 7+ hours", emoji:"😴", quip:"Recovery is part of the journey.", type:"binary", points:2 },
      { id:"exp-fuel",  title:"Fuel well today", emoji:"🍽️", quip:"Protein + carbs. Serious ground ahead.", type:"binary", points:2 },
    ],
  },
  {
    id: "run-jogle", name: "Land's End to John o'Groats", emoji: "🏃", category: "expedition", deprecated: true,
    description: "Run the entire length of Great Britain — 1,407 km from Land's End to John o'Groats. End to end.",
    duration: 90, weeklyGoal: 5, defaultMode: "soft", routeKm: 1407,
    milestones: [
      { km: 1,    name: "Land's End",       emoji: "🌊" },
      { km: 340,  name: "Bristol",          emoji: "🏙️" },
      { km: 600,  name: "Manchester",       emoji: "🏭" },
      { km: 900,  name: "Scottish Border",  emoji: "🏴" },
      { km: 1407, name: "John o'Groats",    emoji: "🏔️" },
    ],
    habits: [
      { id:"dist",      title:"Log distance",  emoji:"🏃", quip:"North. Always north.", type:"distance", points:1, unit:"km" },
      { id:"exp-sleep", title:"Sleep 7+ hours", emoji:"😴", quip:"Recovery is part of the journey.", type:"binary", points:2 },
      { id:"exp-fuel",  title:"Fuel well today", emoji:"🍽️", quip:"Protein + carbs. Serious ground ahead.", type:"binary", points:2 },
    ],
  },
  {
    id: "run-trans-america", name: "Trans-America Run", emoji: "🏃", category: "expedition", deprecated: true,
    description: "Run across the United States — 4,989 km from San Francisco to New York City.",
    duration: 180, weeklyGoal: 5, defaultMode: "soft", routeKm: 4989,
    milestones: [
      { km: 1,    name: "San Francisco",     emoji: "🌉" },
      { km: 1500, name: "Rocky Mountains",   emoji: "⛰️" },
      { km: 2500, name: "Great Plains",      emoji: "🌾" },
      { km: 3500, name: "Mississippi River", emoji: "🌊" },
      { km: 4989, name: "New York City",     emoji: "🗽" },
    ],
    habits: [
      { id:"dist",      title:"Log distance",  emoji:"🏃", quip:"Coast to coast. One step at a time.", type:"distance", points:1, unit:"km" },
      { id:"exp-sleep", title:"Sleep 7+ hours", emoji:"😴", quip:"Recovery is part of the journey.", type:"binary", points:2 },
      { id:"exp-fuel",  title:"Fuel well today", emoji:"🍽️", quip:"Protein + carbs. Serious ground ahead.", type:"binary", points:2 },
    ],
  },

  // ── Additional Cycling Expeditions ──────────────────────────────────────
  {
    id: "raid-pyrenees", name: "Raid Pyrénéen", emoji: "🚴", category: "expedition", deprecated: true,
    description: "Cycle all 726 km of the legendary Pyrénées mountain route from the Atlantic coast to the Mediterranean.",
    duration: 45, weeklyGoal: 5, defaultMode: "soft", routeKm: 726,
    milestones: [
      { km: 1,   name: "Hendaye — Atlantic",     emoji: "🌊" },
      { km: 150, name: "First High Passes",       emoji: "⛰️" },
      { km: 400, name: "Andorra",                 emoji: "🏔️" },
      { km: 600, name: "Final Cols",              emoji: "🚴" },
      { km: 726, name: "Cerbère — Mediterranean", emoji: "☀️" },
    ],
    habits: [
      { id:"dist",      title:"Log distance",  emoji:"🚴", quip:"Pedal. Climb. Breathe.", type:"distance", points:1, unit:"km" },
      { id:"exp-sleep", title:"Sleep 7+ hours", emoji:"😴", quip:"Recovery is part of the journey.", type:"binary", points:2 },
      { id:"exp-fuel",  title:"Fuel well today", emoji:"🍽️", quip:"Protein + carbs. Serious ground ahead.", type:"binary", points:2 },
    ],
  },
  {
    id: "trans-am-bike", name: "Trans-America Bike", emoji: "🚴", category: "expedition", deprecated: true,
    description: "Ride the 6,771 km TransAm Bike Trail from Yorktown, Virginia to Astoria, Oregon.",
    duration: 180, weeklyGoal: 5, defaultMode: "soft", routeKm: 6771,
    milestones: [
      { km: 1,    name: "Yorktown, Virginia",  emoji: "🏛️" },
      { km: 900,  name: "Blue Ridge Parkway",  emoji: "🌄" },
      { km: 2700, name: "Missouri River",      emoji: "🌊" },
      { km: 4500, name: "Colorado Rockies",    emoji: "🏔️" },
      { km: 6771, name: "Astoria, Oregon",     emoji: "🌊" },
    ],
    habits: [
      { id:"dist",      title:"Log distance",  emoji:"🚴", quip:"Every state. Every climb. No shortcuts.", type:"distance", points:1, unit:"km" },
      { id:"exp-sleep", title:"Sleep 7+ hours", emoji:"😴", quip:"Recovery is part of the journey.", type:"binary", points:2 },
      { id:"exp-fuel",  title:"Fuel well today", emoji:"🍽️", quip:"Protein + carbs. Serious ground ahead.", type:"binary", points:2 },
    ],
  },

  // ── Additional Rowing Expeditions ────────────────────────────────────────
  {
    id: "thames-row", name: "Thames Row", emoji: "🚣", category: "expedition", deprecated: true,
    description: "Row the full length of the Thames from its source in the Cotswolds to the open sea — 346 km.",
    duration: 30, weeklyGoal: 5, defaultMode: "soft", routeKm: 346,
    milestones: [
      { km: 1,   name: "The Source, Cotswolds", emoji: "🌿" },
      { km: 75,  name: "Oxford",                emoji: "🎓" },
      { km: 170, name: "Windsor Castle",        emoji: "🏰" },
      { km: 280, name: "London Bridge",         emoji: "🌉" },
      { km: 346, name: "Thames Estuary",        emoji: "🌊" },
    ],
    habits: [
      { id:"dist",      title:"Log distance",  emoji:"🚣", quip:"Pull. The river knows the way.", type:"distance", points:1, unit:"km" },
      { id:"exp-sleep", title:"Sleep 7+ hours", emoji:"😴", quip:"Recovery is part of the journey.", type:"binary", points:2 },
      { id:"exp-fuel",  title:"Fuel well today", emoji:"🍽️", quip:"Protein + carbs. Serious ground ahead.", type:"binary", points:2 },
    ],
  },
  {
    id: "danube-row", name: "Danube Row", emoji: "🚣", category: "expedition", deprecated: true,
    description: "Row 2,860 km down the Danube from Germany to the Black Sea — through 10 countries.",
    duration: 120, weeklyGoal: 5, defaultMode: "soft", routeKm: 2860,
    milestones: [
      { km: 1,    name: "Donaueschingen, Germany", emoji: "🇩🇪" },
      { km: 360,  name: "Vienna",                  emoji: "🎼" },
      { km: 680,  name: "Budapest",                emoji: "🏰" },
      { km: 1400, name: "Iron Gates Gorge",         emoji: "⛰️" },
      { km: 2860, name: "Black Sea",               emoji: "🌊" },
    ],
    habits: [
      { id:"dist",      title:"Log distance",  emoji:"🚣", quip:"Downstream. Europe unrolling behind you.", type:"distance", points:1, unit:"km" },
      { id:"exp-sleep", title:"Sleep 7+ hours", emoji:"😴", quip:"Recovery is part of the journey.", type:"binary", points:2 },
      { id:"exp-fuel",  title:"Fuel well today", emoji:"🍽️", quip:"Protein + carbs. Serious ground ahead.", type:"binary", points:2 },
    ],
  },
  {
    id: "self-care-30", name: "Self-Care 30", emoji: "🌸", category: "lifestyle",
    description: "30 days of putting yourself first. Small rituals that add up to big change.",
    duration: 30, weeklyGoal: 65, defaultMode: "soft",
    habits: [
      { id:"sc-skin",  title:"Skincare routine",            emoji:"✨", quip:"Morning or night — just show up for yourself.",   type:"binary", points:2 },
      { id:"sc-metime",title:"20 min of 'me time'",         emoji:"🛁", quip:"Read, bathe, sit still. No phone. No guilt.",     type:"binary", points:3 },
      { id:"sc-move",  title:"Move your body — 10 min (any way)",    emoji:"🚶", quip:"Walk, stretch, dance — anything that feels good.", type:"binary", points:2 },
      { id:"sc-joy",   title:"One thing that brought joy",  emoji:"😊", quip:"Name it out loud or write it down.",              type:"binary", points:2 },
    ]
  },
  {
    id: "gratitude-reset", name: "Gratitude Reset", emoji: "🙏", category: "lifestyle",
    description: "21 days of daily gratitude practice. Simple, consistent, and quietly transformative.",
    duration: 21, weeklyGoal: 70, defaultMode: "soft",
    habits: [
      { id:"gr-morning", title:"3 gratitudes at breakfast",    emoji:"☀️", quip:"Name them before the day buries them.",    type:"binary", points:3 },
      { id:"gr-person",  title:"Thank someone today",          emoji:"💌", quip:"Text, call, say it in person. Do it.",       type:"binary", points:3 },
      { id:"gr-nocomplain",title:"No complaining",             emoji:"🤐", quip:"Catch the complaint. Replace it.",           type:"binary", points:2 },
      { id:"gr-evening", title:"Evening reflection (2 min)",   emoji:"🌙", quip:"One good thing from today. Always one.",     type:"binary", points:2 },
    ]
  },
  {
    id: "mental-health-30", name: "Mental Health Reset", emoji: "🧠", category: "lifestyle",
    description: "30 days of daily habits that protect your mind. No apps, no hacks — just consistency.",
    duration: 30, weeklyGoal: 65, defaultMode: "soft",
    habits: [
      { id:"mh-mind",   title:"10 min mindfulness or breathwork", emoji:"🧘", quip:"Sit. Breathe. Nothing else.",              type:"binary", points:3 },
      { id:"mh-connect",title:"Connect with someone",             emoji:"👋", quip:"Message, call, or sit with another human.", type:"binary", points:2 },
      { id:"mh-move",   title:"Physical activity (any)",          emoji:"🏃", quip:"Even a 10-min walk changes brain chemistry.",type:"binary", points:2 },
      { id:"mh-screen", title:"Limit doom-scrolling",             emoji:"📵", quip:"No news or social media after 9 PM.",       type:"binary", points:2 },
    ]
  },
  {
    id: "morning-power-hour", name: "Morning Power Hour", emoji: "⚡", category: "transformation",
    description: "30 days of owning your mornings before anyone else can. The first hour sets everything.",
    duration: 30, weeklyGoal: 80, defaultMode: "soft",
    habits: [
      { id:"mph-wake",   title:"Wake before 6 AM (or target time)", emoji:"⏰", quip:"The alarm rings. You get up. That's it.",    type:"binary", points:3 },
      { id:"mph-nosnooze",title:"No snooze",                       emoji:"🚫", quip:"Snooze is a lie. You know this.",            type:"binary", points:2 },
      { id:"mph-nophone",title:"No phone first 30 min",            emoji:"📵", quip:"Own your morning before the internet does.", type:"binary", points:2 },
      { id:"mph-move",   title:"Exercise or movement",             emoji:"💪", quip:"Even 15 min of movement changes everything.", type:"binary", points:3 },
    ]
  },
  {
    id: "posture-fix", name: "Posture Fix", emoji: "🦴", category: "health",
    description: "30 days of posture and mobility habits. Undo the damage from screens and sitting.",
    duration: 30, weeklyGoal: 65, defaultMode: "soft",
    habits: [
      { id:"pf-check",   title:"Posture check every hour",    emoji:"📐", quip:"Shoulders back. Screen at eye level. Repeat.", type:"binary", points:2 },
      { id:"pf-stretch", title:"10 min mobility / stretching",emoji:"🧘", quip:"Hip flexors, chest, and thoracic spine first.", type:"binary", points:3 },
      { id:"pf-walk",    title:"15 min walk",                 emoji:"🚶", quip:"Walking resets posture better than anything.",  type:"binary", points:2 },
      { id:"pf-desk",    title:"Desk or workstation check",   emoji:"💻", quip:"Monitor height, chair height, elbow angle.",    type:"binary", points:1 },
    ]
  },

  // ── New Challenges ────────────────────────────────────────────────────────
  {
    id: "beginner-strength", name: "Beginner Strength 3×/Week", emoji: "🏋️", category: "movement",
    description: "6 weeks of structured lifting for beginners. Three sessions a week — upper, lower, and full body — plus mobility and protein to support recovery.",
    duration: 42, weeklyGoal: 45, defaultMode: "soft",
    habits: [
      { id:"bs-lift",    title:"Lift session",                emoji:"🏋️", quip:"Upper, lower, or full body — show up and lift.",
        type:"tiered", points:5, tiers:[{label:"Upper body",pts:5},{label:"Lower body",pts:5},{label:"Full body",pts:5}] },
      { id:"bs-mobility",title:"Mobility (10 min)",           emoji:"🧘", quip:"Warm up and cool down. Your joints will thank you.", type:"binary", points:2 },
      { id:"bs-protein", title:"Hit protein target",          emoji:"🥩", quip:"0.8–1g per lb bodyweight. Muscle can't build without it.", type:"binary", points:3 },
    ]
  },
  {
    id: "pushup-challenge", name: "Push-Up Challenge", emoji: "💪", category: "movement",
    description: "30 days of daily push-ups with progressive overload. Start where you are, build from there.",
    duration: 30, weeklyGoal: 40, defaultMode: "soft",
    habits: [
      { id:"pu-pushups",  title:"Push-ups",                   emoji:"💪", quip:"Chest to floor. Lock out at the top. Count every rep.",
        type:"tiered", points:2, tiers:[{label:"10 reps",pts:2},{label:"25 reps",pts:3},{label:"50 reps",pts:5},{label:"100+ reps",pts:7}] },
      { id:"pu-stretch",  title:"Chest & shoulder stretch",   emoji:"🧘", quip:"Open up what you just worked. Keep the shoulders healthy.", type:"binary", points:1 },
    ]
  },
  {
    id: "pullup-progression", name: "Pull-Up & Row Progression", emoji: "🏋️", category: "movement",
    description: "6 weeks of progressive pulling strength — from rows to full pull-ups. Includes scapular health work to keep shoulders robust.",
    duration: 42, weeklyGoal: 38, defaultMode: "soft",
    habits: [
      { id:"pp-pull",     title:"Pull / row session",         emoji:"🏋️", quip:"Rows build to pull-ups. Both count. Track your reps.",
        type:"tiered", points:2, tiers:[{label:"5 reps",pts:2},{label:"10 reps",pts:4},{label:"15 reps",pts:6},{label:"20+ reps",pts:8}] },
      { id:"pp-scapular", title:"Scapular health (band work)", emoji:"🦴", quip:"Scapular retractions, Y-T-W raises, or band pull-aparts. Do them.", type:"binary", points:2 },
    ]
  },
  {
    id: "language-learning", name: "Language Learning", emoji: "🌐", category: "lifestyle",
    description: "60 days of daily language practice. Consistency beats intensity — small daily sessions compound into real fluency.",
    duration: 60, weeklyGoal: 55, defaultMode: "soft",
    habits: [
      { id:"ll-practice",  title:"Daily practice (20+ min)",  emoji:"🌐", quip:"App, textbook, tutor, or conversation. 20 minutes every day.", type:"binary", points:4 },
      { id:"ll-vocab",     title:"Learn 10 new words",        emoji:"📖", quip:"Vocabulary is the building block of everything else.",           type:"binary", points:2 },
      { id:"ll-listen",    title:"Listen or watch native content", emoji:"🎧", quip:"Podcasts, shows, or music in the target language.",         type:"binary", points:2 },
      { id:"ll-streak",    title:"No-skip streak",            emoji:"🔥", quip:"The streak is the discipline. Don't break it.",                  type:"binary", points:1 },
    ]
  },
  {
    id: "budget-reset", name: "Budget Reset", emoji: "💰", category: "lifestyle",
    description: "30 days of intentional spending. Track every purchase, cut impulse buys, and build the foundation for financial control.",
    duration: 30, weeklyGoal: 40, defaultMode: "soft",
    habits: [
      { id:"br-log",       title:"Log every expense",          emoji:"📊", quip:"You can't manage what you don't measure. Log it all.", type:"binary", points:4 },
      { id:"br-noimpulse", title:"No impulse purchase",        emoji:"🚫", quip:"Pause 24 hours before any unplanned buy.",               type:"binary", points:3 },
      { id:"br-cook",      title:"Pack lunch or cook at home", emoji:"🍳", quip:"Restaurant meals are the fastest money drain. Cook instead.", type:"binary", points:2 },
    ]
  },
  {
    id: "mindful-eating", name: "Mindful Eating", emoji: "🍽️", category: "lifestyle",
    description: "21 days of eating with intention. No distractions, no rushing, no eating past the point of comfort. Simple rules that change your relationship with food.",
    duration: 21, weeklyGoal: 35, defaultMode: "soft",
    habits: [
      { id:"me-noscreen",  title:"No eating in front of screens", emoji:"📵", quip:"Screens double your portion size without you noticing.", type:"binary", points:3 },
      { id:"me-chew",      title:"Chew slowly, no rushing",       emoji:"🍽️", quip:"It takes 20 minutes for fullness to register. Slow down.", type:"binary", points:2 },
      { id:"me-80pct",     title:"Stop at 80% full",              emoji:"🛑", quip:"Hara hachi bu — the Okinawan rule. Stop before full.", type:"binary", points:3 },
      { id:"me-nolate",    title:"No eating after 8 PM",          emoji:"🌙", quip:"Late-night eating disrupts sleep and digestion. Cut it.", type:"binary", points:2 },
    ]
  },
  {
    id: "nature-reset", name: "Nature Reset", emoji: "🌿", category: "lifestyle",
    description: "21 days of daily outdoor time and morning sunlight. Grounding, resetting, and starting each day on nature's terms.",
    duration: 21, weeklyGoal: 30, defaultMode: "soft",
    habits: [
      { id:"nr-outside",   title:"20+ min outside",                emoji:"🌳", quip:"Rain or shine. Outside is the goal.",                     type:"binary", points:3 },
      { id:"nr-sunlight",  title:"Morning sunlight within 1 hr of waking", emoji:"☀️", quip:"Sets your circadian clock for the next 24 hours.", type:"binary", points:3 },
      { id:"nr-noscreen",  title:"No screens first 30 min",        emoji:"📵", quip:"Start the day before the internet does.",                 type:"binary", points:2 },
    ]
  },
  {
    id: "start-small", name: "Start Small", emoji: "🎯", category: "lifestyle",
    description: "14 days of simple daily wins. Build momentum without overwhelm.",
    duration: 14, weeklyGoal: 45, defaultMode: "soft",
    habits: [
      { id:"ss-move",    title:"10 min movement",        emoji:"🚶", quip:"Walk, stretch, or move. Keep the promise small.", type:"binary", points:3 },
      { id:"ss-water",   title:"Drink water",            emoji:"💧", quip:"Start with the basics. Hydrate today.",           type:"binary", points:2 },
      { id:"ss-protein", title:"Protein with first meal",emoji:"🥩", quip:"Anchor the day with a solid first meal.",          type:"binary", points:3 },
      { id:"ss-plan",    title:"Plan tomorrow",          emoji:"📝", quip:"One minute tonight makes tomorrow easier.",        type:"binary", points:2 },
    ]
  },
  {
    id: "reset-week", name: "Reset Week", emoji: "↻", category: "lifestyle",
    description: "A 7-day reset for getting back in control after falling off track.",
    duration: 7, weeklyGoal: 45, defaultMode: "soft",
    habits: [
      { id:"rw-walk",  title:"Walk 10 minutes", emoji:"🚶", quip:"Move first. Momentum follows.",                 type:"binary", points:3 },
      { id:"rw-food",  title:"Whole-food meal", emoji:"🥗", quip:"One real meal. Simple and honest.",              type:"binary", points:3 },
      { id:"rw-alc",   title:"No alcohol",      emoji:"🚫", quip:"Keep the reset clean today.",                    type:"binary", points:3 },
      { id:"rw-sleep", title:"Sleep routine",   emoji:"🌙", quip:"Same wake-up time, phone away 30 min before bed.",      type:"binary", points:2 },
    ]
  },
  {
    id: "momentum-builder", name: "Momentum Builder", emoji: "⚡", category: "transformation",
    description: "30 days to build daily structure through routines, movement, reading, nutrition, and sleep.",
    duration: 30, weeklyGoal: 70, defaultMode: "soft",
    habits: [
      { id:"mb-morning", title:"Morning routine", emoji:"🌅", quip:"Wake on time, no phone first 30 min, water before coffee.",                type:"binary", points:3 },
      { id:"mb-steps",   title:"8,000 steps",     emoji:"👟", quip:"Move enough to feel awake and capable.",      type:"binary", points:3 },
      { id:"mb-read",    title:"Read 10 pages",   emoji:"📖", quip:"Feed your mind before the day ends.",         type:"binary", points:2 },
      { id:"mb-protein", title:"Protein goal",    emoji:"🥩", quip:"0.8–1g per lb bodyweight. Build meals around it.",                 type:"binary", points:3 },
      { id:"mb-sleep",   title:"Sleep routine",   emoji:"🌙", quip:"Same wake-up time, phone away 30 min before bed.",                 type:"binary", points:2 },
    ]
  },
  {
    id: "lean-start", name: "Lean Start — Simple Basics", emoji: "⚖️", category: "health",
    description: "30 days, no tracking required. Protein, steps, real food — the simplest starting point for fat loss.",
    duration: 30, weeklyGoal: 60, defaultMode: "soft",
    habits: [
      { id:"ls-protein", title:"Protein goal",       emoji:"🥩", quip:"0.8–1g per lb bodyweight. Keep it simple.",             type:"binary", points:4 },
      { id:"ls-steps",   title:"8,000 steps",        emoji:"👟", quip:"Walk daily. The baseline matters.",          type:"binary", points:3 },
      { id:"ls-food",    title:"Whole-food meals",   emoji:"🥗", quip:"Choose real food most of the day.",          type:"binary", points:3 },
      { id:"ls-drinks",  title:"No liquid calories", emoji:"🥤", quip:"Calories you drink are easy to miss.",       type:"binary", points:2 },
    ]
  },
  {
    id: "fat-loss-foundation", name: "Fat Loss Foundation — 42 Day Complete", emoji: "🔥", category: "health",
    description: "The full 6-week version — protein, fiber, movement, strength, and sleep, all in one.",
    duration: 42, weeklyGoal: 70, defaultMode: "soft",
    habits: [
      { id:"fl-protein", title:"Protein goal",    emoji:"🥩", quip:"0.8–1g per lb bodyweight. The anchor habit.",                    type:"binary", points:4 },
      { id:"fl-fiber",   title:"Fiber food",      emoji:"🥦", quip:"Vegetables, legumes, oats, or whole grains.", type:"binary", points:3 },
      { id:"fl-steps",   title:"8,000 steps",     emoji:"👟", quip:"Movement keeps the plan honest.",          type:"binary", points:3 },
      { id:"fl-strength",title:"Strength habit",  emoji:"🏋️", quip:"A short session counts. Show up.",         type:"binary", points:4 },
      { id:"fl-sleep",   title:"Sleep routine",   emoji:"🌙", quip:"Same wake-up time, phone away 30 min before bed.",        type:"binary", points:2 },
    ]
  },
  {
    id: "stress-reset", name: "Stress Reset", emoji: "🧘", category: "lifestyle",
    description: "14 days of simple nervous-system habits for calmer days.",
    duration: 14, weeklyGoal: 42, defaultMode: "soft",
    habits: [
      { id:"sr-light",  title:"Morning light",     emoji:"☀️", quip:"Get light early. Set the tone.",          type:"binary", points:3 },
      { id:"sr-walk",   title:"10 min walk",       emoji:"🚶", quip:"Let the body discharge pressure.",         type:"binary", points:3 },
      { id:"sr-shutdown",title:"Evening shutdown", emoji:"🌙", quip:"Write tomorrow's top task, phone away, lights dim.",                  type:"binary", points:3 },
      { id:"sr-breathe",title:"5 min breathing",   emoji:"🫁", quip:"Slow breathing. Quiet system.",            type:"binary", points:2 },
    ]
  },
  {
    id: "deep-work-sprint", name: "Deep Work Sprint", emoji: "🎯", category: "transformation",
    description: "14 days of focused work. Fewer distractions, clearer priorities, better output.",
    duration: 14, weeklyGoal: 38, defaultMode: "soft",
    habits: [
      { id:"dw-focus", title:"90 min focus block",       emoji:"🧠", quip:"One block. Phone away. Work deep.", type:"binary", points:5 },
      { id:"dw-social",title:"No social during work",    emoji:"📵", quip:"Protect the block.",               type:"binary", points:3 },
      { id:"dw-plan",  title:"Plan tomorrow",            emoji:"📝", quip:"Decide the next mission tonight.", type:"binary", points:2 },
    ]
  },
  {
    id: "strength-foundation", name: "Strength Foundation", emoji: "🏋️", category: "movement",
    description: "30 days of basic strength consistency. This is a habit challenge, not a performance program.",
    duration: 30, weeklyGoal: 50, defaultMode: "soft",
    habits: [
      { id:"sf-strength", title:"Strength session", emoji:"🏋️", quip:"Bodyweight or weights. Train the pattern.", type:"binary", points:4 },
      { id:"sf-core",     title:"Core work",        emoji:"🧱", quip:"Plank, dead bug, or carries.",               type:"binary", points:2 },
      { id:"sf-mobility", title:"Mobility (10 min)",         emoji:"🧘", quip:"Move better so you can train again.",        type:"binary", points:2 },
      { id:"sf-protein",  title:"Protein goal",     emoji:"🥩", quip:"0.8–1g per lb bodyweight. Support recovery.",        type:"binary", points:3 },
    ]
  },
];

// ── Badge Definitions ──────────────────────────────────────────────────────

// Universal badges — earned once across all challenges (tracked in state.globalBadges)
const UNIVERSAL_BADGES = [
  // Streak milestones (best streak across any challenge)
  { id:"u-3d",     label:"✨ Getting Started",   desc:"Reach a 3-day Fire in any Quest.",                    test: u => u.longestStreak >= 3 },
  { id:"u-7d",     label:"🔥 On Fire",            desc:"7-day Fire.",                                         test: u => u.longestStreak >= 7 },
  { id:"u-14d",    label:"🦾 Iron Week",          desc:"14-day Fire.",                                        test: u => u.longestStreak >= 14 },
  { id:"u-21d",    label:"🧠 Oath Locked",        desc:"21-day Fire. You've built a powerful routine.",       test: u => u.longestStreak >= 21 },
  { id:"u-30d",    label:"💪 Locked In",          desc:"30-day Fire.",                                        test: u => u.longestStreak >= 30 },
  { id:"u-60d",    label:"📆 Two Months",         desc:"60-day Fire.",                                        test: u => u.longestStreak >= 60 },
  { id:"u-75d",    label:"🏆 75 Fire",            desc:"75 consecutive days. Legendary.",                     test: u => u.longestStreak >= 75 },
  // XP (all-time total across all challenges)
  { id:"u-p10",    label:"⚡ First XP",           desc:"Earn your first 10 XP.",                              test: u => u.totalPts >= 10 },
  { id:"u-p100",   label:"💯 Century",            desc:"100 XP total.",                                       test: u => u.totalPts >= 100 },
  { id:"u-p500",   label:"🏅 XP Collector",       desc:"500 total XP.",                                       test: u => u.totalPts >= 500 },
  { id:"u-p1k",    label:"💜 Elite",              desc:"1,000 total XP. Rare.",                               test: u => u.totalPts >= 1000 },
  // Body tracking (global)
  { id:"u-scale",  label:"⚖️ On The Scale",       desc:"Log your first weight check-in.",                    test: u => u.weighIns >= 1 },
  { id:"u-1lb",    label:"📉 First Pound",        desc:"Lose 1 lb from your starting weight.",               test: u => u.weightLost >= 1 },
  { id:"u-5lb",    label:"📉 5 lbs Down",         desc:"Lose 5 lbs.",                                        test: u => u.weightLost >= 5 },
  { id:"u-10lb",   label:"💪 10 lbs Down",        desc:"Lose 10 lbs. Seriously impressive.",                 test: u => u.weightLost >= 10 },
  { id:"u-wgoal",  label:"🎯 Goal Reached",       desc:"Hit your goal weight.",                               test: u => u.weightGoalReached },
  // Modes & behaviour
  { id:"u-cmback", label:"🧡 Comeback Kid",       desc:"Use the Save My Day recovery.",                      test: u => u.anyRecovered },
  // Challenge milestones
  { id:"u-first",  label:"🌊 First Wave",         desc:"Complete 100% of habits on your very first day.",   test: u => u.anyFirstDay },
  { id:"u-done1",  label:"✅ Challenge Done",     desc:"Finish your first challenge.",                        test: u => u.completedChallenges >= 1 },
  { id:"u-done3",  label:"🏆 Triple Threat",      desc:"Complete 3 challenges.",                              test: u => u.completedChallenges >= 3 },
  { id:"u-perfwk", label:"⭐ Perfect Week",        desc:"Complete all Oaths every day for 7 consecutive days.", test: u => u.hasPerfectWeek },
  // Hidden badges — show as "🔒 ???" until earned
  { id:"u-double-agent", label:"🔀 Double Agent",     desc:"Complete the same challenge twice.",                         tier:"rare",      hidden:true, test: u => u.doubleAgent },
  { id:"u-dark-horse",   label:"🖤 Dark Horse",       desc:"Come back after a streak gap and still finish.",             tier:"epic",      hidden:true, test: u => u.darkHorse },
  { id:"u-perfect-mt",   label:"💎 Perfect Month",    desc:"Complete 100% of habits every day for 30 consecutive days.", tier:"legendary", hidden:true, test: u => u.perfectMonth },
];

// Lifetime achievements — cross-challenge milestones earned once (tracked in state.globalBadges)
const LIFETIME_BADGES = [
  { id:"lt-100h",   label:"📦 100 Habits",         desc:"Log 100 individual habits across all challenges.",  test: l => l.totalHabitsLogged >= 100 },
  { id:"lt-500h",   label:"🔥 500 Habits",         desc:"Log 500 habits total. You're built different.",    test: l => l.totalHabitsLogged >= 500 },
  { id:"lt-5c",     label:"🎖️ Serial Challenger",  desc:"Complete 5 challenges.",                            test: l => l.completedChallenges >= 5 },
  { id:"lt-cats",   label:"🌍 Well Rounded",        desc:"Complete a challenge in all 3 categories.",        test: l => l.allCategoriesDone },
  { id:"lt-perf",   label:"💎 Perfect Run",         desc:"Complete a challenge without a single missed day.", test: l => l.perfectChallenge },
  { id:"lt-freeze", label:"❄️ Ice Age",             desc:"Use a streak freeze to save a streak.",             test: l => l.freezeUsed },
];

// Rank runes — earned by reaching rank milestones (5/10/15/20/25) on the Frostborn path.
// Tracked in state.globalBadges like Universal/Lifetime runes. Sticky once earned.
const THEME_BADGES = {
  frostborn: [
    { id:"theme-frostborn-5",  label:"❄️ Ice-Tempered",   desc:"Reach Rank 5. The cold no longer bothers you.",         levelReq:5,  tier:"uncommon" },
    { id:"theme-frostborn-10", label:"🛡️ Shield-Wall",    desc:"Reach Rank 10. You hold the line.",                     levelReq:10, tier:"rare" },
    { id:"theme-frostborn-15", label:"⚡ Jarl",            desc:"Reach Rank 15. You lead now.",                          levelReq:15, tier:"rare" },
    { id:"theme-frostborn-20", label:"🔥 Frostborn",      desc:"Reach Rank 20. Ice and fire, both yours to command.",   levelReq:20, tier:"epic" },
    { id:"theme-frostborn-25", label:"👑 Conqueror",       desc:"Reach Rank 25 — the top of the Frostborn path.",        levelReq:25, tier:"legendary" },
  ],
  phoenix: [
    { id:"theme-phoenix-5",  label:"🔥 First Ember",     desc:"Reach Flight 5. You've survived the fall.",             levelReq:5,  tier:"uncommon" },
    { id:"theme-phoenix-10", label:"🪶 Wings Forming",   desc:"Reach Flight 10. You're learning to rise.",             levelReq:10, tier:"rare" },
    { id:"theme-phoenix-15", label:"⚡ Rising Fast",     desc:"Reach Flight 15. Nothing holds you down now.",          levelReq:15, tier:"rare" },
    { id:"theme-phoenix-20", label:"✨ Living Proof",    desc:"Reach Flight 20. You are the comeback.",                levelReq:20, tier:"epic" },
    { id:"theme-phoenix-25", label:"👑 The Phoenix",     desc:"Reach Flight 25 — the top of the Phoenix path.",        levelReq:25, tier:"legendary" },
  ],
  everest: [
    { id:"theme-everest-5",  label:"🏕️ Basecamp Cleared", desc:"Reach Camp 5. The mountain knows your name.",         levelReq:5,  tier:"uncommon" },
    { id:"theme-everest-10", label:"🥾 Ridge Walker",      desc:"Reach Camp 10. Thin air, steady feet.",               levelReq:10, tier:"rare" },
    { id:"theme-everest-15", label:"☁️ Above the Clouds",  desc:"Reach Camp 15. Most never see this view.",            levelReq:15, tier:"rare" },
    { id:"theme-everest-20", label:"⚠️ The Death Zone",    desc:"Reach Camp 20. You're in rare air now.",              levelReq:20, tier:"epic" },
    { id:"theme-everest-25", label:"👑 Conqueror of Everest", desc:"Reach Camp 25 — the summit is yours.",             levelReq:25, tier:"legendary" },
  ],
  cosmos: [
    { id:"theme-cosmos-5",  label:"🛰️ Orbit Reached",   desc:"Reach Clearance 5. You've left the ground behind.",     levelReq:5,  tier:"uncommon" },
    { id:"theme-cosmos-10", label:"🌙 Moon Bound",       desc:"Reach Clearance 10. Halfway to somewhere new.",         levelReq:10, tier:"rare" },
    { id:"theme-cosmos-15", label:"🪐 Deep Space Pioneer", desc:"Reach Clearance 15. Few make it this far out.",       levelReq:15, tier:"rare" },
    { id:"theme-cosmos-20", label:"🚀 Mars Landing",     desc:"Reach Clearance 20. Touchdown on a new world.",         levelReq:20, tier:"epic" },
    { id:"theme-cosmos-25", label:"👑 First on Mars",    desc:"Reach Clearance 25 — the top of the Cosmos path.",      levelReq:25, tier:"legendary" },
  ],
  martial: [
    { id:"theme-martial-5",  label:"🥋 Blue Belt",       desc:"Reach Belt 5. The basics are yours now.",               levelReq:5,  tier:"uncommon" },
    { id:"theme-martial-10", label:"⚫ Black Belt",       desc:"Reach Belt 10. A beginner, at the highest level.",      levelReq:10, tier:"rare" },
    { id:"theme-martial-15", label:"👊 Iron Fist",       desc:"Reach Belt 15. Discipline made physical.",              levelReq:15, tier:"rare" },
    { id:"theme-martial-20", label:"🐉 Shihan",          desc:"Reach Belt 20. You teach through example now.",         levelReq:20, tier:"epic" },
    { id:"theme-martial-25", label:"👑 Grandmaster",     desc:"Reach Belt 25 — the top of the Martial Arts path.",     levelReq:25, tier:"legendary" },
  ],
};

// Template-specific badges — 5 per template, only shown/counted for that challenge (tracked in challenge.badges)
const TEMPLATE_BADGES = {
  "cruise-control": [
    { id:"cc-start",    label:"🌊 Day 1 Done",          desc:"Complete 100% on Day 1.",                          test: c => c.dayNumber >= 1 && c.complete },
    { id:"cc-month",    label:"📅 One Month",            desc:"Complete 4 full weeks.",                           test: c => c.completedWeeks >= 4 },
    { id:"cc-halfway",  label:"⚡ Halfway",              desc:"Reach the 43-day mark.",                           test: c => c.pctDone >= 50 },
    { id:"cc-week8",    label:"📆 Two Months",           desc:"Complete 8 full weeks.",                           test: c => c.completedWeeks >= 8 },
    { id:"cc-done",     label:"🔱 Cruise Control",        desc:"Complete the full 30-day Cruise Control challenge.", test: c => c.pctDone >= 99 && c.complete },
  ],
  "75-hard": [
    { id:"hard-start",   label:"💪 Day 1",               desc:"Complete 100% on Day 1 of 75 Hard.",               test: c => c.dayNumber >= 1 && c.complete },
    { id:"hard-3wk",     label:"📅 3 Weeks In",          desc:"Complete 3 full weeks. No compromises.",           test: c => c.completedWeeks >= 3 },
    { id:"hard-photos",  label:"📸 7 Photo Days",        desc:"Log the progress photo habit 7 times.",            test: c => c.photosLogged >= 7 },
    { id:"hard-halfway", label:"⚡ Halfway",             desc:"Day 37+. You're past the hard part.",              test: c => c.pctDone >= 50 },
    { id:"hard-done",    label:"🏆 75 Hard Complete",    desc:"Finish all 75 days. Zero compromises.",            test: c => c.pctDone >= 99 && c.complete },
  ],
  "75-soft": [
    { id:"soft-start",   label:"🧘 Day 1",               desc:"Complete Day 1.",                                  test: c => c.dayNumber >= 1 && c.complete },
    { id:"soft-month",   label:"📅 One Month",           desc:"Complete 4 full weeks.",                           test: c => c.completedWeeks >= 4 },
    { id:"soft-halfway", label:"🌊 Halfway",             desc:"Day 37+.",                                         test: c => c.pctDone >= 50 },
    { id:"soft-done",    label:"✅ 75 Soft Done",        desc:"Complete all 75 days.",                            test: c => c.pctDone >= 99 && c.complete },
    { id:"soft-lvlup",   label:"⬆️ Level Up Ready",      desc:"Finished 75 Soft — now try 75 Hard.",              test: c => c.pctDone >= 99 && c.complete },
  ],
  "30-pushups": [
    { id:"pu-first",    label:"💥 First Rep",            desc:"Log your first push-up session.",                  test: c => c.daysLogged >= 1 },
    { id:"pu-week",     label:"📅 Push-Up Week",         desc:"7 consecutive push-up days.",                      test: c => c.streak >= 7 },
    { id:"pu-halfway",  label:"💪 Halfway",              desc:"15 days logged.",                                  test: c => c.daysLogged >= 15 },
    { id:"pu-boss",     label:"💪 Beast Mode",           desc:"Log 25 push-up sessions.",                         test: c => c.daysLogged >= 25 },
    { id:"pu-done",     label:"💥 30 Days Strong",       desc:"Complete the full 30-day challenge.",               test: c => c.pctDone >= 99 && c.complete },
  ],
  "dry-month": [
    { id:"dm-day1",     label:"🚫 Day 1 Sober",          desc:"First alcohol-free day.",                          test: c => c.soberStreak >= 1 },
    { id:"dm-week",     label:"🚫 Sober Week",           desc:"7-day alcohol-free streak.",                       test: c => c.soberStreak >= 7 },
    { id:"dm-halfway",  label:"💧 Halfway",              desc:"15 days alcohol-free.",                            test: c => c.soberStreak >= 15 },
    { id:"dm-month",    label:"💎 Sober Month",          desc:"30 days alcohol-free.",                            test: c => c.soberStreak >= 30 },
    { id:"dm-done",     label:"✅ Dry Month Done",       desc:"Complete the full 30-day dry month.",              test: c => c.pctDone >= 99 && c.complete },
  ],
  "reading": [
    { id:"rd-first",    label:"📖 First Chapter",        desc:"Log your first reading session.",                  test: c => c.daysLogged >= 1 },
    { id:"rd-week",     label:"📚 Reading Week",         desc:"7-day reading streak.",                            test: c => c.streak >= 7 },
    { id:"rd-halfway",  label:"📖 Halfway",              desc:"15 reading sessions.",                             test: c => c.daysLogged >= 15 },
    { id:"rd-bkworm",   label:"📚 Bookworm",             desc:"Log 20 reading sessions.",                         test: c => c.daysLogged >= 20 },
    { id:"rd-done",     label:"✅ Reading Month Done",   desc:"Complete 30 days of reading.",                     test: c => c.pctDone >= 99 && c.complete },
  ],
  "dog-walk": [
    { id:"dw-first",    label:"🐕 First Walk",           desc:"Log your first dog walk.",                         test: c => c.daysLogged >= 1 },
    { id:"dw-6km",      label:"🗺️ Adventure Walk",       desc:"Log a 6 km+ walk.",                               test: c => c.has6kmWalk },
    { id:"dw-week",     label:"🌅 Walk Week",            desc:"7-day walking streak.",                            test: c => c.streak >= 7 },
    { id:"dw-halfway",  label:"🐾 Halfway",              desc:"15 walks logged.",                                 test: c => c.daysLogged >= 15 },
    { id:"dw-done",     label:"✅ 30 Walks Done",        desc:"Complete the full 30-day dog walk challenge.",     test: c => c.pctDone >= 99 && c.complete },
  ],
  "cycling": [
    { id:"cy-first",    label:"🚲 First Ride",           desc:"Log your first bike ride.",                        test: c => c.daysLogged >= 1 },
    { id:"cy-50km",     label:"🏔️ Epic Ride",            desc:"Log a 50 km+ ride.",                              test: c => c.has50kmRide },
    { id:"cy-week",     label:"🚴 Saddle Week",          desc:"7 consecutive riding days.",                       test: c => c.streak >= 7 },
    { id:"cy-halfway",  label:"⚡ Halfway",              desc:"15 rides logged.",                                 test: c => c.daysLogged >= 15 },
    { id:"cy-done",     label:"✅ 30 Days Cycling",      desc:"Complete the full 30-day challenge.",               test: c => c.pctDone >= 99 && c.complete },
  ],
  "walking": [
    { id:"wk-first",    label:"👟 First Steps",          desc:"Log your first walk.",                             test: c => c.daysLogged >= 1 },
    { id:"wk-10km",     label:"⚡ 10 km Walk",           desc:"Log a 10 km+ walk.",                              test: c => c.has10kmWalk },
    { id:"wk-week",     label:"🚶 Walk Week",            desc:"7-day walking streak.",                            test: c => c.streak >= 7 },
    { id:"wk-halfway",  label:"🚶 Halfway",              desc:"15 walks logged.",                                 test: c => c.daysLogged >= 15 },
    { id:"wk-done",     label:"✅ Walking Month Done",   desc:"Complete 30 days of walking.",                     test: c => c.pctDone >= 99 && c.complete },
  ],
  "running": [
    { id:"rn-first",    label:"👟 First Run",            desc:"Log your first run.",                              test: c => c.runsLogged >= 1 },
    { id:"rn-5k",       label:"🏅 5k Done",              desc:"Run 5 km or further.",                             test: c => c.hasRun5k },
    { id:"rn-10",       label:"🏃 Ten Runs",             desc:"Log 10 run sessions.",                             test: c => c.runsLogged >= 10 },
    { id:"rn-halfway",  label:"🔥 Halfway",              desc:"15 runs logged.",                                  test: c => c.runsLogged >= 15 },
    { id:"rn-done",     label:"✅ Running Month Done",   desc:"Complete 30 days of running.",                     test: c => c.pctDone >= 99 && c.complete },
  ],
  "creative": [
    { id:"cr-first",    label:"✨ First Creation",       desc:"Log your first creative session.",                 test: c => c.daysLogged >= 1 },
    { id:"cr-week",     label:"🎨 Creative Week",        desc:"7-day creative streak.",                           test: c => c.streak >= 7 },
    { id:"cr-boss",     label:"🚀 Shipped It",           desc:"Log 10 creative sessions.",                        test: c => c.daysLogged >= 10 },
    { id:"cr-halfway",  label:"✨ Halfway",              desc:"15 creative sessions.",                            test: c => c.daysLogged >= 15 },
    { id:"cr-done",     label:"✅ Creative Month Done",  desc:"Complete 30 days of creativity.",                  test: c => c.pctDone >= 99 && c.complete },
  ],
  "strength": [
    { id:"st-first",    label:"🏋️ First Rep",            desc:"Log your first lift session.",                     test: c => c.hasLifted },
    { id:"st-pr",       label:"⚡ PR Hunter",             desc:"Hit a personal record.",                           test: c => c.hasPR },
    { id:"st-week",     label:"💪 Training Week",        desc:"7-day lifting streak.",                            test: c => c.streak >= 7 },
    { id:"st-20",       label:"🏋️ Gym Rat",              desc:"Log 20 lift sessions.",                            test: c => c.liftsLogged >= 20 },
    { id:"st-done",     label:"✅ Strength Month Done",  desc:"Complete 30 days of strength training.",           test: c => c.pctDone >= 99 && c.complete },
  ],
  "meditation": [
    { id:"med-first",   label:"🧘 First Sit",            desc:"Log your first meditation.",                       test: c => c.meditationLogged >= 1 },
    { id:"med-week",    label:"🌿 Inner Peace",          desc:"7-day meditation streak.",                         test: c => c.meditationStreak >= 7 },
    { id:"med-deep",    label:"🌊 Deep State",           desc:"Complete 20 meditation sessions.",                  test: c => c.meditationLogged >= 20 },
    { id:"med-halfway", label:"🧘 Halfway",              desc:"15 meditation sessions.",                          test: c => c.meditationLogged >= 15 },
    { id:"med-done",    label:"✅ Meditation Month Done",desc:"Complete 30 days of meditation.",                  test: c => c.pctDone >= 99 && c.complete },
  ],
  "cold-exposure": [
    { id:"ce-first",    label:"🧊 First Plunge",         desc:"Take your first cold shower.",                     test: c => c.coldShowersLogged >= 1 },
    { id:"ce-week",     label:"❄️ Cold Warrior",         desc:"7-day cold shower streak.",                        test: c => c.coldShowerStreak >= 7 },
    { id:"ce-plunge",   label:"🏔️ Ice Bath",             desc:"Complete a full 5-min cold plunge.",               test: c => c.hasColdPlunge },
    { id:"ce-halfway",  label:"🧊 Halfway",              desc:"15 cold sessions.",                                test: c => c.coldShowersLogged >= 15 },
    { id:"ce-done",     label:"✅ Cold Month Done",      desc:"Complete 30 days of cold exposure.",               test: c => c.pctDone >= 99 && c.complete },
  ],
  "sleep-reset": [
    { id:"sl-first",    label:"😴 Lights Out",           desc:"Log your first sleep habit.",                      test: c => c.sleepHabitsLogged >= 1 },
    { id:"sl-week",     label:"🌙 Deep Sleeper",         desc:"7-day sleep streak.",                              test: c => c.sleepStreak >= 7 },
    { id:"sl-boss",     label:"⭐ Perfect Night",        desc:"Complete 15 sleep sessions.",                      test: c => c.sleepHabitsLogged >= 15 },
    { id:"sl-halfway",  label:"😴 Halfway",              desc:"10+ days of sleep habits.",                        test: c => c.sleepHabitsLogged >= 10 },
    { id:"sl-done",     label:"✅ Sleep Reset Done",     desc:"Complete all 21 days.",                            test: c => c.pctDone >= 99 && c.complete },
  ],
  "no-sugar": [
    { id:"ns-first",    label:"🚫 Sugar Free",           desc:"Your first no-sugar day.",                         test: c => c.noSugarLogged >= 1 },
    { id:"ns-week",     label:"🍎 Sweet Freedom",        desc:"7-day no-sugar streak.",                           test: c => c.noSugarStreak >= 7 },
    { id:"ns-halfway",  label:"🚫 Halfway",              desc:"15 sugar-free days.",                              test: c => c.noSugarLogged >= 15 },
    { id:"ns-pure",     label:"💎 Pure",                 desc:"Log 25 sugar-free days.",                          test: c => c.noSugarLogged >= 25 },
    { id:"ns-done",     label:"✅ No Sugar Done",        desc:"Complete 30 days without added sugar.",            test: c => c.pctDone >= 99 && c.complete },
  ],
  "morning-routine": [
    { id:"mr-first",    label:"🌅 Early Bird",           desc:"Complete your first morning routine.",             test: c => c.morningRoutineLogged >= 1 },
    { id:"mr-week",     label:"☀️ Sunrise Club",         desc:"7-day morning streak.",                            test: c => c.morningRoutineStreak >= 7 },
    { id:"mr-cold",     label:"🧊 Cold Morning",         desc:"Log 20 morning routines.",                         test: c => c.morningRoutineLogged >= 20 },
    { id:"mr-halfway",  label:"🌅 Halfway",              desc:"15 mornings logged.",                              test: c => c.morningRoutineLogged >= 15 },
    { id:"mr-done",     label:"✅ Morning Routine Done", desc:"Complete 30 days of morning routines.",            test: c => c.pctDone >= 99 && c.complete },
  ],
  "yoga-flexibility": [
    { id:"yf-first",    label:"🧘 First Flow",           desc:"Complete your first yoga session.",                 test: c => c.yogaLogged >= 1 },
    { id:"yf-week",     label:"🌿 Flexible Mind",        desc:"7-day yoga streak.",                               test: c => c.yogaStreak >= 7 },
    { id:"yf-flow",     label:"🌊 Full Flow",            desc:"Log 20 yoga sessions.",                            test: c => c.yogaLogged >= 20 },
    { id:"yf-halfway",  label:"🧘 Halfway",              desc:"15 yoga sessions.",                                test: c => c.yogaLogged >= 15 },
    { id:"yf-done",     label:"✅ Yoga Month Done",      desc:"Complete 30 days of yoga.",                        test: c => c.pctDone >= 99 && c.complete },
  ],
  "digital-detox": [
    { id:"dd-first",    label:"📵 Unplugged",            desc:"Complete your first detox day.",                    test: c => c.detoxLogged >= 1 },
    { id:"dd-week",     label:"🌳 Screen Free",          desc:"7-day detox streak.",                              test: c => c.detoxStreak >= 7 },
    { id:"dd-zero",     label:"🏆 Zero Social",          desc:"Log 20 screen-free days.",                         test: c => c.detoxLogged >= 20 },
    { id:"dd-halfway",  label:"📵 Halfway",              desc:"15 detox days.",                                   test: c => c.detoxLogged >= 15 },
    { id:"dd-done",     label:"✅ Detox Done",           desc:"Complete 30 days of digital detox.",               test: c => c.pctDone >= 99 && c.complete },
  ],
  "intermittent-fasting": [
    { id:"if-first",    label:"⏱️ First Fast",            desc:"Complete your first 16-hour fast.",               test: c => c.fastingLogged >= 1 },
    { id:"if-week",     label:"🔥 Fat Adapted",          desc:"7-day fasting streak.",                            test: c => c.fastingStreak >= 7 },
    { id:"if-20hr",     label:"⚡ 20-Hour Fast",         desc:"Log 20 fasting days.",                             test: c => c.fastingLogged >= 20 },
    { id:"if-halfway",  label:"⏱️ Halfway",              desc:"15 fasts completed.",                              test: c => c.fastingLogged >= 15 },
    { id:"if-done",     label:"✅ Fasting Month Done",   desc:"Complete 30 days of fasting.",                     test: c => c.pctDone >= 99 && c.complete },
  ],
  "core-abs": [
    { id:"ca-first",    label:"💪 Core Activated",       desc:"Log your first core session.",                     test: c => c.coreLogged >= 1 },
    { id:"ca-week",     label:"🔥 Iron Core",            desc:"7-day core streak.",                               test: c => c.streak >= 7 },
    { id:"ca-blast",    label:"🏆 Core Blast",           desc:"Log 15 core sessions.",                            test: c => c.coreLogged >= 15 },
    { id:"ca-20",       label:"💪 20 Core Sessions",     desc:"Log 20 core workouts.",                            test: c => c.coreLogged >= 20 },
    { id:"ca-done",     label:"✅ Core Month Done",      desc:"Complete 30 days of core training.",               test: c => c.pctDone >= 99 && c.complete },
  ],

  // Expedition routes — km-milestone badges
  "everest-bc": [
    { id:"ebc-start",     label:"🥾 First Steps",          desc:"Log your first km on the trail.",                  test: c => c.totalKm >= 1 },
    { id:"ebc-phakding",  label:"🏡 Phakding",             desc:"Reach the first mountain village (10 km).",        test: c => c.totalKm >= 10 },
    { id:"ebc-namche",    label:"🏙️ Namche Bazaar",        desc:"Climb to the Sherpa capital (40 km).",             test: c => c.totalKm >= 40 },
    { id:"ebc-gorak",     label:"⛺ Gorak Shep",           desc:"Reach the highest camp (100 km).",                 test: c => c.totalKm >= 100 },
    { id:"ebc-done",      label:"🏔️ Base Camp!",           desc:"Conquer Everest Base Camp — all 130 km.",          test: c => c.totalKm >= 130 },
  ],
  "west-highland-way": [
    { id:"whw-start",   label:"🥾 First Steps",     desc:"Log your first km on the Way.",                       test: c => c.totalKm >= 1   },
    { id:"whw-balmaha", label:"🌊 Balmaha",          desc:"Reach the shores of Loch Lomond (20 km).",           test: c => c.totalKm >= 20  },
    { id:"whw-inv",     label:"🏞️ Inverarnan",       desc:"Pass the north end of Loch Lomond (50 km).",         test: c => c.totalKm >= 50  },
    { id:"whw-tyn",     label:"🏘️ Tyndrum",          desc:"Into the open Highlands (80 km).",                   test: c => c.totalKm >= 80  },
    { id:"whw-kin",     label:"⛰️ Kinlochleven",     desc:"The final mountain crossing (120 km).",              test: c => c.totalKm >= 120 },
    { id:"whw-done",    label:"🎉 Fort William!",    desc:"Complete the full West Highland Way — 154 km.",      test: c => c.totalKm >= 154 },
  ],
  "tour-du-mont-blanc": [
    { id:"tmb-start",  label:"🥾 Chamonix Start",  desc:"Log your first km around the massif.",                test: c => c.totalKm >= 1   },
    { id:"tmb-cont",   label:"🌲 Les Contamines",  desc:"Into France's southern valleys (30 km).",             test: c => c.totalKm >= 30  },
    { id:"tmb-cour",   label:"🇮🇹 Courmayeur",     desc:"Cross into Italy (60 km).",                           test: c => c.totalKm >= 60  },
    { id:"tmb-fouly",  label:"🇨🇭 La Fouly",       desc:"Cross into Switzerland (90 km).",                     test: c => c.totalKm >= 90  },
    { id:"tmb-champ",  label:"🏞️ Champex-Lac",     desc:"The final Alpine section (130 km).",                  test: c => c.totalKm >= 130 },
    { id:"tmb-done",   label:"🏔️ Full Circle!",    desc:"Complete the Tour du Mont Blanc — 170 km.",           test: c => c.totalKm >= 170 },
  ],
  "john-muir-trail": [
    { id:"jmt-start",   label:"🥾 Happy Isles",       desc:"Step off from Yosemite. The Sierra awaits.",          test: c => c.totalKm >= 1   },
    { id:"jmt-tuol",    label:"🌿 Tuolumne",           desc:"Reach the High Sierra plateau (50 km).",             test: c => c.totalKm >= 50  },
    { id:"jmt-evol",    label:"🏔️ Evolution Valley",  desc:"Deep wilderness (120 km).",                          test: c => c.totalKm >= 120 },
    { id:"jmt-ranch",   label:"🏕️ Muir Trail Ranch",  desc:"Halfway through the Sierra (180 km).",               test: c => c.totalKm >= 180 },
    { id:"jmt-pinchot", label:"❄️ Pinchot Pass",      desc:"Over the high passes (250 km).",                     test: c => c.totalKm >= 250 },
    { id:"jmt-done",    label:"🦅 Whitney Summit!",   desc:"Highest peak in the lower 48 — all 340 km.",         test: c => c.totalKm >= 340 },
  ],
  "camino": [
    { id:"cam-start",     label:"🎒 Buen Camino",          desc:"Log your first km on the Way.",                    test: c => c.totalKm >= 1 },
    { id:"cam-pamplona",  label:"🏟️ Pamplona",             desc:"Reach Pamplona (75 km).",                          test: c => c.totalKm >= 75 },
    { id:"cam-burgos",    label:"🏰 Burgos",               desc:"Reach the Gothic city of Burgos (250 km).",        test: c => c.totalKm >= 250 },
    { id:"cam-leon",      label:"🦁 León",                 desc:"Pass through the city of León (400 km).",          test: c => c.totalKm >= 400 },
    { id:"cam-done",      label:"⛪ Santiago!",            desc:"Arrive at Santiago de Compostela — all 790 km.",   test: c => c.totalKm >= 790 },
  ],
  "appalachian": [
    { id:"at-start",      label:"🌅 Georgia Start",        desc:"Log your first km on the AT.",                     test: c => c.totalKm >= 1 },
    { id:"at-shenandoah", label:"🌿 Shenandoah",           desc:"Hike through Shenandoah Valley (300 km).",         test: c => c.totalKm >= 300 },
    { id:"at-halfway",    label:"🪨 Halfway There",         desc:"Pass the halfway mark in Pennsylvania (900 km).",  test: c => c.totalKm >= 900 },
    { id:"at-newengland", label:"🍂 New England",          desc:"Enter the final stretch (1,800 km).",              test: c => c.totalKm >= 1800 },
    { id:"at-done",       label:"🏔️ Katahdin!",            desc:"Reach Mount Katahdin — all 3,540 km.",             test: c => c.totalKm >= 3540 },
  ],
  "tour-de-france": [
    { id:"tdf-start",     label:"🟡 Maillot Jaune",        desc:"Clip in and log your first km.",                   test: c => c.totalKm >= 1 },
    { id:"tdf-brittany",  label:"🌊 Brittany",             desc:"Clear the Brittany coast (400 km).",               test: c => c.totalKm >= 400 },
    { id:"tdf-pyrenees",  label:"⛰️ Les Pyrénées",         desc:"Conquer the Pyrenees (1,600 km).",                 test: c => c.totalKm >= 1600 },
    { id:"tdf-alps",      label:"🏔️ Les Alpes",            desc:"Survive the Alps (2,400 km).",                     test: c => c.totalKm >= 2400 },
    { id:"tdf-done",      label:"🗼 Paris!",               desc:"Roll onto the Champs-Élysées — all 3,490 km.",     test: c => c.totalKm >= 3490 },
  ],
  "route66": [
    { id:"r66-start",     label:"🛣️ Hit the Road",         desc:"Start the Mother Road — log your first km.",       test: c => c.totalKm >= 1 },
    { id:"r66-springfield",label:"🌽 Springfield",         desc:"Roll through Springfield, IL (500 km).",           test: c => c.totalKm >= 500 },
    { id:"r66-okc",       label:"🤠 Oklahoma City",        desc:"Reach Oklahoma City (1,100 km).",                  test: c => c.totalKm >= 1100 },
    { id:"r66-abq",       label:"🌵 Albuquerque",          desc:"Cross the desert to Albuquerque (2,700 km).",      test: c => c.totalKm >= 2700 },
    { id:"r66-done",      label:"🎡 Santa Monica!",        desc:"Reach the end of Route 66 — all 3,940 km.",        test: c => c.totalKm >= 3940 },
  ],
  "amazon-river": [
    { id:"amz-start",     label:"🌿 Into the Jungle",      desc:"Launch onto the Amazon — log your first km.",      test: c => c.totalKm >= 1 },
    { id:"amz-iquitos",   label:"🐊 Iquitos",              desc:"Pass through Iquitos, Peru (500 km).",              test: c => c.totalKm >= 500 },
    { id:"amz-manaus",    label:"🏙️ Manaus",               desc:"Reach the heart of the Amazon (3,000 km).",        test: c => c.totalKm >= 3000 },
    { id:"amz-santarem",  label:"🦜 Santarém",             desc:"Approach the Atlantic delta (5,000 km).",          test: c => c.totalKm >= 5000 },
    { id:"amz-done",      label:"🌊 Atlantic!",            desc:"Flow into the Atlantic Ocean — all 6,437 km.",     test: c => c.totalKm >= 6437 },
  ],
  "everest-stairmaster": [
    { id:"esm-start",   label:"🏢 First Floor",        desc:"Log your first floor. The climb begins.",             test: c => c.totalKm >= 1     },
    { id:"esm-100",     label:"⛰️ Foothills",           desc:"Reach 100 floors — the foothills.",                  test: c => c.totalKm >= 100   },
    { id:"esm-1000",    label:"🏕️ Camp II",             desc:"1,000 floors deep. Basecamp II altitude.",           test: c => c.totalKm >= 1000  },
    { id:"esm-2000",    label:"☠️ Death Zone",           desc:"2,000 floors. The air is dangerously thin.",         test: c => c.totalKm >= 2000  },
    { id:"esm-summit",  label:"🏔️ Everest Summit!",     desc:"2,903 floors. You climbed an entire mountain.",      test: c => c.totalKm >= 2903.2},
  ],
  "kilimanjaro-stairmaster": [
    { id:"ksm-start",   label:"🏢 First Floor",          desc:"Log your first floor. Africa calls.",                test: c => c.totalKm >= 1     },
    { id:"ksm-600",     label:"🌲 Marangu Gate",          desc:"600 floors — through the tropical forest zone.",    test: c => c.totalKm >= 600   },
    { id:"ksm-900",     label:"🏕️ Mandara Hut",          desc:"900 floors. First mountain camp at 2,720 m.",       test: c => c.totalKm >= 900   },
    { id:"ksm-1200",    label:"⛺ Horombo Hut",           desc:"1,200 floors. High camp at 3,720 m.",               test: c => c.totalKm >= 1200  },
    { id:"ksm-1548",    label:"❄️ Kibo Hut",              desc:"1,548 floors. The final camp before the summit.",   test: c => c.totalKm >= 1548  },
    { id:"ksm-summit",  label:"🌋 Uhuru Peak!",           desc:"1,934 floors. Africa's highest point — 5,895 m.",  test: c => c.totalKm >= 1934  },
  ],
  "montblanc-stairmaster": [
    { id:"mb-start",    label:"🏢 First Floor",           desc:"Log your first floor. The Alps await.",             test: c => c.totalKm >= 1     },
    { id:"mb-400",      label:"🌲 Les Houches",            desc:"400 floors — into the Alpine foothills.",           test: c => c.totalKm >= 400   },
    { id:"mb-780",      label:"🦅 Nid d'Aigle",            desc:"780 floors. Eagle's Nest at 2,380 m.",              test: c => c.totalKm >= 780   },
    { id:"mb-1252",     label:"🏔️ Refuge du Goûter",      desc:"1,252 floors. The classic summit hut at 3,817 m.", test: c => c.totalKm >= 1252  },
    { id:"mb-summit",   label:"⛰️ Mont Blanc Summit!",    desc:"1,577 floors. Highest peak in the Alps — 4,808 m.",test: c => c.totalKm >= 1577  },
  ],
  "journaling": [
    { id:"jn-d1",    label:"✍️ First Entry",       desc:"Write your first journal entry.",                          test: c => c.dayNumber >= 1 && c.complete },
    { id:"jn-d7",    label:"📓 One Week In",        desc:"Complete a full week of journaling.",                     test: c => c.streak >= 7 },
    { id:"jn-d14",   label:"💡 Two Weeks Clear",    desc:"14 days of consistent reflection.",                       test: c => c.streak >= 14 },
    { id:"jn-d21",   label:"🔄 21-Day Habit",       desc:"Science says habits form in 21 days. You did it.",       test: c => c.streak >= 21 },
    { id:"jn-done",  label:"📖 Full Journal",       desc:"30 days. A complete record of who you became.",          test: c => c.complete && c.dayNumber >= 30 },
  ],
  "monk-mode": [
    { id:"mm-d1",    label:"🧠 Monk's First Day",   desc:"Complete Day 1 in full focus mode.",                      test: c => c.dayNumber >= 1 && c.complete },
    { id:"mm-d7",    label:"📵 Social-Free Week",   desc:"7 days without social media.",                            test: c => c.streak >= 7 },
    { id:"mm-d14",   label:"💻 Deep Work Streak",   desc:"14 consecutive days of 2-hour deep work blocks.",        test: c => c.streak >= 14 },
    { id:"mm-d21",   label:"⚡ Flow State",          desc:"21 days of monk mode — you've found your rhythm.",       test: c => c.streak >= 21 },
    { id:"mm-done",  label:"🏆 Monk Certified",     desc:"30 days. You built a mind like a weapon.",               test: c => c.complete && c.dayNumber >= 30 },
  ],
  "pct": [
    { id:"pct-start",  label:"🌵 Mexico Border",    desc:"Step off from the southern terminus. The journey begins.", test: c => c.totalKm >= 1    },
    { id:"pct-sierra", label:"⛰️ High Sierra",      desc:"Enter the Sierra Nevada (2,000 km).",                     test: c => c.totalKm >= 2000 },
    { id:"pct-oregon", label:"🌋 Into Oregon",      desc:"Cross into Oregon (3,100 km).",                           test: c => c.totalKm >= 3100 },
    { id:"pct-wa",     label:"🏔️ Washington",       desc:"Enter the final state (3,800 km).",                       test: c => c.totalKm >= 3800 },
    { id:"pct-done",   label:"🍁 Canada!",           desc:"4,286 km. You walked from Mexico to Canada.",            test: c => c.totalKm >= 4286 },
  ],
  "run-5-marathons": [
    { id:"r5m-start",   label:"👟 First Steps",      desc:"Log your first km.",                                      test: c => c.totalKm >= 1   },
    { id:"r5m-mar1",    label:"🏅 Marathon 1",        desc:"Cover 42 km — first marathon done.",                     test: c => c.totalKm >= 42  },
    { id:"r5m-halfway", label:"🔥 Halfway",           desc:"105 km — halfway through all 5 marathons.",              test: c => c.totalKm >= 105 },
    { id:"r5m-mar4",    label:"🏃 Marathon 4",        desc:"168 km — fourth marathon complete.",                     test: c => c.totalKm >= 168 },
    { id:"r5m-done",    label:"🎖️ Five Marathons!",   desc:"All 211 km done. Five consecutive marathons.",           test: c => c.totalKm >= 211 },
  ],
  "run-jogle": [
    { id:"jogle-start",   label:"🌊 Land's End",       desc:"Start your JOGLE run.",                                 test: c => c.totalKm >= 1    },
    { id:"jogle-bristol", label:"🏙️ Bristol",           desc:"Reach Bristol (340 km in).",                           test: c => c.totalKm >= 340  },
    { id:"jogle-manc",    label:"🏭 Manchester",        desc:"Run through Manchester (600 km).",                      test: c => c.totalKm >= 600  },
    { id:"jogle-border",  label:"🏴 Scotland",          desc:"Cross the Scottish Border (900 km).",                  test: c => c.totalKm >= 900  },
    { id:"jogle-done",    label:"🏔️ John o'Groats!",   desc:"Run the full length of Britain — 1,407 km.",           test: c => c.totalKm >= 1407 },
  ],
  "run-trans-america": [
    { id:"rta-start",   label:"🌉 San Francisco",     desc:"Set off from the Bay Area.",                             test: c => c.totalKm >= 1    },
    { id:"rta-rockies", label:"⛰️ Rockies",           desc:"Cross the Rocky Mountains (1,500 km).",                 test: c => c.totalKm >= 1500 },
    { id:"rta-plains",  label:"🌾 Great Plains",      desc:"Run through the Great Plains (2,500 km).",               test: c => c.totalKm >= 2500 },
    { id:"rta-miss",    label:"🌊 Mississippi",       desc:"Cross the Mississippi River (3,500 km).",               test: c => c.totalKm >= 3500 },
    { id:"rta-done",    label:"🗽 New York City!",    desc:"Run coast to coast — all 4,989 km.",                    test: c => c.totalKm >= 4989 },
  ],
  "raid-pyrenees": [
    { id:"rp-start",    label:"🌊 Hendaye",           desc:"Clip in at the Atlantic start.",                         test: c => c.totalKm >= 1   },
    { id:"rp-pass1",    label:"⛰️ First High Pass",   desc:"Conquer the first high passes (150 km).",               test: c => c.totalKm >= 150 },
    { id:"rp-andorra",  label:"🏔️ Andorra",           desc:"Reach Andorra at the halfway point (400 km).",          test: c => c.totalKm >= 400 },
    { id:"rp-final",    label:"🚴 Final Cols",         desc:"Enter the final mountain stretch (600 km).",             test: c => c.totalKm >= 600 },
    { id:"rp-done",     label:"☀️ Mediterranean!",    desc:"Reach Cerbère and the Mediterranean — all 726 km.",     test: c => c.totalKm >= 726 },
  ],
  "trans-am-bike": [
    { id:"tab-start",   label:"🏛️ Yorktown",          desc:"Roll out from the East Coast.",                          test: c => c.totalKm >= 1    },
    { id:"tab-ridge",   label:"🌄 Blue Ridge",        desc:"Ride the Blue Ridge Parkway (900 km).",                  test: c => c.totalKm >= 900  },
    { id:"tab-river",   label:"🌊 Missouri River",    desc:"Cross the Missouri River (2,700 km).",                  test: c => c.totalKm >= 2700 },
    { id:"tab-rockies", label:"🏔️ Colorado Rockies",  desc:"Conquer the Colorado Rockies (4,500 km).",               test: c => c.totalKm >= 4500 },
    { id:"tab-done",    label:"🌊 Astoria!",          desc:"Reach the Pacific — all 6,771 km.",                     test: c => c.totalKm >= 6771 },
  ],
  "thames-row": [
    { id:"thr-start",   label:"🌿 The Source",        desc:"Push off from the Thames source.",                       test: c => c.totalKm >= 1   },
    { id:"thr-oxford",  label:"🎓 Oxford",            desc:"Row through Oxford (75 km).",                           test: c => c.totalKm >= 75  },
    { id:"thr-windsor", label:"🏰 Windsor Castle",    desc:"Pass Windsor Castle (170 km).",                         test: c => c.totalKm >= 170 },
    { id:"thr-london",  label:"🌉 London Bridge",     desc:"Row under London Bridge (280 km).",                     test: c => c.totalKm >= 280 },
    { id:"thr-done",    label:"🌊 To the Sea!",       desc:"Reach the Thames Estuary — all 346 km.",                test: c => c.totalKm >= 346 },
  ],
  "danube-row": [
    { id:"dan-start",    label:"🇩🇪 Donaueschingen",  desc:"Launch on the Danube in Germany.",                       test: c => c.totalKm >= 1    },
    { id:"dan-vienna",   label:"🎼 Vienna",           desc:"Row past Vienna (360 km).",                             test: c => c.totalKm >= 360  },
    { id:"dan-budapest", label:"🏰 Budapest",         desc:"Pass through Budapest (680 km).",                       test: c => c.totalKm >= 680  },
    { id:"dan-gorge",    label:"⛰️ Iron Gates",       desc:"Navigate the Iron Gates Gorge (1,400 km).",             test: c => c.totalKm >= 1400 },
    { id:"dan-done",     label:"🌊 Black Sea!",       desc:"Row to the Black Sea — all 2,860 km.",                  test: c => c.totalKm >= 2860 },
  ],
};

// ── Challenge Chains (what comes next after each template) ────────────────
const CHALLENGE_CHAINS = {
  "30-pushups":         "strength",
  "75-soft":            "75-hard",
  "75-hard":            "cruise-control",
  "reading":            "creative",
  "meditation":         "cold-exposure",
  "morning-routine":    "75-soft",
  "walking":            "running",
  "running":            "cycling",
  "no-sugar":           "intermittent-fasting",
  "sleep-reset":        "morning-routine",
  "digital-detox":      "meditation",
  "dry-month":          "no-sugar",
  "sugar-reset-7":      "no-sugar",
  "processed-food-reset": "meal-prep",
  "caffeine-reset":     "sleep-reset",
  "dry-reset-14":       "dry-month",
  "yoga-flexibility":   "75-soft",
  "core-abs":           "strength",
  "journaling":         "reading",
  "monk-mode":          "cruise-control",
  "pct":                "appalachian",
  // Rowing progression
  "thames-row":         "danube-row",
  "danube-row":         "amazon-river",
  // Running expedition progression
  "comrades-ultra":     "utmb",
  "utmb":               "run-5-marathons",
  "run-5-marathons":    "run-jogle",
  "run-jogle":          "run-trans-america",
  // Cycling expedition progression
  "raid-pyrenees":      "tour-de-france",
  "tour-de-france":     "trans-am-bike",
  // Endurance training progression
  "half-marathon-prep": "marathon-training",
  "marathon-training":  "ironman-703",
  "ironman-703":        "ironman-full",
  "tough-mudder":       "spartan-race",
  "spartan-race":       "ironman-703",
};

// ── PhotoDB — IndexedDB wrapper for progress photos ───────────────────────
const PhotoDB = {
  _db: null,
  async open() {
    if (this._db) return this._db;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open("conqur_photos", 1);
      req.onupgradeneeded = e => { e.target.result.createObjectStore("photos", { keyPath: "key" }); };
      req.onsuccess = e => { this._db = e.target.result; resolve(this._db); };
      req.onerror   = () => reject(req.error);
    });
  },
  async set(key, dataURL) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("photos", "readwrite");
      tx.objectStore("photos").put({ key, dataURL });
      tx.oncomplete = resolve;
      tx.onerror    = () => reject(tx.error);
    });
  },
  async get(key) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("photos", "readonly");
      const req = tx.objectStore("photos").get(key);
      req.onsuccess = () => resolve(req.result?.dataURL || null);
      req.onerror   = () => reject(req.error);
    });
  },
  async list(prefix) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("photos", "readonly");
      const req = tx.objectStore("photos").getAll();
      req.onsuccess = () => resolve((req.result || []).filter(r => r.key.startsWith(prefix)).sort((a,b) => a.key.localeCompare(b.key)));
      req.onerror   = () => reject(req.error);
    });
  },
  async delete(key) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("photos", "readwrite");
      tx.objectStore("photos").delete(key);
      tx.oncomplete = resolve;
      tx.onerror    = () => reject(tx.error);
    });
  },
};

// ── State Management ───────────────────────────────────────────────────────

let state = loadState();
let activeTab = "today";
let challengeSubTab = "habits";
let activeChartTab = "weight";
let sheetOpen = false;
let todayChallengeId = "__all__";
let builderOpen = false;
let builderStep = "template";
let builderForm = defaultBuilderForm();
let viewChallengeId = null;
let editChallengeId = null;
let editForm = null;         // temp copy of edit fields so Cancel truly reverts
let settingsOpen = false;
let justCompletedId  = null;   // challenge shown in completion modal right now
let justCompletedIds = [];     // queue of IDs waiting to be shown after the current one
let _confirmDialog   = null;   // { msg, onConfirm } — replaces window.confirm()
let _promptDialog    = null;   // { msg, defaultVal, onConfirm } — replaces window.prompt()
let _cloudAuthError   = "";    // error message for cloud auth form (settings)
let _cloudAuthLoading = false; // loading spinner for cloud auth (settings)
let _shareModalChallenge = null;    // challenge shown in share card modal
let _shareModalDone      = false;   // true = challenge completion card, false = streak card
let _shareCardDataUrl    = null;    // cached base64 PNG of the last drawn share card
let _notifNudgeDismissed = false;   // dismissal flag for the Day-3 notification nudge
let builderQuizAnswers   = { goal: null, time: null, level: null };
let onboardingAnswers    = { goal: null, intensity: null, time: null };
let _badgeSheetQueue     = [];       // { label, desc, tier } — queued badge celebrations
let _notifPromptVisible  = false;   // post-challenge-start notification prompt
let _showThemePrompt     = false;   // post-Day-1 "how do you want to level up" sheet
let _themePromptShown    = false;   // shown-once guard, separate from themeChosen (dismissing != choosing)
let _templateFilter      = "all";   // "all" | "short" | "medium" | "long"
let _difficultyFilter    = "all";   // "all" | "beginner" | "intermediate" | "advanced" | "extreme"
let _statsCollapsed      = null;    // kept for legacy reads — accordion removed
let _measChartTab        = null;    // active tab in the inline measurement chart
let _savedFlash          = false;   // brief "Saved ✓" indicator after habit tap
let _obAuthError      = "";    // error message for onboarding account screen
let _obAuthLoading    = false; // loading spinner for onboarding account screen
let _obAuthMode       = "signup"; // "signup" | "signin" on the account screen
let _cloudPushTimer   = null;  // debounce timer for cloud push
let _skipCloudPush    = false; // prevent redundant push after pull
let reminderTimeout = null;
let _pwaInstallPrompt = null;  // beforeinstallprompt event (PWA install)
let _showInstallBanner = false; // show the PWA install nudge
let _cloudSyncing     = false; // true while CloudSync.pull / .push is in flight
let _newWeekBanner = null;     // { pts } — Monday new-week ceremony, null when dismissed
let _levelUpOverlay = null;   // { level, name, emoji, total } — full-screen level-up celebration
let _chapterOverlay = null;   // level number (5/10/15/20/25) — shown once per chapter threshold
let _resetConfirm = false;    // shows inline confirm step before wiping all data
let _safetyPendingTemplateId = null; // templateId awaiting health disclaimer acknowledgement
let _obTransitioning = false; // true while slide animation is in flight
let _prevObStep = undefined;  // last rendered onboardingStep — transition only when this changes
let _lastSyncError = false;        // true when last cloud push failed
let _isOffline = false;            // true when navigator is offline
let _skipAccountAfterStart = false; // goal picker bypassed account creation step
let _forgotPwMode = false;         // forgot-password form is showing

// Inject CSS for features added at runtime
(function injectFeatureCSS() {
  if (document.getElementById("conqur-feature-css")) return;
  const s = document.createElement("style");
  s.id = "conqur-feature-css";
  s.textContent = `
.day-plan-banner{border-radius:12px;padding:12px 14px;margin:0 0 12px;display:flex;align-items:center;gap:12px;border-left:3px solid transparent}
.day-plan-banner.plan-easy{background:color-mix(in srgb,var(--success) 12%,transparent);border-color:var(--success)}
.day-plan-banner.plan-tempo{background:color-mix(in srgb,var(--warning) 12%,transparent);border-color:var(--warning)}
.day-plan-banner.plan-long{background:color-mix(in srgb,var(--error) 14%,transparent);border-color:var(--error)}
.day-plan-banner.plan-interval{background:color-mix(in srgb,var(--warning) 12%,transparent);border-color:var(--warning)}
.day-plan-banner.plan-cross{background:var(--primary-haze);border-color:var(--primary)}
.day-plan-banner.plan-rest{background:rgba(120,120,120,.08);border-color:rgba(120,120,120,.3)}
.day-plan-banner.plan-strength{background:color-mix(in srgb,var(--fire-alt) 10%,transparent);border-color:var(--fire-alt)}
.day-plan-banner.plan-wod{background:color-mix(in srgb,var(--danger) 12%,transparent);border-color:var(--danger)}
.day-plan-banner.plan-simulate{background:color-mix(in srgb,var(--fire-gold) 12%,transparent);border-color:var(--fire-gold)}
.dpb-emoji{font-size:22px;flex-shrink:0}
.dpb-type{font-size:14px;font-weight:700;color:var(--text)}
.dpb-desc{font-size:12px;color:var(--text-dim);margin-top:2px}
.mode-chip--scheduled-rest{border-color:var(--primary-pulse)!important;color:var(--primary)!important}
.template-filter-bar--diff{margin-top:6px}
.cloud-sync-bar--warn{background:color-mix(in srgb,var(--warning) 18%,transparent);color:var(--warning);animation:none;height:auto;padding:5px 14px;font-size:12px;text-align:center}
.cloud-sync-bar--err{background:color-mix(in srgb,var(--error) 12%,transparent);color:var(--error);animation:none;height:auto;padding:5px 14px;font-size:12px;text-align:center}
.cloud-sync-bar--err button.link-btn{color:var(--error);font-size:12px;text-decoration:underline}
.backfill-limit-hint{font-size:11px;color:var(--text-dim);text-align:center;padding:2px 0 6px;opacity:.8}
.badge-hint{font-size:11px;color:var(--text-dim);margin-top:3px;font-weight:400}
.ob-forgot-sent{background:rgba(76,175,80,.12);border:1px solid rgba(76,175,80,.35);border-radius:8px;padding:10px 12px;font-size:13px;color:#166534;margin-bottom:12px;text-align:center}
.badges-new-hint{font-size:13px;color:var(--text-dim);text-align:center;padding:10px 14px 6px;line-height:1.5}
.xp-mult-badge{font-size:11px;font-weight:600;color:var(--fire-gold);margin-left:4px}
.mood-note-card{background:var(--surface-2);border-radius:12px;padding:12px 14px;margin:0 0 12px}
.mood-row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
.mood-label{font-size:13px;color:var(--text-dim);font-weight:600}
.mood-emojis{display:flex;gap:4px}
.mood-btn{background:none;border:2px solid transparent;border-radius:8px;font-size:20px;padding:3px 5px;cursor:pointer;transition:border-color .15s,transform .1s;line-height:1}
.mood-btn:hover{border-color:var(--primary);transform:scale(1.15)}
.mood-selected{border-color:var(--primary)!important;background:var(--primary-haze);transform:scale(1.1)}
.day-note-input{width:100%;background:var(--surface-3);border:1px solid var(--track);border-radius:8px;padding:8px 10px;font-size:13px;color:var(--text);resize:none;outline:none;min-height:52px;font-family:inherit;line-height:1.4}
.day-note-input:focus{border-color:var(--primary)}
.day-note-input::placeholder{color:var(--text-faint)}
.tf-surprise{background:var(--surface-2);border:1px dashed var(--primary);color:var(--primary);font-size:13px}
.tf-surprise:hover{background:var(--primary-haze)}
.measurement-habit-card{flex-wrap:wrap;gap:8px 10px;padding:12px 14px}
.measurement-habit-card .habit-info{flex:1;min-width:0}
.measurement-habit-card .measurement-input-wrap{flex:0 0 100%;margin-left:0;justify-content:center}
.meas-chart-card{background:var(--surface-2);border-radius:12px;padding:12px 10px 10px;margin:0 0 12px}
.meas-chart-label{font-size:12px;font-weight:600;color:var(--text-dim);margin-bottom:8px}
.meas-chart-tabs{display:flex;gap:4px;margin-bottom:8px}
.meas-chart-tab{flex:1;background:var(--surface-3);border:none;color:var(--text-dim);font-size:12px;font-weight:600;padding:5px 0;border-radius:6px;cursor:pointer}
.meas-chart-tab.active{background:var(--primary);color:#fff}
.meas-chart-svg{width:100%;height:110px;display:block}
.meas-chart-delta{font-size:13px;font-weight:700;text-align:center;padding:4px 0 2px}
.meas-chart-delta.good{color:var(--success)}.meas-chart-delta.bad{color:var(--error)}
.meas-chart-hint{font-size:11px;color:var(--text-faint);text-align:center}
`;
  document.head.appendChild(s);
})();

// ── Analytics helper (Plausible — graceful no-op if script not loaded) ───────
function trackEvent(name, props) {
  try {
    if (typeof window.plausible === "function") {
      window.plausible(name, props ? { props } : undefined);
    }
  } catch(e) { /* silent */ }
}

// ── Cloud Sync (Supabase) ──────────────────────────────────────────────────
const SUPABASE_URL = "https://rmyvpndnwpgrxosqrqff.supabase.co";
const SUPABASE_KEY = "sb_publishable_NEeo1fUgGclLFN6VGGhl6w_ROgAEQJg";
let _sbClient = null;
function _sb() {
  if (!_sbClient) _sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  return _sbClient;
}

const CloudSync = {
  _user: null,

  get token()     { return null; },
  get uid()       { return this._user?.id || null; },
  get userEmail() { return this._user?.email || null; },
  get isSignedIn(){ return !!this._user; },

  async init() {
    const { data: { session } } = await _sb().auth.getSession();
    this._user = session?.user || null;
    if (this._user) {
      onboardingStep = null;  // already has an account — skip onboarding
      await this.pull();       // restore cloud data before first paint
      render();
    }
    _sb().auth.onAuthStateChange((_, session) => {
      this._user = session?.user || null;
      render();
    });
  },

  async signUp(email, password) {
    const { data, error } = await _sb().auth.signUp({ email, password });
    if (error) return { error: error.message };
    this._user = data.user;
    if (data.session) {
      await this.push();
      return {};
    }
    // Email confirmation required — session is null until confirmed
    return { emailPending: true };
  },

  async signIn(email, password) {
    const { data, error } = await _sb().auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    this._user = data.user;
    await this.pull();
    return {};
  },

  signOut() {
    _sb().auth.signOut();
    this._user = null;
    render();
  },

  async push() {
    if (!this.isSignedIn) return;
    _cloudSyncing = true; render();
    try {
      const stateObj = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      await _sb().from("user_data").upsert({
        user_id: this.uid,
        state_json: stateObj,
        updated_at: new Date().toISOString(),
      });
      _lastSyncError = false;
    } catch(e) { console.warn("Cloud push failed:", e); _lastSyncError = true; }
    finally { _cloudSyncing = false; render(); }
  },

  async pull() {
    if (!this.isSignedIn) return;
    _cloudSyncing = true; render();
    try {
      const { data, error } = await _sb()
        .from("user_data")
        .select("state_json")
        .eq("user_id", this.uid)
        .single();
      if (error || !data?.state_json) { return; }
      const remote = data.state_json;
      if (!remote || typeof remote !== "object" || !("challenges" in remote)) return;
      // Day-level union merge — local logs are never overwritten by a staler cloud copy.
      const merged = mergeStates(state, normalizeState(remote));
      _skipCloudPush = true;
      state = merged;
      saveState();
      _skipCloudPush = false;
      showToast("Data synced from cloud.");
    } catch(e) { console.warn("Cloud pull failed:", e); _lastSyncError = true; }
    finally { _cloudSyncing = false; render(); }
  },
};
let onboardingStep = null;   // null = done, 0-3 = active step
let bodyHistoryLimit = 5;    // how many history rows to show in Body tab
let _lastViewKey   = "";       // for scroll-to-top on navigation changes
let _viewChanged   = false;    // true on the render immediately after a tab/view switch
let _animHabitId = null;     // habit that just got checked (for pop animation)
let _eventsBound = false;        // event listeners are added once — not re-added on every render
let viewingDate       = null;     // null = today; set to a past dateKey to backfill habits
let calendarViewMonth   = null;    // null = auto; or "YYYY-MM-DD" (first of month)

function defaultBuilderForm() {
  return {
    templateId: null,
    name: "",
    emoji: "🎯",
    startDate: todayKey(),
    endDate: addDays(todayKey(), 29),
    mode: "soft",
    weeklyGoal: 100,
    jokerBudget: 3,
    noEndDate: false,
    goalWeight: null,
    habits: [],
    newHabitEmoji: "⭐",
    newHabitName: "",
    newHabitPoints: 2,
    newHabitType: "binary",
    newHabitTiers: [
      { label: "", points: 1 },
      { label: "", points: 2 },
      { label: "", points: 3 },
    ],
    expeditionUnit: "km",
    expeditionDistance: 100,
    expeditionDuration: 30,
  };
}

function saveBuilderFormFromDOM() {
  const nameEl  = document.getElementById("bf-name");
  const startEl = document.getElementById("bf-start");
  const endEl   = document.getElementById("bf-end");
  const goalEl  = document.getElementById("bf-goal");
  const emojiEl = document.getElementById("bf-emoji");
  const ongoingEl    = document.getElementById("bf-ongoing");
  const goalWeightEl = document.getElementById("bf-goalweight");
  if (nameEl)                builderForm.name       = nameEl.value;
  if (startEl?.value)        builderForm.startDate  = startEl.value;
  if (ongoingEl)             builderForm.noEndDate  = ongoingEl.checked;
  if (endEl?.value && !builderForm.noEndDate) builderForm.endDate = endEl.value;
  if (goalEl)                builderForm.weeklyGoal = Number(goalEl.value) || builderForm.weeklyGoal;
  if (emojiEl?.value.trim()) builderForm.emoji      = emojiEl.value.trim();
  if (goalWeightEl?.value)   builderForm.goalWeight = parseFloat(goalWeightEl.value) || null;
  // Persist new-habit input fields so they survive re-render
  const nhName  = document.getElementById("nh-name");
  const nhEmoji = document.getElementById("nh-emoji");
  const nhPts   = document.getElementById("nh-pts");
  if (nhName)  builderForm.newHabitName  = nhName.value;
  if (nhEmoji) builderForm.newHabitEmoji = nhEmoji.value;
  if (nhPts)   builderForm.newHabitPoints = Number(nhPts.value) || builderForm.newHabitPoints;
  builderForm.newHabitTiers = builderForm.newHabitTiers.map((t, i) => ({
    ...t,
    label:  document.getElementById(`nh-tier-${i}-label`)?.value ?? t.label,
    points: Number(document.getElementById(`nh-tier-${i}-pts`)?.value)  || t.points,
  }));
}

function normalizeDay(raw) {
  if (!raw || typeof raw !== "object") raw = {};
  return {
    mode:         raw.mode === "rest" ? "rest" : "standard", // minimum/boss → standard
    done:         Array.isArray(raw.done) ? raw.done : [],
    recovered:    raw.recovered    === true,
    pts:          typeof raw.pts === "number" ? raw.pts : 0,
    tiers:        (raw.tiers && typeof raw.tiers === "object") ? raw.tiers : {},
    distances:    (raw.distances && typeof raw.distances === "object") ? raw.distances : {},
    note:         typeof raw.note === "string" ? raw.note : "",
    freezeUsed:   raw.freezeUsed   === true,
    scheduledRest: raw.scheduledRest === true,
  };
}

function normalizeHabit(raw) {
  if (!raw || typeof raw !== "object") return null;
  const habit = {
    id:          typeof raw.id === "string" && raw.id ? raw.id : uid(),
    title:       typeof raw.title === "string" ? raw.title : "Habit",
    emoji:       typeof raw.emoji === "string" ? raw.emoji : "⭐",
    quip:        typeof raw.quip  === "string" ? raw.quip  : "",
    type:        ["binary","tiered","distance","measurement"].includes(raw.type) ? raw.type : "binary",
    points:      typeof raw.points === "number" && raw.points >= 1 ? Math.round(raw.points) : 2,
  };
  if (typeof raw.unit     === "string") habit.unit     = raw.unit;
  if (typeof raw.decimals === "number") habit.decimals = raw.decimals;
  if (Array.isArray(raw.tiers))         habit.tiers    = raw.tiers;
  return habit;
}

function normalizeChallenge(raw) {
  if (!raw || typeof raw !== "object") return null;
  const rawDays = (raw.days && typeof raw.days === "object") ? raw.days : {};
  const days = {};
  for (const [k, v] of Object.entries(rawDays)) days[k] = normalizeDay(v);
  // Back-fill habit fields (e.g. unit) that may be missing in older saved data
  const tpl = raw.templateId ? TEMPLATES.find(t => t.id === raw.templateId) : null;
  const habits = (Array.isArray(raw.habits) ? raw.habits.map(normalizeHabit).filter(Boolean) : [])
    .map(h => {
      if (!h.unit && tpl) {
        const tplH = tpl.habits?.find(th => th.id === h.id);
        if (tplH?.unit) h.unit = tplH.unit;
      }
      return h;
    });
  return {
    id:         raw.id || uid(),
    name:       raw.name || "My Challenge",
    emoji:      raw.emoji || "🎯",
    description:raw.description || "",
    templateId: raw.templateId || null,
    startDate:  raw.startDate || todayKey(),
    endDate:    raw.endDate   || addDays(todayKey(), 29),
    mode:       ["strict","soft"].includes(raw.mode) ? raw.mode : "soft",
    status:     ["active","completed","failed","paused"].includes(raw.status) ? raw.status : "active",
    weeklyGoal: typeof raw.weeklyGoal === "number" ? raw.weeklyGoal : 100,
    habits,
    days,
    badges:      Array.isArray(raw.badges) ? raw.badges : [],
    createdAt:   raw.createdAt || todayKey(),
    pausedOn:    raw.pausedOn    || null,
    pausedDays:  typeof raw.pausedDays === "number" ? raw.pausedDays : 0,
    finalStreak:              raw.finalStreak ?? null,
    totalPts:                 typeof raw.totalPts === "number" ? raw.totalPts : 0,
    streakFreezes:            typeof raw.streakFreezes === "number" ? raw.streakFreezes : 0,
    streakFreezeWeeksAwarded: Array.isArray(raw.streakFreezeWeeksAwarded) ? raw.streakFreezeWeeksAwarded : [],
    jokerBudget:              typeof raw.jokerBudget === "number" ? raw.jokerBudget : 3,
    flags:                    (raw.flags && typeof raw.flags === "object" && !Array.isArray(raw.flags)) ? raw.flags : {},
    noEndDate:                raw.noEndDate === true,
    pinned:                   raw.pinned === true,
    resumeReminderDate:       raw.resumeReminderDate || null,
    goalWeight:               raw.goalWeight ?? null,
    routeKm:                  typeof raw.routeKm === "number" ? raw.routeKm : null,
  };
}

function normalizeState(raw) {
  if (!raw || typeof raw !== "object") raw = {};
  const rawC = (raw.challenges && typeof raw.challenges === "object") ? raw.challenges : {};
  const challenges = {};
  for (const [k, v] of Object.entries(rawC)) {
    const c = normalizeChallenge(v);
    if (c) challenges[k] = c;
  }
  const rawBT = raw.bodyTracking || {};
  return {
    settings: {
      name:            raw.settings?.name            || "",
      reminderEnabled: raw.settings?.reminderEnabled === true,
      reminderTime:    raw.settings?.reminderTime    || "20:00",
      journeyTheme:    JOURNEY_THEMES[raw.settings?.journeyTheme] ? raw.settings.journeyTheme : "frostborn",
      themeChosen:     raw.settings?.themeChosen === true,
      units: {
        weight:        raw.settings?.units?.weight        || "lbs",
        distance:      raw.settings?.units?.distance      || "km",
        measurements:  raw.settings?.units?.measurements  || "cm",
      },
    },
    challenges,
    bodyTracking: {
      entries:      Array.isArray(rawBT.entries)   ? rawBT.entries : [],
      startWeight:  rawBT.startWeight  ?? null,
      goalWeight:   rawBT.goalWeight   ?? null,
      startBodyFat: rawBT.startBodyFat ?? null,
    },
    globalBadges: Array.isArray(raw.globalBadges) ? raw.globalBadges : [],
    weeklyRecapDismissed: (raw.weeklyRecapDismissed && typeof raw.weeklyRecapDismissed === "object") ? raw.weeklyRecapDismissed : {},
    migrations:      (raw.migrations && typeof raw.migrations === "object") ? raw.migrations : {},
    xp:              typeof raw.xp === "number" ? raw.xp : 0,
    lastChapterSeen: typeof raw.lastChapterSeen === "number" ? raw.lastChapterSeen : 0,
    lastModified:    typeof raw.lastModified === "number" ? raw.lastModified : 0,
  };
}

// ── Cloud merge ──────────────────────────────────────────────────────────────
// Sync philosophy: never lose an additive fact. Logs, badges, XP and weigh-ins
// only ever get added, so on conflict we union them. Only genuine preferences
// (settings, goal weights) use newest-wins, decided by `lastModified`.
function _union(a, b) {
  return Array.from(new Set([...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])]));
}
// A day's "richness" — more habits logged dominates, points break ties. Used so a
// real log can never be overwritten by a staler copy of the same day.
function _dayRichness(d) {
  const done = Array.isArray(d?.done) ? d.done.length : 0;
  const pts  = typeof d?.pts === "number" ? d.pts : 0;
  return done * 100000 + pts;
}
function mergeChallenge(localC, remoteC, localNewer) {
  // Scalar fields (name, emoji, goal, etc.): the newer state wins.
  const base = localNewer ? { ...remoteC, ...localC } : { ...localC, ...remoteC };
  // Days: union by date; on conflict keep the richer day.
  const days = {};
  const dates = new Set([...Object.keys(localC.days || {}), ...Object.keys(remoteC.days || {})]);
  for (const k of dates) {
    const ld = localC.days?.[k], rd = remoteC.days?.[k];
    if (ld && !rd)      days[k] = ld;
    else if (rd && !ld) days[k] = rd;
    else {
      const lr = _dayRichness(ld), rr = _dayRichness(rd);
      days[k] = lr > rr ? ld : rr > lr ? rd : (localNewer ? ld : rd);
    }
  }
  base.days   = days;
  base.badges = _union(localC.badges, remoteC.badges);
  base.streakFreezeWeeksAwarded = _union(localC.streakFreezeWeeksAwarded, remoteC.streakFreezeWeeksAwarded);
  // flags are set-once booleans — keep any that's true on either side.
  base.flags = localNewer ? { ...(remoteC.flags || {}), ...(localC.flags || {}) }
                          : { ...(localC.flags || {}), ...(remoteC.flags || {}) };
  // Completion is sticky — a finished challenge never reverts to active.
  if (localC.status === "completed" || remoteC.status === "completed") base.status = "completed";
  base.finalStreak = Math.max(localC.finalStreak ?? 0, remoteC.finalStreak ?? 0) || (localC.finalStreak ?? remoteC.finalStreak ?? null);
  let tp = 0; for (const d of Object.values(days)) tp += d.pts || 0;
  base.totalPts = tp;
  return base;
}
function mergeStates(local, remote) {
  const localNewer = (local.lastModified || 0) >= (remote.lastModified || 0);
  const prefer = localNewer ? local : remote;
  const challenges = {};
  const ids = new Set([...Object.keys(local.challenges || {}), ...Object.keys(remote.challenges || {})]);
  for (const id of ids) {
    const lc = local.challenges?.[id], rc = remote.challenges?.[id];
    if (lc && !rc)      challenges[id] = lc;
    else if (rc && !lc) challenges[id] = rc;
    else                challenges[id] = mergeChallenge(lc, rc, localNewer);
  }
  // Body-tracking entries: union by date, newer state wins on a same-date conflict.
  const btMap = {};
  const olderBT = localNewer ? remote.bodyTracking : local.bodyTracking;
  const newerBT = localNewer ? local.bodyTracking  : remote.bodyTracking;
  for (const e of (olderBT?.entries || [])) if (e?.date) btMap[e.date] = e;
  for (const e of (newerBT?.entries || [])) if (e?.date) btMap[e.date] = e;
  const bodyTracking = {
    entries:      Object.values(btMap).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)),
    startWeight:  prefer.bodyTracking.startWeight,
    goalWeight:   prefer.bodyTracking.goalWeight,
    startBodyFat: prefer.bodyTracking.startBodyFat,
  };
  return normalizeState({
    settings:             prefer.settings,
    challenges,
    bodyTracking,
    globalBadges:         _union(local.globalBadges, remote.globalBadges),
    weeklyRecapDismissed: { ...(remote.weeklyRecapDismissed || {}), ...(local.weeklyRecapDismissed || {}) },
    migrations:           { ...(remote.migrations || {}), ...(local.migrations || {}) },
    xp:                   Math.max(local.xp || 0, remote.xp || 0),
    lastChapterSeen:      Math.max(local.lastChapterSeen || 0, remote.lastChapterSeen || 0),
    lastModified:         Math.max(local.lastModified || 0, remote.lastModified || 0),
  });
}

function loadState() {
  // Try new storage key first
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try { return normalizeState(JSON.parse(stored)); }
    catch(e) { console.warn("State parse failed", e); }
  }
  // Try migration from old Cruise Mode data
  const old = localStorage.getItem(OLD_KEY);
  if (old) {
    try {
      const s = normalizeState({});
      migrateCruiseMode(JSON.parse(old), s);
      return s;
    } catch(e) { console.warn("Migration failed", e); }
  }
  return normalizeState({});
}

function migrateCruiseMode(old, newState) {
  if (!old || typeof old !== "object") return;
  // Convert old days — runKm/stepsCount → tiers
  const newDays = {};
  const rawDays = old.days || {};
  for (const [k, d] of Object.entries(rawDays)) {
    if (!d || typeof d !== "object") continue;
    newDays[k] = {
      mode:      d.mode === "rest" ? "rest" : "standard",
      done:      Array.isArray(d.done) ? d.done : [],
      recovered: d.recovered === true,
      pts:       typeof d.pts === "number" ? d.pts : 0,
      tiers:     { run: d.runKm ?? null, steps: d.stepsCount ?? null },
    };
  }
  // Build the challenge — derive dates from actual logged data
  const rawDayKeys  = Object.keys(newDays).sort();
  const migrStart   = rawDayKeys[0]   || old.settings?.startDate || todayKey();
  const migrEnd     = old.settings?.endDate || addDays(migrStart, 85);
  const template = TEMPLATES.find(t => t.id === "cruise-control");
  const c = normalizeChallenge({
    id: "cruise-migrated",
    name: "Cruise Control",
    emoji: "🚢",
    description: "Your original 86-day transformation challenge.",
    templateId: "cruise-control",
    startDate: migrStart,
    endDate:   migrEnd,
    mode: "soft",
    status: "active",
    weeklyGoal: 175,
    habits: template ? template.habits : [],
    days: newDays,
    badges: Array.isArray(old.badges) ? old.badges : [],
    createdAt: migrStart,
  });
  newState.challenges[c.id] = c;
  // Body tracking
  if (Array.isArray(old.weighIns)) {
    newState.bodyTracking.entries = old.weighIns.map(w => ({
      date: w.date, weight: w.weight, bodyFat: w.bodyFat ?? null, leanMass: w.leanMass ?? null,
    }));
  }
  if (old.settings?.startWeight != null) newState.bodyTracking.startWeight = old.settings.startWeight;
  if (old.settings?.goalWeight  != null) newState.bodyTracking.goalWeight  = old.settings.goalWeight;
  // Copy old migrations so they don't re-run
  if (old.migrations) Object.assign(newState.migrations, old.migrations);
  // Mark migration done
  newState.migrations["cruiseModeImport_v1"] = true;
}

function saveState() {
  // Recalculate total pts per challenge
  for (const c of Object.values(state.challenges)) {
    let total = 0;
    for (const d of Object.values(c.days)) total += d.pts || 0;
    c.totalPts = total;
  }
  // Stamp the edit time so cloud merge can tell which device's preferences are newer.
  if (!_skipCloudPush) state.lastModified = Date.now();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch(e) {
    console.warn("saveState failed (storage quota?):", e);
    showToast(CloudSync.isSignedIn ? "Storage full — some data may not save." : "Storage full — sign in to back up your progress.");
  }
  // Debounced cloud push — 5 s after last save so rapid taps don't spam
  if (!_skipCloudPush && CloudSync.isSignedIn) {
    clearTimeout(_cloudPushTimer);
    _cloudPushTimer = setTimeout(() => CloudSync.push(), 5000);
  }
}

// Push any pending change immediately — called when the app is backgrounded or
// closed, so a habit logged seconds before leaving still reaches the cloud.
function flushCloudPush() {
  if (_cloudPushTimer) { clearTimeout(_cloudPushTimer); _cloudPushTimer = null; }
  if (!_skipCloudPush && CloudSync.isSignedIn) CloudSync.push();
}

// ── Date Helpers ───────────────────────────────────────────────────────────

function todayKey() { return toKey(new Date()); }
function toKey(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function parseDate(k) { const [y,m,d]=k.split("-").map(Number); return new Date(y,m-1,d); }
function addDays(key, n) { const d=parseDate(key); d.setDate(d.getDate()+n); return toKey(d); }
function diffDays(a, b) { return Math.round((parseDate(b)-parseDate(a))/86400000); }
function clamp(n,lo,hi) { return Math.max(lo,Math.min(hi,n)); }
function uid() { return Math.random().toString(36).slice(2,10); }
// Returns the scheduled workout entry for a given day of a challenge
// Returns null if the challenge template has no weekSchedule
function getDaySchedule(challenge, dateKey) {
  const tpl = challenge?.templateId ? TEMPLATES.find(t => t.id === challenge.templateId) : null;
  if (!tpl?.weekSchedule) return null;
  const dayNum = diffDays(challenge.startDate, dateKey) + 1; // 1-indexed
  const dayOfWeek = ((dayNum - 1) % 7) + 1;                  // 1–7 repeating
  return tpl.weekSchedule.find(s => s.day === dayOfWeek) || null;
}

// Returns the effective day number accounting for paused days
function challengeDayNumber(c, dateKey) {
  const d = dateKey || todayKey();
  const raw = diffDays(c.startDate, d) + 1 - (c.pausedDays || 0);
  if (c.noEndDate) return Math.max(1, raw);
  const totalDays = diffDays(c.startDate, c.endDate) + 1;
  return clamp(raw, 1, totalDays);
}

// ── Challenge Engine ───────────────────────────────────────────────────────

function getActiveChallenges() {
  const today = todayKey();
  return Object.values(state.challenges).filter(c =>
    c.status === "active" && c.startDate <= today && (c.noEndDate || c.endDate >= today)
  ).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
}

function getAllChallenges() {
  return Object.values(state.challenges).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
}

function getChallenge(id) { return state.challenges[id] || null; }

function effectiveDate() { return viewingDate || todayKey(); }

function getChallengeDay(challenge, key = todayKey()) {
  if (!challenge.days[key]) {
    challenge.days[key] = { mode:"standard", done:[], recovered:false, pts:0, tiers:{}, distances:{} };
    saveState();
  }
  return challenge.days[key];
}

function activeHabits(challenge, day) {
  if (day.mode === "rest") return []; // rest day: no habits required
  return challenge.habits;            // standard: all habits active
}

function tierPoints(habit, tierValue) {
  if (!habit.tiers || tierValue == null) return 0;
  // Support both {value, points} (old format) and {label, pts} (new format)
  // Fall back to index-based lookup when t.value is undefined
  const tier = habit.tiers.find((t, i) => String(t.value ?? i) === String(tierValue));
  return tier ? (tier.points ?? tier.pts ?? 0) : 0;
}

function completionInfo(challenge, day) {
  // Rest day: treat as 100% complete, 0 pts
  if (day.mode === "rest") return { done: 1, total: 1, percent: 100, points: 0, maxPoints: 0, multiplier: 1 };
  const active = activeHabits(challenge, day);
  const done = day.done.filter(id => active.some(h => h.id === id)).length;
  const total = active.length;
  const multiplier = day.streakMult ?? 1;
  // Comeback bonus: 1.5× on the first day back after 3+ missed days (flag set externally)
  const effectiveMult = day.comebackBonus ? Math.max(multiplier, 1.5) : multiplier;
  // Completion bonus fires for any challenge with 2+ habits
  const bonusAmt = total >= 2 ? 5 : 0;
  const completionBonus = (done === total && total > 0) ? bonusAmt : 0;
  // Perfect week bonus: +15 pts on day 7, 14, 21... of a consecutive perfect run (flag set externally)
  const weekBonus = (day.weeklyBonus && done === total && total > 0) ? 15 : 0;
  const basePoints = active.reduce((s, h) => {
    if (!day.done.includes(h.id)) return s;
    if (h.type === "tiered") return s + tierPoints(h, day.tiers?.[h.id]);
    return s + h.points;
  }, 0);
  const baseMax = active.reduce((s, h) => {
    if (h.type === "tiered" && h.tiers?.length) return s + Math.max(...h.tiers.map(t => t.points ?? t.pts ?? 0));
    return s + h.points;
  }, 0);
  const points    = Math.round((basePoints + completionBonus + weekBonus) * effectiveMult);
  const maxPoints = Math.round((baseMax + bonusAmt + (day.weeklyBonus ? 15 : 0)) * effectiveMult);
  return { done, total, percent: total ? Math.round((done/total)*100) : 0, points, maxPoints, multiplier };
}

function challengeTotalKm(challenge) {
  let total = 0;
  for (const day of Object.values(challenge.days)) {
    if (day.distances) {
      for (const km of Object.values(day.distances)) total += Number(km) || 0;
    }
  }
  return Math.round(total * 10) / 10;
}

function challengeRouteKm(c) {
  if (c.routeKm) return c.routeKm;
  const tpl = c.templateId ? TEMPLATES.find(t => t.id === c.templateId) : null;
  return tpl?.routeKm ?? null;
}

function updateDayPoints(challenge, day) {
  const info = completionInfo(challenge, day);
  day.pts = info.points;
}

function dayLogged(day) {
  return day && (day.done.length > 0 || day.recovered || day.mode === "rest" || day.freezeUsed);
}

function calcChallengeStreak(challenge) {
  let streak = 0;
  const today = todayKey();
  const d = parseDate(today);
  const todayDay = challenge.days[today];
  // If today not logged yet, start counting from yesterday
  if (!dayLogged(todayDay)) d.setDate(d.getDate()-1);
  const totalDays = challenge.noEndDate
    ? diffDays(challenge.startDate, todayKey()) + 1
    : diffDays(challenge.startDate, challenge.endDate) + 1;
  const softMode  = challenge.mode === "soft";
  let graceUsed   = false;
  for (let i = 0; i < totalDays; i++) {
    const k = toKey(d);
    if (k < challenge.startDate) break;
    const day = challenge.days[k];
    if (day?.mode === "rest") {
      // Rest day is streak-neutral: skip without consuming grace, don't count toward streak
      d.setDate(d.getDate()-1);
    } else if (dayLogged(day)) {
      streak++;
      d.setDate(d.getDate()-1);
    } else if (softMode && !graceUsed) {
      // Soft mode: one grace day — skip but don't break the streak
      graceUsed = true;
      d.setDate(d.getDate()-1);
    } else {
      break;
    }
  }
  return streak;
}

function challengeWeeks(challenge) {
  const start  = parseDate(challenge.startDate);
  const rawEnd = parseDate(challenge.endDate);
  // Cap ongoing challenges at today so week list stays finite
  const today  = parseDate(todayKey());
  const end    = challenge.noEndDate && rawEnd > today ? today : rawEnd;
  const weeks  = [];
  const cursor = new Date(start);
  let   num    = 1;
  while (cursor <= end) {
    const wStart = new Date(cursor);
    const wEnd   = new Date(cursor); wEnd.setDate(wEnd.getDate()+6);
    const wCap   = wEnd < end ? wEnd : end;
    const allDays = [];
    const fd = new Date(wStart);
    while (fd <= wCap) { allDays.push(toKey(fd)); fd.setDate(fd.getDate()+1); }
    const today = todayKey();
    const days  = allDays.filter(k => k <= today);
    const label = formatDate(wStart,{month:"short",day:"numeric"}) + " – " + formatDate(wCap,{month:"short",day:"numeric"});
    weeks.push({ num, label, days, allDays });
    cursor.setDate(cursor.getDate()+7);
    num++;
  }
  return weeks;
}

function createChallenge(form) {
  const template = form.templateId ? TEMPLATES.find(t => t.id === form.templateId) : null;
  const habits = template ? JSON.parse(JSON.stringify(template.habits)) : JSON.parse(JSON.stringify(form.habits));
  const c = normalizeChallenge({
    id: uid(),
    name: form.name || (template ? template.name : "My Challenge"),
    emoji: form.emoji || (template ? template.emoji : "🎯"),
    description: template ? template.description : "",
    templateId: form.templateId || null,
    startDate: form.startDate,
    endDate: form.endDate,
    mode: form.mode,
    status: "active",
    weeklyGoal: form.weeklyGoal || (template ? template.weeklyGoal : 100),
    jokerBudget: template?.noRestDay ? 0 : (typeof form.jokerBudget === "number" ? form.jokerBudget : 3),
    noEndDate: form.noEndDate === true,
    goalWeight: form.goalWeight ?? null,
    routeKm: form.routeKm || template?.routeKm || null,
    habits,
    days: {},
    badges: [],
    createdAt: todayKey(),
  });
  state.challenges[c.id] = c;
  saveState();
  return c;
}

// Real completion % — counts every calendar day of the challenge (not just days the
// user happened to open the app on), so days never visited don't just vanish from the
// denominator. Rest days are only excluded if the user actually took them (visited and
// marked rest) — an unvisited day is assumed to be a normal day, not a free pass.
// Shared by the completion-status decision below and the challenge-detail stat card.
function challengeCompletionStats(c) {
  const today = todayKey();
  const rangeEnd = c.noEndDate ? today : (c.endDate < today ? c.endDate : today);
  const totalDays = Math.max(1, diffDays(c.startDate, rangeEnd) + 1);
  const restDaysTaken = Object.values(c.days).filter(d => d.mode === "rest").length;
  const loggedDays = Object.values(c.days).filter(d => d.mode !== "rest" && (d.done.length > 0 || d.recovered)).length;
  const eligibleDays = Math.max(1, totalDays - restDaysTaken);
  return { loggedDays, eligibleDays, pct: Math.round((loggedDays / eligibleDays) * 100) };
}

function updateChallengeStatuses() {
  const today = todayKey();
  let changed = false;
  for (const c of Object.values(state.challenges)) {
    if (c.status === "active" && !c.noEndDate && c.endDate < today) {
      c.finalStreak = calcChallengeStreak(c); // snapshot before status changes
      c.finalCompletionPct = challengeCompletionStats(c).pct;
      if (!c.flags) c.flags = {};
      if (!c.completedAt) c.completedAt = new Date().toISOString();
      if (c.finalCompletionPct >= 50) {
        c.status = "completed";
        if (!c.flags.completionBonusPaid) {
          const dur = Math.round((new Date(c.endDate) - new Date(c.startDate)) / 86400000);
          const bonus = COMPLETION_BONUS[dur] ?? (dur >= 180 ? 300 : dur >= 90 ? 150 : 75);
          state.xp = (state.xp || 0) + bonus;
          c.flags.completionBonusPaid = true;
          c.completionBonus = bonus;
        }
        if (!c.personalBest) {
          c.personalBest = {
            streak: c.finalStreak,
            perfectDays: Object.values(c.days).filter(d => {
              const i = completionInfo(c, d); return d.mode !== "rest" && i.percent >= 100 && i.total > 0;
            }).length,
            totalPts: c.totalPts,
            completedAt: c.completedAt,
          };
        }
        // Queue — show first one immediately, rest after user dismisses
        if (!justCompletedId) justCompletedId = c.id;
        else justCompletedIds.push(c.id);
        launchConfetti();
      } else {
        // Ran out the clock without showing up enough — no bonus, no confetti, no false trophy.
        c.status = "failed";
        c.flags.autoEnded = true;
      }
      changed = true;
    }
  }
  if (changed) saveState();
}

// ── Badge Checks ───────────────────────────────────────────────────────────

function checkBadges(challenge) {
  const today    = todayKey();
  const day      = getChallengeDay(challenge);
  const info     = completionInfo(challenge, day);
  const allDays  = Object.values(challenge.days);
  const streak   = calcChallengeStreak(challenge);
  const totalPts = allDays.reduce((s,d) => s+(d.pts||0), 0);
  const totalDays = diffDays(challenge.startDate, challenge.endDate) + 1;
  const dayNumber = challengeDayNumber(challenge);
  const pctDone   = Math.round((dayNumber / totalDays) * 100);
  const daysLogged = allDays.filter(d => dayLogged(d)).length;
  // Compute once — reused in completedWeeks (cCtx) and checkStreakFreezeAward
  const myWeeks  = challengeWeeks(challenge);

  // ── Habit-type detection (template-agnostic) ──────────────────────────────
  const _runIds     = challenge.habits.filter(h =>
    h.type==="tiered" && h.tiers?.some(t => Number(t.value)===1 && /\bkm\b/i.test(t.label))
  ).map(h=>h.id);
  const _soberIds   = challenge.habits.filter(h =>
    h.id==="noalcohol" || h.id==="noalc" || /alcohol/i.test(h.title)
  ).map(h=>h.id);
  const _coldIds    = challenge.habits.filter(h =>
    h.id==="ce-cold" || /cold shower/i.test(h.title)
  ).map(h=>h.id);
  const _coldBoss   = challenge.habits.filter(h =>
    h.id==="ce-full"
  ).map(h=>h.id);
  const _medIds     = challenge.habits.filter(h =>
    h.id==="med-sit" || /meditat/i.test(h.title)
  ).map(h=>h.id);
  const _liftIds    = challenge.habits.filter(h =>
    h.id==="st-lift" || /lift session/i.test(h.title)
  ).map(h=>h.id);
  const _prIds      = challenge.habits.filter(h =>
    h.id==="st-pr" || /personal record/i.test(h.title)
  ).map(h=>h.id);
  const _sleepIds   = challenge.habits.filter(h =>
    h.id==="sl-hours" || /\d\+.{0,8}sleep|sleep.{0,8}\d\+/i.test(h.title)
  ).map(h=>h.id);
  const _noSugarIds = challenge.habits.filter(h =>
    h.id==="ns-nosugar" || /no.{0,6}sugar|zero.{0,6}sugar/i.test(h.title)
  ).map(h=>h.id);
  const _morningIds = challenge.habits.filter(h =>
    h.id==="mr-wake" || /wake up|no snooze/i.test(h.title)
  ).map(h=>h.id);
  const _detoxIds   = challenge.habits.filter(h =>
    h.id==="dd-limit" || /social media|screen time/i.test(h.title)
  ).map(h=>h.id);
  const _fastingIds = challenge.habits.filter(h =>
    h.id==="if-fast" || /fast completed|\d{2}-hour fast/i.test(h.title)
  ).map(h=>h.id);
  const _coreIds    = challenge.habits.filter(h =>
    h.id==="ca-core" || /core workout|ab workout/i.test(h.title)
  ).map(h=>h.id);
  const _yogaIds    = challenge.habits.filter(h =>
    h.id==="yf-yoga" || /yoga session/i.test(h.title)
  ).map(h=>h.id);
  const _photoIds   = challenge.habits.filter(h =>
    h.id==="photo" || /progress\s*photo/i.test(h.title)
  ).map(h=>h.id);
  const _walkIds    = challenge.habits.filter(h =>
    h.id==="dw-dist" || h.id==="wk-dist"
  ).map(h=>h.id);
  const _cycleIds   = challenge.habits.filter(h =>
    h.id==="cy-ride"
  ).map(h=>h.id);

  // ── 1. Template-specific context ─────────────────────────────────────────
  const cCtx = {
    dayNumber, pctDone, streak, totalPts, daysLogged,
    complete:              info.done === info.total && info.total > 0,
    completedWeeks: (() => {
      return myWeeks.filter(w => {
        const lastDay = w.allDays[w.allDays.length-1];
        if (!lastDay || lastDay >= today) return false;
        return w.allDays.length > 0 && w.allDays.every(k => {
          const d = challenge.days[k]; return d && (d.done.length || d.recovered);
        });
      }).length;
    })(),
    runsLogged:            _runIds.length     ? allDays.filter(d=>_runIds.some(id=>d.done.includes(id))).length : 0,
    hasRun5k:              _runIds.length     ? allDays.some(d=>_runIds.some(id=>{ const v=d.tiers?.[id]; return v==="5+"||Number(v)>=5; })) : false,
    soberStreak:           _soberIds.length   ? Math.max(0,..._soberIds.map(id=>habitStreakCount(challenge,id))) : 0,
    coldShowersLogged:     _coldIds.length    ? allDays.filter(d=>_coldIds.some(id=>d.done.includes(id))).length : 0,
    coldShowerStreak:      _coldIds.length    ? Math.max(0,..._coldIds.map(id=>habitStreakCount(challenge,id))) : 0,
    hasColdPlunge:         _coldBoss.length   ? allDays.some(d=>_coldBoss.some(id=>d.done.includes(id))) : false,
    meditationLogged:      _medIds.length     ? allDays.filter(d=>_medIds.some(id=>d.done.includes(id))).length : 0,
    meditationStreak:      _medIds.length     ? Math.max(0,..._medIds.map(id=>habitStreakCount(challenge,id))) : 0,
    hasLifted:             _liftIds.length    ? allDays.some(d=>_liftIds.some(id=>d.done.includes(id))) : false,
    liftsLogged:           _liftIds.length    ? allDays.filter(d=>_liftIds.some(id=>d.done.includes(id))).length : 0,
    hasPR:                 _prIds.length      ? allDays.some(d=>_prIds.some(id=>d.done.includes(id))) : false,
    sleepHabitsLogged:     _sleepIds.length   ? allDays.filter(d=>_sleepIds.some(id=>d.done.includes(id))).length : 0,
    sleepStreak:           _sleepIds.length   ? Math.max(0,..._sleepIds.map(id=>habitStreakCount(challenge,id))) : 0,
    noSugarLogged:         _noSugarIds.length ? allDays.filter(d=>_noSugarIds.some(id=>d.done.includes(id))).length : 0,
    noSugarStreak:         _noSugarIds.length ? Math.max(0,..._noSugarIds.map(id=>habitStreakCount(challenge,id))) : 0,
    morningRoutineLogged:  _morningIds.length ? allDays.filter(d=>_morningIds.some(id=>d.done.includes(id))).length : 0,
    morningRoutineStreak:  _morningIds.length ? Math.max(0,..._morningIds.map(id=>habitStreakCount(challenge,id))) : 0,
    detoxLogged:           _detoxIds.length   ? allDays.filter(d=>_detoxIds.some(id=>d.done.includes(id))).length : 0,
    detoxStreak:           _detoxIds.length   ? Math.max(0,..._detoxIds.map(id=>habitStreakCount(challenge,id))) : 0,
    fastingLogged:         _fastingIds.length ? allDays.filter(d=>_fastingIds.some(id=>d.done.includes(id))).length : 0,
    fastingStreak:         _fastingIds.length ? Math.max(0,..._fastingIds.map(id=>habitStreakCount(challenge,id))) : 0,
    coreLogged:            _coreIds.length    ? allDays.filter(d=>_coreIds.some(id=>d.done.includes(id))).length : 0,
    yogaLogged:            _yogaIds.length    ? allDays.filter(d=>_yogaIds.some(id=>d.done.includes(id))).length : 0,
    yogaStreak:            _yogaIds.length    ? Math.max(0,..._yogaIds.map(id=>habitStreakCount(challenge,id))) : 0,
    photosLogged:          _photoIds.length   ? allDays.filter(d=>_photoIds.some(id=>d.done.includes(id))).length : 0,
    has6kmWalk:            _walkIds.length    ? allDays.some(d=>_walkIds.some(id=>{ const v=d.tiers?.[id]; return Number(v)>=6; })) : false,
    has50kmRide:           _cycleIds.length   ? allDays.some(d=>_cycleIds.some(id=>{ const v=d.tiers?.[id]; return Number(v)>=50; })) : false,
    has10kmWalk:           _walkIds.length    ? allDays.some(d=>_walkIds.some(id=>{ const v=d.tiers?.[id]; return Number(v)>=10; })) : false,
    totalKm:               challengeTotalKm(challenge),
  };

  // Check template-specific badges
  let earned = false;
  const tBadges = TEMPLATE_BADGES[challenge.templateId] || [];
  tBadges.forEach(b => {
    if (!challenge.badges.includes(b.id) && b.test(cCtx)) {
      challenge.badges.push(b.id);
      _badgeSheetQueue.push({ label: b.label, desc: b.desc || "", tier: TEMPLATE_TIERS[challenge.templateId] || "common" });
      earned = true;
      // Completion badge → finalise challenge status and queue the modal
      if (b.id.endsWith("-done") && challenge.status !== "completed") {
        challenge.finalStreak = calcChallengeStreak(challenge);
        challenge.status = "completed";
        if (!challenge.completedAt) challenge.completedAt = new Date().toISOString();
        if (!challenge.flags.completionBonusPaid) {
          const dur = Math.round((new Date(challenge.endDate) - new Date(challenge.startDate)) / 86400000);
          const bonus = COMPLETION_BONUS[dur] ?? (dur >= 180 ? 300 : dur >= 90 ? 150 : 75);
          state.xp = (state.xp || 0) + bonus;
          challenge.flags.completionBonusPaid = true;
          challenge.completionBonus = bonus;
        }
        if (!challenge.personalBest) {
          challenge.personalBest = {
            streak: challenge.finalStreak,
            perfectDays: Object.values(challenge.days).filter(d => {
              const i = completionInfo(challenge, d); return d.mode !== "rest" && i.percent >= 100 && i.total > 0;
            }).length,
            totalPts: challenge.totalPts,
            completedAt: challenge.completedAt,
          };
        }
        if (!justCompletedId) justCompletedId = challenge.id;
        else justCompletedIds.push(challenge.id);
        trackEvent("Challenge Completed", { challenge: challenge.name, days: challenge.duration });
        launchConfetti();
      }
    }
  });

  // ── 2. Universal context (best/totals across all challenges) ─────────────
  const allChallenges = Object.values(state.challenges);
  const allDaysAll    = allChallenges.flatMap(c => Object.values(c.days));
  const uCtx = {
    longestStreak: Math.max(0, ...allChallenges.map(c =>
      (c.status==="completed"||c.status==="failed") && c.finalStreak!=null
        ? c.finalStreak : calcChallengeStreak(c)
    )),
    totalPts: allChallenges.reduce((s,c) =>
      s + Object.values(c.days).reduce((ss,d) => ss+(d.pts||0), 0), 0
    ),
    weighIns:          state.bodyTracking.entries.length,
    weightLost: (() => {
      const sw = state.bodyTracking.startWeight;
      const e  = state.bodyTracking.entries;
      return (sw && e.length) ? Math.max(0, sw - e[e.length-1].weight) : 0;
    })(),
    weightGoalReached: (() => {
      const gw = state.bodyTracking.goalWeight;
      const e  = state.bodyTracking.entries;
      return !!(gw && e.length && e[e.length-1].weight <= gw);
    })(),
    anyRecovered:  allDaysAll.some(d => d.recovered),
    anyFirstDay: allChallenges.some(c => {
      const fd = c.days[c.startDate];
      if (!fd) return false;
      const fi = completionInfo(c, fd);
      return fi.percent === 100 && fi.total > 0;
    }),
    completedChallenges: allChallenges.filter(c => c.status==="completed").length,
    hasPerfectWeek:      allChallenges.some(c => getPerfectRunLength(c, todayKey()) >= 7),
    expeditionDone:      allChallenges.some(c => c.status==="completed" && c.habits.some(h => h.type==="distance")),
    doubleAgent: (() => {
      const done = allChallenges.filter(c => c.status==="completed" && c.templateId);
      const seen = new Set();
      return done.some(c => { if (seen.has(c.templateId)) return true; seen.add(c.templateId); return false; });
    })(),
    darkHorse:    allChallenges.some(c => c.status==="completed" && Object.values(c.days).some(d => d.comebackBonus)),
    perfectMonth: allChallenges.some(c => getPerfectRunLength(c, todayKey()) >= 30),
  };

  UNIVERSAL_BADGES.forEach(b => {
    if (!state.globalBadges.includes(b.id) && b.test(uCtx)) {
      state.globalBadges.push(b.id);
      _badgeSheetQueue.push({ label: rethemeBadgeText(b.label), desc: rethemeBadgeText(b.desc || ""), tier: "uncommon" });
      earned = true;
    }
  });

  // ── 3. Lifetime context (cumulative cross-challenge achievements) ─────────
  const pb = computePersonalBests();
  const lCtx = {
    totalHabitsLogged: pb.totalHabits,
    completedChallenges: allChallenges.filter(c => c.status==="completed").length,
    allCategoriesDone: (() => {
      const cats = new Set(
        allChallenges
          .filter(c => c.status==="completed" && c.templateId)
          .map(c => TEMPLATES.find(t => t.id===c.templateId)?.category)
          .filter(Boolean)
      );
      return ["transformation","movement","lifestyle"].every(cat => cats.has(cat));
    })(),
    perfectChallenge: allChallenges.filter(c => c.status==="completed").some(c => {
      const start = parseDate(c.startDate), end = parseDate(c.endDate);
      const cur = new Date(start);
      while (cur <= end) {
        const d = c.days[toKey(cur)];
        if (!d || !dayLogged(d)) return false;
        cur.setDate(cur.getDate()+1);
      }
      return true;
    }),
    freezeUsed: allChallenges.some(c => Object.values(c.days).some(d => d.freezeUsed)),
  };

  LIFETIME_BADGES.forEach(b => {
    if (!state.globalBadges.includes(b.id) && b.test(lCtx)) {
      state.globalBadges.push(b.id);
      _badgeSheetQueue.push({ label: b.label, desc: b.desc || "", tier: "rare" });
      earned = true;
    }
  });

  // ── 4. Journey badges (level milestones within the currently active theme) ──
  const activeThemeId = state.settings.journeyTheme;
  const curLevel = getLevelInfo(state.xp).level;
  (THEME_BADGES[activeThemeId] || []).forEach(b => {
    if (!state.globalBadges.includes(b.id) && curLevel >= b.levelReq) {
      state.globalBadges.push(b.id);
      _badgeSheetQueue.push({ label: b.label, desc: b.desc || "", tier: b.tier });
      earned = true;
    }
  });

  if (earned) saveState();
  checkStreakFreezeAward(challenge, myWeeks);
}

function checkStreakFreezeAward(challenge, weeks) {
  const today = todayKey();
  weeks = weeks || challengeWeeks(challenge);
  const curWeek = weeks.find(w => w.allDays.includes(today));
  if (!curWeek) return;
  const weekKey = curWeek.allDays[0]; // first day of week = unique ID
  if ((challenge.streakFreezeWeeksAwarded || []).includes(weekKey)) return; // already awarded this week
  const daysLogged = curWeek.days.filter(k => {
    const d = challenge.days[k]; return d && (d.done.length || d.recovered);
  }).length;
  if (daysLogged >= 5) {
    challenge.streakFreezes = (challenge.streakFreezes || 0) + 1;
    if (!challenge.streakFreezeWeeksAwarded) challenge.streakFreezeWeeksAwarded = [];
    const isFirst = challenge.streakFreezeWeeksAwarded.length === 0;
    challenge.streakFreezeWeeksAwarded.push(weekKey);
    showBigToast('<i class="ti ti-snowflake"></i>', "Streak freeze banked!", "5 days logged this week — you've earned a streak freeze.");
    if (isFirst) setTimeout(() => showToast("Streak Freeze: tap the snowflake bar on any day you miss to use it."), 3500);
    saveState();
  }
}

function habitStreakCount(challenge, habitId) {
  let n = 0;
  const d = parseDate(todayKey());
  const totalDays = diffDays(challenge.startDate, challenge.endDate)+1;
  for (let i=0;i<totalDays;i++) {
    const day = challenge.days[toKey(d)];
    if (!day || !day.done.includes(habitId)) break;
    n++;
    d.setDate(d.getDate()-1);
  }
  return n;
}

function lastNDays(n) {
  const d = parseDate(todayKey());
  return Array.from({length:n},()=>{ const k=toKey(d); d.setDate(d.getDate()-1); return k; });
}

// ── Confirm Modal (replaces window.confirm — works in standalone PWA) ─────

function showConfirm(msg, onConfirm) {
  _confirmDialog = { msg, onConfirm };
  render();
}

function showPrompt(msg, defaultVal, onConfirm) {
  _promptDialog = { msg, defaultVal: defaultVal ?? "", onConfirm };
  render();
}

function renderConfirmModal() {
  if (!_confirmDialog) return "";
  return `
  <div class="confirm-overlay" data-confirm-overlay>
    <div class="confirm-modal panel">
      <p class="confirm-msg">${esc(_confirmDialog.msg)}</p>
      <div class="confirm-btns">
        <button class="secondary-button" data-confirm-cancel>Cancel</button>
        <button class="pill-btn confirm-danger-btn" data-confirm-ok>Confirm</button>
      </div>
    </div>
  </div>`;
}

function renderPromptModal() {
  if (!_promptDialog) return "";
  return `
  <div class="confirm-overlay" data-prompt-overlay>
    <div class="confirm-modal panel">
      <p class="confirm-msg">${esc(_promptDialog.msg)}</p>
      <input class="prompt-input" id="prompt-input-field" type="number" min="1" max="365"
             value="${esc(String(_promptDialog.defaultVal))}" placeholder="days">
      <div class="confirm-btns">
        <button class="secondary-button" data-prompt-cancel>Skip</button>
        <button class="pill-btn" data-prompt-ok>Set reminder</button>
      </div>
    </div>
  </div>`;
}

// ── Launch UX ────────────────────────────────────────────────────────────

// Monday new-week ceremony
function checkNewWeekCeremony() {
  const today = todayKey();
  const d = new Date();
  if (d.getDay() !== 1) return; // only Monday
  if (localStorage.getItem("conqur_newweek") === today) return; // already shown this Monday
  // Calculate last week's total points across all active/completed challenges
  let lastWeekPts = 0;
  Object.values(state.challenges).forEach(c => {
    for (let i = 1; i <= 7; i++) {
      const k = addDays(today, -i);
      lastWeekPts += (c.days?.[k]?.pts || 0);
    }
  });
  if (lastWeekPts > 0) {
    _newWeekBanner = { pts: lastWeekPts };
    localStorage.setItem("conqur_newweek", today);
  }
}

// Floating +pts animation
function showPtsAnim(pts, rect) {
  if (!pts || pts <= 0) return;
  const el = document.createElement("div");
  el.className = "pts-anim";
  el.textContent = `+${pts} pts`;
  el.style.left = `${rect.left + rect.width * 0.72}px`;
  el.style.top  = `${rect.top + 12}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

// Big toast for special moments (Day 1, halfway, etc.)
function showBigToast(emoji, title, sub, duration = 4000) {
  const existing = document.querySelector(".big-toast");
  if (existing) existing.remove();
  const el = document.createElement("div");
  el.className = "big-toast";
  el.innerHTML = `<span class="big-toast-emoji">${emoji}</span><div class="big-toast-title">${title}</div><div class="big-toast-sub">${sub}</div>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), duration);
}

function renderLevelUpOverlay() {
  const o = _levelUpOverlay;
  return `
  <div class="luo-backdrop" data-close-levelup>
    <div class="luo-card" role="dialog" aria-modal="true" aria-label="Level up!">
      <div class="luo-burst"><i class="ti ${o.icon}"></i></div>
      <div class="luo-badge">LEVEL UP</div>
      <div class="luo-level">${o.level}</div>
      <div class="luo-name">${o.name}</div>
      <div class="luo-total">${o.total.toLocaleString()} XP total</div>
      <button class="primary-button luo-cta" data-close-levelup>Keep going</button>
    </div>
  </div>`;
}

// Count consecutive missed days immediately before today for a challenge
function getConsecutiveMisses(challenge) {
  let count = 0;
  const today = todayKey();
  let cursor = addDays(today, -1);
  while (cursor >= challenge.startDate) {
    const day = challenge.days[cursor];
    if (day?.mode === "rest") break; // rest day is not a miss
    if (!day || !dayLogged(day)) count++;
    else break;
    cursor = addDays(cursor, -1);
  }
  return count;
}

// Count consecutive 100%-complete non-rest days ending at endKey
function getPerfectRunLength(challenge, endKey) {
  const dates = Object.keys(challenge.days).sort().filter(k => k <= endKey);
  let run = 0;
  for (let i = dates.length - 1; i >= 0; i--) {
    const d = challenge.days[dates[i]];
    if (!d || d.mode === "rest" || d.freezeUsed) continue;
    const info = completionInfo(challenge, d);
    if (info.percent < 100 || info.total === 0) break;
    run++;
  }
  return run;
}

// Best week score across all weeks of a challenge
function challengePersonalBest(challenge) {
  const weeks = challengeWeeks(challenge);
  return weeks.reduce((best, week) => {
    const score = week.allDays.reduce((s, d) => s + (challenge.days[d]?.pts || 0), 0);
    return Math.max(best, score);
  }, 0);
}

// Check and fire one-time milestone celebrations
function checkMilestones(challenge) {
  if (!challenge.flags) challenge.flags = {};
  const totalDays = diffDays(challenge.startDate, challenge.endDate) + 1;
  const dayNumber = challengeDayNumber(challenge);
  const today = todayKey();
  const day = challenge.days[today];
  if (!day) return;
  const info = completionInfo(challenge, day);
  const streak = calcChallengeStreak(challenge);

  // Day 1 complete
  if (dayNumber === 1 && info.percent === 100 && !challenge.flags.day1done) {
    challenge.flags.day1done = true;
    setTimeout(() => {
      showBigToast('<i class="ti ti-circle-check"></i>', "Day 1 done.", `Come back tomorrow. Your ${term('streak')} starts now.`);
      if (_pwaInstallPrompt && !localStorage.getItem("conqur_install_shown")) {
        setTimeout(() => { _showInstallBanner = true; render(); }, 3000);
      }
      if ("Notification" in window && Notification.permission === "default" && !localStorage.getItem("conqur_notif_asked")) {
        localStorage.setItem("conqur_notif_asked", "1");
        setTimeout(() => { _notifPromptVisible = true; render(); }, 2500);
      }
      if (!state.settings.themeChosen && !_themePromptShown) {
        _themePromptShown = true;
        setTimeout(() => { _showThemePrompt = true; render(); }, 4000);
      }
    }, 500);
  }
  // Halfway
  if (dayNumber >= Math.ceil(totalDays / 2) && info.percent === 100 && !challenge.flags.halfway) {
    challenge.flags.halfway = true;
    setTimeout(() => showBigToast('<i class="ti ti-target"></i>', "Halfway there.", "Most people quit here. You didn't."), 600);
  }
  // Streak milestones — fire only when the streak just hit that number today
  const STREAK_MILESTONES = [
    { n:7,  icon:"🔥", title:`7-day ${term('streak')}!`, sub:`One week straight. The ${term('streak')} is building.` },
    { n:14, icon:"💪", title:"14 days!",       sub:"Two weeks. You're building something real." },
    { n:21, icon:"⚡", title:`21-day ${term('streak')}!`, sub:"Three weeks in. This is who you are now." },
    { n:30, icon:"🏆", title:"30 days!",        sub:"One month. Elite 1% territory." },
    { n:50, icon:"🌟", title:`50-day ${term('streak')}!`, sub:"Fifty days of showing up. Unbelievable." },
    { n:75,  icon:"👑", title:"75 days!",         sub:"The full distance. You are unstoppable." },
    { n:100, icon:"💎", title:`100-day ${term('streak')}!`, sub:"Triple digits. You are an absolute legend." },
  ];
  for (const ms of STREAK_MILESTONES) {
    const flagKey = `streak${ms.n}`;
    if (streak === ms.n && info.percent === 100 && !challenge.flags[flagKey]) {
      challenge.flags[flagKey] = true;
      const { icon, title, sub } = ms;
      setTimeout(() => showBigToast(icon, title, sub), 700);
      break; // only one streak toast per toggle
    }
  }
  // Phase completion toasts (all phases except the last — challenge completion has its own moment)
  const phases = getChallengePhases(challenge);
  if (phases && info.percent === 100) {
    for (let i = 0; i < phases.length - 1; i++) {
      const flagKey = `phase${i + 1}done`;
      if (dayNumber === phases[i].end && !challenge.flags[flagKey]) {
        challenge.flags[flagKey] = true;
        const nextPhase = phases[i + 1];
        setTimeout(() => showBigToast('<i class="ti ti-flag"></i>', `Phase ${i + 1} complete!`, `Up next: ${nextPhase.name}`), 800);
        break;
      }
    }
  }
}

function getChallengePhases(challenge) {
  const totalDays = diffDays(challenge.startDate, challenge.endDate) + 1;
  if (totalDays <= 30) return null;
  if (totalDays <= 60) {
    const mid = Math.round(totalDays / 2);
    return [
      { name: "Getting Started", start: 1,       end: mid },
      { name: "Making It Stick", start: mid + 1, end: totalDays },
    ];
  }
  if (totalDays <= 90) {
    const t = Math.round(totalDays / 3);
    return [
      { name: "Foundation", start: 1,           end: t },
      { name: "Rising",     start: t + 1,       end: t * 2 },
      { name: "The Ascent", start: t * 2 + 1,   end: totalDays },
    ];
  }
  const q = Math.round(totalDays / 4);
  return [
    { name: "Foundation",  start: 1,           end: q },
    { name: "Building",    start: q + 1,       end: q * 2 },
    { name: "The Climb",   start: q * 2 + 1,   end: q * 3 },
    { name: "Summit Push", start: q * 3 + 1,   end: totalDays },
  ];
}

function getChallengePhaseInfo(challenge, dayNumber) {
  const phases = getChallengePhases(challenge);
  if (!phases) return null;
  for (let i = 0; i < phases.length; i++) {
    if (dayNumber <= phases[i].end) {
      return { phase: phases[i], phaseIndex: i + 1, totalPhases: phases.length };
    }
  }
  return { phase: phases[phases.length - 1], phaseIndex: phases.length, totalPhases: phases.length };
}

// ── Render Core ────────────────────────────────────────────────────────────

function applyTheme() {
  document.documentElement.setAttribute("data-theme", state?.settings?.journeyTheme || "frostborn");
  setDynamicIcon();
}

function render() {
  try {
    _renderInner();
  } catch (err) {
    console.error("Render error:", err);
    const app = document.getElementById("app");
    if (app) app.innerHTML = `<div style="padding:32px 20px;text-align:center;color:var(--text)">
      <div style="font-size:40px;margin-bottom:12px;color:var(--warning)"><i class="ti ti-alert-triangle"></i></div>
      <div style="font-size:18px;font-weight:700;margin-bottom:8px">Something went wrong</div>
      <div style="font-size:13px;color:var(--text-dim);margin-bottom:20px">A display error occurred. Your data is safe.</div>
      <button class="primary-button" onclick="window.location.reload()" style="margin:0 auto;max-width:200px">Reload app</button>
    </div>`;
  }
}
function _renderInner() {
  applyTheme();
  const app = document.getElementById("app");
  // Full-screen onboarding — render only the onboarding screen
  if (onboardingStep !== null) {
    const stepChanged = onboardingStep !== _prevObStep;
    _prevObStep = onboardingStep;
    app.innerHTML = renderOnboarding();
    if (stepChanged) {
      const scr = app.querySelector(".ob-screen");
      if (scr) scr.classList.add("ob-entering");
    }
    if (!_eventsBound) { bindEvents(); _eventsBound = true; }
    return;
  }
  // Scroll to top when the primary view changes (not for modals/sheet)
  const viewKey = `${activeTab}|${builderOpen}|${settingsOpen}|${viewChallengeId}|${editChallengeId}`;
  _viewChanged = (viewKey !== _lastViewKey && !justCompletedId);
  if (_viewChanged) {
    window.scrollTo(0, 0);
    _lastViewKey = viewKey;
  }
  let html = renderTopbar();
  if (builderOpen) {
    html += renderBuilder();
  } else if (settingsOpen) {
    html += renderSettings();
  } else if (editChallengeId) {
    html += renderEditChallenge(getChallenge(editChallengeId));
  } else if (viewChallengeId) {
    html += renderChallengeDetail(getChallenge(viewChallengeId));
  } else {
    html += activeTab === "today"      ? renderToday()      : "";
    html += activeTab === "challenges" ? renderChallenges() : "";

    html += activeTab === "badges"     ? renderBadges()     : "";
  }
  html += renderNav();
  if (justCompletedId) {
    const _cc = getChallenge(justCompletedId);
    if (_cc) html += renderCompletionModal(_cc);
  }
  html += renderShareModal();
  // Badge unlocks are non-blocking stacked toasts (see flushBadgeToasts) — they're
  // appended straight to document.body, outside the render() HTML string, so an
  // unrelated re-render can't recreate and replay their entrance animation.
  if (_badgeSheetQueue.length > 0) {
    flushBadgeToasts(_badgeSheetQueue);
    _badgeSheetQueue = [];
  }
  // Level-up / chapter overlays are mutually exclusive — show at most one per render
  // so dismissing one doesn't immediately reveal another stacked behind it.
  if (_levelUpOverlay) {
    html += renderLevelUpOverlay();
  } else {
    // Chapter milestone check (show once per threshold, guarded by state.lastChapterSeen)
    if (!_chapterOverlay) {
      const _curLevel = getLevelInfo(state.xp).level;
      const _chapterDue = [5, 10, 15, 20, 25].find(l => l <= _curLevel && l > (state.lastChapterSeen ?? 0));
      if (_chapterDue) { _chapterOverlay = _chapterDue; state.lastChapterSeen = _chapterDue; saveState(); }
    }
    if (_chapterOverlay) html += renderChapterOverlay();
  }
  if (_notifPromptVisible) html += renderNotifPrompt();
  html += renderConfirmModal();
  html += renderPromptModal();
  if (_safetyPendingTemplateId) html += renderSafetyModal();
  if (_showThemePrompt) html += renderThemePromptSheet();
  if (_showInstallBanner && _pwaInstallPrompt && !localStorage.getItem("conqur_install_shown")) {
    html += `
    <div class="install-banner">
      <span style="font-size:28px;color:var(--accent)"><i class="ti ti-download"></i></span>
      <div class="install-banner-text">
        <strong>Add Conqur to your Home Screen</strong>
        <span>Works offline. Opens like a native app.</span>
      </div>
      <button class="install-banner-btn" data-install-accept>Install</button>
      <button class="install-banner-dismiss" data-install-dismiss aria-label="Dismiss">×</button>
    </div>`;
  }
  app.innerHTML = html;
  if (!_eventsBound) { bindEvents(); _eventsBound = true; }
  requestAnimationFrame(() => {
    updateRingVisuals();
    _animHabitId = null;
    // Load progress photos into challenge detail strip (runs after every render so it works after navigation)
    const ppStrip = document.querySelector('[id^="pp-strip-"]');
    if (ppStrip && !ppStrip.dataset.loaded) {
      ppStrip.dataset.loaded = "1";
      const cid = ppStrip.id.replace("pp-strip-", "");
      PhotoDB.list(cid + "_").then(photos => {
        if (!photos.length) {
          ppStrip.innerHTML = `<p class="pp-empty">No photos yet — tap the camera icon on the progress photo habit to capture one.</p>`;
        } else {
          ppStrip.innerHTML = `<div class="pp-grid">${
            photos.slice(-9).reverse().map(p => {
              const dateStr = p.key.split("_")[1] || "";
              const label = dateStr ? formatDate(parseDate(dateStr), {month:"short", day:"numeric"}) : dateStr;
              return `<div class="pp-item">
                <img src="${p.dataURL}" class="pp-img" alt="Progress ${label}">
                <div class="pp-date">${label}</div>
                <button class="pp-delete" data-delete-photo="${esc(p.key)}" title="Delete photo" aria-label="Delete photo"><i class="ti ti-trash"></i></button>
              </div>`;
            }).join("")
          }</div><p class="pp-count">${photos.length} photo${photos.length===1?"":"s"}</p>`;
        }
      }).catch(() => { ppStrip.innerHTML = ""; });
    }
  });
}

function renderTopbar() {
  const showShare = activeTab === "today" && !builderOpen && !settingsOpen && !viewChallengeId && !editChallengeId && todayChallengeId !== "__all__" && getActiveChallenges().length > 0;
  return `
  ${_isOffline ? `<div class="cloud-sync-bar cloud-sync-bar--warn" role="status" aria-live="polite">Offline — will sync when reconnected</div>` : ""}
  ${_lastSyncError && !_isOffline ? `<div class="cloud-sync-bar cloud-sync-bar--err" role="alert"><i class="ti ti-alert-triangle"></i> Sync failed — <button class="link-btn" data-retry-sync>retry</button></div>` : ""}
  ${_cloudSyncing ? `<div class="cloud-sync-bar" role="progressbar" aria-label="Syncing…"></div>` : ""}
  <header class="topbar">
    <div class="brand">
      <span class="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 36 36" width="30" height="30">
          <defs>
            <linearGradient id="bm-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" style="stop-color:var(--primary)"/>
              <stop offset="100%" style="stop-color:var(--secondary)"/>
            </linearGradient>
          </defs>
          <rect width="36" height="36" rx="8" fill="#000"/>
          <circle cx="18" cy="18" r="13" fill="none" stroke="#111" stroke-width="2.5"/>
          <circle cx="18" cy="18" r="13" fill="none" stroke="url(#bm-g)" stroke-width="2.5"
            stroke-linecap="round" stroke-dasharray="61 20" transform="rotate(-90 18 18)"/>
          <text x="18" y="18" text-anchor="middle" dominant-baseline="central"
            font-family="'Lato',system-ui,sans-serif" font-weight="900" font-size="15" fill="url(#bm-g)">C</text>
        </svg>
      </span>
      <span>Conqur</span>
    </div>
    <div style="display:flex;align-items:center;gap:10px">
      <div class="date-chip">${formatDate(parseDate(todayKey()),{weekday:"short",month:"short",day:"numeric"})}</div>
      ${showShare ? `<button class="icon-btn" data-share-progress aria-label="Share progress">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>
      </button>` : ""}
      <button class="icon-btn" data-open-settings aria-label="Settings">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
          <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>
    </div>
  </header>`;
}

const NAV_ICONS = {
  today:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`,
  challenges: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
  body:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
  badges:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>`,
};

function renderNav() {
  const tabs = [["today","Today"],["challenges",term('challengePlural')],["badges",term('badgePlural')]];
  return `
  <nav class="bottom-nav" aria-label="Conqur sections">
    ${tabs.map(([id,label]) => `
      <button class="nav-button ${activeTab===id&&!builderOpen&&!settingsOpen&&!viewChallengeId&&!editChallengeId?"active":""}" data-tab="${id}">
        ${NAV_ICONS[id]}${label}
      </button>`).join("")}
  </nav>`;
}

// ── Today Tab ─────────────────────────────────────────────────────────────

function renderToday() {
  const active = getActiveChallenges();
  if (!active.length) return renderNoChallenge();

  // Auto-select first challenge if none selected or selection invalid (but keep __all__)
  if (!todayChallengeId || (todayChallengeId !== "__all__" && !active.find(c => c.id === todayChallengeId))) {
    todayChallengeId = active[0].id;
  }

  // Unified all-challenges view
  if (todayChallengeId === "__all__") return renderTodayAll(active);
  const challenge = active.find(c => c.id === todayChallengeId);
  const today    = todayKey();
  const effDate  = effectiveDate();
  // Clamp viewingDate within challenge bounds and no further back than 3 days
  const minBack  = addDays(today, -3);
  const minDate  = challenge.startDate > minBack ? challenge.startDate : minBack;
  if (viewingDate && viewingDate < minDate) viewingDate = minDate;
  if (viewingDate && viewingDate > today)  viewingDate = null;
  const isToday  = effDate === today;

  const day  = getChallengeDay(challenge, effDate);
  const info = completionInfo(challenge, day);
  const totalDays  = challenge.noEndDate ? null : diffDays(challenge.startDate, challenge.endDate)+1;
  const dayNumber  = challengeDayNumber(challenge, effDate);
  const daysLeft   = challenge.noEndDate ? null : Math.max(0, diffDays(today, challenge.endDate));
  const journeyPct = totalDays ? clamp(Math.round((dayNumber/totalDays)*100), 0, 100) : null;
  const streak     = calcChallengeStreak(challenge);
  const phaseInfo  = getChallengePhaseInfo(challenge, dayNumber);
  const heroTpl    = challenge.templateId ? TEMPLATES.find(t => t.id === challenge.templateId) : null;

  const canGoBack  = addDays(effDate, -1) >= minDate;
  const canGoFwd   = !isToday;

  // Comeback: consecutive missed days before today
  const missedStreak = isToday ? getConsecutiveMisses(challenge) : 0;
  const xpInfo  = getLevelInfo(state.xp);
  const xpTheme = JOURNEY_THEMES[state.settings.journeyTheme] || JOURNEY_THEMES.frostborn;
  const xpToNext = xpInfo.next ? (xpInfo.next.xp - state.xp).toLocaleString() : null;

  return `
  <main${_viewChanged ? ` class="tab-fade-in"` : ""}>
    <div class="xp-mini-bar">
      <span class="xmb-badge"><i class="ti ${xpTheme.icon}"></i> ${term('level')} ${xpInfo.level}</span>
      <span class="xmb-name">${xpInfo.name}</span>
      <span class="xmb-track"><span class="xmb-fill" style="width:${xpInfo.pct}%"></span></span>
      <span class="xmb-hint">${xpToNext ? xpToNext + " XP to next · XP never resets" : `Max ${term('level')} <i class="ti ti-trophy"></i>`}</span>
    </div>
    ${active.length > 1 ? renderChallengePills(active) : ""}
    ${renderWeeklyRecap(challenge)}
    ${_newWeekBanner ? `
    <div class="new-week-banner${_viewChanged ? " new-week-banner--anim" : ""}">
      <h3><i class="ti ti-calendar"></i> New week. Clean slate.</h3>
      <p>Last week: <strong>${_newWeekBanner.pts} pts</strong>. Come back stronger.</p>
      <button class="new-week-dismiss" data-dismiss-newweek aria-label="Dismiss">×</button>
    </div>` : ""}
    ${missedStreak >= 2 ? `
    <div class="comeback-banner${_viewChanged ? " comeback-banner--anim" : ""}">
      ${copy('comebackHard', missedStreak)}
    </div>` : missedStreak === 1 ? `
    <div class="comeback-banner comeback-banner--soft${_viewChanged ? " comeback-banner--anim" : ""}">
      ${copy('comebackSoft', streak)}
    </div>` : ""}
    <div class="date-nav">
      <button class="date-nav-arrow ${canGoBack?"":"disabled"}" data-date-back ${canGoBack?"":"disabled"} aria-label="Previous day" ${!canGoBack ? 'title="Only the last 3 days can be logged"' : ""}>‹</button>
      <div class="date-nav-center">
        <span class="date-nav-label ${!isToday?"date-nav-past":""}">
          ${isToday ? "Today" : formatDate(parseDate(effDate), {weekday:"short", month:"short", day:"numeric"})}
        </span>
        ${isToday && canGoBack ? `<span class="date-nav-hint">‹ tap to log a past day</span>` : ""}
      </div>
      <button class="date-nav-arrow ${canGoFwd?"":"disabled"}" data-date-fwd ${canGoFwd?"":"disabled"} aria-label="Next day">›</button>
    </div>
    ${!canGoBack && minDate === addDays(today, -3) && challenge.startDate < minDate ? `<div class="backfill-limit-hint">Logging is limited to the last 3 days</div>` : ""}
    ${!isToday ? `<div class="backfill-banner"><i class="ti ti-pencil"></i> Editing ${formatDate(parseDate(effDate),{weekday:"long"})} — changes save immediately.</div>` : ""}
    <section class="hero">
      <div class="hero-daycount">Day ${dayNumber}${totalDays ? ` / ${totalDays}` : ""}</div>
      <div class="hero-titlebar">
        <i class="ti ${challengeIcon(heroTpl)} hero-ic" aria-hidden="true"></i>
        <h1 class="hero-name">${esc(challenge.name)}</h1>
      </div>
      ${journeyPct !== null ? `<div class="journey-track"><div class="journey-fill" style="width:${journeyPct}%"></div></div>` : ""}
      <div class="hero-stats">
        ${journeyPct !== null ? `<span>${journeyPct}%</span><span class="hero-stat-dot">·</span>` : ""}
        ${streak > 0 && isToday ? `<span><i class="ti ti-flame"></i> ${streak} day ${term('streak')}</span><span class="hero-stat-dot">·</span>` : ""}
        <span>${challenge.noEndDate ? "Ongoing" : daysLeft > 0 ? daysLeft+" days left" : "Final day!"}</span>
        ${phaseInfo ? `<span class="hero-stat-dot">·</span><span>${esc(phaseInfo.phase.name)}</span>` : ""}
        ${isToday ? `<button class="link-btn hero-settings-link" data-view-challenge="${challenge.id}">Edit</button>` : ""}
      </div>
      ${isToday ? `<div class="greeting">${currentGreeting(challenge, dayNumber, streak)}</div>` : ""}
      ${isToday ? renderModeSelector(day, challenge) : ""}
    </section>
    ${phaseInfo && isToday && dayNumber === phaseInfo.phase.end && dayNumber > 1 ? `
    <div class="boss-day-callout"><div class="boss-day-callout-icon"><i class="ti ti-bolt"></i></div><div class="boss-day-callout-body"><div class="boss-day-callout-title">${term('bossDay')}</div><div class="boss-day-callout-sub">Last day of <strong>${phaseInfo.phase.name}</strong> — finish strong.</div></div></div>` : ""}

    ${(() => {
      const sched = getDaySchedule(challenge, effDate);
      if (!sched) return "";
      const typeClass = { easy:"plan-easy", tempo:"plan-tempo", long:"plan-long", interval:"plan-interval", cross:"plan-cross", rest:"plan-rest", strength:"plan-strength", wod:"plan-wod", simulate:"plan-simulate", combo:"plan-interval" }[sched.type] || "plan-easy";
      return `<div class="day-plan-banner ${typeClass}">
        <span class="dpb-emoji"><i class="ti ${scheduleIcon(sched.type)}"></i></span>
        <div>
          <div class="dpb-type">Today's Plan: ${sched.label}</div>
          <div class="dpb-desc">${sched.desc}</div>
        </div>
      </div>`;
    })()}

    <section class="today-stage panel">
      ${renderRing(info, day, streak, challenge)}
      ${isToday ? renderStreakFreezeUI(challenge) : ""}
      ${renderCompleteBanner(day, info, challenge, dayNumber, totalDays, isToday)}
    </section>

    <section>
      <div class="section-head">
        ${challenge.habits.some(h => h.type === "distance")
          ? `<div class="section-label" style="margin:0">Distance</div>`
          : `<div class="section-label" style="margin:0">Today's ${term('habitPlural')}</div>
             <div style="font-size:12px;font-weight:500;color:var(--text-dim)">${_savedFlash ? `<span class="saved-flash">Saved ✓</span>` : dayNumber === 1 && info.done === 0 ? `One ${term('habit')} is enough to begin →` : `${info.done} / ${info.total}`}</div>`}
      </div>
      <div class="habit-list">
        ${challenge.habits.map(h => renderHabit(h, day, challenge)).join("")}
      </div>
    </section>
    ${renderChallengeMetricChart(challenge)}
    ${(() => {
      if (!isToday) return "";
      const badgeHint = renderAlmostThereBadge(challenge, streak);
      return badgeHint || renderRankProgressHint();
    })()}
    ${(() => {
      // Only one nudge at a time: backup (Day 7+, no account) beats notif nudge
      if (!isToday) return "";
      if (shouldShowBackupNudge(challenge)) return renderBackupNudge(challenge);
      if (dayNumber >= 3 && !_notifNudgeDismissed && ("Notification" in window) && Notification.permission === "default") {
        return `<div class="notif-nudge" data-notif-nudge>
          <span class="notif-nudge-icon"><i class="ti ti-bell"></i></span>
          <span class="notif-nudge-text">Never miss a day — <button class="notif-nudge-link" data-request-notif-permission>enable reminders</button></span>
          <button class="notif-nudge-close" data-dismiss-notif-nudge aria-label="Dismiss">×</button>
        </div>`;
      }
      return "";
    })()}
    ${(() => {
      const tpl = challenge.templateId ? TEMPLATES.find(t=>t.id===challenge.templateId) : null;
      return challengeRouteKm(challenge) ? renderRouteProgress(challenge, tpl) : "";
    })()}
  </main>`;
}

function renderTodayAll(active) {
  const effDate = effectiveDate();
  const today = todayKey();
  const isToday = effDate === today;
  let totalDone = 0, totalHabits = 0;
  for (const c of active) {
    const day = c.days[effDate] || normalizeDay({});
    const info = completionInfo(c, day);
    totalDone += info.done;
    totalHabits += info.total;
  }
  const allPct = totalHabits ? Math.round((totalDone / totalHabits) * 100) : 0;
  return `
  <main${_viewChanged ? ` class="tab-fade-in"` : ""}>
    ${renderChallengePills(active)}
    ${isToday ? renderXPBar() : ""}
    <div class="all-today-banner">
      <div class="atb-title"><i class="ti ti-list-check"></i> All Active ${term('challengePlural')}</div>
      <div class="atb-stats">${totalDone} / ${totalHabits} ${term('habitPlural')} kept today · ${allPct}%</div>
    </div>
    ${active.map(c => {
      const day = c.days[effDate] || normalizeDay({});
      const info = completionInfo(c, day);
      const tpl  = c.templateId ? TEMPLATES.find(t => t.id === c.templateId) : null;
      const dots = c.habits
        .filter(h => h.type !== "distance")
        .map(h => `<span class="atc-dot${day.done.includes(h.id)?" atc-dot--done":""}">${day.done.includes(h.id)?"✓":"○"}</span>`)
        .join("");
      return `
      <button class="all-today-card" data-today-challenge="${c.id}">
        <div class="atc-row">
          <span class="atc-emoji"><i class="ti ${challengeIcon(tpl)}"></i></span>
          <div class="atc-info">
            <div class="atc-name">${esc(c.name)}</div>
            <div class="atc-dots">${dots}</div>
          </div>
          <div class="atc-right">
            <div class="atc-pct${info.percent===100?" atc-done":""}">${info.percent}%</div>
            <div class="atc-cta">Log →</div>
          </div>
        </div>
        <div class="cc-track"><div class="cc-fill${info.percent===100?" cc-fill--done":""}" style="width:${info.percent}%"></div></div>
      </button>`;
    }).join("")}
    ${allPct === 100 ? `
    <div class="all-done-today">
      <div class="all-done-today-icon"><i class="ti ti-trophy"></i></div>
      <div class="all-done-today-title">All done today.</div>
      <div class="all-done-today-sub">Every habit logged. Rest up — tomorrow we go again.</div>
    </div>` : ""}
  </main>`;
}

function renderChallengePills(active) {
  const today = todayKey();
  const showAll = active.length > 1;
  return `
  <div class="challenge-pills">
    ${showAll ? `<button class="c-pill ${todayChallengeId==="__all__"?"active":""}" data-today-challenge="__all__">All <span class="c-pill-pct">${active.length}</span></button>` : ""}
    ${active.map(c => {
      const totalDays  = diffDays(c.startDate, c.endDate) + 1;
      const dayNum     = challengeDayNumber(c);
      const journeyPct = clamp(Math.round((dayNum / totalDays) * 100), 0, 100);
      const todayD     = c.days[today];
      const todayInfo  = completionInfo(c, todayD || normalizeDay({}));
      const todayDot   = todayInfo.percent === 100 ? `<i class="ti ti-circle-check-filled"></i>` : todayInfo.percent > 0 ? `<i class="ti ti-circle-dot"></i>` : "";
      const isExp      = c.habits.some(h => h.type === "distance");
      const tpl        = c.templateId ? TEMPLATES.find(t => t.id === c.templateId) : null;
      const distPct    = isExp && challengeRouteKm(c)
        ? Math.min(100, Math.round((challengeTotalKm(c) / challengeRouteKm(c)) * 100))
        : null;
      const pctStr     = isExp && distPct !== null
        ? `<i class="ti ti-map-2"></i>${distPct}% <i class="ti ti-clock"></i>${journeyPct}%`
        : `${journeyPct}%`;
      return `<button class="c-pill ${c.id===todayChallengeId?"active":""}" data-today-challenge="${c.id}">
        ${todayDot}<i class="ti ${challengeIcon(tpl)}"></i> ${esc(c.name)} <span class="c-pill-pct">${pctStr}</span>
      </button>`;
    }).join("")}
  </div>`;
}

function renderNoChallenge() {
  const today = todayKey();
  const hasPast = Object.values(state.challenges).some(c => c.status !== "active");
  const upcoming = Object.values(state.challenges).filter(c => c.status === "active" && c.startDate > today);
  const isFirstTime = !hasPast && !upcoming.length;
  const theme = JOURNEY_THEMES[state.settings.journeyTheme] || JOURNEY_THEMES.frostborn;
  return `
  <main class="welcome-shell">
    <div class="welcome-logo">
      <svg viewBox="0 0 120 120" width="80" height="80">
        <defs><linearGradient id="wg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" style="stop-color:var(--primary)"/><stop offset="100%" style="stop-color:var(--secondary)"/></linearGradient></defs>
        <rect width="120" height="120" rx="28" fill="#000"/>
        <circle cx="60" cy="60" r="46" fill="none" stroke="#111" stroke-width="8"/>
        <circle cx="60" cy="60" r="46" fill="none" stroke="url(#wg)" stroke-width="8" stroke-linecap="round" stroke-dasharray="216 72" transform="rotate(-90 60 60)"/>
        <text x="60" y="60" text-anchor="middle" dominant-baseline="central" font-family="'Lato',system-ui,sans-serif" font-weight="900" font-size="56" fill="url(#wg)">C</text>
      </svg>
    </div>
    <h1 class="welcome-title">Conqur</h1>
    <p class="welcome-sub">${upcoming.length ? `Your next ${term('challenge')} starts soon.` : hasPast ? `All ${term('challengePlural')} complete. Choose your next one.` : copy('welcomeFallback')}</p>

    ${isFirstTime ? `
    <p class="welcome-desc">Conqur helps you build discipline through daily ${term('challengePlural')}, ${term('habitPlural')}, and streaks — and prove to yourself that you can follow through.</p>
    <div class="welcome-features">
      <div class="wf-item"><span class="wf-icon"><i class="ti ${OB_FEATURE_ICONS[0]}"></i></span><span class="wf-text">${term('challengePlural')} for routines, discipline, health, focus, and mindset</span></div>
      <div class="wf-item"><span class="wf-icon"><i class="ti ${OB_FEATURE_ICONS[1]}"></i></span><span class="wf-text">Daily ${term('habitPlural')} turn identity change into small wins you can repeat</span></div>
      <div class="wf-item"><span class="wf-icon"><i class="ti ${OB_FEATURE_ICONS[2]}"></i></span><span class="wf-text">${term('streak')}, ${term('badgePlural')}, ${term('restDay')}s, and ${term('weeklyReview')}s keep you honest</span></div>
      <div class="wf-item"><span class="wf-icon"><i class="ti ${OB_FEATURE_ICONS[3]}"></i></span><span class="wf-text">Works offline. No ads. Your data stays on your device.</span></div>
    </div>` : ""}

    ${upcoming.length ? `
    <div style="width:100%;max-width:320px;margin:0 auto 16px">
      ${upcoming.map(c=>`
      <button class="challenge-card" data-view-challenge="${c.id}" style="text-align:left;width:100%">
        <div class="cc-top">
          <div class="cc-emoji"><i class="ti ${challengeIcon(c.templateId ? TEMPLATES.find(t => t.id === c.templateId) : null)}"></i></div>
          <div class="cc-info">
            <div class="cc-name">${c.name}</div>
            <div class="cc-meta">Starts ${c.startDate} · ${diffDays(today, c.startDate)} day${diffDays(today,c.startDate)===1?"":"s"} away</div>
          </div>
          <div class="cc-right"><div class="cc-status" style="color:var(--text-dim)">upcoming</div></div>
        </div>
      </button>`).join("")}
    </div>` : ""}
    <button class="primary-button" style="max-width:280px;margin:0 auto" data-open-builder>
      ${hasPast || upcoming.length ? "Start New Challenge" : "Start Your First Challenge"}
    </button>
    ${isFirstTime && !CloudSync.isSignedIn ? `
    <div class="device-only-nudge">
      <span class="don-icon"><i class="ti ti-device-floppy"></i></span>
      <div>Your data lives on this device only. <button class="link-btn" data-open-settings>Create a free account</button> to back it up.</div>
    </div>` : ""}
    ${isFirstTime ? `<p class="welcome-hint">No ads. No tracking. Just you and the challenge.</p>` : ""}
  </main>`;
}

function renderRing(info, day, streak, challenge) {
  const challengePts  = challenge ? (challenge.totalPts || 0) : 0;
  const gracePip      = challenge && graceUsedYesterday(challenge);
  const isExpedition  = challenge?.habits.some(h => h.type === "distance");
  const todayKmRaw    = isExpedition ? Object.values(day.distances || {}).reduce((s,v) => s + (Number(v)||0), 0) : null;
  const totalKmNative = isExpedition ? challengeTotalKm(challenge) : null;
  const routeKm       = isExpedition ? challengeRouteKm(challenge) : null;
  // Unit conversion for ring display
  const ringDistHabit = isExpedition ? challenge.habits.find(h => h.type === "distance") : null;
  const ringIsFloors  = ringDistHabit?.unit === "floors";
  const ringDUnit     = ringIsFloors ? "floors" : (state.settings.units.distance === "miles" ? "mi" : "km");
  const ringFactor    = ringDUnit === "mi" ? 0.621371 : 1;
  const todayKmD      = todayKmRaw !== null ? Math.round(todayKmRaw * ringFactor * 100) / 100 : null;
  const totalKmD      = totalKmNative !== null ? Math.round(totalKmNative * ringFactor * 10) / 10 : null;
  const isPerfect = !isExpedition && day.mode !== "rest" && info.percent >= 100;
  return `
  <div class="ring-wrap ${day.mode==="rest"?"rest":""}${isPerfect?" perfect":""}">
    <svg class="progress-ring" viewBox="0 0 220 220" aria-hidden="true">
      <defs>
        <linearGradient id="ring-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" style="stop-color:var(--primary)"/>
          <stop offset="100%" style="stop-color:var(--secondary)"/>
        </linearGradient>
        <linearGradient id="nav-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" style="stop-color:var(--primary)"/>
          <stop offset="100%" style="stop-color:var(--secondary)"/>
        </linearGradient>
      </defs>
      <circle class="ring-track" cx="110" cy="110" r="90"/>
      <circle class="ring-value ${day.mode==="rest"?"rest-mode":""}" cx="110" cy="110" r="90" data-percent="${info.percent}"/>
    </svg>
    <div class="ring-center">
      ${day.mode === "rest"
        ? `<div class="percent" style="font-size:2.2rem"><i class="ti ti-moon"></i></div><div class="ring-pts" style="font-size:11px;color:var(--text-dim)">recovery day</div>`
        : isExpedition
          ? `<div class="percent" style="font-size:${todayKmD > 0 ? "1.6rem" : "2rem"}">${todayKmD > 0 ? todayKmD.toFixed(ringIsFloors?0:1) : "—"}</div><div class="ring-pts" style="font-size:11px;color:var(--text-dim)">${todayKmD > 0 ? ringDUnit+" today" : "log "+ringDUnit}</div>`
          : `<div class="percent">${info.percent}%</div><div class="ring-pts">${info.points}<span class="ring-pts-max">/${info.maxPoints}</span><span class="ring-pts-label"> XP</span></div>`
      }
    </div>
  </div>
  <div class="ring-stats">
    ${isExpedition ? `
    <div class="ring-stat">
      <div class="ring-stat-value">${totalKmD !== null ? totalKmD.toFixed(ringIsFloors?0:1) : "0"}<span class="ring-stat-sub"> ${ringDUnit}</span></div>
      <div class="ring-stat-label">total distance</div>
    </div>
    <div class="ring-stat">
      <div class="ring-stat-value">${routeKm ? Math.min(100,Math.round((totalKmNative/routeKm)*100)) : "—"}<span class="ring-stat-sub">${routeKm ? "%" : ""}</span></div>
      <div class="ring-stat-label">route done</div>
    </div>` : `
    <div class="ring-stat">
      <div class="ring-stat-value">${info.done}<span class="ring-stat-sub">/${info.total}</span></div>
      <div class="ring-stat-label">${term('habitPlural').toLowerCase()}</div>
    </div>
    <div class="ring-stat">
      <div class="ring-stat-value">${challengePts}</div>
      <div class="ring-stat-label">XP</div>
    </div>`}
    <div class="ring-stat">
      <div class="ring-stat-value${streak>=7?' streak-hero':''}">${streak}${gracePip?`<span style="font-size:10px;color:var(--warning);margin-left:2px" title="Grace day used yesterday — don't miss today!"><i class="ti ti-lifebuoy"></i></span>`:""}${streak>=7?` <i class="ti ti-flame"></i>`:""}</div>
      <div class="ring-stat-label">day ${term('streak')}${gracePip?`<span style="display:block;font-size:9px;color:var(--warning)">grace used</span>`:""}</div>
      ${challenge && getStreakMultiplier(challenge) > 1.0 ? `<div class="ring-mult-chip">${getStreakMultiplier(challenge).toFixed(2).replace(/\.?0+$/,"")}× XP</div>` : ""}
    </div>
  </div>
  ${isPerfect ? `<div class="perfect-day-chip"><i class="ti ti-circle-check"></i> PERFECT DAY</div>` : ""}
  ${day.comebackBonus ? `<div class="perfect-day-chip comeback-chip"><i class="ti ti-flame"></i> COMEBACK DAY</div>` : ""}`;
}

function renderStreakFreezeUI(challenge) {
  const freezes = challenge.streakFreezes || 0;
  const yesterday = addDays(todayKey(), -1);
  const yDay = challenge.days[yesterday];
  const yesterdayUnlogged = !dayLogged(yDay) && yesterday >= challenge.startDate;
  if (freezes === 0) return "";
  return `
  <div class="freeze-bar">
    <span class="freeze-bar-label"><i class="ti ti-snowflake"></i> ${freezes} streak freeze${freezes > 1 ? "s" : ""}</span>
    ${yesterdayUnlogged
      ? `<button class="pill-btn" data-use-freeze>Protect streak</button>`
      : `<span class="freeze-bar-hint">Ready if you miss a day</span>`}
  </div>`;
}

function renderModeSelector(day, challenge) {
  const template        = challenge?.templateId ? TEMPLATES.find(t => t.id === challenge.templateId) : null;
  const noRestDay       = !!(template?.noRestDay);
  const schedule        = getDaySchedule(challenge, effectiveDate());
  const isScheduledRest = schedule?.type === "rest";
  const jokerBudget     = challenge?.jokerBudget ?? 3;
  const todayIsRest     = day.mode === "rest";
  // Only count user-chosen rest days (not scheduled ones) against the joker budget
  const jokersUsed      = Object.values(challenge?.days || {}).filter(d => d.mode === "rest" && !d.scheduledRest).length;
  const budgetExhausted = !todayIsRest && !isScheduledRest && jokersUsed >= jokerBudget;
  const jokersLeft      = Math.max(0, jokerBudget - jokersUsed);

  // Compact single-line chip row
  if (noRestDay) {
    return `<div class="mode-chip-row"><button class="mode-chip mode-chip--active" data-mode="rest" title="No ${term('restDay')}s on this ${term('challenge')}"><i class="ti ti-target"></i> Standard Day <span class="mode-chip-no-rest">· no ${term('restDay')}s</span></button></div>`;
  }
  if (isScheduledRest) {
    const restLabel = todayIsRest ? `<i class="ti ti-moon"></i> Scheduled Recovery — active` : `<i class="ti ti-moon"></i> Scheduled Recovery (free)`;
    return `
  <div class="mode-chip-row">
    <button class="mode-chip ${!todayIsRest ? "mode-chip--active" : ""}" data-mode="standard"><i class="ti ti-run"></i> Work out anyway</button>
    <button class="mode-chip mode-chip--rest ${todayIsRest ? "mode-chip--rest-active" : "mode-chip--scheduled-rest"}" data-mode="rest">${restLabel}</button>
  </div>`;
  }
  const restLabel = todayIsRest
    ? `<i class="ti ti-moon"></i> ${term('restDay')} — active`
    : budgetExhausted
      ? `<i class="ti ti-moon"></i> ${term('restDay')} · none left`
      : `<i class="ti ti-moon"></i> ${term('restDay')} · ${jokersLeft} flex ${jokersLeft === 1 ? "day" : "days"} left`;
  const restDisabled = budgetExhausted ? "mode-chip--disabled" : "";
  const activeChip   = todayIsRest ? "mode-chip--rest-active" : "mode-chip--active";
  return `
  <div class="mode-chip-row">
    <button class="mode-chip ${!todayIsRest ? activeChip : ""}" data-mode="standard"><i class="ti ti-target"></i> Standard</button>
    <button class="mode-chip mode-chip--rest ${todayIsRest ? "mode-chip--rest-active" : ""} ${restDisabled}" data-mode="rest" ${budgetExhausted ? 'aria-disabled="true"' : ""}>${restLabel}</button>
  </div>`;
}

function renderHabit(habit, day, challenge) {
  if (habit.type === "tiered")      return renderTieredHabit(habit, day, challenge);
  if (habit.type === "distance")    return renderDistanceHabit(habit, day, challenge);
  if (habit.type === "measurement") return renderMeasurementHabit(habit, day);
  const locked  = day.mode==="rest";
  const checked = day.done.includes(habit.id);
  const popping = _animHabitId === habit.id;
  // Photo habits get a camera capture button alongside the checkbox
  const isPhoto = !locked && (habit.id === "photo" || /progress\s*photo/i.test(habit.title));
  if (isPhoto) {
    return `
  <div class="habit-card photo-habit-card ${checked?"checked":""} ${popping?"habit-pop":""}">
    <span class="accent"></span>
    <span class="habit-emoji">${esc(habit.emoji)}</span>
    <span class="habit-info">
      <span class="habit-title">${esc(habit.title)}</span>
      <span class="habit-quip">${checked ? "Photo logged ✓" : esc(habit.quip)}</span>
    </span>
    <div class="photo-habit-actions">
      <button class="camera-btn" data-capture-photo="${habit.id}" aria-label="Take progress photo">📷</button>
      <button class="check-circle ${checked?"":"check-hollow"}" data-habit="${habit.id}" aria-label="Mark done">${checked?"✓":""}</button>
    </div>
  </div>`;
  }
  return `
  <button class="habit-card ${checked?"checked":""} ${locked?"locked":""} ${popping?"habit-pop":""}" data-habit="${habit.id}" ${locked?`aria-disabled="true"`:""}>
    <span class="accent"></span>
    <span class="habit-emoji">${locked?"🔒":esc(habit.emoji)}</span>
    <span class="habit-info">
      <span class="habit-title">${esc(habit.title)}</span>
      <span class="habit-quip">${locked?`${term('restDay')} — recover well.`:esc(habit.quip)}</span>
    </span>
    <span class="check-circle">${checked?"✓":""}</span>
  </button>`;
}

function renderTieredHabit(habit, day, challenge) {
  const locked  = day.mode==="rest";
  const checked = day.done.includes(habit.id);
  const selVal  = day.tiers?.[habit.id] ?? null;
  if (locked) return `
  <div class="habit-card locked" aria-disabled="true">
    <span class="accent"></span>
    <span class="habit-emoji">🔒</span>
    <span class="habit-info">
      <span class="habit-title">${esc(habit.title)}</span>
      <span class="habit-quip">${term('restDay')} — recover well.</span>
    </span>
    <span class="check-circle"></span>
  </div>`;
  const popping = _animHabitId === habit.id;
  return `
  <div class="habit-card run-habit ${checked?"checked":""} ${popping?"habit-pop":""}">
    <span class="accent"></span>
    <span class="habit-emoji">${esc(habit.emoji)}</span>
    <div class="run-body">
      <span class="habit-title">${esc(habit.title)}</span>
      <div class="run-distances">
        ${habit.tiers.map((t, i) => { const tv = t.value ?? i; return `<button class="run-dist ${String(selVal)===String(tv)?"active":""}" data-tier="${habit.id}" data-tier-val="${tv}">${t.label}</button>`; }).join("")}
      </div>
      ${!checked ? `<span class="tier-hint">Tap to log</span>` : ""}
    </div>
    <span class="check-circle">${checked && selVal != null ? (tierPoints(habit,selVal)+"pts") : checked ? "✓" : ""}</span>
  </div>`;
}

function renderDistanceHabit(habit, day, challenge) {
  const locked    = day.mode === "rest";
  const storedVal = day.distances?.[habit.id] ?? 0; // always in habit's native unit
  const habitUnit = habit.unit || "km";
  const isFloors  = habitUnit === "floors";
  // For km-type habits: respect the global distance unit setting
  const MI_PER_KM  = 0.621371;
  const KM_PER_MI  = 1.60934;
  const globalDist = state.settings.units.distance || "km";
  const displayUnit = isFloors ? "floors" : (globalDist === "miles" ? "mi" : "km");
  // Convert stored km → display unit for input value
  const displayVal = isFloors ? Math.round(storedVal) :
    (displayUnit === "mi" ? Math.round(storedVal * MI_PER_KM * 100) / 100 : storedVal);

  const cRouteKm  = challenge ? challengeRouteKm(challenge) : null;
  const totalNative  = cRouteKm ? challengeTotalKm(challenge) : 0;
  // Convert totals to display units for quip text
  const totalDisplay = isFloors ? totalNative :
    (displayUnit === "mi" ? Math.round(totalNative * MI_PER_KM * 10) / 10 : totalNative);
  const routeDisplay = cRouteKm
    ? (isFloors ? cRouteKm : (displayUnit === "mi" ? Math.round(cRouteKm * MI_PER_KM * 10) / 10 : cRouteKm))
    : null;
  const remaining = routeDisplay !== null ? Math.max(0, routeDisplay - totalDisplay) : null;

  if (locked) return `
  <div class="habit-card locked" aria-disabled="true">
    <span class="accent"></span>
    <span class="habit-emoji">🔒</span>
    <span class="habit-info">
      <span class="habit-title">${esc(habit.title)}</span>
      <span class="habit-quip">${term('restDay')} — recover well.</span>
    </span>
    <span class="check-circle"></span>
  </div>`;
  const checked = day.done.includes(habit.id);
  const quip = checked
    ? `${displayVal} ${displayUnit} logged today`
    : remaining !== null && remaining === 0
      ? `${isFloors ? "Summit" : "Route"} complete!`
      : remaining !== null
        ? `${remaining.toFixed(1)} ${displayUnit} left`
        : esc(habit.quip);
  return `
  <div class="habit-card distance-habit-card ${checked?"checked":""}">
    <span class="accent"></span>
    <span class="habit-emoji">${esc(habit.emoji)}</span>
    <div class="habit-info">
      <span class="habit-title">${esc(habit.title)}</span>
      <span class="habit-quip">${quip}</span>
    </div>
    <div class="distance-input-wrap">
      <input type="number" class="distance-input" data-distance-habit="${habit.id}"
        value="${displayVal > 0 ? displayVal : ""}" min="0" max="99999"
        step="${isFloors ? "1" : "0.1"}" placeholder="0"
        inputmode="decimal" aria-label="Distance in ${displayUnit}">
      ${isFloors
        ? `<span class="distance-unit">floors</span>`
        : `<select class="dist-unit-sel" data-dist-unit-sel="${habit.id}" aria-label="Unit">
             <option value="km" ${displayUnit==="km"?"selected":""}>km</option>
             <option value="mi" ${displayUnit==="mi"?"selected":""}>mi</option>
           </select>`}
    </div>
    ${isFloors ? `<div class="floor-steppers">
      <button class="floor-step-btn" data-floor-step="${habit.id}" data-step="1">+1</button>
      <button class="floor-step-btn" data-floor-step="${habit.id}" data-step="5">+5</button>
      <button class="floor-step-btn" data-floor-step="${habit.id}" data-step="10">+10</button>
    </div>` : ""}
  </div>`;
}

function renderMeasurementHabit(habit, day) {
  const locked   = day.mode === "rest";
  const rawUnit  = habit.unit || "";
  // "weight" is a sentinel — resolve to the user's weight unit setting
  const unit     = rawUnit === "weight" ? (state.settings.units.weight || "kg") : rawUnit;
  const decimals = typeof habit.decimals === "number" ? habit.decimals : 1;
  const stored   = day.distances?.[habit.id] ?? 0;

  if (locked) return `
  <div class="habit-card locked" aria-disabled="true">
    <span class="accent"></span>
    <span class="habit-emoji">🔒</span>
    <span class="habit-info">
      <span class="habit-title">${esc(habit.title)}</span>
      <span class="habit-quip">${term('restDay')} — recover well.</span>
    </span>
    <span class="check-circle"></span>
  </div>`;

  const checked = day.done.includes(habit.id);
  const refRange = UNIT_RANGES[unit] || null;
  const quip = checked
    ? `${stored.toFixed(decimals)} ${unit} logged ✓`
    : refRange ? refRange : esc(habit.quip);

  return `
  <div class="habit-card measurement-habit-card ${checked?"checked":""}">
    <span class="accent"></span>
    <span class="habit-emoji">${esc(habit.emoji)}</span>
    <div class="habit-info">
      <span class="habit-title">${esc(habit.title)}</span>
      <span class="habit-quip">${quip}</span>
    </div>
    <div class="measurement-input-wrap">
      <input type="number" class="measurement-input" data-measurement-habit="${habit.id}"
        value="${stored > 0 ? stored.toFixed(decimals) : ""}" min="0" max="99999"
        step="${decimals === 0 ? "1" : "0.1"}" placeholder="—"
        inputmode="decimal" aria-label="${esc(habit.title)} in ${unit}">
      <span class="measurement-unit">${esc(unit)}</span>
    </div>
  </div>`;
}

function renderRouteProgress(challenge, template) {
  const totalNative = challengeTotalKm(challenge); // always in native units (km or floors)
  const routeNative = template?.routeKm ?? challenge.routeKm;
  const distHabit   = challenge.habits.find(h => h.type === "distance");
  const habitUnit   = distHabit?.unit || "km";
  const isFloors    = habitUnit === "floors";
  const MI_PER_KM   = 0.621371;
  const globalDist  = state.settings.units.distance || "km";
  const displayUnit = isFloors ? "floors" : (globalDist === "miles" ? "mi" : "km");
  const factor      = (displayUnit === "mi") ? MI_PER_KM : 1;
  const totalDisplay = Math.round(totalNative * factor * 10) / 10;
  const routeDisplay = Math.round(routeNative * factor * 10) / 10;
  const pct      = Math.min(100, Math.round((totalNative / routeNative) * 100));
  const remaining = Math.max(0, routeDisplay - totalDisplay);
  const milestones = template?.milestones ?? [];
  const reached = [...milestones].reverse().find(m => totalNative >= m.km);
  const next    = milestones.find(m => totalNative < m.km);
  const markers = milestones.map(m => {
    const mPct = Math.round((m.km / routeNative) * 100);
    const done  = totalNative >= m.km;
    const mDisplay = Math.round(m.km * factor * 10) / 10;
    return `<div class="route-milestone-dot ${done?"done":""}" style="left:${mPct}%" title="${m.name} (${mDisplay} ${displayUnit})"></div>`;
  }).join("");
  return `
  <section class="route-progress-section panel">
    <div class="route-progress-header">
      <span class="route-progress-name">${template?.emoji ?? challenge.emoji} ${template?.name ?? challenge.name}</span>
      <span class="route-progress-km">${isFloors ? Math.round(totalDisplay) : totalDisplay.toFixed(1)} <span style="font-weight:500;color:var(--text-dim)">/ ${isFloors ? Math.round(routeDisplay).toLocaleString() : routeDisplay.toLocaleString()} ${displayUnit}</span></span>
    </div>
    <div class="route-progress-track">
      <div class="route-progress-fill" style="width:${pct}%"></div>
      ${markers}
    </div>
    <div class="route-pace">
      ${remaining > 0
        ? `${isFloors ? Math.round(remaining) : remaining.toFixed(1)} ${displayUnit} remaining${next ? ` · next: ${next.emoji} ${next.name}` : ""}`
        : `${isFloors ? "Summit reached" : "Route complete"}! You conquered ${template.name}.`}
    </div>
    ${reached && totalNative > 0 ? `
    <div class="route-milestone-banner">
      <span class="rmb-emoji">${reached.emoji}</span>
      <div>
        <div class="rmb-title">${reached.name}</div>
        <div class="rmb-sub">${Math.round(reached.km * factor * 10) / 10} ${displayUnit} checkpoint reached</div>
      </div>
    </div>` : ""}
  </section>`;
}

function renderWeightWidget() {
  const entries = state.bodyTracking.entries;
  if (!entries.length) return "";
  const latest = entries[entries.length-1];
  const sw = state.bodyTracking.startWeight;
  const gw = state.bodyTracking.goalWeight;
  const unit = state.settings.units.weight;
  const lost = sw ? parseFloat((sw-latest.weight).toFixed(1)) : null;
  const pct  = (sw&&gw&&sw>gw) ? clamp(Math.round(((sw-latest.weight)/(sw-gw))*100),0,100) : null;
  const toGoal = (gw&&latest.weight>gw) ? parseFloat((latest.weight-gw).toFixed(1)) : 0;
  const lostText = lost===null?"":lost>0?`↓ ${lost} ${unit} lost`:lost<0?`↑ ${Math.abs(lost)} ${unit} gained`:"Holding steady";
  return `
  <div class="weight-widget">
    <div class="ww-left">
      <div class="ww-value">${latest.weight}<span class="ww-unit"> ${unit}</span></div>
      <div class="ww-label">current weight</div>
    </div>
    <div class="ww-right">
      ${lost!==null?`<div class="ww-lost ${lost>0?"ww-good":lost<0?"ww-bad":""}">${lostText}</div>`:""}
      ${pct!==null?`<div class="ww-track"><div class="ww-fill" style="width:${pct}%"></div></div>
        <div class="ww-goal">${toGoal>0?`${toGoal} ${unit} to go`:'<i class="ti ti-target"></i> Goal reached!'}</div>`:""}
    </div>
  </div>`;
}

function renderTodayWeightLog() {
  const today = todayKey();
  if (state.bodyTracking.entries.some(e => e.date === today)) return "";
  const unit = state.settings.units.weight;
  return `
  <div class="today-weight-log">
    <div class="twl-label">⚖️ Log today's weight</div>
    <div class="twl-row">
      <input id="twl-weight" type="number" step="0.1" inputmode="decimal" placeholder="${unit==="lbs"?"185.0":"84.0"}" class="twl-input">
      <span class="twl-unit">${unit}</span>
      <button class="pill-btn" data-log-today-weight>Log</button>
    </div>
  </div>`;
}


function renderCompleteBanner(day, info, challenge, dayNumber, totalDays, isToday) {
  if (info.done!==info.total || info.total===0) return "";
  const isExpedition = challenge?.habits.some(h => h.type === "distance");
  if (day.mode==="rest") return `<div class="complete-banner rest-complete"><span class="cb-icon"><i class="ti ti-moon"></i></span><div class="cb-body"><div class="cb-title">${term('restDay')}</div><div class="cb-sub">Recovery is part of the work.</div></div></div>`;
  if (isExpedition) {
    const distHabit  = challenge.habits.find(h => h.type === "distance");
    const habitUnit  = distHabit?.unit || "km";
    const isFloors   = habitUnit === "floors";
    const MI_PER_KM  = 0.621371;
    const globalDist = state.settings.units.distance || "km";
    const dUnit      = isFloors ? "floors" : (globalDist === "miles" ? "mi" : "km");
    const factor     = (dUnit === "mi") ? MI_PER_KM : 1;
    const todayNative = Object.values(day.distances || {}).reduce((s,v) => s + (Number(v)||0), 0);
    const totalNative = challengeTotalKm(challenge);
    const remNative   = challengeRouteKm(challenge) ? Math.max(0, challengeRouteKm(challenge) - totalNative) : null;
    const todayD = Math.round(todayNative * factor * 10) / 10;
    const totalD = Math.round(totalNative * factor * 10) / 10;
    const remD   = remNative !== null ? Math.round(remNative * factor * 10) / 10 : null;
    const sub = remD !== null
      ? `${totalD.toFixed(1)} ${dUnit} covered · ${remD.toFixed(1)} ${dUnit} to go`
      : `${totalD.toFixed(1)} ${dUnit} covered`;
    return `<div class="complete-banner"><span class="cb-icon"><i class="ti ti-map-2"></i></span><div class="cb-body"><div class="cb-title">${todayD.toFixed(isFloors?0:1)} ${dUnit} today</div><div class="cb-sub">${sub}</div></div></div>`;
  }
  const currentStreak = challenge ? calcChallengeStreak(challenge) : 0;
  const streakShare = currentStreak >= 2 ? `<button class="cb-share-btn" data-share-streak><i class="ti ti-share"></i> Share streak</button>` : "";
  const firstHabit = challenge?.habits[0];
  const tomorrowHook = isToday && dayNumber && totalDays && dayNumber < totalDays
    ? `<div class="cb-tomorrow">Tomorrow: ${firstHabit ? esc(firstHabit.title) : "Day "+(dayNumber+1)} · ${currentStreak+1}-day ${term('streak')} <i class="ti ti-flame"></i></div>`
    : "";
  if (day.comebackBonus) {
    return `<div class="complete-banner"><span class="cb-icon"><i class="ti ti-flame"></i></span><div class="cb-body"><div class="cb-title">Comeback. Day ${dayNumber||""} is done.</div><div class="cb-sub">That's what resilience looks like · ${info.points} XP</div>${tomorrowHook}${streakShare}</div></div>`;
  }
  const tpl = challenge?.templateId ? TEMPLATES.find(t => t.id === challenge.templateId) : null;
  const cat = tpl?.category || "transformation";
  const copyLines = COMPLETE_COPY[cat] || COMPLETE_COPY.transformation;
  const seed = parseInt((day.date || todayKey()).replace(/-/g,"")) || 0;
  const copy = copyLines[seed % copyLines.length];
  return `<div class="complete-banner"><span class="cb-icon"><i class="ti ti-flame"></i></span><div class="cb-body"><div class="cb-title">${copy}${dayNumber ? ` Day ${dayNumber} done.` : ""}</div><div class="cb-sub">All ${term('habitPlural')} kept · ${info.points} XP</div>${tomorrowHook}${streakShare}</div></div>`;
}

function renderXPBar() {
  const info    = getLevelInfo(state.xp);
  const isMax   = !info.next;
  const toNext  = isMax ? 0 : info.next.xp - state.xp;
  const c       = currentChallenge();
  const freezes = c ? (c.streakFreezes || 0) : 0;
  const todayDay = c?.days[todayKey()];
  const mult     = todayDay?.streakMult ?? (c ? getStreakMultiplier(c) : 1);
  const multLabel = mult >= 1.40 ? `<i class="ti ti-flame"></i> +40% ${term('streak')} bonus active` : mult >= 1.25 ? `<i class="ti ti-flame"></i> +25% ${term('streak')} bonus active` : mult >= 1.15 ? `<i class="ti ti-flame"></i> +15% ${term('streak')} bonus active` : mult >= 1.10 ? `<i class="ti ti-flame"></i> +10% ${term('streak')} bonus active` : null;
  return `
  <div class="xp-bar-wrap">
    <div class="xp-bar-header">
      <span class="xp-level-badge"><i class="ti ti-bolt"></i> ${term('level')} ${info.level} <span class="xp-level-name">${info.name}</span></span>
      <div style="display:flex;align-items:center;gap:8px">
        ${freezes > 0 ? `<span class="xp-freeze-badge" title="Streak freezes — use one to protect a missed day"><i class="ti ti-snowflake"></i> ${freezes}</span>` : ""}
        <span class="xp-bar-to-next">${isMax ? `Max ${term('level')}` : (() => { const avg = avgDailyXP(); const d = avg ? `~${Math.ceil(toNext/avg)}d` : null; return `${toNext.toLocaleString()} XP to ${term('level')} ${info.next.level}${d?` · ${d}`:""}` })()}</span>
      </div>
    </div>
    <div class="xp-bar-track" role="progressbar" aria-valuenow="${info.pct}" aria-valuemin="0" aria-valuemax="100">
      <div class="xp-bar-fill" style="width:${info.pct}%"></div>
    </div>
    <div class="xp-bar-explainer">${multLabel || `XP builds your ${term('level')} forever`}</div>
  </div>`;
}


// ── Weekly Recap (Sunday card) ────────────────────────────────────────────

function renderWeeklyRecap(challenge) {
  if (state.weeklyRecapDismissed?.[challenge.id] === todayKey()) return "";  // already dismissed today
  const todayK = todayKey();
  const weeks = challengeWeeks(challenge);
  const curWeekIdx = weeks.findIndex(w => w.allDays.includes(todayK));
  if (curWeekIdx <= 0) return "";                              // no completed week yet
  const lastWeek = weeks[curWeekIdx - 1];
  const pts = lastWeek.allDays.reduce((sum,k) => {
    const d = challenge.days[k]; return sum + (d ? completionInfo(challenge,d).points : 0);
  }, 0);
  const logged = lastWeek.allDays.filter(k => { const d=challenge.days[k]; return d&&(d.done.length||d.recovered); }).length;
  const streak = calcChallengeStreak(challenge);
  // Week-over-week delta
  const prevWeek = curWeekIdx >= 2 ? weeks[curWeekIdx - 2] : null;
  const prevPts  = prevWeek ? prevWeek.allDays.reduce((sum,k) => {
    const d = challenge.days[k]; return sum + (d ? completionInfo(challenge,d).points : 0);
  }, 0) : null;
  const delta = prevPts != null ? pts - prevPts : null;
  const deltaStr = delta == null ? "" :
    delta > 0 ? `<span class="wrc-delta up">↑ +${delta} vs last week</span>` :
    delta < 0 ? `<span class="wrc-delta down">↓ ${delta} vs last week</span>` :
                `<span class="wrc-delta flat">= same as last week</span>`;
  const isExpedition = challenge.habits.some(h => h.type === "distance");
  const distHabitR   = isExpedition ? challenge.habits.find(h => h.type === "distance") : null;
  const isFloorsR    = distHabitR?.unit === "floors";
  const weekKm = isExpedition ? lastWeek.allDays.reduce((s,k) => {
    const d = challenge.days[k];
    if (!d?.distances) return s;
    return s + Object.values(d.distances).reduce((ss,km) => ss + (Number(km)||0), 0);
  }, 0) : null;
  const weekDistLabel = isFloorsR ? Math.round(weekKm) : weekKm?.toFixed(1);
  const weekDistUnit  = isFloorsR ? "floors" : "km";
  const lastWeekGoal = isExpedition ? null : goalForWeek(challenge, curWeekIdx - 1);
  const goalMetLast  = lastWeekGoal != null && pts >= lastWeekGoal;
  const thisWeekGoal = isExpedition ? null : goalForWeek(challenge, curWeekIdx);
  const msgs = ["Progress compounds. Keep stacking.", "New week, fresh start. Let's go.", "Every logged day is a win.", "Last week was strong. Build on it.", "Momentum is real — keep it going."];
  const msg = msgs[new Date().getDate() % msgs.length];
  return `
  <div class="weekly-recap-card">
    <div class="wrc-top">
      <div class="wrc-title"><i class="ti ti-clipboard-list"></i> ${term('weeklyReview')} — Week ${lastWeek.num}</div>
      <button class="wrc-dismiss" data-dismiss-weekly-recap="${challenge.id}" aria-label="Dismiss">×</button>
    </div>
    <div class="wrc-stats">
      ${isExpedition
        ? `<div class="wrc-stat"><span class="wrc-val">${weekDistLabel}</span><span class="wrc-lbl">${weekDistUnit}</span></div>`
        : `<div class="wrc-stat"><span class="wrc-val">${pts}${lastWeekGoal ? `<span class="wrc-goal-sub">/${lastWeekGoal}</span>` : ""}</span><span class="wrc-lbl">XP</span></div>`}
      <div class="wrc-sep"></div>
      <div class="wrc-stat"><span class="wrc-val">${logged}/${lastWeek.allDays.length}</span><span class="wrc-lbl">days</span></div>
      <div class="wrc-sep"></div>
      <div class="wrc-stat"><span class="wrc-val">${streak}</span><span class="wrc-lbl">${term('streak')}</span></div>
    </div>
    ${lastWeekGoal ? `<div class="wrc-goal-row${goalMetLast ? " wrc-goal-met" : ""}"><i class="ti ti-target"></i> ${goalMetLast ? "Weekly goal hit!" : `${pts}/${lastWeekGoal} XP — ${Math.round(pts/lastWeekGoal*100)}% of goal`}${thisWeekGoal && thisWeekGoal !== lastWeekGoal ? ` · Week ${curWeekIdx + 1} target: ${thisWeekGoal} XP` : ""}</div>` : ""}
    ${deltaStr ? `<div class="wrc-delta-row">${deltaStr}</div>` : ""}
    <div class="wrc-msg">${msg}</div>
  </div>`;
}


// ── Challenge Suggestions (post-completion) ───────────────────────────────

function suggestNextChallenges(c) {
  const finishedId = c.templateId;
  // Check challenge chain first
  const chainNextId = finishedId && CHALLENGE_CHAINS[finishedId];
  const chainNextRaw = chainNextId ? TEMPLATES.find(t => t.id === chainNextId) : null;
  const chainNext   = isConqurTemplate(chainNextRaw) ? chainNextRaw : null;
  const cat  = TEMPLATES.find(t => t.id === finishedId)?.category;
  const pool = TEMPLATES.filter(t => t.id !== finishedId && t.id !== chainNextId && isConqurTemplate(t));
  const sameCat = pool.filter(t => t.category === cat);
  const extras  = pickRandom(sameCat.length ? sameCat : pool, chainNext ? 1 : 2);
  return chainNext ? [chainNext, ...extras] : extras;
}

function renderCompletionSuggestions(c) {
  const chainNextId = c.templateId && CHALLENGE_CHAINS[c.templateId];
  // Exclude the chain template — it's already featured prominently above
  let sugs = suggestNextChallenges(c).filter(t => t.id !== chainNextId);
  if (!sugs.length) return "";
  return `
  <div class="completion-suggestions">
    <div class="cs-label">You might also like</div>
    ${sugs.map(t => `
    <button class="cs-card" data-start-suggested="${t.id}">
      <span class="cs-emoji">${t.emoji}</span>
      <div class="cs-info">
        <div class="cs-name">${t.name}</div>
        <div class="cs-meta">${t.duration}d · ${t.category}</div>
      </div>
      <span class="cs-arrow">→</span>
    </button>`).join("")}
  </div>`;
}

// ── Personal Bests ────────────────────────────────────────────────────────

function computePersonalBests() {
  const all = getAllChallenges();
  let longestStreak = 0, bestWeekPts = 0, totalHabits = 0, totalDays = 0;
  for (const c of all) {
    const streak = (c.status==="completed"||c.status==="failed") && c.finalStreak!=null
      ? c.finalStreak : calcChallengeStreak(c);
    if (streak > longestStreak) longestStreak = streak;
    for (const w of challengeWeeks(c)) {
      const wpts = w.days.reduce((sum,k) => { const d=c.days[k]; return sum+(d?completionInfo(c,d).points:0); }, 0);
      if (wpts > bestWeekPts) bestWeekPts = wpts;
    }
    for (const d of Object.values(c.days)) {
      totalHabits += d.done.length;
      if (d.done.length > 0 || d.recovered) totalDays++;
    }
  }
  return { longestStreak, bestWeekPts, totalHabits, totalDays };
}

function renderPersonalBests() {
  const all = getAllChallenges();
  if (!all.length) return "";
  const pb = computePersonalBests();
  if (pb.totalHabits === 0) return "";
  return `
  <div class="section-label" style="margin-top:8px">Personal Bests</div>
  <div class="pb-grid">
    ${pbCard(`<i class="ti ti-flame"></i> Longest ${term('streak')}`,   pb.longestStreak, "days")}
    ${pbCard('<i class="ti ti-bolt"></i> Best Week',       pb.bestWeekPts,   "XP")}
    ${pbCard(`<i class="ti ti-check"></i> ${term('habitPlural')} Kept`,     pb.totalHabits,   "")}
    ${pbCard('<i class="ti ti-calendar"></i> Days Shown Up', pb.totalDays,   "")}
  </div>`;
}

function pbCard(label, value, unit) {
  return `<div class="pb-card">
    <div class="pb-label">${label}</div>
    <div class="pb-value">${value}${unit ? `<span class="pb-unit"> ${unit}</span>` : ""}</div>
  </div>`;
}


function shareAchievement(text) {
  if (navigator.share) {
    navigator.share({ title: "Conqur", text }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(text).then(() => showToast("Copied to clipboard!")).catch(() => showToast(text));
  }
}

function showShareModal(challenge, isDone) {
  _shareModalChallenge = challenge;
  _shareModalDone = !!isDone;
  _shareCardDataUrl = drawShareCard(challenge, !!isDone).toDataURL("image/png");
  render();
}

function drawShareCard(challenge, isDone) {
  const s = 1080;
  const canvas = document.createElement("canvas");
  canvas.width  = s;
  canvas.height = s;
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#07111F";
  ctx.fillRect(0, 0, s, s);

  // Gradient accent bar top
  const cs = getComputedStyle(document.documentElement);
  const grad = ctx.createLinearGradient(0, 0, s, 0);
  grad.addColorStop(0, cs.getPropertyValue("--primary").trim()   || "#38BDF8");
  grad.addColorStop(1, cs.getPropertyValue("--secondary").trim() || "#7DD3FC");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, s, 10);

  // Challenge emoji
  ctx.font      = `${Math.round(s * 0.12)}px serif`;
  ctx.textAlign = "center";
  ctx.fillText(challenge.emoji || "🏆", s / 2, s * 0.25);

  // Quest name
  ctx.fillStyle = "#F1F5F9";
  ctx.font      = `700 ${Math.round(s * 0.065)}px 'Arial', sans-serif`;
  ctx.fillText(challenge.name, s / 2, s * 0.38);

  // Stats pill
  const streak     = calcChallengeStreak(challenge);
  const totalPts   = Object.values(challenge.days).reduce((a, d) => a + (d.pts || 0), 0);
  const dayNum     = challengeDayNumber(challenge);
  const totalDays  = diffDays(challenge.startDate, challenge.endDate) + 1;

  const statLine = isDone
    ? `${totalDays} days · ${totalPts} XP · ${streak}-day ${term('streak')}`
    : `Day ${dayNum} · ${streak}-day ${term('streak')} · ${totalPts} XP`;

  // Pill background
  const pillW = s * 0.78, pillH = s * 0.085, pillX = (s - pillW) / 2, pillY = s * 0.44;
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  const pr = pillH / 2;
  ctx.beginPath();
  ctx.moveTo(pillX + pr, pillY);
  ctx.lineTo(pillX + pillW - pr, pillY);
  ctx.arcTo(pillX + pillW, pillY, pillX + pillW, pillY + pillH, pr);
  ctx.lineTo(pillX + pillW, pillY + pillH - pr);
  ctx.arcTo(pillX + pillW, pillY + pillH, pillX + pillW - pr, pillY + pillH, pr);
  ctx.lineTo(pillX + pr, pillY + pillH);
  ctx.arcTo(pillX, pillY + pillH, pillX, pillY + pillH - pr, pr);
  ctx.lineTo(pillX, pillY + pr);
  ctx.arcTo(pillX, pillY, pillX + pr, pillY, pr);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#CBD5E1";
  ctx.font      = `400 ${Math.round(s * 0.038)}px 'Arial', sans-serif`;
  ctx.fillText(statLine, s / 2, pillY + pillH * 0.64);

  // Headline
  const headline = isDone ? `${term('challenge')} complete. 🏆`
    : streak >= 2 ? `${streak} days straight. 🔥`
    : `Day ${dayNum} — showing up. 💪`;
  ctx.fillStyle = grad;
  ctx.font      = `700 ${Math.round(s * 0.055)}px 'Arial', sans-serif`;
  ctx.fillText(headline, s / 2, s * 0.65);

  // Sub copy
  ctx.fillStyle = "#CBD5E1";
  ctx.font      = `400 ${Math.round(s * 0.033)}px 'Arial', sans-serif`;
  ctx.fillText(isDone ? `Kept the ${term('habitPlural')}. Won the ${term('challenge')}.` : "One day at a time. " + SHARE_URL, s / 2, s * 0.72);

  // Rank line
  const _scLevel = getLevelInfo(state.xp);
  const _scTheme = JOURNEY_THEMES[state.settings.journeyTheme] || JOURNEY_THEMES.frostborn;
  ctx.fillStyle = "rgba(203,213,225,0.55)";
  ctx.font      = `400 ${Math.round(s * 0.03)}px 'Arial', sans-serif`;
  ctx.fillText(`${_scTheme.label} · ${term('level')} ${_scLevel.level} ${_scLevel.name}`, s / 2, s * 0.81);

  // Watermark
  ctx.fillStyle = "rgba(203,213,225,0.4)";
  ctx.font      = `700 ${Math.round(s * 0.028)}px 'Arial', sans-serif`;
  ctx.fillText("CONQUR", s / 2, s * 0.89);

  return canvas;
}

function renderShareModal() {
  if (!_shareModalChallenge || !_shareCardDataUrl) return "";
  const streak    = calcChallengeStreak(_shareModalChallenge);
  const totalPts  = Object.values(_shareModalChallenge.days).reduce((a, d) => a + (d.pts || 0), 0);
  const totalDays = diffDays(_shareModalChallenge.startDate, _shareModalChallenge.endDate) + 1;
  const dayNum    = challengeDayNumber(_shareModalChallenge);
  const shareText = _shareModalDone
    ? `I just completed the ${_shareModalChallenge.name} ${term('challenge')} on Conqur! 🏆\n${totalDays} days · ${totalPts} XP · ${streak}-day ${term('streak')}.\nKeeping my ${term('habitPlural')}. 💪\n${SHARE_URL}`
    : `Day ${dayNum} of my ${_shareModalChallenge.name} ${term('challenge')} — ${streak}-day ${term('streak')}. 🔥\nKeeping my ${term('habitPlural')}, one day at a time.\n${SHARE_URL}`;

  return `
  <div class="share-modal-overlay" data-close-share-modal>
    <div class="share-modal-inner" onclick="event.stopPropagation()">
      <img src="${_shareCardDataUrl}" class="share-card-img" alt="Share card">
      <div class="share-modal-actions">
        <button class="primary-button" data-share-card-native style="margin-bottom:8px"><i class="ti ti-share"></i> Share</button>
        <button class="secondary-button" data-download-share-card><i class="ti ti-download"></i> Save image</button>
        <button class="secondary-button" data-copy-share-text style="margin-top:8px"><i class="ti ti-copy"></i> Copy text</button>
      </div>
      <button class="share-modal-close" data-close-share-modal aria-label="Close">×</button>
    </div>
  </div>`;
}

function renderCompletionModal(c) {
  const totalDays    = diffDays(c.startDate, c.endDate) + 1;
  const totalPts     = Object.values(c.days).reduce((s,d) => s+(d.pts||0), 0);
  const finalStreak  = c.finalStreak ?? calcChallengeStreak(c);
  const canShare     = !!navigator.share || !!navigator.clipboard;
  const nextId       = c.templateId && CHALLENGE_CHAINS[c.templateId];
  const nextRaw      = nextId ? TEMPLATES.find(t => t.id === nextId) : null;
  const nextT        = isConqurTemplate(nextRaw) ? nextRaw : null;
  const isExpedition  = c.habits.some(h => h.type === "distance");
  const totalKmNativeM = isExpedition ? challengeTotalKm(c) : null;
  const routeFinished = challengeRouteKm(c) && totalKmNativeM >= challengeRouteKm(c);
  const mDistHabit    = isExpedition ? c.habits.find(h => h.type === "distance") : null;
  const mIsFloors     = mDistHabit?.unit === "floors";
  const mDUnit        = mIsFloors ? "floors" : (state.settings.units.distance === "miles" ? "mi" : "km");
  const mFactor       = mDUnit === "mi" ? 0.621371 : 1;
  const mTotalD       = isExpedition ? Math.round(totalKmNativeM * mFactor * 10) / 10 : null;
  const completionSub = isExpedition
    ? `${mTotalD.toFixed(mIsFloors?0:1)} ${mDUnit} covered · ${totalDays} days · ${finalStreak}-day ${term('streak')}.<br>${routeFinished ? "You finished the route. Legendary." : "You stayed the course. That's what commitment looks like."}`
    : `${totalDays} days · ${totalPts} XP · ${finalStreak}-day ${term('streak')}.<br>That's what commitment looks like.`;
  const bonusXP = c.completionBonus || 0;
  return `
  <div class="sheet-backdrop" data-close-completion>
    <section class="sheet completion-modal" role="dialog">
      <div class="completion-emoji"><i class="ti ti-trophy"></i></div>
      <div class="completion-title">${isExpedition && routeFinished ? "Route Complete!" : `${term('challenge')} Complete!`}</div>
      <div class="completion-name">${esc(c.name)}</div>
      <div class="completion-sub">${completionSub}</div>
      ${bonusXP ? `<div class="completion-bonus-row"><i class="ti ti-bolt"></i> Challenge Complete Bonus: <strong>+${bonusXP} XP</strong></div>` : ""}
      ${nextT ? `
      <button class="chain-cta" data-start-suggested="${nextT.id}">
        <span class="chain-cta-pre">Continue your journey</span>
        <span class="chain-cta-main"><i class="ti ${challengeIcon(nextT)}"></i> ${nextT.name} →</span>
        <span class="chain-cta-sub">${nextT.duration} days · Level up</span>
      </button>` : ""}
      ${(() => {
        const restDays = totalDays >= 75 ? 5 : totalDays >= 30 ? 3 : 2;
        const nextStart = addDays(todayKey(), restDays);
        const nextStartLabel = formatDate(parseDate(nextStart), {month:"short", day:"numeric"});
        return `<div style="background:color-mix(in srgb,var(--accent) 8%,transparent);border:1px solid color-mix(in srgb,var(--accent) 25%,transparent);border-radius:10px;padding:12px 14px;margin-top:16px;text-align:left">
          <div style="font-size:12px;font-weight:700;color:var(--text-dim);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">What's next</div>
          <div style="font-size:13px;color:var(--text);line-height:1.55">Take <strong>${restDays} days to recover</strong> — sleep, eat well, reflect on what you built. Your next challenge can start <strong>${nextStartLabel}</strong>.</div>
        </div>`;
      })()}
      <button class="${nextT?"secondary-button":"primary-button"}" data-close-completion style="margin-top:${nextT?"8":"16"}px">Hell yeah!</button>
      ${canShare ? `<button class="secondary-button" data-share-completion style="margin-top:8px"><i class="ti ti-share"></i> Share your achievement</button>` : ""}
      <button class="secondary-button" data-completion-new-challenge style="margin-top:8px">Browse all challenges →</button>
      ${renderCompletionSuggestions(c)}
    </section>
  </div>`;
}

// ── Challenges Tab ────────────────────────────────────────────────────────

function renderChallenges() {
  const all    = getAllChallenges();
  const active = all.filter(c => c.status==="active");
  const paused = all.filter(c => c.status==="paused");
  const past   = all.filter(c => c.status!=="active" && c.status!=="paused");
  const emptyMsg = `<div class="empty-state-icon"><i class="ti ti-trophy"></i></div><div class="empty-state-title">${copy('emptyTitle')}</div><div class="empty-state-sub">${copy('emptySub')}</div><div><button class="link-btn" data-open-builder>Start something →</button></div>`;
  const emailCapState = localStorage.getItem("conqur_email_capture");
  const showEmailCapture = emailCapState !== "dismissed";
  // "What's Next" banner: shown when a challenge was recently completed and no active challenges exist
  const recentlyCompleted = active.length === 0
    ? getAllChallenges()
        .filter(c => c.status === "completed" && c.completedAt)
        .sort((a,b) => b.completedAt.localeCompare(a.completedAt))[0]
    : null;
  return `
  <main${_viewChanged ? ` class="tab-fade-in"` : ""}>
    ${recentlyCompleted ? `
    <div class="whats-next-banner">
      <div class="wnb-title">What's next?</div>
      <div class="wnb-sub">You finished <strong>${esc(recentlyCompleted.name)}</strong>. Keep the momentum going.</div>
      ${renderCompletionSuggestions(recentlyCompleted)}
    </div>` : ""}
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <div class="section-label" style="margin:0">Active ${term('challengePlural')}</div>
      <button class="pill-btn" data-open-builder>+ New</button>
    </div>
    ${active.length ? active.map(c=>renderChallengeCard(c)).join("") : `<div class="empty-state">${emptyMsg}</div>`}
    ${paused.length ? `<div class="section-label"><i class="ti ti-player-pause"></i> Paused</div>${paused.map(c=>renderChallengeCard(c)).join("")}` : ""}
    ${past.length   ? `<div class="section-label">Past</div>${past.map(c=>renderChallengeCard(c)).join("")}` : ""}
  </main>`;
}

function renderChallengeCard(c) {
  const today        = todayKey();
  const totalDays    = c.noEndDate ? null : diffDays(c.startDate, c.endDate)+1;
  const dayNumber    = challengeDayNumber(c);
  const pct          = totalDays ? clamp(Math.round((dayNumber/totalDays)*100), 0, 100) : 0;
  const streak       = (c.status==="completed"||c.status==="failed") && c.finalStreak!=null
    ? c.finalStreak : calcChallengeStreak(c);
  const day          = c.days[today];
  const todayInfo    = day ? completionInfo(c, day) : null;
  const statusColor  = c.status==="completed"?"var(--success)":c.status==="failed"?"var(--secondary)":c.status==="paused"?"var(--text-dim)":"";
  const isExpedition = c.habits.some(h => h.type === "distance");
  const tpl          = c.templateId ? TEMPLATES.find(t => t.id === c.templateId) : null;
  const cRouteKm     = challengeRouteKm(c);
  const totalKmVal   = isExpedition ? challengeTotalKm(c) : null;
  const routePct     = cRouteKm ? Math.min(100, Math.round((totalKmVal / cRouteKm) * 100)) : null;
  const distHabit    = isExpedition ? c.habits.find(h => h.type === "distance") : null;
  const isFloors     = distHabit?.unit === "floors";
  const MI_PER_KM    = 0.621371;
  const globalDist   = state.settings.units.distance || "km";
  const dUnit        = isFloors ? "floors" : (globalDist === "miles" ? "mi" : "km");
  const factor       = dUnit === "mi" ? MI_PER_KM : 1;
  const todayNativeKm = isExpedition && day?.distances
    ? Object.values(day.distances).reduce((s,v) => s + (Number(v)||0), 0) : null;
  const resumeNudge = c.status === "paused" && c.resumeReminderDate && c.resumeReminderDate <= today;
  return `
  <div class="challenge-card-wrap">
    <button class="challenge-card" data-view-challenge="${c.id}">
      <div class="cc-top">
        <div class="cc-emoji"><i class="ti ${challengeIcon(tpl)}"></i></div>
        <div class="cc-info">
          <div class="cc-name">${esc(c.name)}${tierTag(c.templateId)}${c.noEndDate?` <span class="ongoing-badge">Ongoing</span>`:""}</div>
          <div class="cc-meta">${isExpedition && cRouteKm
            ? `${Math.round(totalKmVal * factor * 10)/10} / ${Math.round(cRouteKm * factor).toLocaleString()} ${dUnit} · Day ${dayNumber}`
            : c.noEndDate ? `Ongoing · ${c.mode} · Day ${dayNumber}` : `${totalDays}d · ${c.mode} · Day ${dayNumber}`}</div>
        </div>
        <div class="cc-right">
          ${c.status!=="active"
            ? `<div class="cc-status" style="color:${statusColor}">${c.status==="paused"?`<i class="ti ti-player-pause"></i> paused`:c.status==="failed"?(c.flags?.autoEnded?`ended · ${c.finalCompletionPct ?? 0}%`:"abandoned"):c.status}</div>`
            : isExpedition
              ? `<div class="cc-today">${todayNativeKm !== null && todayNativeKm > 0 ? (Math.round(todayNativeKm*factor*10)/10)+" "+dUnit : "—"}</div>`
              : `<div class="cc-today">${todayInfo?todayInfo.percent+"%":"—"}</div>`}
          <div class="cc-streak"><i class="ti ti-flame"></i> ${streak}</div>
        </div>
      </div>
      <div class="cc-track">
        <div class="cc-fill" style="width:${isExpedition && routePct !== null ? routePct : pct}%"></div>
      </div>
      <div class="cc-sub">${isExpedition && routePct !== null
        ? `<i class="ti ti-map-2"></i> ${routePct}% dist · <i class="ti ti-check"></i> ${todayInfo ? todayInfo.percent : 0}% today · <i class="ti ti-clock"></i> ${pct}% time`
        : `${pct}% complete · ${c.badges.length} ${c.badges.length === 1 ? term('badge') : term('badgePlural')}`}</div>
    </button>
    ${resumeNudge ? `<div class="resume-nudge"><i class="ti ti-bell"></i> Reminder to resume! <button class="link-btn" data-pause-challenge="${c.id}">Resume now →</button></div>` : ""}
  </div>`;
}

// ── Sparkline helper ─────────────────────────────────────────────────────

function renderSparkline(values, w = 88, h = 28) {
  const pts = values.filter(v => v != null && v > 0);
  if (pts.length < 2) return "";
  const min = Math.min(...pts), max = Math.max(...pts);
  const range = max - min || 1;
  const coords = pts.map((v, i) => {
    const x = Math.round((i / (pts.length - 1)) * w);
    const y = Math.round(h - ((v - min) / range) * (h - 4) - 2);
    return `${x},${y}`;
  }).join(" ");
  const lastX = Math.round(((pts.length - 1) / (pts.length - 1)) * w);
  const lastY = Math.round(h - ((pts[pts.length-1] - min) / range) * (h - 4) - 2);
  return `<svg class="sparkline" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">
    <polyline fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" points="${coords}"/>
    <circle cx="${lastX}" cy="${lastY}" r="2.5" fill="var(--accent)"/>
  </svg>`;
}

// ── Challenge Detail ──────────────────────────────────────────────────────

function renderChallengeDetail(c) {
  if (!c) return `<main><div class="empty-state">Challenge not found.</div></main>`;
  const today     = todayKey();
  const totalDays = c.noEndDate ? null : diffDays(c.startDate, c.endDate)+1;
  const dayNumber = challengeDayNumber(c);
  const pct       = totalDays ? clamp(Math.round((dayNumber/totalDays)*100), 0, 100) : null;
  const streak    = calcChallengeStreak(c);
  const totalPts  = Object.values(c.days).reduce((s,d)=>s+(d.pts||0),0);
  const compStats = challengeCompletionStats(c);
  const activeDaysDone = compStats.loggedDays;
  const activeTotal = compStats.eligibleDays;
  const activeCompPct = compStats.pct;
  const hasPhotoHabit = c.habits.some(h => h.id === "photo" || /progress\s*photo/i.test(h.title));
  const nextChainId   = c.templateId && CHALLENGE_CHAINS[c.templateId];
  const nextChainRaw  = nextChainId ? TEMPLATES.find(t => t.id === nextChainId) : null;
  const nextChainT    = isConqurTemplate(nextChainRaw) ? nextChainRaw : null;
  const tpl           = c.templateId ? TEMPLATES.find(t => t.id === c.templateId) : null;
  const isExpedition  = !!challengeRouteKm(c) || c.habits.some(h => h.type === "distance");
  const totalNativeKm = isExpedition ? challengeTotalKm(c) : null;
  const distHabitDet  = isExpedition ? c.habits.find(h => h.type === "distance") : null;
  const isFloorsDet   = distHabitDet?.unit === "floors";
  const MI_PER_KM_D   = 0.621371;
  const globalDistD   = state.settings.units.distance || "km";
  const dUnitDet      = isFloorsDet ? "floors" : (globalDistD === "miles" ? "mi" : "km");
  const factorDet     = dUnitDet === "mi" ? MI_PER_KM_D : 1;
  const totalKmDisplay = isExpedition ? Math.round(totalNativeKm * factorDet * 10) / 10 : null;
  return `
  <main${_viewChanged ? ` class="slide-in-right"` : ""}>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
      <button class="icon-btn" data-close-detail>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
      </button>
      <div>
        <div style="font-size:18px;font-weight:700"><i class="ti ${challengeIcon(tpl)}"></i> ${esc(c.name)}${tierTag(c.templateId)}</div>
        <div style="font-size:12px;color:var(--text-dim)">${c.startDate}${c.noEndDate ? " · Ongoing" : ` → ${c.endDate}`}</div>
      </div>
    </div>
    <div class="stats-grid" style="margin-bottom:14px">
      ${statCard(`<i class="ti ti-flame"></i> ${term('streak')}`, streak, "days")}
      ${isExpedition
        ? statCard('<i class="ti ti-map-2"></i> Distance', totalKmDisplay.toFixed(isFloorsDet?0:1), dUnitDet)
        : statCard('<i class="ti ti-bolt"></i> Total XP', totalPts, "")}
      ${statCard('<i class="ti ti-check"></i> Active days', `${activeDaysDone}/${activeTotal}`, "")}
      ${statCard(`<i class="ti ti-medal"></i> ${term('badgePlural')}`, c.badges.length, "")}
    </div>
    ${pct !== null ? `<div class="detail-progress-bar" style="margin-bottom:26px"><div class="detail-progress-fill" style="width:${pct}%"></div><div class="detail-progress-label">${pct}% journey complete</div></div>` : `<div class="detail-progress-bar" style="margin-bottom:26px"><div class="detail-progress-label">Day ${dayNumber} · Ongoing</div></div>`}
    ${isExpedition ? renderRouteProgress(c, tpl) : ""}


    ${nextChainT && c.status === "completed" ? `
    <div class="chain-next-banner" data-start-suggested="${nextChainT.id}">
      <div class="cnb-label">Continue your journey →</div>
      <div class="cnb-row">
        <span class="cnb-emoji"><i class="ti ${challengeIcon(nextChainT)}"></i></span>
        <div class="cnb-info">
          <div class="cnb-name">${nextChainT.name}</div>
          <div class="cnb-meta">${nextChainT.duration} days · Level up</div>
        </div>
        <span class="cnb-arrow">→</span>
      </div>
    </div>` : ""}

    ${renderMonthCalendar(c)}

    <div class="section-label">${term('habitPlural')}</div>
    <div class="habit-preview-list" style="margin-bottom:14px">
      ${c.habits.map(h => {
        if (h.type === "distance") {
          const allDays = Object.values(c.days);
          const kmTotal = allDays.reduce((s,d) => s + (Number(d.distances?.[h.id]) || 0), 0);
          const daysLogged = allDays.filter(d => d.done.includes(h.id)).length;
          const routeKm = challengeRouteKm(c) || 0;
          const routePct = routeKm ? Math.min(100, Math.round((kmTotal / routeKm) * 100)) : null;
          return `<div class="habit-preview-item">
            <span>${esc(h.title)}</span>
            <span class="hpi-rate" style="color:var(--accent)">${kmTotal.toFixed(1)} km${routePct !== null ? ` · ${routePct}% of route` : ` · ${daysLogged}d logged`}</span>
          </div>`;
        }
        if (h.type === "measurement") {
          const sortedDays = Object.entries(c.days)
            .filter(([k]) => /^\d{4}-\d{2}-\d{2}$/.test(k))
            .sort(([a],[b]) => a.localeCompare(b))
            .map(([,d]) => d);
          const decimals = typeof h.decimals === "number" ? h.decimals : 1;
          const unit = h.unit === "weight" ? (state.settings.units.weight || "kg") : (h.unit || "");
          const vals = sortedDays.map(d => d.distances?.[h.id]).filter(v => v != null && v > 0);
          const latest = vals.length ? vals[vals.length - 1] : null;
          const avg = vals.length > 1 ? vals.reduce((a,b) => a+b, 0) / vals.length : null;
          const sparkData = sortedDays.map(d => d.distances?.[h.id] ?? null);
          const goalW = (h.unit === "weight" || h.unit === "lbs" || h.unit === "kg") && c.goalWeight ? c.goalWeight : null;
          const goalLine = goalW && latest != null
            ? `<span class="hpi-goal ${latest <= goalW ? "hpi-goal--reached":""}">${latest <= goalW ? "✓ Goal reached!" : `${Math.abs(latest - goalW).toFixed(decimals)} ${unit} to goal`}</span>`
            : "";
          return `<div class="habit-preview-item habit-preview-meas">
            <div class="hpm-top">
              <span>${esc(h.title)}</span>
              <span class="hpi-rate" style="color:var(--accent)">
                ${latest != null ? `${latest.toFixed(decimals)} ${unit}` : "No entries"}${avg != null ? ` · avg ${avg.toFixed(decimals)}` : ""}
              </span>
            </div>
            ${goalLine}
            ${renderSparkline(sparkData)}
          </div>`;
        }
        const allDays = Object.values(c.days);
        const available = allDays.filter(d => d.mode !== "rest" && (d.done.length > 0 || d.recovered));
        const done = available.filter(d => d.done.includes(h.id)).length;
        const hpct = available.length ? Math.round((done / available.length) * 100) : null;
        const color = hpct == null ? "var(--text-faint)" : hpct >= 80 ? "var(--success)" : hpct >= 50 ? "var(--warning)" : "var(--secondary)";
        return `<div class="habit-preview-item">
          <span>${esc(h.title)}</span>
          ${hpct != null ? `<span class="hpi-rate" style="color:${color}">${hpct}%</span>` : ""}
        </div>`;
      }).join("")}
    </div>

    ${hasPhotoHabit ? `
    <div class="section-label">${term('progressPhoto')}</div>
    <div id="pp-strip-${c.id}" class="pp-strip"><div class="pp-loading">Loading photos…</div></div>
    ` : ""}

    ${c.habits.some(h => h.type === "measurement") ? `
    <div style="margin-top:16px">
      <button class="secondary-button" data-export-health="${c.id}"><i class="ti ti-chart-bar"></i> Export Health Data (CSV)</button>
    </div>` : ""}
    ${(c.status==="active"||c.status==="paused")?`
    <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap">
      ${c.status==="active"?`<button class="secondary-button" data-edit-challenge="${c.id}"><i class="ti ti-pencil"></i> Edit</button>`:""}
      <button class="secondary-button" data-pause-challenge="${c.id}">${c.status==="paused"?'<i class="ti ti-player-play"></i> Resume':'<i class="ti ti-player-pause"></i> Pause'}</button>
      <button class="secondary-button danger" data-abandon-challenge="${c.id}">Abandon</button>
    </div>`:""}
    ${(c.status==="completed"||c.status==="failed")?`
    <div style="margin-top:16px">
      <button class="secondary-button danger" data-delete-challenge="${c.id}"><i class="ti ti-trash"></i> Delete challenge</button>
    </div>`:""}
  </main>`;
}

function renderEditChallenge(c) {
  if (!c) return `<main><div class="empty-state">Challenge not found.</div></main>`;
  return `
  <main${_viewChanged ? ` class="slide-in-right"` : ""}>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
      <button class="icon-btn" data-close-edit>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
      </button>
      <div style="font-size:16px;font-weight:700">Edit Challenge</div>
    </div>
    <div class="builder-form">
      <label class="field" style="margin-bottom:14px">
        Challenge name
        <input id="ec-name" type="text" value="${esc(c.name)}" maxlength="40">
      </label>
      <label class="field" style="margin-bottom:14px">
        Emoji
        <input id="ec-emoji" type="text" value="${esc(c.emoji)}" maxlength="2" class="emoji-input" style="width:64px">
      </label>
      <div class="field-grid" style="margin-bottom:14px">
        <label class="field">Start date<input id="ec-start" type="date" value="${c.startDate}"></label>
        <label class="field">End date<input id="ec-end" type="date" value="${c.endDate}"></label>
      </div>
      <div class="section-label" style="margin:0 0 8px">Challenge Mode</div>
      <div class="mode-selector" style="margin-bottom:14px">
        <button class="mode-button ${(editForm?.mode||c.mode)==="soft"?"active":""}" data-ec-mode="soft">Soft</button>
        <button class="mode-button ${(editForm?.mode||c.mode)==="strict"?"active":""}" data-ec-mode="strict">Strict</button>
      </div>
      <div class="section-label" style="margin:20px 0 8px">${term('habitPlural')}</div>
      <div class="custom-habits-list">
        ${(editForm?.habits || []).map((h, i) => {
          if (editForm?.habitEditIdx === i) {
            // Inline edit row
            const isTiered = h.type === "tiered";
            return `
            <div class="ech-edit-row">
              <div class="ech-edit-top">
                <input id="ech-emoji" class="emoji-input" type="text" value="${esc(h.emoji)}" maxlength="2" style="width:48px">
                <input id="ech-title" type="text" value="${esc(h.title)}" placeholder="Habit name" style="flex:1">
                ${isTiered
                  ? `<span class="custom-habit-pts" style="font-size:11px">${h.tiers.map(t=>t.label||`Tier`).join(" / ")}</span>`
                  : `<input id="ech-pts" type="number" value="${h.points}" min="1" max="20" style="width:52px">`}
              </div>
              ${isTiered ? `<p style="font-size:11px;color:var(--text-dim);margin:0">Tiered habit — to change tiers, delete and re-add.</p>` : ""}
              <div class="ech-edit-actions">
                <button class="pill-btn" data-ec-save-habit>Save ✓</button>
                <button class="secondary-button" style="padding:6px 12px;font-size:13px" data-ec-cancel-habit-edit>Cancel</button>
              </div>
            </div>`;
          }
          return `
          <div class="custom-habit-row">
            <span class="custom-habit-emoji"><i class="ti ti-square"></i></span>
            <span class="custom-habit-name">${esc(h.title)}</span>
            <span class="custom-habit-pts">${h.type==="tiered" ? `${h.tiers[0].points??h.tiers[0].pts??0}–${(t=>t.points??t.pts??0)(h.tiers[h.tiers.length-1])}pt` : h.points+"pt"}</span>
            <button class="icon-btn" data-ec-edit-habit="${i}" title="Edit"><i class="ti ti-pencil"></i></button>
            <button class="icon-btn" data-ec-delete-habit="${i}" title="Delete" style="color:var(--secondary)"><i class="ti ti-x"></i></button>
          </div>`;
        }).join("")}
        ${(() => {
          const ef = editForm || {};
          const newType  = ef.newHabitType  || "binary";
          const newTiers = ef.newHabitTiers || [{label:"",points:1},{label:"",points:2},{label:"",points:3}];
          return `
        <div class="add-habit-form">
          <div class="add-habit-top-row">
            <input id="ech-new-emoji" class="emoji-input" type="text" value="${esc(ef.newHabitEmoji||"⭐")}" maxlength="2" placeholder="⭐" style="width:46px">
            <input id="ech-new-title" type="text" value="${esc(ef.newHabitTitle||"")}" placeholder="New habit name" style="flex:1">
            <div class="habit-type-toggle">
              <button class="ht-btn ${newType!=="tiered"?"active":""}" data-ech-type="binary">Simple</button>
              <button class="ht-btn ${newType==="tiered"?"active":""}" data-ech-type="tiered">Tiered</button>
            </div>
          </div>
          ${newType === "tiered" ? `
          <div class="tier-inputs">
            <div class="tier-inputs-header"><span>Label</span><span>Pts</span>${newTiers.length>2?"<span></span>":""}</div>
            ${newTiers.map((t,i)=>`
            <div class="tier-row">
              <input class="tier-label-input" id="ech-tier-${i}-label" type="text" value="${esc(t.label)}" placeholder="e.g. 3 km">
              <input class="tier-pts-input" id="ech-tier-${i}-pts" type="number" value="${t.points}" min="1" max="20">
              ${newTiers.length>2?`<button class="icon-btn" data-ech-remove-tier="${i}" style="font-size:11px"><i class="ti ti-x"></i></button>`:""}
            </div>`).join("")}
            ${newTiers.length<5?`<button class="link-btn" data-ech-add-tier style="font-size:12px;margin-top:2px">+ Add tier</button>`:""}
          </div>` : `
          <div class="tier-inputs-simple">
            <span style="font-size:12px;color:var(--text-dim)">Points</span>
            <input id="ech-new-pts" type="number" value="${ef.newHabitPoints||2}" min="1" max="20" style="width:60px">
          </div>`}
          <button class="pill-btn" data-ec-add-habit style="margin-top:8px;width:100%">+ Add habit</button>
        </div>`;
        })()}
      </div>

      <button class="primary-button" data-save-edit style="margin-top:20px">Save Changes ✓</button>
      <button class="secondary-button" style="margin-top:8px" data-close-edit>Cancel</button>
    </div>
  </main>`;
}

function statCard(label, value, unit) {
  return `<div class="stat-card">
    <div class="label" style="font-size:11px;font-weight:500;color:var(--text-dim);margin-bottom:6px">${label}</div>
    <div class="stat-value">${value}<span style="font-size:13px;font-weight:500;color:var(--text-dim);margin-left:3px">${unit}</span></div>
  </div>`;
}

function goalForWeek(challenge, weekIdx) {
  const g = challenge.weeklyGoal;
  if (weekIdx <= 0) return Math.round(g * 0.5);
  if (weekIdx === 1) return Math.round(g * 0.7);
  if (weekIdx === 2) return Math.round(g * 0.85);
  return g;
}

// ── Month Calendar Heatmap ────────────────────────────────────────────────

function renderMonthCalendar(challenge) {
  const today = todayKey();
  // Determine which month to show
  let refKey = calendarViewMonth;
  if (!refKey) {
    if (today >= challenge.startDate && today <= challenge.endDate) refKey = today;
    else if (today > challenge.endDate) refKey = challenge.endDate;
    else refKey = challenge.startDate;
  }
  const ref       = parseDate(refKey);
  const year      = ref.getFullYear();
  const month     = ref.getMonth();
  const firstDay  = new Date(year, month, 1);
  const lastDay   = new Date(year, month + 1, 0);
  const padStart  = firstDay.getDay(); // 0=Sun

  // Build cells (null = padding)
  const cells = Array.from({length: padStart}, () => null);
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(toKey(new Date(year, month, d)));
  while (cells.length % 7 !== 0) cells.push(null);

  // Navigation bounds
  const prevKey = toKey(new Date(year, month - 1, 1));
  const nextKey = toKey(new Date(year, month + 1, 1));
  const hasPrev = prevKey.slice(0,7) >= challenge.startDate.slice(0,7);
  const hasNext = nextKey.slice(0,7) <= (today > challenge.endDate ? challenge.endDate : today).slice(0,7);
  const monthLabel = formatDate(firstDay, { month: "long", year: "numeric" });

  const cellHTML = cells.map(k => {
    if (!k) return `<div class="cal-cell cal-pad"></div>`;
    const dn      = parseDate(k).getDate();
    const outside = k < challenge.startDate || k > challenge.endDate || k > today;
    if (outside) return `<div class="cal-cell cal-outside">${dn}</div>`;
    const day     = challenge.days[k];
    const isToday = k === today;
    const todayCls = isToday ? " cal-today" : "";
    if (!day || (!day.done.length && !day.recovered && day.mode !== "rest" && !day.freezeUsed)) {
      return `<div class="cal-cell cal-missed${todayCls}">${dn}</div>`;
    }
    const info = completionInfo(challenge, day);
    if (day.mode === "rest")                             return `<div class="cal-cell cal-rest${todayCls}"><i class="ti ti-moon"></i></div>`;
    if (day.freezeUsed && !day.done.length)              return `<div class="cal-cell cal-freeze${todayCls}"><i class="ti ti-snowflake"></i></div>`;
    if (info.percent === 100)                            return `<div class="cal-cell cal-full${todayCls}">${dn}</div>`;
    return `<div class="cal-cell cal-partial${todayCls}">${dn}</div>`;
  }).join("");

  return `
  <div class="month-cal">
    <div class="cal-nav">
      <button class="cal-nav-btn${hasPrev?"":" cal-nav-dis"}" data-cal-prev="${prevKey}" ${hasPrev?"":"disabled"}>‹</button>
      <span class="cal-month-label">${monthLabel}</span>
      <button class="cal-nav-btn${hasNext?"":" cal-nav-dis"}" data-cal-next="${nextKey}" ${hasNext?"":"disabled"}>›</button>
    </div>
    <div class="cal-header">
      ${["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=>`<div class="cal-wd">${d}</div>`).join("")}
    </div>
    <div class="cal-grid">${cellHTML}</div>
    <div class="cal-legend">
      <span class="cal-leg full">✓ Full</span>
      <span class="cal-leg partial">● Partial</span>
      <span class="cal-leg rest"><i class="ti ti-moon"></i> Rest</span>
      <span class="cal-leg freeze"><i class="ti ti-snowflake"></i> Frozen</span>
      <span class="cal-leg missed">— Missed</span>
    </div>
  </div>`;
}

// ── Builder Quiz ──────────────────────────────────────────────────────────

function getQuizRecommendation(q) {
  const { goal, time, level } = q;
  if (goal === "fitness" && level === "hardcore" && (time === "60" || time === "90")) return "75-hard";
  if (goal === "fitness" && level === "hardcore") return "cruise-control";
  if (goal === "fitness" && level === "some" && (time === "60" || time === "90")) return "strength-foundation";
  if (goal === "fitness" && level === "some") return "strength-foundation";
  if (goal === "fitness" && level === "beginner") return "start-small";
  if (goal === "fitness") return "momentum-builder";
  if (goal === "discipline" && level === "hardcore") return "75-hard";
  if (goal === "discipline" && level === "some") return "monk-mode";
  if (goal === "discipline") return "digital-detox";
  if (goal === "wellness") return "stress-reset";
  if (goal === "routine") return "morning-routine";
  return "morning-routine";
}

function renderBuilderQuiz() {
  const q = builderQuizAnswers;
  const ready = q.goal && q.time && q.level;
  const goalOpts  = [
    { id:"fitness",    label:"Build an active habit",         emoji:"💪" },
    { id:"discipline", label:"Build daily discipline",        emoji:"🎯" },
    { id:"wellness",   label:"Care for my mind",              emoji:"🧘" },
    { id:"routine",    label:"Build better routines",         emoji:"🌅" },
  ];
  const timeOpts  = [
    { id:"15", label:"15–30 min" },
    { id:"30", label:"30–60 min" },
    { id:"60", label:"60–90 min" },
    { id:"90", label:"90 min+"  },
  ];
  const levelOpts = [
    { id:"beginner", label:"Beginner — just starting out" },
    { id:"some",     label:"Some experience"              },
    { id:"hardcore", label:"Experienced — I push hard"   },
  ];
  return `
  <div class="builder-quiz">
    <div class="bq-title">Find your ${term('challenge')}</div>
    <div class="bq-sub">3 quick questions → 1 perfect match</div>

    <div class="bq-question">What's your main goal?</div>
    <div class="bq-options">
      ${goalOpts.map(o=>`
      <button class="bq-opt${q.goal===o.id?" bq-opt--active":""}" data-quiz-goal="${o.id}">
        <span class="bq-opt-emoji">${o.emoji}</span>${o.label}
      </button>`).join("")}
    </div>

    <div class="bq-question">How much time can you commit per day?</div>
    <div class="bq-options bq-options--row">
      ${timeOpts.map(o=>`
      <button class="bq-opt bq-opt--sm${q.time===o.id?" bq-opt--active":""}" data-quiz-time="${o.id}">${o.label}</button>`).join("")}
    </div>

    <div class="bq-question">Your experience with habit challenges?</div>
    <div class="bq-options">
      ${levelOpts.map(o=>`
      <button class="bq-opt${q.level===o.id?" bq-opt--active":""}" data-quiz-level="${o.id}">${o.label}</button>`).join("")}
    </div>

    <button class="primary-button" style="margin-top:20px" data-quiz-find ${ready?"":"disabled style='opacity:.35'"}>
      ${ready ? "Find my challenge →" : "Answer all 3 to continue"}
    </button>
    <div style="text-align:center;margin-top:10px">
      <button class="link-btn" data-quiz-skip>Skip — browse all challenges →</button>
    </div>
  </div>`;
}

// ── Builder ───────────────────────────────────────────────────────────────

function renderBuilder() {
  return `
  <main class="builder-shell${_viewChanged ? " slide-in-right" : ""}">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
      <button class="icon-btn" data-close-builder>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
      <div style="font-size:16px;font-weight:700">
        ${builderStep==="quiz"?`Find Your ${term('challenge')}`:builderStep==="template"?`Choose ${term('challenge')}`:builderStep==="quickstart"?"Ready to Start?":"Customise"}
      </div>
    </div>
    ${builderStep==="quiz"              ? renderBuilderQuiz()                 : ""}
    ${builderStep==="template"          ? renderBuilderTemplates()             : ""}
    ${builderStep==="quickstart"        ? renderBuilderQuickstart()            : ""}
    ${builderStep==="customize"         ? renderBuilderCustomize()             : ""}
  </main>`;
}

function renderBuilderTemplates() {
  const cats = [
    { label:"Start Here", ids:["start-small","reset-week","momentum-builder","morning-routine"] },
    { label:"Transformation", ids:["cruise-control","75-soft","75-hard","project-50","morning-power-hour","cold-exposure"] },
    { label:"Weight Loss", ids:["lean-start","fat-loss-foundation","weight-loss-30","mindful-eating"] },
    { label:"Nutrition", ids:["no-sugar","sugar-reset-7","sugar-reset-strict","caffeine-reset","processed-food-reset","dry-month","dry-reset-14","intermittent-fasting","protein-challenge","fiber-challenge","hydration","meal-prep"] },
    { label:"Mindset", ids:["stress-reset","mental-health-30","meditation","journaling","gratitude-reset","self-care-30","nature-reset"] },
    { label:"Productivity", ids:["monk-mode","deep-work-sprint","digital-detox","budget-reset","reading","creative","language-learning","no-spend","declutter"] },
    { label:"Sleep & Recovery", ids:["sleep-reset","sleep-tracker","recovery-reset","yoga-flexibility","posture-fix"] },
    { label:"Strength Basics", ids:["strength-foundation","beginner-strength","strength","calisthenics","kettlebell","pushup-challenge","pullup-progression","core-abs","pilates"] },
    { label:"Daily Routines", ids:["morning-routine","sleep-reset","self-care-30","hydration","walking"] },
  ];
  const orderedCats = cats;
  const POPULAR_IDS = ["start-small","momentum-builder","lean-start","digital-detox","sleep-reset","cruise-control","75-soft","monk-mode","stress-reset","strength-foundation"];
  const START_HERE_IDS = ["start-small","reset-week","momentum-builder","morning-routine","sleep-reset","digital-detox","lean-start","stress-reset"];
  const filterTabs = [
    { id:"all",      label:"All" },
    { id:"popular",  label:"Popular" },
    { id:"short",    label:"≤30 days" },
    { id:"medium",   label:"31–60 days" },
    { id:"long",     label:"61+ days" },
  ];
  const diffTabs = [
    { id:"all",          label:"All levels" },
    { id:"beginner",     label:"Beginner" },
    { id:"intermediate", label:"Intermediate" },
    { id:"advanced",     label:"Advanced" },
    { id:"extreme",      label:"Extreme" },
  ];
  const passesFilter = t => {
    if (!isConqurTemplate(t)) return false;
    if (t.deprecated) return false;
    const dur = _templateFilter;
    const diff = _difficultyFilter;
    if (dur === "popular" && !POPULAR_IDS.includes(t.id)) return false;
    if (dur === "short"   && t.duration > 30)             return false;
    if (dur === "medium"  && (t.duration <= 30 || t.duration > 60)) return false;
    if (dur === "long"    && t.duration <= 60)            return false;
    if (diff !== "all") {
      const d = TEMPLATE_DIFFICULTY[t.id] || "intermediate";
      if (d !== diff) return false;
    }
    return true;
  };
  const templateRow = t => {
    const diff = TEMPLATE_DIFFICULTY[t.id] || "intermediate";
    const mins = estimateMinutesPerDay(t.habits);
    const minsLabel = mins >= 60 ? `${(mins/60).toFixed(mins % 60 ? 1 : 0)}h/day` : `${mins} min/day`;
    const meta = `${t.duration} days · ${t.defaultMode} · ${DIFF_LABEL[diff]} · ~${minsLabel}`;
    const hasSafety = !!TEMPLATE_SAFETY[t.id];
    return `
    <button class="cl-row" data-select-template="${t.id}">
      <i class="ti ${challengeIcon(t)} cl-ic" aria-hidden="true"></i>
      <span class="cl-main">
        <span class="cl-name">${t.name}${hasSafety?`<i class="ti ti-alert-triangle cl-safety" title="Safety note"></i>`:""}</span>
        <span class="cl-meta">${meta}</span>
      </span>
      <i class="ti ti-chevron-right cl-go" aria-hidden="true"></i>
    </button>`;
  };
  const chip = (active, attr, val, label) =>
    `<button class="cl-chip${active?" active":""}" ${attr}="${val}">${label}</button>`;
  const filterBar = `
  <div class="cl-filters">
    ${filterTabs.map(f => chip(_templateFilter===f.id, "data-template-filter", f.id, f.label)).join("")}
    <button class="cl-chip cl-chip--ghost" data-surprise-me title="Pick a random challenge for me"><i class="ti ti-arrows-shuffle"></i> Surprise</button>
  </div>
  <div class="cl-filters cl-filters--diff">
    ${diffTabs.map(f => chip(_difficultyFilter===f.id, "data-difficulty-filter", f.id, f.label)).join("")}
  </div>`;
  const catBlock = (label, count, rowsHtml) =>
    `<div class="cl-cat"><span class="cl-cat-name">${label}</span><span class="cl-cat-count">${count}</span></div>
     <div class="cl-list">${rowsHtml}</div>`;
  const showStartHere = false;
  const startHereSection = showStartHere ? (() => {
    const picks = START_HERE_IDS.map(id => TEMPLATES.find(t => t.id === id)).filter(Boolean);
    return catBlock("Start here", picks.length, picks.map(templateRow).join(""));
  })() : "";
  const catSections = orderedCats.map(cat => {
    const seen = new Set();
    const group = cat.ids.map(id => TEMPLATES.find(t => t.id === id)).filter(t => {
      if (!t || seen.has(t.id) || !passesFilter(t)) return false;
      seen.add(t.id);
      return true;
    });
    if (!group.length) return "";
    return catBlock(cat.label, group.length, group.map(templateRow).join(""));
  }).join("");
  const customSection = _templateFilter === "all" ? catBlock("Custom", 1, `
    <button class="cl-row" data-select-template="custom">
      <i class="ti ti-target cl-ic" aria-hidden="true"></i>
      <span class="cl-main">
        <span class="cl-name">Custom ${term('challenge')}</span>
        <span class="cl-meta">Build your own from scratch</span>
      </span>
      <i class="ti ti-chevron-right cl-go" aria-hidden="true"></i>
    </button>`) : "";
  return filterBar + startHereSection + catSections + customSection;
}

function renderBuilderCustomize() {
  const isCustom = !builderForm.templateId;
  const template = builderForm.templateId ? TEMPLATES.find(t=>t.id===builderForm.templateId) : null;
  return `
  <div class="builder-form">
    ${isCustom ? `
    <label class="field" style="margin-bottom:14px">
      Emoji
      <input id="bf-emoji" type="text" value="${esc(builderForm.emoji)}" maxlength="2" class="emoji-input" style="width:64px" placeholder="🎯">
    </label>` : ""}
    <label class="field" style="margin-bottom:14px">
      Challenge name
      <input id="bf-name" type="text" value="${esc(builderForm.name)}" placeholder="${template?template.name:"My Challenge"}" maxlength="40">
    </label>
    <div class="field-grid" style="margin-bottom:6px">
      <label class="field">Start date<input id="bf-start" type="date" value="${builderForm.startDate}"></label>
      ${builderForm.noEndDate ? `<label class="field" style="opacity:.4">End date<input type="date" disabled value="—"></label>` : `<label class="field">End date<input id="bf-end" type="date" value="${builderForm.endDate}"></label>`}
    </div>
    ${builderForm.startDate < todayKey() ? `<p class="mode-desc" style="margin:-2px 0 10px">Starting in the past — days before today will show as unlogged. That's OK.</p>` : ""}
    <div class="ongoing-toggle" style="margin-bottom:14px">
      <label class="ongoing-toggle-label">
        <input type="checkbox" id="bf-ongoing" ${builderForm.noEndDate?"checked":""} style="width:16px;height:16px;accent-color:var(--accent)">
        <span>Ongoing ${term('challenge')} — no end date</span>
      </label>
    </div>
    <div class="section-label" style="margin:0 0 8px">Challenge Mode</div>
    <div class="mode-selector" style="margin-bottom:6px">
      <button class="mode-button ${builderForm.mode==="soft"?"active":""}" data-bf-mode="soft">Soft</button>
      <button class="mode-button ${builderForm.mode==="strict"?"active":""}" data-bf-mode="strict">Strict</button>
    </div>
    <p class="mode-desc" style="margin-bottom:14px">${builderForm.mode==="soft"?"One grace day allowed if you miss — streak stays alive.":"Zero misses. Every day counts. No exceptions."}</p>
    ${template?.noRestDay ? `
    <div class="joker-budget-row" style="margin-bottom:14px">
      <span class="field-label">${term('restDay')}s</span>
      <span class="mode-desc" style="margin:0">Zero — no recovery days on this ${term('challenge')}.</span>
    </div>` : `
    <div class="joker-budget-row" style="margin-bottom:14px">
      <div class="field-label">${term('restDay')}s allowed</div>
      <div class="joker-stepper">
        <button class="joker-step-btn" data-joker-adj="-1">−</button>
        <span class="joker-step-val" id="joker-val">${builderForm.jokerBudget}</span>
        <button class="joker-step-btn" data-joker-adj="1">+</button>
      </div>
      <p class="mode-desc" style="margin:4px 0 0">${builderForm.jokerBudget === 0 ? "Zero compromise — no recovery days." : `${builderForm.jokerBudget} day${builderForm.jokerBudget===1?"":"s"} you can use to recover without breaking your ${term('streak')}.`}</p>
    </div>`}
    ${(() => {
      const tpl = builderForm.templateId ? TEMPLATES.find(t=>t.id===builderForm.templateId) : null;
      const hasWeightHabit = (tpl?.habits || builderForm.habits).some(h => h.unit === "weight" || h.unit === "lbs" || h.unit === "kg");
      if (!hasWeightHabit) return "";
      const wUnit = state.settings.units.weight || "lbs";
      return `<label class="field" style="margin-bottom:14px">
        Goal weight (${wUnit}) <span style="font-size:11px;color:var(--text-dim)">optional — shown as progress in the app</span>
        <input id="bf-goalweight" type="number" value="${builderForm.goalWeight || ""}" min="0" max="999" step="0.1" placeholder="e.g. 150">
      </label>`;
    })()}
    ${(() => {
      const habits = builderForm.templateId
        ? (TEMPLATES.find(t=>t.id===builderForm.templateId)?.habits || [])
        : builderForm.habits;
      const maxPtsPerDay = habits.reduce((s,h) => {
        if (h.type === "tiered" && h.tiers?.length) return s + Math.max(...h.tiers.map(t => t.points ?? t.pts ?? 0));
        return s + (h.points||0);
      }, 0);
      const bonus = habits.length >= 3 ? 3 : 0;
      const ptsPerWeek = (maxPtsPerDay + bonus) * 7;
      return ptsPerWeek > 0 ? `<p class="mode-desc" style="margin-bottom:16px">~${ptsPerWeek} XP/week if all ${term('habitPlural')} kept daily${bonus ? " (incl. +3 completion bonus)" : ""}</p>` : `<p style="margin-bottom:16px"></p>`;
    })()}
    ${template?.routeKm ? `
    <div class="route-info-card">
      <div class="route-info-header">
        <span class="route-info-emoji"><i class="ti ${challengeIcon(template)}"></i></span>
        <div>
          <div class="route-info-name">${template.name}</div>
          <div class="route-info-km">${template.routeKm.toLocaleString()} km · ${template.milestones.length} milestones</div>
        </div>
      </div>
      <div class="route-milestones-preview">
        ${template.milestones.map(m => `<span class="route-ms-chip"><i class="ti ti-flag"></i> ${m.name}</span>`).join("")}
      </div>
      <p class="mode-desc" style="margin:8px 0 0">Log any distance each day — walking, running, cycling, swimming. It all counts toward your route.</p>
    </div>` : `
    <div class="section-label" style="margin:0 0 8px">${term('habitPlural')} (${template?template.habits.length:builderForm.habits.length})</div>
    ${template ? `
      <div class="habit-preview-list">
        ${template.habits.map(h=>`<div class="habit-preview-item"><i class="ti ti-square" style="color:var(--text-faint);margin-right:8px"></i>${esc(h.title)}</div>`).join("")}
      </div>` : `
      <div class="custom-habits-list">
        ${builderForm.habits.map((h,i)=>`
          <div class="custom-habit-row">
            <span class="custom-habit-emoji"><i class="ti ti-square"></i></span>
            <span class="custom-habit-name">${esc(h.title)}</span>
            <span class="custom-habit-pts">${h.type==="tiered" ? `${h.tiers[0].points??h.tiers[0].pts??0}–${(t=>t.points??t.pts??0)(h.tiers[h.tiers.length-1])}pt` : h.points+"pt"}</span>
            <button class="icon-btn" data-remove-habit="${i}"><i class="ti ti-x"></i></button>
          </div>`).join("")}
        <div class="add-habit-form">
          <div class="add-habit-top-row">
            <input id="nh-emoji" class="emoji-input" type="text" value="${esc(builderForm.newHabitEmoji)}" maxlength="2" placeholder="⭐" style="width:46px">
            <input id="nh-name" type="text" value="${esc(builderForm.newHabitName)}" placeholder="Habit name" style="flex:1">
            <div class="habit-type-toggle">
              <button class="ht-btn ${builderForm.newHabitType!=="tiered"?"active":""}" data-nh-type="binary">Simple</button>
              <button class="ht-btn ${builderForm.newHabitType==="tiered"?"active":""}" data-nh-type="tiered">Tiered</button>
            </div>
          </div>
          ${builderForm.newHabitType === "tiered" ? `
          <div class="tier-inputs">
            <div class="tier-inputs-header"><span>Label</span><span>Pts</span>${builderForm.newHabitTiers.length>2?"<span></span>":""}</div>
            ${builderForm.newHabitTiers.map((t,i)=>`
            <div class="tier-row">
              <input class="tier-label-input" id="nh-tier-${i}-label" type="text" value="${esc(t.label)}" placeholder="e.g. 1 km">
              <input class="tier-pts-input" id="nh-tier-${i}-pts" type="number" value="${t.points}" min="1" max="20">
              ${builderForm.newHabitTiers.length>2?`<button class="icon-btn" data-nh-remove-tier="${i}" style="font-size:11px"><i class="ti ti-x"></i></button>`:""}
            </div>`).join("")}
            ${builderForm.newHabitTiers.length<5?`<button class="link-btn" data-nh-add-tier style="font-size:12px;margin-top:2px">+ Add tier</button>`:""}
          </div>` : `
          <div class="tier-inputs-simple">
            <span style="font-size:12px;color:var(--text-dim)">Points</span>
            <input id="nh-pts" type="number" value="${builderForm.newHabitPoints}" min="1" max="20" style="width:60px">
          </div>`}
          <button class="pill-btn" data-add-habit style="margin-top:8px;width:100%">+ Add ${term('habit')}</button>
        </div>
      </div>`}
    `}
    <div class="pts-explainer">
      <div class="pts-explainer-title"><i class="ti ti-bolt"></i> How XP works</div>
      <div class="pts-explainer-body">Check off ${term('habitPlural')} to earn XP. XP builds your ${term('level')} and never resets. Log 5 days in a week to earn a ${term('streak')} freeze.</div>
    </div>
    ${("Notification" in window) && Notification.permission === "default" ? `
    <div class="builder-notif-request">
      <div style="font-size:13px;font-weight:700;margin-bottom:4px"><i class="ti ti-bell"></i> Enable daily reminders?</div>
      <div class="mode-desc" style="margin-bottom:8px">People who enable reminders are far more likely to finish. Takes one tap.</div>
      <button class="secondary-button" style="width:100%" data-request-notif-from-builder>Enable Reminders</button>
    </div>` : ("Notification" in window) && Notification.permission === "granted" ? `
    <div class="builder-reminder-hint"><i class="ti ti-circle-check"></i> Reminders on — we'll notify you at ${state.settings.reminderTime || "20:00"}.</div>` : `
    <div class="builder-reminder-hint"><i class="ti ti-bulb"></i> Enable daily reminders in Settings after you start — it's the best habit for actually finishing.</div>`}
    <div class="builder-cta-footer">
      <button class="primary-button" data-start-challenge>Start ${term('challenge')} <i class="ti ti-rocket"></i></button>
      <button class="secondary-button" style="margin-top:8px" data-builder-back>← Back</button>
    </div>
  </div>`;
}

// ── Body Tab ──────────────────────────────────────────────────────────────

function renderBody() {
  const entries = state.bodyTracking.entries;
  const latest  = entries[entries.length-1] ?? null;
  const prev    = entries.length>=2 ? entries[entries.length-2] : null;
  const unit    = state.settings.units.weight;
  const mUnit   = state.settings.units.measurements;
  const cw  = latest?.weight   ?? null;
  const cb  = latest?.bodyFat  ?? null;
  const cl  = latest?.leanMass ?? null;
  const cwa = latest?.waist    ?? null;
  const chi = latest?.hips     ?? null;
  const wDelta  = prev?.weight!=null&&cw!=null   ? cw-prev.weight   : null;
  const bDelta  = prev?.bodyFat!=null&&cb!=null  ? cb-prev.bodyFat  : null;
  const lDelta  = prev?.leanMass!=null&&cl!=null ? cl-prev.leanMass : null;
  const waDelta = prev?.waist!=null&&cwa!=null   ? cwa-prev.waist   : null;
  const hiDelta = prev?.hips!=null&&chi!=null    ? chi-prev.hips    : null;
  return `
  <main>
    <div class="section-label">Body Composition</div>
    ${!entries.length ? `
    <div style="padding:28px 20px;text-align:center;background:var(--surface-2);border-radius:12px;margin-bottom:12px">
      <div style="font-size:32px;margin-bottom:8px;color:var(--text-dim)"><i class="ti ti-chart-bar"></i></div>
      <p style="font-weight:700;margin:0 0 4px">No check-ins yet</p>
      <p style="font-size:13px;color:var(--text-dim);margin:0">Log your first weight below to start tracking your progress.</p>
    </div>` : ""}
    <div class="metric-row">
      ${metricCard("Weight", cw!=null?cw.toFixed(1):"—", unit, wDelta, "weight")}
      ${metricCard("Body fat", cb!=null?cb.toFixed(1):"—", "%", bDelta, "bf")}
      ${metricCard("Lean est.", cl!=null?cl.toFixed(1):cw!=null&&cb!=null?((cw*(1-cb/100)).toFixed(1)):"—", unit, lDelta, "lean")}
    </div>
    <div class="metric-row">
      ${metricCard("Waist", cwa!=null?cwa.toFixed(1):"—", mUnit, waDelta, "waist")}
      ${metricCard("Hips", chi!=null?chi.toFixed(1):"—", mUnit, hiDelta, "hips")}
    </div>
    <div class="chart-card">
      <div class="chart-tabs">
        <button class="chart-tab ${activeChartTab==="weight"?"active":""}" data-chart="weight">Weight</button>
        <button class="chart-tab ${activeChartTab==="bf"?"active":""}" data-chart="bf">Body fat</button>
        <button class="chart-tab ${activeChartTab==="waist"?"active":""}" data-chart="waist">Waist</button>
        <button class="chart-tab ${activeChartTab==="hips"?"active":""}" data-chart="hips">Hips</button>
      </div>
      ${renderBodyChart()}
    </div>
    <div class="section-label">Log Check-in</div>
    <div class="log-card">
      <div class="field-grid">
        <label class="field">Weight (${unit})<input id="weight-input" type="number" step="0.1" inputmode="decimal" placeholder="${unit==="lbs"?"185.0":"84.0"}"></label>
        <label class="field">Body fat %<input id="bf-input" type="number" step="0.1" inputmode="decimal" placeholder="Optional"></label>
      </div>
      <div class="field-grid" style="margin-top:10px">
        <label class="field">Start weight${state.bodyTracking.startWeight!=null?`<span class="field-set-hint">${state.bodyTracking.startWeight} ${unit}</span>`:""}<input id="start-input" type="number" step="0.1" inputmode="decimal" placeholder="${state.bodyTracking.startWeight!=null?"Update…":"Set once"}"></label>
        <label class="field">Goal weight${state.bodyTracking.goalWeight!=null?`<span class="field-set-hint">${state.bodyTracking.goalWeight} ${unit}</span>`:""}<input id="goal-input" type="number" step="0.1" inputmode="decimal" placeholder="${state.bodyTracking.goalWeight!=null?"Update…":"Target"}"></label>
      </div>
      <div class="field-grid" style="margin-top:10px">
        <label class="field">Waist (${mUnit})<input id="waist-input" type="number" step="0.1" inputmode="decimal" placeholder="${mUnit==="cm"?"80.0":"32.0"}"></label>
        <label class="field">Hips (${mUnit})<input id="hips-input" type="number" step="0.1" inputmode="decimal" placeholder="${mUnit==="cm"?"95.0":"37.0"}"></label>
      </div>
      <button class="primary-button" data-log-weight style="margin-top:14px">Log Check-in</button>
    </div>
    ${entries.length ? renderWeighInHistory(entries) : ""}
  </main>`;
}

function metricCard(label, value, unit, delta, type) {
  let deltaClass="", deltaText="No prior data";
  if (delta!==null) {
    const abs=Math.abs(delta).toFixed(1); const arrow=delta<0?"↓":delta>0?"↑":"→";
    deltaText=`${arrow} ${abs} ${unit}`;
    const isGood=(type==="weight"||type==="bf"||type==="waist"||type==="hips")?delta<0:delta>0;
    deltaClass=delta===0?"":isGood?"good":"bad";
  }
  return `<div class="metric-card">
    <div class="metric-label">${label}</div>
    <div class="metric-value">${value}<span class="metric-unit">${unit}</span></div>
    <div class="metric-delta ${deltaClass}">${deltaText}</div>
  </div>`;
}

function renderBodyChart() {
  const TAB_MAP = { weight:"weight", bf:"bodyFat", waist:"waist", hips:"hips" };
  const UNIT_MAP = {
    weight: state.settings.units.weight, bf:"%",
    waist: state.settings.units.measurements, hips: state.settings.units.measurements,
  };
  const field = TAB_MAP[activeChartTab] || "weight";
  const unit  = UNIT_MAP[activeChartTab] || state.settings.units.weight;
  const points = state.bodyTracking.entries.filter(e=>e[field]!=null).map(e=>({date:e.date,val:e[field]}));
  const metricLabels = { weight:"weight", bf:"body fat %", waist:"waist measurements", hips:"hips measurements" };
  if (points.length<2) return `<div class="chart-empty">Log two check-ins with ${metricLabels[activeChartTab]||"this metric"} to see your trend.</div>`;
  const vals=points.map(p=>p.val); const mn=Math.min(...vals); const mx=Math.max(...vals);
  const rng=Math.max(0.5,mx-mn); const W=300,H=120,P=16;
  const coords=points.map((p,i)=>{
    const x=P+(i/(points.length-1))*(W-P*2);
    const y=(H-P)-((p.val-mn)/rng)*(H-P*2);
    return[x.toFixed(1),y.toFixed(1)];
  });
  const line=coords.map(([x,y],i)=>`${i?"L":"M"} ${x} ${y}`).join(" ");
  const area=`${line} L ${coords[coords.length-1][0]} ${H} L ${coords[0][0]} ${H} Z`;
  return `
  <svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="height:120px">
    <defs>
      <linearGradient id="cg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" style="stop-color:var(--primary)"/><stop offset="100%" style="stop-color:var(--secondary)"/></linearGradient>
      <linearGradient id="cga" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" style="stop-color:var(--primary);stop-opacity:0.22"/><stop offset="100%" style="stop-color:var(--secondary);stop-opacity:0"/></linearGradient>
    </defs>
    <path d="${area}" fill="url(#cga)"/>
    <path d="${line}" fill="none" stroke="url(#cg)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    ${coords.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="3" fill="url(#cg)"/>`).join("")}
    <text x="${coords[0][0]}" y="${H-2}" fill="var(--text-dim)" font-size="9" text-anchor="middle">${vals[0].toFixed(1)}</text>
    <text x="${coords[coords.length-1][0]}" y="${H-2}" fill="var(--text-dim)" font-size="9" text-anchor="middle">${vals[vals.length-1].toFixed(1)}</text>
  </svg>`;
}

function renderWeighInHistory(entries) {
  const all=[...entries].reverse();
  const shown=all.slice(0,bodyHistoryLimit);
  const remaining=all.length-bodyHistoryLimit;
  const unit=state.settings.units.weight;
  const mUnit=state.settings.units.measurements;
  return `<div class="section-label">History</div>
  <div class="more-card" style="margin-bottom:0">
    <div class="summary-list">
      ${shown.map(w=>`<div class="summary-row"><span>${w.date}</span>
        <strong>${w.weight} ${unit}${w.bodyFat!=null?` · ${w.bodyFat}% fat`:""}${w.waist!=null?` · ${w.waist} ${mUnit} waist`:""}</strong>
      </div>`).join("")}
    </div>
    ${remaining>0?`<button class="link-btn" data-show-more-history style="margin-top:10px">Show ${remaining} more ↓</button>`:""}
  </div>`;
}

// ── Badges Tab ────────────────────────────────────────────────────────────

function renderLevelProfile() {
  const info  = getLevelInfo(state.xp);
  const isMax = !info.next;
  const toNext = isMax ? 0 : info.next.xp - state.xp;
  const theme = JOURNEY_THEMES[state.settings.journeyTheme] || JOURNEY_THEMES.frostborn;
  const roadChunks = [];
  for (let i = 0; i < XP_LEVELS.length; i += 5) {
    roadChunks.push(XP_LEVELS.slice(i, i + 5));
  }
  return `
  <div class="level-profile-card">
    <div class="lp-top">
      <div class="lp-level-num"><i class="ti ${theme.icon}"></i> ${term('level')} ${info.level}</div>
      <div class="lp-level-name">${info.name}</div>
    </div>
    <div class="xp-bar-track lp-track">
      <div class="xp-bar-fill" style="width:${info.pct}%"></div>
    </div>
    <div class="lp-xp-row">
      <span>${state.xp.toLocaleString()} XP total</span>
      <span>${isMax ? `Max ${term('level')} <i class="ti ti-trophy"></i>` : `${toNext.toLocaleString()} XP to ${term('level')} ${info.next.level}`}</span>
    </div>
    <div class="level-road">
      ${XP_LEVELS.map(lvl => {
        const unlocked = state.xp >= lvl.xp;
        const isCurrent = info.level === lvl.level;
        const showNum = isCurrent || lvl.level % 5 === 0;
        return `<div class="lvl-node ${unlocked ? "unlocked" : ""} ${isCurrent ? "current" : ""}" title="${term('level')} ${lvl.level} ${getThemedLevelName(lvl.level)}">
          <div class="lvl-node-dot"></div>
          ${showNum ? `<div class="lvl-node-num">${lvl.level}</div>` : ""}
        </div>`;
      }).join("")}
    </div>
  </div>`;
}

function renderTrophyCase() {
  const trophies = getAllChallenges()
    .filter(c => c.status === "completed")
    .sort((a,b) => (b.completedAt||"").localeCompare(a.completedAt||""));
  if (!trophies.length) return "";
  return `
  <div class="section-label"><i class="ti ti-trophy"></i> Trophies</div>
  <div class="more-card trophy-case">
    ${trophies.map(c => {
      const streak = c.personalBest?.streak ?? c.finalStreak ?? 0;
      const perfectDays = c.personalBest?.perfectDays ?? 0;
      const totalPts = c.totalPts || Object.values(c.days).reduce((s,d) => s+(d.pts||0), 0);
      const dateStr = c.completedAt
        ? new Date(c.completedAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})
        : null;
      const tcTpl = c.templateId ? TEMPLATES.find(t => t.id === c.templateId) : null;
      const challengeBadges = (TEMPLATE_BADGES[c.templateId] || []).filter(b => c.badges.includes(b.id));
      return `
      <div class="trophy-card">
        <div class="tc-top">
          <span class="tc-emoji"><i class="ti ${challengeIcon(tcTpl)}"></i></span>
          <div class="tc-info">
            <div class="tc-name">${esc(c.name)}</div>
            <div class="tc-meta">${streak}-day ${term('streak')} · ${totalPts} XP${dateStr ? ` · ${dateStr}` : ""}</div>
          </div>
        </div>
        ${perfectDays > 0 ? `<div class="tc-sub">${perfectDays} perfect day${perfectDays!==1?"s":""}</div>` : ""}
        ${challengeBadges.length ? `<div class="tc-badges">${challengeBadges.slice(0,5).map(b => `<span class="tc-badge-pill">${stripBadgeEmoji(b.label)}</span>`).join("")}</div>` : ""}
      </div>`;
    }).join("")}
  </div>`;
}

function renderChapterOverlay() {
  const level = _chapterOverlay;
  const data  = level ? CHAPTER_LEVELS[level] : null;
  if (!data) return "";
  const chapterIcon = level >= 25 ? "ti-trophy" : level >= 20 ? "ti-star" : level >= 15 ? "ti-flame" : level >= 10 ? "ti-bolt" : "ti-seedling";
  const levelName = getThemedLevelName(level, state.settings.journeyTheme);
  return `
  <div class="luo-backdrop" data-close-chapter>
    <div class="luo-card" role="dialog" aria-modal="true">
      <div class="luo-burst"><i class="ti ${chapterIcon}"></i></div>
      <div class="luo-badge">CHAPTER ${data.title.toUpperCase()}</div>
      <div class="luo-level">${term('level')} ${level}</div>
      <div class="luo-name">${levelName}</div>
      <div class="luo-total">${data.msg}</div>
      <button class="primary-button luo-cta" data-close-chapter>Begin again. Stronger. →</button>
    </div>
  </div>`;
}

function renderBadges() {
  const allChallenges    = getAllChallenges();
  // Only show/count template badges for challenges that have been started
  const startedChallenges = allChallenges.filter(c => Object.keys(c.days).length > 0 || c.badges.length > 0);

  // Honest denominator: fixed global pool + per-challenge template sets
  const allThemeBadges = Object.values(THEME_BADGES).flat();
  const templateTotal = startedChallenges.reduce((s,c) => s + (TEMPLATE_BADGES[c.templateId]?.length || 0), 0);
  const total  = UNIVERSAL_BADGES.length + LIFETIME_BADGES.length + allThemeBadges.length + templateTotal;

  const universalEarned = state.globalBadges.filter(id => UNIVERSAL_BADGES.some(b=>b.id===id)).length;
  const lifetimeEarned  = state.globalBadges.filter(id => LIFETIME_BADGES.some(b=>b.id===id)).length;
  const themeEarned     = state.globalBadges.filter(id => allThemeBadges.some(b=>b.id===id)).length;
  const templateEarned  = allChallenges.reduce((s,c) => s+c.badges.length, 0);
  const earned = universalEarned + lifetimeEarned + themeEarned + templateEarned;

  const pct = total > 0 ? Math.round((earned/total)*100) : 0;
  return `
  <main${_viewChanged ? ` class="tab-fade-in"` : ""}>
    ${renderLevelProfile()}
    <div class="section-label">${term('badgePlural')}</div>
    <div class="more-card">
      <div class="badge-overview">
        <div class="badge-overview-count"><span class="boc-num">${earned}</span><span class="boc-total"> / ${total}</span></div>
        <div class="badge-overview-label">${term('badgePlural')} earned</div>
      </div>
      <div class="badge-overall-track"><div class="badge-overall-fill" style="width:${pct}%"></div></div>
      ${earned === 0 ? `<div class="badges-new-hint">Keep your first ${term('habit')} to unlock your first ${term('badge')} — most people earn 3–5 in their first week.</div>` : ""}
      ${renderBadgeCat('<i class="ti ti-world"></i> Universal', rethemeBadges(UNIVERSAL_BADGES), state.globalBadges, null, { xp: state.xp, maxStreak: Math.max(0, ...getAllChallenges().map(c => calcChallengeStreak(c))) })}
      ${renderBadgeCat('<i class="ti ti-diamond"></i> Lifetime Achievements', LIFETIME_BADGES, state.globalBadges, null, null)}
      ${Object.entries(THEME_BADGES).map(([themeId, defs]) => {
        const theme = JOURNEY_THEMES[themeId];
        const isActiveTheme = state.settings.journeyTheme === themeId;
        const progressCtx = isActiveTheme ? { level: getLevelInfo(state.xp).level } : null;
        return renderBadgeCat(`<i class="ti ${theme.icon}"></i> ${theme.label} Path`, defs, state.globalBadges, null, progressCtx);
      }).join("")}
      ${startedChallenges.map(c => {
        const tBadges = TEMPLATE_BADGES[c.templateId];
        if (!tBadges) return "";
        const tpl = c.templateId ? TEMPLATES.find(t => t.id === c.templateId) : null;
        return renderBadgeCat(`<i class="ti ${challengeIcon(tpl)}"></i> ${esc(c.name)}`, tBadges, c.badges, c.templateId, null);
      }).join("")}
    </div>
    ${renderPersonalBests()}
    ${renderTrophyCase()}
    ${renderConsistencyChart(allChallenges)}
  </main>`;
}

function renderConsistencyChart(allChallenges) {
  if (!allChallenges.length) return "";

  const today = todayKey();
  // Find this week's Monday
  const todayD = parseDate(today);
  const dow = todayD.getDay();
  const daysBack = dow === 0 ? 6 : dow - 1;
  const thisMonday = addDays(today, -daysBack);

  const weeks = [];
  for (let w = 7; w >= 0; w--) {
    const weekStart = addDays(thisMonday, -w * 7);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).filter(d => d <= today);
    let totalPct = 0, counted = 0;
    for (const d of weekDays) {
      for (const c of allChallenges) {
        if (d < c.startDate || (!c.noEndDate && d > c.endDate)) continue;
        const day = c.days[d];
        if (day && day.done?.length > 0) { totalPct += completionInfo(c, day).percent; counted++; }
      }
    }
    const label = w === 0 ? "Now" : `${w}w`;
    weeks.push({ pct: counted ? Math.round(totalPct / counted) : 0, label, hasData: counted > 0 });
  }

  if (weeks.every(w => !w.hasData)) return "";

  return `
  <div class="pchart-section">
    <div class="section-label">${term('habit')} Consistency</div>
    <div class="pchart-wrap">
      <div class="pchart-bars">
        ${weeks.map(w => `
        <div class="pchart-col">
          <div class="pchart-bar-outer">
            <div class="pchart-bar" style="height:${w.hasData ? Math.max(6, w.pct) : 0}%"></div>
          </div>
          <div class="pchart-week-label">${w.label}</div>
        </div>`).join("")}
      </div>
    </div>
  </div>`;
}

function renderBadgeCat(label, defs, earned, templateId, progressCtx) {
  const earnedSet = new Set(earned);
  const count = defs.filter(b=>earnedSet.has(b.id)).length;
  const catTier = templateId ? (TEMPLATE_TIERS[templateId] || "common") : null;

  // Progress hints for universal streak/xp badges
  const STREAK_BADGES = { "u-3d":3,"u-7d":7,"u-14d":14,"u-21d":21,"u-30d":30,"u-60d":60,"u-75d":75 };
  const XP_BADGES     = { "u-p10":10,"u-p100":100,"u-p500":500,"u-p1k":1000 };
  function badgeProgressHint(b) {
    if (!progressCtx || earnedSet.has(b.id)) return "";
    if (STREAK_BADGES[b.id] !== undefined) {
      const need = STREAK_BADGES[b.id];
      const have = Math.min(progressCtx.maxStreak, need);
      return `<div class="badge-hint">${have} / ${need} days</div>`;
    }
    if (XP_BADGES[b.id] !== undefined) {
      const need = XP_BADGES[b.id];
      const have = Math.min(progressCtx.xp, need);
      return `<div class="badge-hint">${have} / ${need} XP</div>`;
    }
    if (b.levelReq !== undefined && progressCtx.level !== undefined) {
      const have = Math.min(progressCtx.level, b.levelReq);
      return `<div class="badge-hint">${term('level')} ${have} / ${b.levelReq}</div>`;
    }
    return "";
  }

  const renderBadgeTile = (b) => {
    const isEarned = earnedSet.has(b.id);
    if (b.hidden && !isEarned) {
      return `
      <div class="badge badge-hidden">
        <div class="badge-label"><i class="ti ti-lock"></i> ???</div>
        <div class="badge-desc">Hidden badge</div>
      </div>`;
    }
    const tier = catTier || BADGE_TIERS[b.id] || b.tier || "common";
    const td   = TIERS[tier];
    const borderStyle = isEarned && td ? `border-color:${td.border};` : "";
    const glowStyle   = isEarned && tier === "legendary" ? `box-shadow:0 0 10px ${td.border};` : "";
    return `
    <div class="badge ${isEarned?"earned":""}" style="${borderStyle}${glowStyle}">
      <span class="badge-tier-dot" style="color:${isEarned && td ? td.color : "var(--text-faint)"}" title="${td ? td.label : ""}"><i class="ti ${TIER_ICON[tier]}"></i></span>
      <div class="badge-label">${stripBadgeEmoji(b.label)}</div>
      ${b.desc?`<div class="badge-desc">${b.desc}</div>`:""}
      ${!isEarned ? badgeProgressHint(b) : ""}
    </div>`;
  };

  const earnedDefs  = defs.filter(b =>  earnedSet.has(b.id));
  const lockedDefs  = defs.filter(b => !earnedSet.has(b.id));

  return `
  <div class="badge-cat">
    <div class="badge-cat-header">
      <span class="badge-cat-name">${label}</span>
      <span class="badge-cat-count">${count} / ${defs.length}</span>
    </div>
    ${earnedDefs.length ? `<div class="badge-grid">${earnedDefs.map(renderBadgeTile).join("")}</div>` : ""}
    ${lockedDefs.length ? `<div class="badge-grid badge-grid--locked">${lockedDefs.map(renderBadgeTile).join("")}</div>` : ""}
  </div>`;
}

function renderNotifPrompt() {
  const curTime = state.settings.reminderTime || "20:00";
  return `
  <div class="notif-prompt-overlay">
    <div class="notif-prompt-backdrop" data-notif-prompt-skip></div>
    <div class="notif-prompt" role="dialog" aria-modal="true">
      <div class="notif-prompt-icon"><i class="ti ti-bell"></i></div>
      <div class="notif-prompt-title">Day 1 done — great start!</div>
      <div class="notif-prompt-sub">People with daily reminders are 3× more likely to finish. When should we nudge you?</div>
      <div class="notif-time-row">
        <label class="notif-time-label">Reminder time</label>
        <input type="time" id="notif-time-input" class="notif-time-input" value="${curTime}">
      </div>
      <button class="primary-button" style="margin-top:16px" data-notif-prompt-enable>Enable Reminders</button>
      <p class="notif-caveat">Works while the app is open in your browser. Cannot deliver when your phone is locked or browser is closed.</p>
      <button class="link-btn notif-prompt-skip-btn" data-notif-prompt-skip>I'll risk forgetting →</button>
    </div>
  </div>`;
}

// Stack of non-blocking badge toasts: each one flies in from the bottom, stacking
// above earlier ones (newest slot closest to the bottom edge), holds for a few
// seconds, then flies out upward on its own. Staggered so multiple simultaneous
// unlocks read as a sequence rather than a single dump.
function flushBadgeToasts(list) {
  list.forEach((badge, i) => {
    setTimeout(() => addBadgeToast(badge), i * 220);
  });
}

function addBadgeToast(badge) {
  let stack = document.getElementById("badge-toast-stack");
  if (!stack) {
    stack = document.createElement("div");
    stack.id = "badge-toast-stack";
    stack.className = "badge-toast-stack";
    document.body.appendChild(stack);
  }
  const td    = TIERS[badge.tier] || TIERS.common;
  const tier  = badge.tier || "common";
  const title = stripBadgeEmoji(badge.label);
  const el = document.createElement("div");
  el.className = "badge-toast";
  el.innerHTML = `
    <div class="badge-toast-icon" style="color:${td.color}"><i class="ti ${TIER_ICON[tier] || TIER_ICON.common}"></i></div>
    <div class="badge-toast-body">
      <div class="badge-toast-tier" style="color:${td.color}">${td.label}</div>
      <div class="badge-toast-title">${esc(title)}</div>
    </div>`;
  stack.appendChild(el);
  el.offsetHeight; // force layout so the browser commits the initial transform before animating to "show"
  el.classList.add("show");
  setTimeout(() => {
    el.classList.remove("show");
    el.classList.add("hide");
    setTimeout(() => {
      el.remove();
      if (!stack.children.length) stack.remove();
    }, 380);
  }, 2800);
}

function shouldShowBackupNudge(challenge) {
  if (localStorage.getItem("conqur_backup_nudge_dismissed")) return false;
  if (CloudSync.isSignedIn) return false;
  return challengeDayNumber(challenge) >= 7;
}

function renderBackupNudge(challenge) {
  if (!shouldShowBackupNudge(challenge)) return "";
  return `
  <div class="backup-nudge">
    <button class="backup-nudge-close" data-dismiss-backup-nudge aria-label="Dismiss">×</button>
    <div class="backup-nudge-icon"><i class="ti ti-cloud"></i></div>
    <div class="backup-nudge-body">
      <div class="backup-nudge-title">Protect your progress</div>
      <div class="backup-nudge-sub">You've built a solid streak — back it up so you never lose it.</div>
    </div>
    <button class="secondary-button" style="margin-top:8px;width:100%" data-preview-onboarding>Back up free →</button>
  </div>`;
}

function renderMoodNote(day) {
  const MOODS = [
    { key:"great", emoji:"😄", label:"Great" },
    { key:"good",  emoji:"🙂", label:"Good"  },
    { key:"okay",  emoji:"😐", label:"Okay"  },
    { key:"rough", emoji:"😕", label:"Rough"  },
    { key:"bad",   emoji:"😩", label:"Bad"   },
  ];
  const cur = day.mood || null;
  const note = day.note || "";
  return `
  <div class="mood-note-card">
    <div class="mood-row">
      <span class="mood-label">How's today going?</span>
      <div class="mood-emojis">
        ${MOODS.map(m => `<button class="mood-btn${cur===m.key?" mood-selected":""}" data-mood="${m.key}" title="${m.label}" aria-label="${m.label}" aria-pressed="${cur===m.key}">${m.emoji}</button>`).join("")}
      </div>
    </div>
    <textarea class="day-note-input" placeholder="Add a note (optional)…" maxlength="280" data-day-note>${esc(note)}</textarea>
  </div>`;
}

function renderChallengeMetricChart(challenge) {
  const measHabits = challenge.habits.filter(h => h.type === "measurement");
  if (!measHabits.length) return "";
  const dayEntries = Object.entries(challenge.days)
    .filter(([, d]) => d.distances && measHabits.some(h => (d.distances[h.id] || 0) > 0))
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30);
  const activeId = (_measChartTab && measHabits.find(h => h.id === _measChartTab))
    ? _measChartTab : measHabits[0].id;
  const habit = measHabits.find(h => h.id === activeId);
  const unit = habit.unit === "weight" ? (state.settings.units.weight || "kg") : habit.unit;
  const points = dayEntries.map(([, d]) => d.distances?.[activeId] || 0).filter(v => v > 0);
  return `
  <div class="meas-chart-card">
    ${measHabits.length > 1 ? `<div class="meas-chart-tabs">${measHabits.map(h =>
      `<button class="meas-chart-tab${h.id === activeId ? " active" : ""}" data-meas-tab="${h.id}">${esc(h.title.replace(/^Log /, ""))}</button>`
    ).join("")}</div>` : `<div class="meas-chart-label"><i class="ti ti-chart-line"></i> ${esc(habit.title)}</div>`}
    ${renderMeasurementChartSVG(points, unit, habit.unit === "weight" || habit.unit === "%")}
    ${dayEntries.length >= 2 ? `<div class="meas-chart-hint">Last 30 logged days · earlier ← → recent</div>` : ""}
  </div>`;
}

function renderMeasurementChartSVG(points, unit, lowerIsBetter) {
  if (points.length < 2) return `<div class="chart-empty" style="padding:20px 0;font-size:12px">Log 2 check-ins with this metric to see your trend.</div>`;
  const mn = Math.min(...points), mx = Math.max(...points);
  const rng = Math.max(0.5, mx - mn);
  const W = 300, H = 110, P = 18;
  const coords = points.map((v, i) => {
    const x = P + (i / (points.length - 1)) * (W - P * 2);
    const y = (H - P) - ((v - mn) / rng) * (H - P * 2 - 14);
    return [x.toFixed(1), y.toFixed(1)];
  });
  const line = coords.map(([x, y], i) => `${i ? "L" : "M"} ${x} ${y}`).join(" ");
  const area = `${line} L ${coords[coords.length-1][0]} ${H} L ${coords[0][0]} ${H} Z`;
  const delta = points[points.length-1] - points[0];
  const isGood = lowerIsBetter ? delta <= 0 : delta >= 0;
  const arrow = delta < 0 ? "↓" : delta > 0 ? "↑" : "→";
  const deltaStr = `${arrow} ${Math.abs(delta).toFixed(1)} ${unit}`;
  return `
  <svg class="meas-chart-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <defs>
      <linearGradient id="mcg${W}" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" style="stop-color:var(--primary)"/><stop offset="100%" style="stop-color:var(--secondary)"/></linearGradient>
      <linearGradient id="mcga${W}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" style="stop-color:var(--primary);stop-opacity:0.18"/><stop offset="100%" style="stop-color:var(--primary);stop-opacity:0"/></linearGradient>
    </defs>
    <path d="${area}" fill="url(#mcga${W})"/>
    <path d="${line}" fill="none" stroke="url(#mcg${W})" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    ${coords.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="${i===0||i===coords.length-1?3.5:2.5}" fill="url(#mcg${W})"/>`).join("")}
    <text x="${coords[0][0]}" y="${H - 2}" fill="var(--text-dim)" font-size="9" text-anchor="middle">${points[0].toFixed(1)}</text>
    <text x="${coords[coords.length-1][0]}" y="${H - 2}" fill="var(--text-dim)" font-size="9" text-anchor="middle">${points[points.length-1].toFixed(1)}</text>
  </svg>
  <div class="meas-chart-delta ${delta === 0 ? "" : isGood ? "good" : "bad"}">${deltaStr}</div>`;
}

function renderAlmostThereBadge(challenge, streak) {
  const milestones = [7, 14, 21, 30, 50, 75];
  const allBadges = [...(challenge.badges || []), ...(state.globalBadges || [])];
  const next = milestones.find(m => {
    if (m > streak && (m - streak) <= 2) {
      // Skip if the streak badge for this milestone is already earned
      const badgeId = `streak-${m}`;
      return !allBadges.includes(badgeId);
    }
    return false;
  });
  if (!next) return "";
  const diff = next - streak;
  return `<div class="almost-badge-chip"><i class="ti ti-medal"></i> ${diff === 1 ? "One more day" : "2 days"} to unlock your ${next}-day badge!</div>`;
}

// Shown on Today only when no streak-badge hint is already taking that slot, so the two
// gold chips never stack.
function renderRankProgressHint() {
  const info = getLevelInfo(state.xp);
  if (!info.next || info.pct < 70) return "";
  const xpToNext = (info.next.xp - state.xp).toLocaleString();
  return `<div class="almost-badge-chip"><i class="ti ti-bolt"></i> ${xpToNext} XP to ${term('level')} ${info.next.level}!</div>`;
}

// ── Settings ──────────────────────────────────────────────────────────────

// ── Onboarding ────────────────────────────────────────────────────────────

function renderObHero() {
  const theme = JOURNEY_THEMES[state.settings.journeyTheme] || JOURNEY_THEMES.frostborn;
  return `
  <div class="ob-screen" role="main">
    <div class="ob-hero-top">
      <div class="ob-hero-icon" aria-hidden="true"><i class="ti ${theme.icon}"></i></div>
      <div class="ob-hero-logo">CONQUR</div>
      <div class="ob-hero-tagline">${copy('heroTagline')}</div>
    </div>
    <ul class="ob-features" aria-label="App features">
      <li class="ob-feature"><span class="ob-feature-icon" aria-hidden="true"><i class="ti ${OB_FEATURE_ICONS[0]}"></i></span><span><strong>Daily ${term('challengePlural')}</strong> — pick a challenge and complete daily ${term('habitPlural')}</span></li>
      <li class="ob-feature"><span class="ob-feature-icon" aria-hidden="true"><i class="ti ${OB_FEATURE_ICONS[1]}"></i></span><span>${copy('fireBullet')}</span></li>
      <li class="ob-feature"><span class="ob-feature-icon" aria-hidden="true"><i class="ti ${OB_FEATURE_ICONS[2]}"></i></span><span><strong>Earn ${term('badgePlural')}, rise in ${term('level')}</strong> — real progress for real consistency</span></li>
      <li class="ob-feature"><span class="ob-feature-icon" aria-hidden="true"><i class="ti ${OB_FEATURE_ICONS[3]}"></i></span><span>Works offline — no account required</span></li>
    </ul>
    <button class="primary-button ob-cta" data-ob-next>Let's go →</button>
    <button class="link-btn ob-link" data-ob-to-signin>Already have an account? Sign in</button>
  </div>`;
}

function renderObExplainer() {
  return `
  <div class="ob-screen ob-screen--slide" role="main">
    <div class="ob-slide-inner">
      <div class="ob-emoji" aria-hidden="true"><i class="ti ti-trending-up"></i></div>
      <div class="ob-title">Habits become a game</div>
      <div class="ob-body">Here's the whole system in three steps.</div>
    </div>
    <ul class="ob-features" aria-label="How it works">
      <li class="ob-feature"><span class="ob-feature-icon" aria-hidden="true"><i class="ti ti-list-check"></i></span><span><strong>Pick a challenge</strong> — a set of daily habits to keep for a set number of days</span></li>
      <li class="ob-feature"><span class="ob-feature-icon" aria-hidden="true"><i class="ti ti-bolt"></i></span><span><strong>Keep your habits, earn XP</strong> — every day you show up adds up</span></li>
      <li class="ob-feature"><span class="ob-feature-icon" aria-hidden="true"><i class="ti ti-trophy"></i></span><span><strong>XP levels you up</strong> — your level never resets, no matter what</span></li>
    </ul>
    <button class="primary-button ob-cta" data-ob-next>Choose how you level up →</button>
  </div>`;
}

function renderThemeCardsGrid() {
  return `
    <div class="ob-goal-grid">
      ${Object.entries(JOURNEY_THEMES).map(([id, t]) => `
      <button class="ob-goal-btn ob-theme-btn" data-ob-theme="${id}" style="--theme-swatch:${THEME_SWATCHES[id][0]}">
        <span class="ob-goal-emoji"><i class="ti ${t.icon}"></i></span>
        <div class="ob-goal-info">
          <div class="ob-goal-label">${t.label}</div>
          <div class="ob-goal-desc">${t.tagline}</div>
        </div>
        <span class="ob-goal-arrow">→</span>
      </button>`).join("")}
    </div>`;
}

function renderThemePromptSheet() {
  return `
  <div class="sheet-backdrop" data-theme-prompt-backdrop>
    <section class="sheet" role="dialog" style="max-width:400px">
      <div class="ob-emoji" aria-hidden="true" style="margin-bottom:6px"><i class="ti ti-sparkles"></i></div>
      <div style="font-size:18px;font-weight:700;text-align:center;margin-bottom:6px">Day 1 done. Nice.</div>
      <div style="font-size:13px;color:var(--text-dim);text-align:center;margin-bottom:16px">How do you want to level up from here? You can change this anytime in Settings.</div>
      ${renderThemeCardsGrid()}
      <button class="link-btn" data-theme-prompt-dismiss style="display:block;margin:4px auto 0;font-size:12px">Maybe later</button>
    </section>
  </div>`;
}

function renderObGoal() {
  const goals = [
    { id:"lose_weight",  icon:"ti-scale", label:"Lose weight",        desc:"Protein, steps, whole foods" },
    { id:"discipline",   icon:"ti-flame", label:"Build discipline",   desc:"Structure, standards, follow-through" },
    { id:"health",       icon:"ti-heart-rate-monitor", label:"Improve health", desc:"Sleep, hydration, movement" },
    { id:"productivity", icon:"ti-target", label:"Be more productive", desc:"Focus, planning, less scrolling" },
    { id:"stress",       icon:"ti-leaf", label:"Reduce stress",       desc:"Calm routines and recovery" },
    { id:"sleep",        icon:"ti-moon", label:"Sleep better",        desc:"Better evenings and mornings" },
    { id:"start_small",  icon:"ti-seedling", label:"Start small",     desc:"Low-friction daily wins" },
  ];
  return `
  <div class="ob-screen ob-screen--slide" role="main">
    <div class="ob-slide-inner">
      <div class="ob-emoji" aria-hidden="true"><i class="ti ti-target"></i></div>
      <div class="ob-title">What do you want most right now?</div>
      <div class="ob-body">Answer 3 questions. We'll recommend one challenge to start today.</div>
    </div>
    <div class="ob-goal-grid">
      ${goals.map(g => `
      <button class="ob-goal-btn" data-ob-answer="goal" data-ob-value="${g.id}">
        <span class="ob-goal-emoji"><i class="ti ${g.icon}"></i></span>
        <div class="ob-goal-info">
          <div class="ob-goal-label">${g.label}</div>
          <div class="ob-goal-desc">${g.desc}</div>
        </div>
        <span class="ob-goal-arrow">→</span>
      </button>`).join("")}
    </div>
    <button class="link-btn ob-link" data-ob-browse>Browse all challenges</button>
  </div>`;
}

function renderObIntensity() {
  const options = [
    { id:"easy", icon:"ti-leaf", label:"Easy start", desc:"Simple, forgiving, low pressure" },
    { id:"balanced", icon:"ti-adjustments", label:"Balanced", desc:"Challenging but sustainable" },
    { id:"strict", icon:"ti-flame", label:"Strict", desc:"Higher standards, less wiggle room" },
  ];
  return renderObChoice("How hard do you want to go?", "Pick the level that you can honestly show up for.", options, "intensity");
}

function renderObTime() {
  const options = [
    { id:"10", icon:"ti-clock", label:"10 minutes", desc:"Start small and build momentum" },
    { id:"30", icon:"ti-clock-hour-4", label:"30 minutes", desc:"A solid daily commitment" },
    { id:"60", icon:"ti-clock-hour-8", label:"60+ minutes", desc:"Ready for a serious challenge" },
  ];
  return renderObChoice("How much time per day?", "This keeps the recommendation realistic.", options, "time");
}

function renderObChoice(title, body, options, key) {
  return `
  <div class="ob-screen ob-screen--slide" role="main">
    <div class="ob-slide-inner">
      <div class="ob-emoji" aria-hidden="true"><i class="ti ti-target-arrow"></i></div>
      <div class="ob-title">${title}</div>
      <div class="ob-body">${body}</div>
    </div>
    <div class="ob-goal-grid">
      ${options.map(o => `
      <button class="ob-goal-btn" data-ob-answer="${key}" data-ob-value="${o.id}">
        <span class="ob-goal-emoji"><i class="ti ${o.icon}"></i></span>
        <div class="ob-goal-info">
          <div class="ob-goal-label">${o.label}</div>
          <div class="ob-goal-desc">${o.desc}</div>
        </div>
        <span class="ob-goal-arrow">→</span>
      </button>`).join("")}
    </div>
    <button class="link-btn ob-link" data-ob-next>Skip →</button>
  </div>`;
}

function recommendedOnboardingTemplateId() {
  const goal = onboardingAnswers.goal || "start_small";
  const intensity = onboardingAnswers.intensity || "easy";
  const time = onboardingAnswers.time || "10";
  if (goal === "sleep") return "sleep-reset";
  if (goal === "start_small") return "start-small";
  if (goal === "lose_weight") {
    if (intensity === "easy" || time === "10") return "start-small";
    if (intensity === "strict") return "fat-loss-foundation";
    return "lean-start";
  }
  if (goal === "discipline") {
    if (intensity === "easy") return "momentum-builder";
    if (intensity === "strict") return time === "60" ? "75-hard" : "cruise-control";
    return "cruise-control";
  }
  if (goal === "health") {
    if (intensity === "easy") return "reset-week";
    if (intensity === "strict") return "75-soft";
    return "momentum-builder";
  }
  if (goal === "productivity") {
    if (intensity === "strict") return "monk-mode";
    if (intensity === "easy") return "deep-work-sprint";
    return "digital-detox";
  }
  if (goal === "stress") {
    if (intensity === "easy") return "stress-reset";
    if (intensity === "strict") return "sleep-reset";
    return "mental-health-30";
  }
  return "start-small";
}

function renderObRecommendation() {
  const id = recommendedOnboardingTemplateId();
  const t = TEMPLATES.find(t => t.id === id) || TEMPLATES.find(t => t.id === "start-small");
  const diff = TEMPLATE_DIFFICULTY[t.id] || "beginner";
  const habits = t.habits.slice(0, 5);
  return `
  <div class="ob-screen ob-screen--slide" role="main">
    <div class="ob-slide-inner">
      <div class="ob-emoji" aria-hidden="true"><i class="ti ${challengeIcon(t)}"></i></div>
      <div class="ob-title">Recommended for you</div>
      <div class="ob-body">Start with one clear mission. You can browse the full library later.</div>
    </div>
    <div class="challenge-card" style="text-align:left;width:100%;margin:0 auto 16px">
      <div class="cc-top">
        <div class="cc-emoji"><i class="ti ${challengeIcon(t)}"></i></div>
        <div class="cc-info">
          <div class="cc-name">${esc(t.name)}</div>
          <div class="cc-meta">${t.duration} days · ${DIFF_LABEL[diff] || "Beginner"} · ${t.habits.length} habits</div>
        </div>
      </div>
      <div class="cc-desc">${esc(t.description)}</div>
      <div class="habit-preview-list" style="margin-top:12px">
        ${habits.map(h => `<div class="habit-preview-item">${esc(h.title)}</div>`).join("")}
      </div>
    </div>
    <button class="primary-button ob-cta" data-ob-start-rec="${t.id}">Start ${esc(t.name)}</button>
    <button class="link-btn ob-link" data-ob-browse>Browse all challenges</button>
  </div>`;
}

function renderObName() {
  const saved = state.settings.name || "";
  return `
  <div class="ob-screen ob-screen--slide" role="main">
    <div class="ob-slide-inner">
      <div class="ob-emoji" aria-hidden="true"><i class="ti ti-hand-stop"></i></div>
      <div class="ob-title">What should we call you?</div>
      <div class="ob-body">We'll use your name to cheer you on along the way.</div>
    </div>
    <div class="ob-form">
      <label class="field ob-field">
        First name
        <input id="ob-name" type="text" placeholder="Your name" autocomplete="given-name" value="${esc(saved)}">
      </label>
      <button class="primary-button ob-cta" data-ob-save-name>Continue →</button>
    </div>
    <button class="link-btn ob-link ob-link--faint" data-ob-skip-name>Skip</button>
  </div>`;
}

function renderObAccount() {
  const isSignin = _obAuthMode === "signin";
  // Forgot password sub-screen
  if (_forgotPwMode) {
    return `
  <div class="ob-screen ob-screen--account" role="main">
    <div class="ob-slide-inner">
      <div class="ob-emoji" aria-hidden="true"><i class="ti ti-key"></i></div>
      <div class="ob-title">Reset your password</div>
      <div class="ob-body">Enter your email and we'll send you a reset link.</div>
    </div>
    ${_obAuthError ? `<div class="ob-auth-error">${esc(_obAuthError)}</div>` : ""}
    ${_obAuthLoading ? `<div class="ob-loading">Sending…</div>` : `
    <div class="ob-form">
      <label class="field ob-field">
        Email
        <input id="ob-reset-email" type="email" placeholder="your@email.com" autocomplete="email" inputmode="email">
      </label>
      <button class="primary-button ob-cta" data-ob-forgot-submit>Send reset link</button>
    </div>`}
    <button class="link-btn ob-link" data-ob-forgot-cancel>← Back to sign in</button>
  </div>`;
  }
  return `
  <div class="ob-screen ob-screen--account" role="main">
    <div class="ob-slide-inner">
      <div class="ob-emoji" aria-hidden="true"><i class="ti ti-cloud"></i></div>
      <div class="ob-title">${isSignin ? "Welcome back" : "Save your progress"}</div>
      <div class="ob-body">${isSignin
        ? `Sign in to restore your ${term('challengePlural')}, ${term('streak')}, and ${term('badgePlural')}.`
        : "Create a free account so your data survives a reinstall or new phone."}</div>
    </div>
    ${_obAuthError ? `<div class="ob-auth-error">${esc(_obAuthError)}</div>` : ""}
    ${_obAuthLoading
      ? `<div class="ob-loading">One moment…</div>`
      : `<div class="ob-form">
          <label class="field ob-field">
            Email
            <input id="ob-email" type="email" placeholder="your@email.com" autocomplete="email" inputmode="email">
          </label>
          <label class="field ob-field">
            Password${!isSignin ? ` <span class="ob-pw-hint">(min 8 characters)</span>` : ""}
            <input id="ob-password" type="password" placeholder="••••••••" autocomplete="${isSignin ? "current-password" : "new-password"}">
          </label>
          <button class="primary-button ob-cta" data-ob-auth>${isSignin ? "Sign In" : "Create Account"}</button>
          ${isSignin ? `<button class="link-btn ob-link ob-link--faint" style="margin-top:4px" data-ob-forgot>Forgot password?</button>` : ""}
        </div>`}
    <button class="link-btn ob-link" data-ob-toggle-auth>
      ${isSignin ? "No account yet? Create one" : "Already have an account? Sign in"}
    </button>
    <button class="link-btn ob-link ob-link--faint" data-ob-skip-account>Skip — use offline</button>
    ${!isSignin ? `<p class="ob-privacy-note">By creating an account you agree to our <a href="/privacy.html" target="_blank" class="ob-privacy-link">Privacy Policy</a>.</p>` : ""}
  </div>`;
}

function renderOnboarding() {
  if (onboardingStep === null) return "";
  if (onboardingStep === 0) return renderObHero();
  if (onboardingStep === 1) return renderObExplainer();
  if (onboardingStep === 2) return renderObGoal();
  if (onboardingStep === 3) return renderObIntensity();
  if (onboardingStep === 4) return renderObTime();
  if (onboardingStep === 5) return renderObRecommendation();
  if (onboardingStep === 6) return renderObName();
  return renderObAccount();
}

function renderSafetyModal() {
  const t = _safetyPendingTemplateId ? TEMPLATES.find(t2 => t2.id === _safetyPendingTemplateId) : null;
  if (!t) return "";
  const warning = TEMPLATE_SAFETY[t.id];
  return `
  <div class="sheet-backdrop" data-safety-backdrop>
    <section class="sheet" role="dialog" style="max-width:400px">
      <div style="font-size:40px;text-align:center;margin-bottom:10px;color:var(--warning)"><i class="ti ti-alert-triangle"></i></div>
      <div style="font-size:18px;font-weight:700;text-align:center;margin-bottom:14px">Health Notice</div>
      <div style="font-size:14px;color:var(--text);line-height:1.65;margin-bottom:16px">${warning}</div>
      <div style="font-size:12px;color:var(--text-dim);line-height:1.55;margin-bottom:22px;padding:10px 12px;background:var(--surface-2,var(--surface));border-radius:8px">By starting this ${term('challenge')} you confirm you have read this notice. Seek medical advice before starting if you have any relevant health conditions.</div>
      <button class="primary-button" data-safety-confirm>I understand — Start ${esc(t.name)}</button>
      <button class="secondary-button" data-safety-dismiss style="margin-top:8px">Go back</button>
    </section>
  </div>`;
}

function renderDataSettings() {
  return `
  <div class="section-label" style="margin-top:20px">Data</div>
  ${!CloudSync.isSignedIn ? `
  <div style="background:rgba(234,179,8,0.1);border:1px solid rgba(234,179,8,0.35);border-radius:10px;padding:12px 14px;margin-bottom:12px;display:flex;gap:10px;align-items:flex-start">
    <span style="font-size:18px;flex-shrink:0;color:var(--warning)"><i class="ti ti-alert-triangle"></i></span>
    <div>
      <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:3px">Your data is local only</div>
      <div style="font-size:12px;color:var(--text-dim);line-height:1.5">Progress is stored on this device. If you clear your browser or switch devices, it will be lost. <button class="link-btn" data-preview-onboarding style="font-size:12px">Sign in to back up →</button></div>
    </div>
  </div>` : ""}
  ${CloudSync.isSignedIn ? `
  <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border)">
    ${_resetConfirm ? `
      <div style="background:color-mix(in srgb,var(--error) 8%,transparent);border:1px solid color-mix(in srgb,var(--error) 30%,transparent);border-radius:10px;padding:14px">
        <div style="font-size:13px;font-weight:700;color:var(--error);margin-bottom:6px">Delete account?</div>
        <div style="font-size:12px;color:var(--text-dim);margin-bottom:12px">All ${term('challengePlural')}, XP, ${term('badgePlural')}, ${term('streak')}, and settings will be permanently deleted and your account removed. This cannot be undone.</div>
        <div style="display:flex;gap:8px">
          <button class="secondary-button" data-reset-cancel style="flex:1">Cancel</button>
          <button class="primary-button" data-reset-confirm style="flex:1;background:var(--error);border-color:var(--error)">Yes, delete account</button>
        </div>
      </div>` : `
      <div style="font-size:13px;color:var(--text-dim);margin-bottom:8px">Permanently delete your account and all data.</div>
      <button class="secondary-button" data-reset-app style="color:var(--error);border-color:color-mix(in srgb,var(--error) 40%,transparent)">Delete account</button>`}
  </div>` : ""}
  <div style="margin-top:20px;text-align:center">
    <a href="/privacy.html" target="_blank" style="font-size:12px;color:var(--text-dim);text-decoration:none">Privacy Policy</a>
    <span style="font-size:12px;color:var(--text-faint);margin:0 8px">·</span>
    <span style="font-size:12px;color:var(--text-faint)">v${APP_VERSION}</span>
  </div>
  <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border);text-align:center">
    <button class="link-btn" style="font-size:12px;color:var(--text-dim)" data-preview-onboarding>Replay intro screens</button>
  </div>`;
}

function renderReminderSettings() {
  const supported = "Notification" in window;
  const perm    = supported ? Notification.permission : "unsupported";
  const enabled = state.settings.reminderEnabled;
  const time    = state.settings.reminderTime || "20:00";
  let body = "";
  if (!supported) {
    body = `<p class="reminder-note">Your browser doesn't support notifications.</p>`;
  } else if (perm === "denied") {
    const ua = navigator.userAgent;
    const isChrome  = /Chrome/.test(ua) && !/Edg/.test(ua) && !/OPR/.test(ua);
    const isFirefox = /Firefox/.test(ua);
    const isSafari  = /Safari/.test(ua) && !/Chrome/.test(ua);
    const isEdge    = /Edg/.test(ua);
    let steps = isChrome
      ? `Click the <strong>🔒 lock icon</strong> in your address bar → <strong>Notifications</strong> → <strong>Allow</strong>`
      : isEdge
      ? `Click the <strong>🔒 lock icon</strong> in your address bar → <strong>Permissions for this site</strong> → Notifications → <strong>Allow</strong>`
      : isFirefox
      ? `Click the <strong>🛡 shield icon</strong> in your address bar → <strong>Permissions</strong> → Allow Notifications`
      : isSafari
      ? `Go to <strong>Safari menu → Settings for This Website → Notifications → Allow</strong>`
      : `Click the icon next to the address bar → find <strong>Notifications</strong> → set to <strong>Allow</strong>`;
    body = `
    <div style="text-align:center;padding:8px 0">
      <div style="font-size:32px;margin-bottom:10px;color:var(--text-dim)"><i class="ti ti-bell-off"></i></div>
      <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:8px">Notifications are blocked</div>
      <div style="font-size:13px;color:var(--text-dim);line-height:1.6;margin-bottom:14px">${steps}, then tap the button below.</div>
      <button class="secondary-button" style="width:100%" onclick="window.location.reload()">I've enabled them — reload ↻</button>
    </div>`;
  } else if (perm === "default") {
    body = `<button class="primary-button" data-request-notif-permission>Enable reminders</button>
            <p class="reminder-note" style="margin-top:8px">Best-effort — we'll try to nudge you once a day if today's habits are still open. This only works while the app is open in a tab somewhere; fully closing it can stop the reminder from firing.</p>`;
  } else {
    body = `
    <div class="reminder-row">
      <div>
        <div style="font-size:14px;font-weight:700">Daily reminder</div>
        <div style="font-size:12px;color:var(--text-dim);margin-top:2px">Fires when today's habits are incomplete — best-effort, needs the app open in a tab</div>
      </div>
      <label class="toggle-switch">
        <input type="checkbox" ${enabled ? "checked" : ""} data-toggle-reminder>
        <span class="toggle-track"><span class="toggle-thumb"></span></span>
      </label>
    </div>
    ${enabled ? `
    <label class="field" style="margin-top:12px">
      Remind me at
      <input id="reminder-time" type="time" value="${time}">
    </label>
    <button class="secondary-button" data-save-reminder style="margin-top:10px">Save time</button>
    <p class="reminder-note" style="margin-top:8px">Browsers suspend timers in closed or backgrounded tabs, so this can miss firing if you're not near the app. We're looking at a proper background version.</p>` : ""}`;
  }
  return `
  <div class="section-label" style="margin-top:20px">Reminders</div>
  <div class="more-card">${body}</div>`;
}

function renderProSection() {
  if (CloudSync.isSignedIn) {
    // Already a member — show compact "Pro" badge + sync controls
    return `
    <div class="section-label"><i class="ti ti-cloud"></i> Cloud Backup</div>
    <div class="more-card" style="margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <span style="font-size:18px;color:var(--success)"><i class="ti ti-circle-check"></i></span>
        <div>
          <div style="font-size:13px;font-weight:700;color:var(--text)">${esc(CloudSync.userEmail || "")}</div>
          <div style="font-size:11px;color:var(--text-dim)">Data auto-syncs after each save</div>
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="secondary-button" style="flex:1" data-cloud-sync>${_cloudAuthLoading?"Syncing…":"Sync Now"}</button>
        <button class="secondary-button" style="flex:1" data-cloud-signout>Sign Out</button>
      </div>
    </div>`;
  }
  return `
  <div class="section-label"><i class="ti ti-cloud"></i> Cloud Backup</div>
  <div class="more-card" style="margin-bottom:14px">
    <div style="font-size:13px;color:var(--text-dim);margin-bottom:14px">Back up your progress and sync across devices. Your ${term('streak')}, ${term('badgePlural')}, and ${term('challengePlural')} stay safe even if you clear your browser.</div>
    ${_cloudAuthError ? `<div class="cloud-auth-error">${esc(_cloudAuthError)}</div>` : ""}
    ${_cloudAuthLoading ? `<div style="text-align:center;padding:12px;color:var(--text-dim);font-size:14px">Loading…</div>` : `
    <label class="field" style="margin-bottom:10px">
      Email
      <input id="cloud-email" type="email" placeholder="your@email.com" autocomplete="email" inputmode="email">
    </label>
    <label class="field" style="margin-bottom:14px">
      Password <span style="font-size:11px;font-weight:500;color:var(--text-dim)">(min 8 characters)</span>
      <input id="cloud-password" type="password" placeholder="Choose a password" autocomplete="new-password">
    </label>
    <div style="display:flex;gap:8px">
      <button class="secondary-button" style="flex:1" data-cloud-signin>Sign In</button>
      <button class="primary-button" style="flex:1" data-cloud-signup>Create Account →</button>
    </div>
    <button class="link-btn" style="font-size:12px;color:var(--text-dim);margin-top:10px" data-cloud-forgot>Forgot password?</button>`}
  </div>`;
}

function renderCloudSync() { return ""; }

function renderSettings() {
  const u = state.settings.units;
  return `
  <main${_viewChanged ? ` class="slide-in-right"` : ""}>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
      <button class="icon-btn" data-close-settings>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
      <div style="font-size:16px;font-weight:700">Settings</div>
    </div>
    <div class="section-label">Your Name</div>
    <div class="log-card" style="margin-bottom:14px">
      <label class="field">Name<input id="s-name" type="text" value="${esc(state.settings.name)}" placeholder="Optional" data-autosave-name></label>
    </div>
    <div class="section-label">Units</div>
    <div class="more-card">
      <div style="margin-bottom:14px">
        <div style="font-size:12px;font-weight:700;color:var(--text-dim);margin-bottom:8px">Distance</div>
        <div class="mode-selector">
          <button class="mode-button ${u.distance==="km"?"active":""}" data-unit-distance="km">km</button>
          <button class="mode-button ${u.distance==="miles"?"active":""}" data-unit-distance="miles">miles</button>
        </div>
      </div>
      <div>
        <div style="font-size:12px;font-weight:700;color:var(--text-dim);margin-bottom:8px">Weight</div>
        <div class="mode-selector">
          <button class="mode-button ${u.weight==="kg"?"active":""}" data-unit-weight="kg">kg</button>
          <button class="mode-button ${u.weight==="lbs"?"active":""}" data-unit-weight="lbs">lbs</button>
        </div>
      </div>
    </div>
    <div class="section-label" style="margin-top:20px">Theme</div>
    <div class="more-card">
      <div style="font-size:12px;color:var(--text-dim);margin-bottom:12px">Choose how you level up. Changes your colors and ranks throughout the app.</div>
      <div class="theme-switch-grid">
        ${Object.entries(JOURNEY_THEMES).map(([id, t]) => `
        <button class="theme-switch-btn ${state.settings.journeyTheme === id ? "active" : ""}" data-set-theme="${id}" style="--theme-swatch:${THEME_SWATCHES[id][0]}">
          <span class="theme-switch-ic"><i class="ti ${t.icon}"></i></span>
          <span class="theme-switch-label">${t.label}</span>
          ${state.settings.journeyTheme === id ? `<i class="ti ti-check theme-switch-check"></i>` : ""}
        </button>`).join("")}
      </div>
    </div>
    <div class="section-label" style="margin-top:20px">How Conqur Works</div>
    <div class="more-card" style="font-size:13px;line-height:1.65;color:var(--text-dim)">
      <div style="margin-bottom:12px"><strong style="color:var(--text)"><i class="ti ti-target"></i> ${term('challengePlural')}</strong> — Pick a challenge: a routine, a health reset, or a discipline test. Each one gives you daily ${term('habitPlural')} to keep.</div>
      <div style="margin-bottom:12px"><strong style="color:var(--text)"><i class="ti ti-bolt"></i> XP &amp; ${term('level')}</strong> — Each ${term('habit')} you keep is worth XP. XP builds your ${term('level')} and never resets, so every small win becomes part of your record.</div>
      <div style="margin-bottom:12px"><strong style="color:var(--text)"><i class="ti ti-flame"></i> ${term('streak')}</strong> — Your ${term('streak')} grows every day you keep your ${term('habitPlural')}. Soft mode gives you one grace day before it resets.</div>
      <div style="margin-bottom:12px"><strong style="color:var(--text)"><i class="ti ti-shield"></i> ${term('restDay')}s</strong> — ${term('restDay')}s are planned rest, reflection, and reset time. They do not erase your progress.</div>
      <div style="margin-bottom:12px"><strong style="color:var(--text)"><i class="ti ti-flag"></i> Phases &amp; ${term('bossDay')}s</strong> — Longer ${term('challengePlural')} are split into phases, each ending in a ${term('bossDay')} — a harder push with bonus XP.</div>
      <div><strong style="color:var(--text)"><i class="ti ti-medal"></i> ${term('badgePlural')}</strong> — Earn ${term('badgePlural')} for ${term('streak')}, consistency, and completions. Proof of who you're becoming.</div>
    </div>
    ${renderProSection()}
    ${renderReminderSettings()}
    ${renderDataSettings()}
  </main>`;
}

// ── Dynamic Visuals ───────────────────────────────────────────────────────

function updateRingVisuals() {
  const ring = document.querySelector(".ring-value");
  if (!ring) return;
  const pct = Number(ring.dataset.percent||0);
  ring.style.strokeDasharray  = RING_CIRC;
  ring.style.strokeDashoffset = RING_CIRC - (pct/100)*RING_CIRC;
}

// ── Events ────────────────────────────────────────────────────────────────

function bindEvents() {
  on("[data-tab]",          el => { activeTab=el.dataset.tab; challengeSubTab="habits"; builderOpen=false; settingsOpen=false; viewChallengeId=null; editChallengeId=null; editForm=null; viewingDate=null; render(); });
  on("[data-challenge-sub]",el => { challengeSubTab=el.dataset.challengeSub; render(); });
  on("[data-mode]",         el => setMode(el.dataset.mode));
  on("[data-habit]",        el => {
    const habitId = el.dataset.habit;
    const rect = el.getBoundingClientRect();
    const _c = currentChallenge();
    const _day = _c && getChallengeDay(_c, effectiveDate());
    const _ptsBefore = _day?.pts ?? 0;
    toggleHabit(habitId);
    const _ptsAfter = _day?.pts ?? 0;
    const _ptsDelta = _ptsAfter - _ptsBefore;
    if (_day?.done.includes(habitId) && _ptsDelta > 0) {
      showPtsAnim(_ptsDelta, rect);
    }
  });
  on("[data-tier]",         el => selectTier(el.dataset.tier, el.dataset.tierVal));
  on("[data-chart]",        el => { activeChartTab=el.dataset.chart; render(); });
  on("[data-today-challenge]", el => { todayChallengeId=el.dataset.todayChallenge; render(); });
  on("[data-date-back]", () => {
    const cur = effectiveDate();
    const prev = addDays(cur, -1);
    const challenge = getActiveChallenges().find(c => c.id === todayChallengeId);
    const minBack = addDays(todayKey(), -3);
    const minDate = challenge && challenge.startDate > minBack ? challenge.startDate : minBack;
    if (prev >= minDate) { viewingDate = prev; render(); }
  });
  on("[data-date-fwd]", () => {
    if (!viewingDate) return;
    const next = addDays(viewingDate, 1);
    viewingDate = next >= todayKey() ? null : next;
    render();
  });
  on("[data-open-builder]", () => { builderOpen=true; builderStep="template"; builderForm=defaultBuilderForm(); render(); });
  on("[data-close-builder]",() => { builderOpen=false; render(); });
  on("[data-open-settings]",() => { settingsOpen=!settingsOpen; render(); });
  on("[data-close-settings]",()=>{ settingsOpen=false; render(); });
  on("[data-preview-onboarding]", () => { settingsOpen=false; _obAuthError=""; _obAuthMode="signup"; onboardingStep=0; render(); });
  on("[data-view-challenge]",el=>{ viewChallengeId=el.dataset.viewChallenge; calendarViewMonth=null; _pushAppState(); render(); });
  on("[data-close-detail]", () => { viewChallengeId=null; calendarViewMonth=null; render(); });
  on("[data-cal-prev]",     el => { calendarViewMonth=el.dataset.calPrev; render(); });
  on("[data-cal-next]",     el => { calendarViewMonth=el.dataset.calNext; render(); });
  on("[data-use-freeze]",   () => useStreakFreeze());
  on("[data-capture-photo]",el => captureProgressPhoto(el.dataset.capturePhoto));
  on("[data-log-weight]",   () => logWeight());
  on("[data-save-settings]",() => saveSettings());
  document.addEventListener("input", e => {
    if (!e.target.matches("[data-autosave-name]")) return;
    state.settings.name = e.target.value.trim();
    saveState();
  });
  on("[data-unit-weight]",        el => {
    state.settings.units.weight = el.dataset.unitWeight;
    saveState();
    if (state.bodyTracking.entries.length) showToast("Unit changed. Logged values are not auto-converted.");
    render();
  });
  on("[data-unit-distance]",      el => { state.settings.units.distance=el.dataset.unitDistance; saveState(); render(); });
  on("[data-unit-measurements]",  el => {
    state.settings.units.measurements = el.dataset.unitMeasurements;
    saveState();
    if (state.bodyTracking.entries.some(e=>e.waist!=null||e.hips!=null)) showToast("Unit changed. Logged values are not auto-converted.");
    render();
  });
  on("[data-select-template]", el => selectTemplate(el.dataset.selectTemplate));
  on("[data-bf-mode]",      el => { saveBuilderFormFromDOM(); builderForm.mode=el.dataset.bfMode; render(); });
  on("[data-pin-challenge]", el => { // kept for old data; no-op
    const c = getChallenge(el.dataset.pinChallenge); if (!c) return;
    c.pinned = !c.pinned;
    saveState(); render();
  });
  document.addEventListener("change", e => {
    if (!e.target.matches("#bf-ongoing")) return;
    saveBuilderFormFromDOM();
    builderForm.noEndDate = e.target.checked;
    if (builderForm.noEndDate) builderForm.endDate = "9999-12-31";
    render();
  }, true);
  on("[data-joker-adj]",   el => {
    const delta = Number(el.dataset.jokerAdj);
    const dur = diffDays(builderForm.startDate, builderForm.endDate) + 1;
    const max = Math.floor(dur * 0.3); // cap at 30% of challenge length
    builderForm.jokerBudget = Math.max(0, Math.min(max, (builderForm.jokerBudget || 0) + delta));
    const valEl = document.getElementById("joker-val");
    if (valEl) valEl.textContent = builderForm.jokerBudget;
    // update the desc text inline without full re-render
    const row = el.closest(".joker-budget-row");
    const desc = row?.querySelector(".mode-desc");
    if (desc) desc.textContent = builderForm.jokerBudget === 0 ? "Zero compromise — no recovery days." : `${builderForm.jokerBudget} planned ${term('restDay')}${builderForm.jokerBudget===1?"":"s"}. Use them wisely.`;
  });
  on("[data-builder-back]", () => {
    if (builderStep === "customize")  { builderStep = "quickstart"; render(); }
    else if (builderStep === "quickstart") { builderStep = "template"; render(); }
    else { builderOpen = false; render(); }
  });
  on("[data-quickstart-customise]", () => { builderStep = "customize"; render(); });
  on("[data-template-filter]", el => { _templateFilter = el.dataset.templateFilter; render(); });
  on("[data-difficulty-filter]", el => { _difficultyFilter = el.dataset.difficultyFilter; render(); });
  on("[data-meas-tab]", el => { _measChartTab = el.dataset.measTab; render(); });
  on("[data-surprise-me]", () => {
    const pool = TEMPLATES.filter(t => {
      const d = TEMPLATE_DIFFICULTY[t.id] || "intermediate";
      return isConqurTemplate(t) && (d === "beginner" || d === "intermediate");
    });
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick) { _safetyPendingTemplateId = null; selectTemplate(pick.id); }
  });
  on("[data-quiz-goal]",  el => { builderQuizAnswers.goal  = el.dataset.quizGoal;  render(); });
  on("[data-quiz-time]",  el => { builderQuizAnswers.time  = el.dataset.quizTime;  render(); });
  on("[data-quiz-level]", el => { builderQuizAnswers.level = el.dataset.quizLevel; render(); });
  on("[data-quiz-find]",  () => { selectTemplate(getQuizRecommendation(builderQuizAnswers)); });
  on("[data-quiz-skip]",  () => { builderStep="template"; render(); });
  on("[data-request-notif-from-builder]", () => requestNotificationPermission());
  on("[data-dismiss-backup-nudge]", () => { localStorage.setItem("conqur_backup_nudge_dismissed","1"); render(); });
  on("[data-dismiss-email-capture]", () => { localStorage.setItem("conqur_email_capture","dismissed"); render(); });
  document.addEventListener("keydown", e => {
    if (e.key === "Enter" && e.target.id === "email-cap-input") document.querySelector("[data-email-capture-submit]")?.click();
  });
  on("[data-email-capture-submit]",  () => {
    const input = document.getElementById("email-cap-input");
    const email = input ? input.value.trim() : "";
    if (!email || !email.includes("@")) { if (input) { input.focus(); input.classList.add("input-shake"); setTimeout(()=>input.classList.remove("input-shake"),400); } return; }
    fetch("/", { method:"POST", headers:{"Content-Type":"application/x-www-form-urlencoded"}, body: new URLSearchParams({"form-name":"beta-waitlist", email}) }).catch(()=>{});
    localStorage.setItem("conqur_email_capture","submitted");
    render();
  });
  on("[data-close-levelup]",        () => { _levelUpOverlay = null; render(); });
  on("[data-close-chapter]",        () => { _chapterOverlay = null; render(); });
  on("[data-notif-prompt-enable]",  async () => { _notifPromptVisible = false; await requestNotificationPermission(); render(); });
  on("[data-notif-prompt-skip]",    () => { _notifPromptVisible = false; render(); });
  on("[data-start-challenge]",() => startChallenge());
  on("[data-safety-confirm]",  () => startChallenge(true));
  on("[data-safety-dismiss]",  () => { _safetyPendingTemplateId = null; render(); });
  on("[data-safety-backdrop]", (el, e) => { if (e.target === el) { _safetyPendingTemplateId = null; render(); } });
  on("[data-add-habit]",    () => { saveBuilderFormFromDOM(); addCustomHabit(); });
  on("[data-remove-habit]", el => { saveBuilderFormFromDOM(); removeCustomHabit(Number(el.dataset.removeHabit)); });
  on("[data-close-completion]",       (el,e) => { if(e.target.closest("[data-close-completion]")){ justCompletedId = justCompletedIds.length ? justCompletedIds.shift() : null; render(); }});
  on("[data-completion-new-challenge]",     () => { justCompletedId=null; justCompletedIds=[]; builderOpen=true; builderStep="template"; builderForm=defaultBuilderForm(); render(); });
  on("[data-share-completion]", () => {
    const c = justCompletedId ? getChallenge(justCompletedId) : null; if (!c) return;
    showShareModal(c, true);
  });
  on("[data-share-streak]", () => {
    const c = currentChallenge(); if (!c) return;
    showShareModal(c, false);
  });
  on("[data-share-progress]", () => {
    const c = currentChallenge(); if (!c) return;
    showShareModal(c, false);
  });
  on("[data-close-share-modal]", () => { _shareModalChallenge = null; _shareCardDataUrl = null; render(); });
  on("[data-share-card-native]", () => {
    if (!_shareModalChallenge || !_shareCardDataUrl) return;
    const streak    = calcChallengeStreak(_shareModalChallenge);
    const totalPts  = Object.values(_shareModalChallenge.days).reduce((a,d)=>a+(d.pts||0),0);
    const totalDays = diffDays(_shareModalChallenge.startDate, _shareModalChallenge.endDate)+1;
    const dayNum    = challengeDayNumber(_shareModalChallenge);
    const text = _shareModalDone
      ? `I just completed the ${_shareModalChallenge.name} ${term('challenge')} on Conqur! 🏆\n${totalDays} days · ${totalPts} XP · ${streak}-day ${term('streak')}.\nKeeping my ${term('habitPlural')}. 💪\n${SHARE_URL}`
      : `Day ${dayNum} of my ${_shareModalChallenge.name} ${term('challenge')} — ${streak}-day ${term('streak')}. 🔥\nKeeping my ${term('habitPlural')}, one day at a time.\n${SHARE_URL}`;
    if (navigator.share) {
      fetch(_shareCardDataUrl).then(r=>r.blob()).then(blob => {
        const file = new File([blob], "conqur-share.png", { type:"image/png" });
        const shareData = { title:"Conqur", text };
        if (navigator.canShare?.({files:[file]})) shareData.files = [file];
        navigator.share(shareData).catch(()=>{});
      }).catch(() => shareAchievement(text));
    } else {
      shareAchievement(text);
    }
  });
  on("[data-download-share-card]", () => {
    if (!_shareCardDataUrl || !_shareModalChallenge) return;
    const a = document.createElement("a");
    a.href     = _shareCardDataUrl;
    a.download = `${(_shareModalChallenge.name||"conqur").replace(/\s+/g,"-")}-day${challengeDayNumber(_shareModalChallenge)}.png`;
    a.click();
  });
  on("[data-copy-share-text]", () => {
    if (!_shareModalChallenge) return;
    const streak    = calcChallengeStreak(_shareModalChallenge);
    const totalPts  = Object.values(_shareModalChallenge.days).reduce((a,d)=>a+(d.pts||0),0);
    const totalDays = diffDays(_shareModalChallenge.startDate, _shareModalChallenge.endDate)+1;
    const dayNum    = challengeDayNumber(_shareModalChallenge);
    const text = _shareModalDone
      ? `I just completed the ${_shareModalChallenge.name} ${term('challenge')} on Conqur! 🏆\n${totalDays} days · ${totalPts} XP · ${streak}-day ${term('streak')}.\nKeeping my ${term('habitPlural')}. 💪\n${SHARE_URL}`
      : `Day ${dayNum} of my ${_shareModalChallenge.name} ${term('challenge')} — ${streak}-day ${term('streak')}. 🔥\nKeeping my ${term('habitPlural')}, one day at a time.\n${SHARE_URL}`;
    navigator.clipboard?.writeText(text).then(() => showToast("Copied!")).catch(() => showToast(text));
  });
  on("[data-dismiss-notif-nudge]", () => { _notifNudgeDismissed = true; render(); });
  on("[data-log-today-weight]", () => logTodayWeight());

  // ── Cloud Sync auth handlers ───────────────────────────────────────────────
  on("[data-cloud-signin]", async () => {
    const email    = document.getElementById("cloud-email")?.value?.trim();
    const password = document.getElementById("cloud-password")?.value;
    if (!email || !password) { _cloudAuthError = "Email and password are required."; render(); return; }
    _cloudAuthLoading = true; _cloudAuthError = ""; render();
    const res = await CloudSync.signIn(email, password);
    _cloudAuthLoading = false;
    if (res.error) { _cloudAuthError = res.error; render(); return; }
    showToast("Signed in! Data restored.");
    render();
  });
  on("[data-cloud-signup]", async () => {
    const email    = document.getElementById("cloud-email")?.value?.trim();
    const password = document.getElementById("cloud-password")?.value;
    if (!email || !password) { _cloudAuthError = "Email and password are required."; render(); return; }
    if (password.length < 8) { _cloudAuthError = "Password must be at least 8 characters."; render(); return; }
    _cloudAuthLoading = true; _cloudAuthError = ""; render();
    const res = await CloudSync.signUp(email, password);
    _cloudAuthLoading = false;
    if (res.error) { _cloudAuthError = res.error; render(); return; }
    if (res.emailPending) {
      showToast("Account created! Check your inbox to confirm your email.");
    } else {
      showToast("Account created! Data syncing to cloud.");
    }
    render();
  });
  on("[data-cloud-signout]",   () => { CloudSync.signOut(); _cloudAuthError = ""; render(); });
  on("[data-dismiss-newweek]", () => { _newWeekBanner = null; render(); });
  on("[data-install-accept]",  async () => {
    _showInstallBanner = false; render();
    if (_pwaInstallPrompt) {
      _pwaInstallPrompt.prompt();
      const choice = await _pwaInstallPrompt.userChoice;
      if (choice?.outcome === "accepted") trackEvent("App Installed");
      _pwaInstallPrompt = null;
    }
  });
  on("[data-install-dismiss]", () => { _showInstallBanner = false; localStorage.setItem("conqur_install_shown","1"); render(); });
  on("[data-cloud-sync]", async () => {
    if (_cloudAuthLoading) return;
    _cloudAuthLoading = true; render();
    await CloudSync.push();
    _cloudAuthLoading = false;
    showToast("Data synced to cloud."); render();
  });
  on("[data-edit-challenge]", el => {
    const c = getChallenge(el.dataset.editChallenge); if (!c) return;
    editForm = {
      mode: c.mode,
      habits: JSON.parse(JSON.stringify(c.habits)),  // deep copy — Cancel discards this
      habitEditIdx: null,
      newHabitEmoji: "⭐", newHabitTitle: "", newHabitPoints: 2,
      newHabitType: "binary",
      newHabitTiers: [{ label:"", points:1 }, { label:"", points:2 }, { label:"", points:3 }],
    };
    editChallengeId = el.dataset.editChallenge;
    viewChallengeId = null;
    render();
  });
  on("[data-close-edit]",    () => { viewChallengeId=editChallengeId; editChallengeId=null; editForm=null; render(); });
  on("[data-ec-mode]",       el => { if (editForm) { editForm.mode=el.dataset.ecMode; render(); } });
  on("[data-save-edit]",         () => saveEditChallenge());

  // ── Habit CRUD inside Edit Challenge ──────────────────────────────────────
  on("[data-ec-edit-habit]", el => {
    if (!editForm) return;
    editForm.habitEditIdx = Number(el.dataset.ecEditHabit);
    render();
  });
  on("[data-ec-cancel-habit-edit]", () => {
    if (!editForm) return;
    editForm.habitEditIdx = null;
    render();
  });
  on("[data-ec-save-habit]", () => {
    if (!editForm || editForm.habitEditIdx == null) return;
    const i = editForm.habitEditIdx;
    const h = editForm.habits[i];
    const emoji = (document.getElementById("ech-emoji")?.value || "⭐").trim() || "⭐";
    const title = (document.getElementById("ech-title")?.value || "").trim();
    if (!title) { showToast("Habit needs a name."); return; }
    if (h.type === "tiered") {
      editForm.habits[i] = { ...h, emoji, title };
    } else {
      const pts = Math.max(1, Math.min(20, Number(document.getElementById("ech-pts")?.value) || 2));
      editForm.habits[i] = { ...h, emoji, title, points: pts };
    }
    editForm.habitEditIdx = null;
    render();
  });
  on("[data-ec-delete-habit]", el => {
    if (!editForm) return;
    const i = Number(el.dataset.ecDeleteHabit);
    const h = editForm.habits[i];
    if (!h) return;
    showConfirm(
      `Remove "${h.title}" from this ${term('challenge')}? Past logs for this ${term('habit')} will be cleared.`,
      () => {
        editForm.habits.splice(i, 1);
        if (editForm.habitEditIdx === i) editForm.habitEditIdx = null;
        render();
      }
    );
  });
  on("[data-ec-add-habit]", () => {
    if (!editForm) return;
    const emoji = (document.getElementById("ech-new-emoji")?.value || "⭐").trim() || "⭐";
    const title = (document.getElementById("ech-new-title")?.value || "").trim();
    if (!title) { showToast(`Enter an ${term('habit')} name.`); return; }
    if (editForm.newHabitType === "tiered") {
      const tiers = (editForm.newHabitTiers || []).map((t, i) => ({
        label:  (document.getElementById(`ech-tier-${i}-label`)?.value || t.label || `Tier ${i+1}`).trim() || `Tier ${i+1}`,
        value:  i,
        points: Math.max(1, Math.min(20, Number(document.getElementById(`ech-tier-${i}-pts`)?.value) || t.points)),
      }));
      if (tiers.filter(t => t.label).length < 2) { showToast("Fill in at least 2 tier labels."); return; }
      editForm.habits.push({ id: uid(), title, emoji, quip: "", type: "tiered", points: tiers[0].points, tiers });
    } else {
      const pts = Math.max(1, Math.min(20, Number(document.getElementById("ech-new-pts")?.value) || 2));
      editForm.habits.push({ id: uid(), title, emoji, quip: "", type: "binary", points: pts });
    }
    editForm.newHabitEmoji  = "⭐";
    editForm.newHabitTitle  = "";
    editForm.newHabitPoints = 2;
    editForm.newHabitType   = "binary";
    editForm.newHabitTiers  = [{ label:"", points:1 }, { label:"", points:2 }, { label:"", points:3 }];
    render();
  });
  // Habit type toggles in builder
  on("[data-nh-type]", el => {
    saveBuilderFormFromDOM();
    builderForm.newHabitType = el.dataset.nhType;
    render();
  });
  on("[data-nh-add-tier]", () => {
    saveBuilderFormFromDOM();
    if (builderForm.newHabitTiers.length < 5) {
      const lastPts = builderForm.newHabitTiers[builderForm.newHabitTiers.length - 1]?.points || 1;
      builderForm.newHabitTiers.push({ label: "", points: lastPts + 1 });
    }
    render();
  });
  on("[data-nh-remove-tier]", el => {
    saveBuilderFormFromDOM();
    builderForm.newHabitTiers.splice(Number(el.dataset.nhRemoveTier), 1);
    render();
  });
  // Habit type toggles in edit challenge
  on("[data-ech-type]", el => {
    if (!editForm) return;
    const newTitle = document.getElementById("ech-new-title")?.value || "";
    const newEmoji = document.getElementById("ech-new-emoji")?.value || "⭐";
    editForm.newHabitTiers = (editForm.newHabitTiers || []).map((t, i) => ({
      ...t,
      label:  document.getElementById(`ech-tier-${i}-label`)?.value ?? t.label,
      points: Number(document.getElementById(`ech-tier-${i}-pts`)?.value) || t.points,
    }));
    editForm.newHabitTitle = newTitle;
    editForm.newHabitEmoji = newEmoji;
    editForm.newHabitType  = el.dataset.echType;
    render();
  });
  on("[data-ech-add-tier]", () => {
    if (!editForm) return;
    if ((editForm.newHabitTiers || []).length < 5) {
      const last = editForm.newHabitTiers[editForm.newHabitTiers.length - 1]?.points || 1;
      editForm.newHabitTiers.push({ label: "", points: last + 1 });
    }
    render();
  });
  on("[data-ech-remove-tier]", el => {
    if (!editForm) return;
    editForm.newHabitTiers.splice(Number(el.dataset.echRemoveTier), 1);
    render();
  });
  on("[data-pause-challenge]",        el => pauseChallenge(el.dataset.pauseChallenge));
  on("[data-abandon-challenge]",      el => abandonChallenge(el.dataset.abandonChallenge));
  on("[data-request-notif-permission]",  () => requestNotificationPermission());
  on("[data-toggle-reminder]",        el => {
    state.settings.reminderEnabled = el.checked;
    saveState();
    if (el.checked) scheduleReminder(); else clearTimeout(reminderTimeout);
    render();
  });
  on("[data-save-reminder]",   () => saveReminderTime());
  on("[data-reset-app]",       () => { _resetConfirm = true;  render(); });
  on("[data-reset-cancel]",    () => { _resetConfirm = false; render(); });
  on("[data-reset-confirm]",   async () => {
    // 1. Kill pending push timer immediately
    clearTimeout(_cloudPushTimer);
    _cloudPushTimer = null;
    _skipCloudPush = true;
    // 2. Overwrite cloud row BEFORE clearing localStorage — auth token must
    //    still be in localStorage for Supabase to authenticate the upsert
    if (CloudSync.isSignedIn) {
      try {
        await _sb().from("user_data").upsert({
          user_id: CloudSync.uid,
          state_json: {},
          updated_at: new Date().toISOString(),
        });
      } catch(e) {}
    }
    // 3. Sign out (invalidates session server-side)
    try { await _sb().auth.signOut(); } catch(e) {}
    // 4. Now clear all client-side stores (auth token gone after signOut anyway)
    localStorage.clear();
    sessionStorage.clear();
    // 5. Clear IndexedDB
    try {
      const dbs = await indexedDB.databases?.() || [];
      for (const db of dbs) { if (db.name) indexedDB.deleteDatabase(db.name); }
    } catch(e) {}
    // 6. Hard reload
    window.location.replace(window.location.pathname + "?reset=" + Date.now());
  });
  // ── Onboarding navigation ──────────────────────────────────────────────────
  on("[data-ob-next]", () => {
    onboardingStep++;
    render();
  });
  on("[data-ob-skip]", () => {
    onboardingStep = 6;
    _obAuthError = "";
    render();
  });
  on("[data-ob-to-signin]", () => {
    _obAuthMode = "signin";
    onboardingStep = 7; // skip name step for returning users
    _obAuthError = "";
    render();
  });
  on("[data-ob-answer]", el => {
    const key = el.dataset.obAnswer;
    const value = el.dataset.obValue;
    if (key && value && key in onboardingAnswers) onboardingAnswers[key] = value;
    onboardingStep++;
    render();
  });
  on("[data-ob-theme]", el => {
    const themeId = el.dataset.obTheme;
    if (JOURNEY_THEMES[themeId]) { state.settings.journeyTheme = themeId; state.settings.themeChosen = true; saveState(); }
    if (_showThemePrompt) { _showThemePrompt = false; render(); }
    else { onboardingStep++; render(); }
  });
  on("[data-theme-prompt-dismiss]", () => { _showThemePrompt = false; render(); });
  on("[data-theme-prompt-backdrop]", (el, e) => { if (e.target === el) { _showThemePrompt = false; render(); } });
  on("[data-set-theme]", el => {
    const themeId = el.dataset.setTheme;
    if (JOURNEY_THEMES[themeId] && themeId !== state.settings.journeyTheme) {
      state.settings.journeyTheme = themeId;
      state.settings.themeChosen = true;
      saveState();
      render();
      showToast(`Theme changed to ${JOURNEY_THEMES[themeId].label}.`);
    }
  });
  on("[data-ob-browse]", () => {
    onboardingStep = null;
    activeTab = "challenges";
    builderOpen = true;
    builderStep = "template";
    builderForm = defaultBuilderForm();
    render();
  });
  on("[data-ob-start-rec]", el => {
    const templateId = el.dataset.obStartRec;
    const tpl = TEMPLATES.find(t => t.id === templateId);
    if (!tpl) return;
    builderForm = defaultBuilderForm();
    builderForm.templateId = tpl.id;
    builderForm.name       = tpl.name;
    builderForm.emoji      = tpl.emoji;
    builderForm.startDate  = todayKey();
    builderForm.endDate    = addDays(todayKey(), tpl.duration - 1);
    builderForm.weeklyGoal = tpl.weeklyGoal;
    builderForm.mode       = tpl.defaultMode || "soft";
    builderForm.jokerBudget = tpl.noRestDay ? 0 : 3;
    onboardingStep = null;
    _skipAccountAfterStart = true;
    startChallenge();
  });
  on("[data-ob-save-name]", () => {
    const nameInput = document.getElementById("ob-name");
    if (nameInput?.value?.trim()) { state.settings.name = nameInput.value.trim(); saveState(); }
    onboardingStep++;
    _obAuthError = "";
    render();
  });
  on("[data-ob-skip-name]", () => {
    onboardingStep++;
    _obAuthError = "";
    render();
  });
  on("[data-ob-toggle-auth]", () => {
    _obAuthMode = _obAuthMode === "signup" ? "signin" : "signup";
    _obAuthError = "";
    render();
  });
  on("[data-ob-auth]", async () => {
    const email    = document.getElementById("ob-email")?.value?.trim() || "";
    const password = document.getElementById("ob-password")?.value || "";
    if (!email || !password) { _obAuthError = "Email and password are required."; render(); return; }
    if (_obAuthMode === "signup" && password.length < 8) { _obAuthError = "Password must be at least 8 characters."; render(); return; }
    _obAuthLoading = true; _obAuthError = ""; render();
    const res = _obAuthMode === "signup"
      ? await CloudSync.signUp(email, password)
      : await CloudSync.signIn(email, password);
    _obAuthLoading = false;
    if (res.error) { _obAuthError = res.error; render(); return; }
    if (res.emailPending) {
      // Email confirmation required — show message and let user continue offline
      _obAuthError = "";
      showToast("Account created! Check your inbox to confirm your email.");
      trackEvent("Account Created");
      onboardingStep = null;
      activeTab = "challenges";
      builderOpen = true; builderStep = "template";
      builderForm = defaultBuilderForm();
      render(); return;
    }
    trackEvent(_obAuthMode === "signup" ? "Account Created" : "Sign In");
    // Success — go to challenge picker (signup) or today tab (signin with existing data)
    onboardingStep = null;
    if (_obAuthMode === "signin" && Object.keys(state.challenges).length > 0) {
      activeTab = "today";
      todayChallengeId = "__all__";
    } else {
      activeTab = "challenges";
      builderOpen = true;
      builderStep = "template";
      builderForm = defaultBuilderForm();
    }
    render();
  });
  on("[data-ob-skip-account]", () => {
    onboardingStep = null;
    activeTab = "challenges";
    builderOpen = true;
    builderStep = "template";
    builderForm = defaultBuilderForm();
    render();
  });
  // ── Forgot password ──────────────────────────────────────────────────────
  on("[data-ob-forgot]",         () => { _forgotPwMode = true; _obAuthError = ""; render(); });
  on("[data-ob-forgot-cancel]",  () => { _forgotPwMode = false; _obAuthError = ""; render(); });
  on("[data-ob-forgot-submit]",  async () => {
    const email = (document.getElementById("ob-reset-email")?.value || "").trim();
    if (!email) { _obAuthError = "Enter your email address."; render(); return; }
    _obAuthLoading = true; _obAuthError = ""; render();
    try { await _sb().auth.resetPasswordForEmail(email); } catch(e) { /* silent — Supabase always returns 200 */ }
    _obAuthLoading = false;
    _forgotPwMode = false;
    showToast("Reset link sent — check your inbox.");
    render();
  });
  on("[data-cloud-forgot]",      async () => {
    const email = (document.getElementById("cloud-email")?.value || "").trim();
    if (!email) { _cloudAuthError = "Enter your email above, then tap Forgot password."; render(); return; }
    _cloudAuthLoading = true; _cloudAuthError = ""; render();
    try { await _sb().auth.resetPasswordForEmail(email); } catch(e) { /* silent */ }
    _cloudAuthLoading = false;
    showToast("Reset link sent — check your inbox.");
    render();
  });
  on("[data-retry-sync]", () => { _lastSyncError = false; CloudSync.push(); });
  on("[data-mood]", el => {
    const c = currentChallenge(); if (!c) return;
    const day = getChallengeDay(c, todayKey());
    day.mood = day.mood === el.dataset.mood ? null : el.dataset.mood;
    saveState(); render();
  });
  document.addEventListener("change", e => {
    const ta = e.target.closest("[data-day-note]");
    if (!ta) return;
    const c = currentChallenge(); if (!c) return;
    const day = getChallengeDay(c, todayKey());
    day.note = ta.value.trim().slice(0, 280);
    saveState();
  });
  on("[data-confirm-ok]",      () => { const fn = _confirmDialog?.onConfirm; _confirmDialog = null; render(); if (fn) fn(); });
  on("[data-confirm-cancel]",  () => { _confirmDialog = null; render(); });
  on("[data-prompt-ok]",       () => { const val = document.getElementById("prompt-input-field")?.value; const fn = _promptDialog?.onConfirm; _promptDialog = null; render(); if (fn) fn(val); });
  on("[data-prompt-cancel]",   () => { _promptDialog = null; render(); });
  on("[data-delete-photo]",    el => {
    const key = el.dataset.deletePhoto;
    showConfirm("Delete this progress photo? This can't be undone.", async () => {
      try {
        await PhotoDB.delete(key);
        // Force the strip to re-load on next render
        const strip = document.querySelector('[id^="pp-strip-"]');
        if (strip) delete strip.dataset.loaded;
        render();
      } catch(e) { showToast("Couldn't delete photo — try again."); }
    });
  });
  on("[data-show-more-history]",() => { bodyHistoryLimit += 10; render(); });
  on("[data-delete-challenge]",  el => deleteChallenge(el.dataset.deleteChallenge));
  on("[data-export-health]",    el => { const c = getChallenge(el.dataset.exportHealth); if (c) exportHealthCSV(c); });
  on("[data-dismiss-weekly-recap]", el => {
    const cid = el.dataset.dismissWeeklyRecap;
    if (!state.weeklyRecapDismissed) state.weeklyRecapDismissed = {};
    state.weeklyRecapDismissed[cid] = todayKey();
    saveState(); render();
  });
  on("[data-start-suggested]", el => {
    const t = TEMPLATES.find(t2 => t2.id === el.dataset.startSuggested);
    if (!t) return;
    justCompletedId = null; justCompletedIds = [];
    builderOpen = true; builderStep = "customize";
    builderForm = defaultBuilderForm();
    builderForm.templateId = t.id;
    builderForm.name = t.name;
    builderForm.emoji = t.emoji;
    builderForm.mode = t.defaultMode;
    builderForm.weeklyGoal = t.weeklyGoal;
    builderForm.endDate = addDays(builderForm.startDate, t.duration - 1);
    render();
  });
  // Measurement habit input
  document.addEventListener("change", e => {
    if (!e.target.matches("[data-measurement-habit]")) return;
    const habitId  = e.target.dataset.measurementHabit;
    const raw = parseFloat(e.target.value) || 0;
    const inputVal = Math.min(Math.max(0, raw), 9999);
    if (inputVal !== raw) e.target.value = inputVal;
    logMeasurement(habitId, inputVal);
  });
  // Floor stepper buttons (+1/+5/+10)
  document.addEventListener("click", e => {
    const btn = e.target.closest("[data-floor-step]");
    if (!btn) return;
    const habitId = btn.dataset.floorStep;
    const step    = parseInt(btn.dataset.step, 10) || 1;
    const input   = document.querySelector(`[data-distance-habit="${habitId}"]`);
    if (!input) return;
    const newVal = Math.min(9999, (parseFloat(input.value) || 0) + step);
    input.value = newVal;
    const c = currentChallenge();
    const habit = c?.habits.find(h => h.id === habitId);
    if (habit) logDistance(habitId, newVal);
  });
  // Distance habit input — delegated change event (persists across re-renders)
  document.addEventListener("change", e => {
    if (!e.target.matches("[data-distance-habit]")) return;
    const habitId  = e.target.dataset.distanceHabit;
    const raw = parseFloat(e.target.value) || 0;
    const inputVal = Math.min(Math.max(0, raw), 9999);
    if (inputVal !== raw) e.target.value = inputVal;
    // Read the unit selector if present; defaults to global setting
    const unitSel   = document.querySelector(`[data-dist-unit-sel="${habitId}"]`);
    const inputUnit = unitSel?.value || (state.settings.units.distance === "miles" ? "mi" : "km");
    // Convert to km for storage (floor habits are stored as-is)
    const c = currentChallenge();
    const habit = c?.habits.find(h => h.id === habitId);
    const habitUnit = habit?.unit || "km";
    const storeVal  = (habitUnit === "km" && inputUnit === "mi") ? inputVal * 1.60934 : inputVal;
    logDistance(habitId, Math.round(storeVal * 1000) / 1000);
  });
}

function on(sel, fn) {
  // Proper event delegation — works after DOM re-renders because the listener lives on document
  document.addEventListener("click", e => {
    const el = e.target.closest(sel);
    if (el) fn(el, e);
  });
}

// ── Actions ───────────────────────────────────────────────────────────────

function currentChallenge() {
  if (!todayChallengeId) {
    const active = getActiveChallenges();
    if (active.length) todayChallengeId = active[0].id;
  }
  return getChallenge(todayChallengeId);
}

function setMode(mode) {
  const c = currentChallenge(); if (!c) return;
  const dayKey = effectiveDate();
  const isScheduledRest = getDaySchedule(c, dayKey)?.type === "rest";
  if (mode === "rest") {
    const tpl = c.templateId ? TEMPLATES.find(t => t.id === c.templateId) : null;
    if (tpl?.noRestDay) { showToast(`No ${term('restDay')}s on this ${term('challenge')} — that's the point.`); return; }
    const alreadyRest = c.days[dayKey]?.mode === "rest";
    if (!alreadyRest && !isScheduledRest) {
      const used = Object.values(c.days).filter(d => d.mode === "rest" && !d.scheduledRest).length;
      const budget = c.jokerBudget ?? 3;
      if (used >= budget) {
        showToast(`No rest days left — you used all ${budget}. Keep going.`);
        return;
      }
    }
  }
  const day = getChallengeDay(c, dayKey);
  if (mode === "rest" && isScheduledRest) day.scheduledRest = true;
  else if (mode === "standard") day.scheduledRest = false;
  applyMode(c, day, mode);
}

function applyMode(c, day, mode) {
  day.mode = mode;
  if (mode==="rest") day.done = [];
  updateDayPoints(c, day);
  saveState();
  if (mode==="rest") showToast("Rest day set. Streak is safe.");
  checkBadges(c);
  render();
}

function toggleHabit(id) {
  const c = currentChallenge(); if (!c) return;
  const habit = c.habits.find(h=>h.id===id); if (!habit) return;
  const day = getChallengeDay(c, effectiveDate());
  if (day.mode==="rest") return;
  const xpBefore    = state.xp;
  const levelBefore = getLevelInfo(state.xp).level;
  const checking    = !day.done.includes(id);
  if (checking && effectiveDate() === todayKey() && day.streakMult === undefined) {
    day.streakMult = getStreakMultiplier(c);
  }
  if (checking && effectiveDate() === todayKey() && day.comebackBonus === undefined) {
    if (getConsecutiveMisses(c) >= 3) day.comebackBonus = true;
  }
  if (checking) { day.done.push(id); _animHabitId = id; }
  else          { day.done = day.done.filter(x=>x!==id); _animHabitId = null; }
  if (effectiveDate() === todayKey()) {
    const _perfRun = getPerfectRunLength(c, todayKey());
    day.weeklyBonus = (_perfRun > 0 && _perfRun % 7 === 0);
  }
  updateDayPoints(c, day);
  state.xp = recalcXP();
  const xpGain  = state.xp - xpBefore;
  const lvlInfo = getLevelInfo(state.xp);
  const newInfo = completionInfo(c, day);
  if (checking && newInfo.percent === 100 && effectiveDate() === todayKey()) {
    setTimeout(launchConfetti, 250);
  }
  if (lvlInfo.level > levelBefore) {
    const _luT = JOURNEY_THEMES[state.settings.journeyTheme] || JOURNEY_THEMES.frostborn;
    setTimeout(() => { _levelUpOverlay = { level: lvlInfo.level, name: lvlInfo.name, icon: _luT.icon, total: state.xp }; render(); }, 600);
  } else if (xpGain > 0) {
    const mult = day.streakMult || 1;
    const multStr = mult > 1 ? ` 🔥×${mult.toFixed(2)}` : "";
    showToast(`+${xpGain} XP${multStr}`);
  }
  saveState(); navigator.vibrate?.(10);
  _savedFlash = true;
  checkBadges(c);
  checkMilestones(c);
  render();
  setTimeout(() => { _savedFlash = false; render(); }, 1200);
}

function logMeasurement(habitId, value) {
  const c = currentChallenge(); if (!c) return;
  const habit = c.habits.find(h => h.id === habitId); if (!habit) return;
  if (habit.type !== "measurement") return;
  const day = getChallengeDay(c, effectiveDate());
  if (day.mode === "rest") return;
  if (!day.distances) day.distances = {};
  day.distances[habitId] = value;
  if (value > 0) {
    if (effectiveDate() === todayKey() && day.streakMult === undefined) day.streakMult = getStreakMultiplier(c);
    if (effectiveDate() === todayKey() && day.comebackBonus === undefined && getConsecutiveMisses(c) >= 3) day.comebackBonus = true;
    if (!day.done.includes(habitId)) { day.done.push(habitId); _animHabitId = habitId; }
  } else {
    day.done = day.done.filter(id => id !== habitId);
    _animHabitId = null;
  }
  if (effectiveDate() === todayKey()) { const _r = getPerfectRunLength(c, todayKey()); day.weeklyBonus = (_r > 0 && _r % 7 === 0); }
  updateDayPoints(c, day);
  state.xp = recalcXP();
  saveState();
  checkBadges(c);
  render();
}

function logDistance(habitId, km) {
  const c = currentChallenge(); if (!c) return;
  const habit = c.habits.find(h => h.id === habitId); if (!habit) return;
  if (habit.type !== "distance") return;
  const day = getChallengeDay(c, effectiveDate());
  if (day.mode === "rest") return;
  if (!day.distances) day.distances = {};
  day.distances[habitId] = habit.unit === "floors" ? Math.round(km) : km;
  if (km > 0) {
    if (effectiveDate() === todayKey() && day.streakMult === undefined) day.streakMult = getStreakMultiplier(c);
    if (effectiveDate() === todayKey() && day.comebackBonus === undefined && getConsecutiveMisses(c) >= 3) day.comebackBonus = true;
    if (!day.done.includes(habitId)) { day.done.push(habitId); _animHabitId = habitId; }
  } else {
    day.done = day.done.filter(id => id !== habitId);
    _animHabitId = null;
  }
  if (effectiveDate() === todayKey()) { const _r = getPerfectRunLength(c, todayKey()); day.weeklyBonus = (_r > 0 && _r % 7 === 0); }
  updateDayPoints(c, day);
  state.xp = recalcXP();
  saveState();
  checkBadges(c);
  checkMilestones(c);
  render();
}

function selectTier(habitId, rawVal) {
  const c = currentChallenge(); if (!c) return;
  const habit = c.habits.find(h=>h.id===habitId); if (!habit) return;
  const day = getChallengeDay(c, effectiveDate());
  if (day.mode==="rest") return;
  const val = isNaN(Number(rawVal)) ? rawVal : Number(rawVal);
  if (!day.tiers) day.tiers = {};
  const selecting = String(day.tiers[habitId]) !== String(val);
  if (selecting && effectiveDate() === todayKey() && day.streakMult === undefined) {
    day.streakMult = getStreakMultiplier(c);
  }
  if (!selecting) {
    day.tiers[habitId] = null;
    day.done = day.done.filter(id=>id!==habitId);
    _animHabitId = null;
  } else {
    day.tiers[habitId] = val;
    if (!day.done.includes(habitId)) day.done.push(habitId);
    _animHabitId = habitId;
  }
  updateDayPoints(c, day);
  const xpBefore2    = state.xp;
  const levelBefore2 = getLevelInfo(state.xp).level;
  state.xp = recalcXP();
  const xpGain2   = state.xp - xpBefore2;
  const lvlInfo2  = getLevelInfo(state.xp);
  const newInfo2  = completionInfo(c, day);
  if (selecting && newInfo2.percent === 100 && effectiveDate() === todayKey()) {
    setTimeout(launchConfetti, 250);
  }
  if (lvlInfo2.level > levelBefore2) {
    const _luT2 = JOURNEY_THEMES[state.settings.journeyTheme] || JOURNEY_THEMES.frostborn;
    setTimeout(() => { _levelUpOverlay = { level: lvlInfo2.level, name: lvlInfo2.name, icon: _luT2.icon, total: state.xp }; render(); }, 600);
  } else if (xpGain2 > 0) {
    const mult2 = day.streakMult || 1;
    const multStr2 = mult2 > 1 ? ` 🔥×${mult2.toFixed(2)}` : "";
    showToast(`+${xpGain2} XP${multStr2}`);
  }
  saveState(); navigator.vibrate?.(10);
  checkBadges(c); checkMilestones(c); render();
}

function markRecovered() {
  const c = currentChallenge(); if (!c) return;
  const day = getChallengeDay(c, effectiveDate());
  day.recovered = true;
  updateDayPoints(c, day);
  saveState(); sheetOpen=false;
  showToast("Comeback complete. Tomorrow we go again.");
  checkBadges(c); render();
}

function logWeight() {
  const wVal = Number(document.getElementById("weight-input").value);
  const bfVal = document.getElementById("bf-input").value;
  const swVal = document.getElementById("start-input").value;
  const gwVal = document.getElementById("goal-input").value;
  if (swVal!=="") state.bodyTracking.startWeight = Number(swVal);
  if (gwVal!=="") state.bodyTracking.goalWeight  = Number(gwVal);
  if (!Number.isFinite(wVal)||wVal<=0) { showToast("Enter a weight first."); saveState(); render(); return; }
  const bodyFat  = bfVal===""?null:Number(bfVal);
  const leanMass = bodyFat!=null&&Number.isFinite(bodyFat)?Number((wVal*(1-bodyFat/100)).toFixed(1)):null;
  const waistRaw = document.getElementById("waist-input")?.value;
  const hipsRaw  = document.getElementById("hips-input")?.value;
  const waist    = waistRaw ? Number(waistRaw) : null;
  const hips     = hipsRaw  ? Number(hipsRaw)  : null;
  const entry = { date:todayKey(), weight:Number(wVal.toFixed(1)), bodyFat, leanMass, waist, hips };
  const idx = state.bodyTracking.entries.findIndex(e=>e.date===todayKey());
  if (idx>=0) state.bodyTracking.entries[idx]=entry; else state.bodyTracking.entries.push(entry);
  if (!state.bodyTracking.startWeight) state.bodyTracking.startWeight=Number(wVal.toFixed(1));
  saveState();
  // Check weight badges across all active challenges
  getActiveChallenges().forEach(c => checkBadges(c));
  showToast(leanMass?`Logged. Lean mass: ${leanMass} ${state.settings.units.weight}.`:"Logged.");
  render();
}

function logTodayWeight() {
  const wEl = document.getElementById("twl-weight");
  if (!wEl) return;
  const wVal = Number(wEl.value);
  if (!Number.isFinite(wVal) || wVal <= 0) { showToast("Enter a valid weight."); return; }
  const entry = { date: todayKey(), weight: Number(wVal.toFixed(1)), bodyFat: null, leanMass: null, waist: null, hips: null };
  const idx = state.bodyTracking.entries.findIndex(e => e.date === todayKey());
  if (idx >= 0) state.bodyTracking.entries[idx] = entry; else state.bodyTracking.entries.push(entry);
  if (!state.bodyTracking.startWeight) state.bodyTracking.startWeight = Number(wVal.toFixed(1));
  saveState();
  getActiveChallenges().forEach(c => checkBadges(c));
  showToast(`Weight logged: ${wVal} ${state.settings.units.weight}`);
  render();
}

function saveSettings() {
  const nameEl = document.getElementById("s-name");
  if (nameEl) state.settings.name = nameEl.value.trim();
  saveState(); scheduleReminder(); showToast("Settings saved."); render();
}

function saveReminderTime() {
  const el = document.getElementById("reminder-time");
  if (!el || !el.value) return;
  state.settings.reminderTime = el.value;
  saveState(); scheduleReminder();
  showToast("Reminder set for " + el.value); render();
}

function selectTemplate(id) {
  const template = id==="custom" ? null : TEMPLATES.find(t=>t.id===id);
  builderForm.templateId = id==="custom" ? null : id;
  builderForm.name  = template ? template.name  : "";
  builderForm.emoji = template ? template.emoji : "🎯";
  builderForm.mode  = template ? template.defaultMode : "soft";
  builderForm.weeklyGoal = template ? template.weeklyGoal : 100;
  builderForm.endDate = addDays(builderForm.startDate, (template?template.duration:30)-1);
  builderForm.habits = [];
  // Custom challenges always go straight to customize; templates get the quickstart screen
  builderStep = (id === "custom") ? "customize" : "quickstart";
  render();
}

function renderBuilderQuickstart() {
  const template = TEMPLATES.find(t => t.id === builderForm.templateId);
  if (!template) { builderStep = "customize"; render(); return ""; }
  const tier = TEMPLATE_TIERS[template.id] || "common";
  const td   = TIERS[tier];
  const dur  = diffDays(builderForm.startDate, builderForm.endDate) + 1;
  const habits = template.habits.slice(0, 5);
  const xpTheme  = JOURNEY_THEMES[state.settings.journeyTheme] || JOURNEY_THEMES.frostborn;
  const weeklyXP = template.habits.reduce((sum, h) => sum + (h.points || 2), 0) * 7;
  return `
  <div class="builder-quickstart">
    <div class="bqs-hero">
      <div class="bqs-emoji"><i class="ti ${challengeIcon(template)}"></i></div>
      <div class="bqs-tier" style="color:${td.color}">${td.label}</div>
      <div class="bqs-name">${esc(template.name)}</div>
      <div class="bqs-meta">${dur} days · starts today</div>
    </div>
    <div class="bqs-habits">
      ${habits.map(h => `<div class="bqs-habit-row">✓ ${esc(h.title)}</div>`).join("")}
      ${template.habits.length > 5 ? `<div class="bqs-habit-row" style="color:var(--text-faint)">+ ${template.habits.length - 5} more ${term('habitPlural')}</div>` : ""}
    </div>
    <div class="bqs-desc">${esc(template.description)}</div>
    ${TEMPLATE_SAFETY[template.id] ? `<div class="bqs-safety-warning"><span class="bqs-safety-icon"><i class="ti ti-alert-triangle"></i></span><span>${TEMPLATE_SAFETY[template.id]}</span></div>` : ""}
    <div class="bqs-xp-row">
      <i class="ti ${xpTheme.icon}"></i> Earn ~<strong>${weeklyXP.toLocaleString()} XP</strong> per week logging every ${term('habit')}
    </div>
    <div class="bqs-mode-note">
      ${template.defaultMode === "soft"
        ? "<i class=\"ti ti-bulb\"></i> <strong>Soft mode</strong> — one grace day per week if life gets in the way."
        : "<i class=\"ti ti-bolt\"></i> <strong>Strict mode</strong> — no missed days. Zero compromise."}
    </div>
    <div class="builder-cta-footer">
      <button class="primary-button" data-start-challenge>Start ${dur}-Day ${term('challenge')}</button>
      <button class="secondary-button" style="margin-top:8px" data-quickstart-customise>Customise first →</button>
      <button class="link-btn" style="margin-top:10px;text-align:center;display:block" data-builder-back>← Choose a different ${term('challenge')}</button>
    </div>
  </div>`;
}

function startChallenge(safetyConfirmed = false, multiConfirmed = false) {
  const nameEl       = document.getElementById("bf-name");
  const startEl      = document.getElementById("bf-start");
  const endEl        = document.getElementById("bf-end");
  const ongoingEl    = document.getElementById("bf-ongoing");
  const goalWeightEl = document.getElementById("bf-goalweight");
  if (nameEl)       builderForm.name      = nameEl.value.trim();
  if (startEl)      builderForm.startDate = startEl.value;
  if (ongoingEl)    builderForm.noEndDate = ongoingEl.checked;
  if (endEl && !builderForm.noEndDate) builderForm.endDate = endEl.value;
  if (builderForm.noEndDate) builderForm.endDate = "9999-12-31";
  if (goalWeightEl?.value) builderForm.goalWeight = parseFloat(goalWeightEl.value) || null;
  if (!builderForm.startDate) { showToast("Set a start date."); return; }
  if (!builderForm.noEndDate && !builderForm.endDate) { showToast("Set an end date or enable Ongoing."); return; }
  const template = builderForm.templateId ? TEMPLATES.find(t=>t.id===builderForm.templateId) : null;
  const habitCount = template ? template.habits.length : builderForm.habits.length;
  if (habitCount === 0) { showToast(`Add at least one ${term('habit')} first.`); return; }
  if (!safetyConfirmed && template && TEMPLATE_SAFETY[template.id]) {
    _safetyPendingTemplateId = template.id;
    render();
    return;
  }
  if (!multiConfirmed) {
    const active = getActiveChallenges();
    if (active.length > 0) {
      const msg = active.length === 1
        ? `You already have "${active[0].name}" running. Starting another splits your focus. Continue anyway?`
        : `You already have ${active.length} ${term('challengePlural')} running. Starting another splits your focus. Continue anyway?`;
      showConfirm(msg, () => startChallenge(true, true));
      return;
    }
  }
  _safetyPendingTemplateId = null;
  const c = createChallenge(builderForm);
  todayChallengeId = c.id;
  builderOpen = false;
  activeTab = "today";
  showToast(`${c.name} started!`);
  trackEvent("Challenge Started", { challenge: c.name, template: builderForm.templateId || "custom" });
  if (_skipAccountAfterStart && !CloudSync.isSignedIn) {
    _skipAccountAfterStart = false;
    _obAuthMode = "signup";
    _obAuthError = "";
    onboardingStep = 7;
    render(); return;
  }
  _skipAccountAfterStart = false;
  render();
}

function addCustomHabit() {
  const emoji = (document.getElementById("nh-emoji")?.value||"⭐").trim()||"⭐";
  const name  = (document.getElementById("nh-name")?.value||"").trim();
  if (!name) { showToast(`Enter an ${term('habit')} name.`); return; }

  if (builderForm.newHabitType === "tiered") {
    const tiers = builderForm.newHabitTiers.map((t, i) => ({
      label:  (document.getElementById(`nh-tier-${i}-label`)?.value || t.label || `Tier ${i+1}`).trim() || `Tier ${i+1}`,
      value:  i,
      points: Math.max(1, Math.min(20, Number(document.getElementById(`nh-tier-${i}-pts`)?.value) || t.points)),
    }));
    if (tiers.filter(t => t.label).length < 2) { showToast("Fill in at least 2 tier labels."); return; }
    builderForm.habits.push({ id:uid(), title:name, emoji, quip:"", type:"tiered", points:tiers[0].points, tiers });
  } else {
    const pts = Math.max(1, Math.min(20, Number(document.getElementById("nh-pts")?.value)||2));
    builderForm.habits.push({ id:uid(), title:name, emoji, quip:"", type:"binary", points:pts });
  }

  builderForm.newHabitEmoji  = "⭐";
  builderForm.newHabitName   = "";
  builderForm.newHabitPoints = 2;
  builderForm.newHabitType   = "binary";
  builderForm.newHabitTiers  = [{ label:"", points:1 }, { label:"", points:2 }, { label:"", points:3 }];
  render();
}

function removeCustomHabit(i) {
  builderForm.habits.splice(i,1);
  render();
}

function saveEditChallenge() {
  const c = getChallenge(editChallengeId); if (!c) return;
  const name  = document.getElementById("ec-name")?.value.trim();
  const emoji = document.getElementById("ec-emoji")?.value.trim();
  const start = document.getElementById("ec-start")?.value;
  const end   = document.getElementById("ec-end")?.value;
  if (!start || !end || start > end) { showToast("Check your dates."); return; }
  if (name)  c.name       = name;
  if (emoji) c.emoji      = emoji;
  c.startDate  = start;
  c.endDate    = end;
  c.mode       = editForm?.mode || c.mode;

  // ── Apply habit changes ──────────────────────────────────────────────────
  if (editForm?.habits) {
    const newHabitIds = new Set(editForm.habits.map(h => h.id));
    // Strip deleted habits from every logged day
    for (const day of Object.values(c.days)) {
      day.done  = day.done.filter(id => newHabitIds.has(id));
      if (day.tiers) {
        for (const id of Object.keys(day.tiers)) {
          if (!newHabitIds.has(id)) delete day.tiers[id];
        }
      }
      if (day.distances) {
        for (const id of Object.keys(day.distances)) {
          if (!newHabitIds.has(id)) delete day.distances[id];
        }
      }
      // Recalculate stored pts for this day
      updateDayPoints(c, day);
    }
    c.habits = editForm.habits;
    if (c.habits.length === 0) { showToast(`Add at least one ${term('habit')}.`); return; }
  }

  state.xp = recalcXP();
  saveState();
  checkBadges(c);
  editChallengeId = null;
  editForm        = null;
  viewChallengeId = c.id;
  showToast(`${term('challenge')} updated ✓`);
  render();
}

function pauseChallenge(id) {
  const c = getChallenge(id); if (!c) return;
  if (c.status === "paused") {
    // Resuming: push end date forward by however many days it was paused
    const pausedOn = c.pausedOn || todayKey();
    const daysPaused = Math.max(0, diffDays(pausedOn, todayKey()));
    if (daysPaused > 0) c.endDate = addDays(c.endDate, daysPaused);
    c.pausedDays = (c.pausedDays || 0) + daysPaused;
    c.status = "active";
    delete c.pausedOn;
    showToast(`${term('challenge')} resumed. End date moved to ${c.endDate}.`);
    saveState(); render();
  } else {
    c.status = "paused";
    c.pausedOn = todayKey();
    c.resumeReminderDate = null;
    saveState(); render();
    showPrompt("Set a resume reminder? (days from now)", "7", (val) => {
      const days = parseInt(val || "0", 10);
      const ch = getChallenge(id); if (!ch) return;
      if (days > 0) {
        ch.resumeReminderDate = addDays(todayKey(), days);
        showToast(`Paused. Reminder set for ${ch.resumeReminderDate}.`);
      } else {
        showToast(`${term('challenge')} paused. End date adjusts when you resume.`);
      }
      saveState();
    });
  }
}

function abandonChallenge(id) {
  const c = getChallenge(id); if (!c) return;
  showConfirm(
    `Abandon "${c.name}"? Progress is kept but the ${term('challenge')} will be marked as failed.`,
    () => {
      c.finalStreak = calcChallengeStreak(c);
      c.status = "failed";
      saveState(); viewChallengeId = null;
      showToast(`${term('challenge')} abandoned.`); render();
    }
  );
}

function exportHealthCSV(challenge) {
  const mHabits = challenge.habits.filter(h => h.type === "measurement");
  if (!mHabits.length) return;
  const resolveUnit = h => h.unit === "weight" ? (state.settings.units.weight || "kg") : (h.unit || "");
  const cols = mHabits.map(h => `"${h.title} (${resolveUnit(h)})"`).join(",");
  const rows = [`Date,${cols}`];
  const sortedDays = Object.entries(challenge.days)
    .filter(([k]) => /^\d{4}-\d{2}-\d{2}$/.test(k))
    .sort(([a],[b]) => a.localeCompare(b));
  for (const [date, day] of sortedDays) {
    const vals = mHabits.map(h => {
      const v = day.distances?.[h.id];
      return (v != null && v > 0) ? v : "";
    });
    if (vals.some(v => v !== "")) rows.push(`${date},${vals.join(",")}`);
  }
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${challenge.name.replace(/[^a-z0-9]/gi,"-")}-health-data.csv`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function deleteChallenge(id) {
  const c = getChallenge(id); if (!c) return;
  showConfirm(
    `Delete "${c.name}"? All progress will be permanently removed.`,
    () => {
      delete state.challenges[id];
      saveState(); viewChallengeId = null;
      showToast(`${term('challenge')} deleted.`); render();
    }
  );
}

function useStreakFreeze() {
  const c = currentChallenge(); if (!c) return;
  if ((c.streakFreezes || 0) <= 0) { showToast(`No ${term('streak')} freezes available.`); return; }
  const yesterday = addDays(todayKey(), -1);
  if (yesterday < c.startDate) { showToast(`Nothing to freeze — ${term('challenge')} just started.`); return; }
  const day = getChallengeDay(c, yesterday);
  if (dayLogged(day)) { showToast("Yesterday is already logged — no freeze needed."); return; }
  day.freezeUsed = true;
  c.streakFreezes--;
  saveState();
  showToast("Streak freeze applied! Yesterday is covered. Streak protected.");
  render();
}

async function captureProgressPhoto(habitId) {
  const input = document.createElement("input");
  input.type = "file"; input.accept = "image/*"; input.capture = "environment";
  Object.assign(input.style, { position:"absolute", width:"1px", height:"1px", opacity:"0", pointerEvents:"none" });
  document.body.appendChild(input);
  input.onchange = async e => {
    const file = e.target.files?.[0];
    document.body.removeChild(input);
    if (!file) return;
    showToast("Saving photo…");
    const c = currentChallenge(); if (!c) return;
    const dateKey = effectiveDate();
    try {
      const dataURL = await compressPhoto(file);
      if (!dataURL) { showToast("Couldn't process photo — try again."); return; }
      await PhotoDB.set(`${c.id}_${dateKey}`, dataURL);
      const day = getChallengeDay(c, dateKey);
      if (!day.done.includes(habitId)) {
        day.done.push(habitId); _animHabitId = habitId;
        updateDayPoints(c, day); state.xp = recalcXP(); saveState(); checkBadges(c);
      }
      showToast("Progress photo saved!");
      render();
    } catch(err) { showToast("Couldn't save photo — try again."); }
  };
  input.click();
}

function compressPhoto(file) {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxDim = 480;
      const ratio  = Math.min(maxDim / img.width, maxDim / img.height, 1);
      canvas.width  = Math.round(img.width  * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

function saveNote() {
  const c = currentChallenge(); if (!c) return;
  const day = getChallengeDay(c, effectiveDate());
  const el = document.getElementById("day-note");
  if (!el) return;
  day.note = el.value;
  saveState();
}

// Returns true if the challenge is in soft mode AND yesterday was a missed day
// (meaning the grace day is "live" and today's log matters to keep the streak)
function graceUsedYesterday(challenge) {
  if (challenge.mode !== "soft") return false;
  if (dayLogged(challenge.days[todayKey()])) return false;  // today already logged — no warning needed
  const yesterday = addDays(todayKey(), -1);
  if (yesterday < challenge.startDate) return false;
  const yDay = challenge.days[yesterday];
  if (dayLogged(yDay)) return false;  // yesterday was logged, no grace in play
  // Only show warning if streak is still running (day before yesterday was logged, or it's only day 2)
  const twoDaysAgo = addDays(todayKey(), -2);
  if (twoDaysAgo < challenge.startDate) return true; // day 2: yesterday missed from first day
  const twoDay = challenge.days[twoDaysAgo];
  return dayLogged(twoDay);
}

// ── Confetti ──────────────────────────────────────────────────────────────

function launchConfetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const colors = ["var(--primary)","var(--secondary)","var(--warning)","var(--text)"];
  const count = 48;
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "confetti-piece";
    el.style.cssText = [
      `left:${Math.random() * 100}vw`,
      `width:${6 + Math.random() * 6}px`,
      `height:${8 + Math.random() * 8}px`,
      `background:${colors[Math.floor(Math.random() * colors.length)]}`,
      `animation-duration:${0.9 + Math.random() * 1.1}s`,
      `animation-delay:${Math.random() * 0.5}s`,
    ].join(";");
    document.body.appendChild(el);
    el.addEventListener("animationend", () => el.remove());
  }
}

// ── Utilities ─────────────────────────────────────────────────────────────

function showToast(msg) {
  const stack = document.getElementById("toast-stack");
  if (!stack) return;
  // Cap simultaneous toasts so badge bursts don't stack endlessly
  while (stack.children.length >= 3) stack.removeChild(stack.firstChild);
  const el = document.createElement("div");
  el.className = "toast"; el.textContent = msg;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

function currentGreeting(challenge, dayNumber, streak) {
  const totalHabits = Object.values(state.challenges).reduce((sum, c) =>
    sum + Object.values(c.days).reduce((s, d) => s + (d.done?.length || 0), 0), 0);
  const h = new Date().getHours();
  const t = h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
  // Streak-based (highest priority — most motivating)
  if (streak >= 50) return `<i class="ti ti-flame"></i> ${streak}-day ${term('streak')}. You are in the 1%.`;
  if (streak >= 30) return `<i class="ti ti-bolt"></i> ${streak} days straight. Most people never get here.`;
  if (streak >= 21) return `<i class="ti ti-trophy"></i> ${streak} days. The average person quits at day 12. You didn't.`;
  if (streak >= 14) return `<i class="ti ti-flame"></i> ${streak} in a row. The week-one graveyard is behind you.`;
  if (streak >= 7)  return `<i class="ti ti-bolt"></i> ${streak}-day ${term('streak')}. Discipline is forming. Don't stop now.`;
  if (streak >= 3)  return `<i class="ti ti-flame"></i> ${streak} days in a row. The ${term('streak')} is real.`;
  // Data-driven on total habits logged
  if (totalHabits >= 200) return `${totalHabits} ${term('habitPlural')} kept. You're not the same person you were.`;
  if (totalHabits >= 100) return `${totalHabits} ${term('habitPlural')} kept. 100 small decisions that add up.`;
  if (totalHabits >= 50)  return `${totalHabits} ${term('habitPlural')} kept. You've built more than you realise.`;
  // Day-number narrative
  if (dayNumber === 1) return `Day 1. Every legend has a first day. Make it count.`;
  if (dayNumber <= 3)  return `Day ${dayNumber} — the hardest days are the first ones. You're in them.`;
  if (dayNumber <= 7)  return `Day ${dayNumber} — still in the building phase. Trust the process.`;
  if (dayNumber >= 21) return `Day ${dayNumber}. Most people never make it this far.`;
  if (dayNumber >= 14) return `Day ${dayNumber}. The ${term('streak')} is building. Keep the chain unbroken.`;
  // Time-of-day fallback
  if (t === "morning")   return `Good morning. The mission continues.`;
  if (t === "afternoon") return `Good afternoon. Close it out strong.`;
  return `Good evening. One more day in the books.`;
}

function isAfterSix() { return new Date().getHours()>=18; }
function formatDate(d,opts) { return new Intl.DateTimeFormat(undefined,opts).format(d); }
function pickRandom(arr,n) { return [...arr].sort(()=>Math.random()-0.5).slice(0,n); }
function esc(s) { return String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;"); }

// ── Notifications ────────────────────────────────────────────────────────

function scheduleReminder() {
  clearTimeout(reminderTimeout);
  if (!state.settings.reminderEnabled) return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const [h, m] = (state.settings.reminderTime || "20:00").split(":").map(Number);
  const now = new Date();
  const fire = new Date(now);
  fire.setHours(h, m, 0, 0);
  if (fire <= now) fire.setDate(fire.getDate() + 1);
  reminderTimeout = setTimeout(() => { fireReminder(); scheduleReminder(); }, fire - now);
}

function fireReminder() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const incomplete = getActiveChallenges().filter(c => {
    const d = c.days[todayKey()];
    return !d || completionInfo(c, d).percent < 100;
  });
  if (!incomplete.length) return;
  const names = incomplete.length === 1
    ? incomplete[0].name
    : `${incomplete.length} ${term('challengePlural')}`;
  new Notification(`Conqur — Protect your ${term('streak')}`, {
    body: `${names}: you still have ${term('habitPlural')} left for today.`,
    icon: "/icons/icon-192.svg",
    tag: "conqur-daily",
    renotify: true,
  });
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) { showToast("Notifications aren't supported in this browser."); return; }
  const timeInput = document.getElementById("notif-time-input");
  if (timeInput?.value) { state.settings.reminderTime = timeInput.value; saveState(); }
  const perm = await Notification.requestPermission();
  if (perm === "granted") {
    state.settings.reminderEnabled = true;
    saveState();
    scheduleReminder();
    showToast("Reminders on! You'll be nudged at " + state.settings.reminderTime);
  } else {
    state.settings.reminderEnabled = false;
    saveState();
    showToast("Permission denied. Enable notifications in your browser settings.");
  }
  render();
}

// ── Auto-update System ────────────────────────────────────────────────────

async function clearAppCaches() {
  if (!("caches" in window)) return;
  const keys = await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith("cruise-mode-")||k.startsWith("conqur-")).map(k=>caches.delete(k)));
}

function reloadForUpdate() {
  if (sessionStorage.getItem("conqur_reloaded")===APP_VERSION) return;
  sessionStorage.setItem("conqur_reloaded", APP_VERSION);
  window.location.reload();
}

async function applyAppUpdate(next) {
  console.info(`Conqur update: ${APP_VERSION} → ${next}`);
  await clearAppCaches();
  if ("serviceWorker" in navigator) {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) await reg.update();
  }
  reloadForUpdate();
}

let _lastUpdateCheckTime = 0;

async function checkForAppUpdate() {
  _lastUpdateCheckTime = Date.now();
  try {
    const r = await fetch(`/app-version.json?t=${Date.now()}`,{cache:"no-store"});
    if (!r.ok) return;
    const info = await r.json();
    if (info.version && info.version!==APP_VERSION) await applyAppUpdate(info.version);
  } catch(e) { console.warn("Update check failed",e); }
}

function startUpdateChecks() {
  if (!("fetch" in window)) return;
  checkForAppUpdate();
  setInterval(checkForAppUpdate, UPDATE_CHECK_MS);
  // Throttle: skip visibility-triggered checks that happen within 5 min of the last one
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      if (Date.now() - _lastUpdateCheckTime > 5 * 60 * 1000) checkForAppUpdate();
      scheduleReminder();
    } else {
      flushCloudPush();  // app backgrounded — don't let a fresh log wait out the debounce
    }
  });
  window.addEventListener("pagehide", flushCloudPush);
}

// ── Boot ──────────────────────────────────────────────────────────────────

if ("serviceWorker" in navigator && location.protocol!=="file:") {
  window.addEventListener("load",()=>{
    navigator.serviceWorker.register("/sw.js")
      .then(r=>r.update())
      .catch(e=>console.warn("SW failed",e));
  });
  navigator.serviceWorker.addEventListener("message",event=>{
    if (event.data?.type==="APP_UPDATED" && event.data.version!==APP_VERSION) reloadForUpdate();
  });
  navigator.serviceWorker.addEventListener("controllerchange", reloadForUpdate);
}

function setDynamicIcon() {
  const link = document.querySelector("link[rel='icon']");
  if (!link) return;
  const cs = getComputedStyle(document.documentElement);
  const c1 = cs.getPropertyValue("--primary").trim()   || "#38BDF8";
  const c2 = cs.getPropertyValue("--secondary").trim() || "#7DD3FC";
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs><rect width="192" height="192" rx="42" fill="#000"/><circle cx="96" cy="96" r="76" fill="none" stroke="#111" stroke-width="11"/><circle cx="96" cy="96" r="76" fill="none" stroke="url(#g)" stroke-width="11" stroke-linecap="round" stroke-dasharray="358 120" transform="rotate(-90 96 96)"/><text x="96" y="96" text-anchor="middle" dominant-baseline="central" font-family="'Lato',system-ui,sans-serif" font-weight="900" font-size="88" fill="url(#g)">C</text></svg>`;
  link.href=`data:image/svg+xml,${encodeURIComponent(svg)}`;
}

startUpdateChecks();
updateChallengeStatuses();
// Migration: badge system V2 — universal/lifetime/template architecture replaces single flat list
if (!state.migrations["badgeSystemV2"]) {
  for (const c of Object.values(state.challenges)) { c.badges = []; }
  state.globalBadges = [];
  for (const c of Object.values(state.challenges)) {
    if (Object.keys(c.days).length > 0) checkBadges(c);
  }
  state.migrations["badgeSystemV2"] = true;
  saveState();
}
// Migration: XP system — calculate initial XP from all existing challenge data
if (!state.migrations["xpSystemV1"]) {
  state.xp = recalcXP();
  state.migrations["xpSystemV1"] = true;
  saveState();
}
// Migration: recalculate all cached d.pts after bonus formula change (bonus now only for 3+ habit challenges)
if (!state.migrations["dPtsRecalcV1"]) {
  for (const c of Object.values(state.challenges)) {
    for (const day of Object.values(c.days)) updateDayPoints(c, day);
  }
  state.xp = recalcXP();
  state.migrations["dPtsRecalcV1"] = true;
  saveState();
}
// Migration: fix expedition challenges with unreachable weeklyGoal of 20 (max achievable is 7)
if (!state.migrations["expeditionGoalV1"]) {
  for (const c of Object.values(state.challenges)) {
    if (c.habits.length === 1 && c.habits[0].type === "distance" && c.weeklyGoal === 20) {
      c.weeklyGoal = 5;
    }
  }
  state.migrations["expeditionGoalV1"] = true;
  saveState();
}
// Show onboarding for truly new users (no challenges, never migrated)
if (!Object.keys(state.challenges).length && !state.migrations["cruiseModeImport_v1"]) {
  onboardingStep = 0;
}
// Monday new-week ceremony
checkNewWeekCeremony();
// PWA install prompt capture
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); _pwaInstallPrompt = e; });
saveState();
scheduleReminder();
setDynamicIcon();
CloudSync.init();

// ── Network status — offline banner + auto-retry on reconnect ─────────────
window.addEventListener("offline", () => { _isOffline = true; render(); });
window.addEventListener("online",  () => {
  _isOffline = false;
  _lastSyncError = false;
  if (CloudSync.isSignedIn) CloudSync.push();
  else render();
});

// ── History API: Android swipe-back stays inside the app ──────────────────
// Push a dummy history entry so the first "back" gesture pops state instead
// of navigating the browser away from the PWA.
function _pushAppState() {
  history.pushState({ conqur: true }, "");
}
function _isInSubview() {
  return !!(viewChallengeId || editChallengeId || builderOpen || settingsOpen);
}
_pushAppState(); // initial entry
window.addEventListener("popstate", () => {
  if (_isInSubview()) {
    // Navigate back to the main view instead of leaving
    viewChallengeId = null; editChallengeId = null;
    builderOpen = false; settingsOpen = false; editForm = null;
    render();
  } else {
    // Already at root — re-push so the next back also stays in app
    activeTab = "today";
    todayChallengeId = "__all__";
    render();
  }
  _pushAppState();
});

render();
