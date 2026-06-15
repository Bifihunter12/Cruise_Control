"use strict";

const APP_VERSION = "2026.06.14.12";
const STORAGE_KEY = "conqur_v1";
const OLD_KEY     = "cruise_mode_v1";
const RING_CIRC   = 2 * Math.PI * 90;
const UPDATE_CHECK_MS = 30 * 60 * 1000;

// ── XP Level System ──────────────────────────────────────────────────────────
const XP_LEVELS = [
  { level: 1,  name: "Rookie",               xp: 0      },
  { level: 2,  name: "Wanderer",             xp: 100    },
  { level: 3,  name: "Trailblazer",          xp: 250    },
  { level: 4,  name: "Scout",                xp: 500    },
  { level: 5,  name: "Ranger",               xp: 900    },
  { level: 6,  name: "Climber",              xp: 1500   },
  { level: 7,  name: "Adventurer",           xp: 2300   },
  { level: 8,  name: "Ice Breaker",          xp: 3400   },
  { level: 9,  name: "Mountaineer",          xp: 6000   },
  { level: 10, name: "Storm Rider",          xp: 8000   },
  { level: 11, name: "Blizzard Born",        xp: 10500  },
  { level: 12, name: "Crevasse Jumper",      xp: 13500  },
  { level: 13, name: "Altitude Master",      xp: 17000  },
  { level: 14, name: "Peak Hunter",          xp: 21000  },
  { level: 15, name: "Snow Titan",           xp: 26000  },
  { level: 16, name: "Elite Climber",        xp: 32000  },
  { level: 17, name: "Summit Seeker",        xp: 39000  },
  { level: 18, name: "Mountain Legend",      xp: 47000  },
  { level: 19, name: "The Immortal",         xp: 56000  },
  { level: 20, name: "The Untouchable",      xp: 66000  },
  { level: 21, name: "Summit Overlord",      xp: 78000  },
  { level: 22, name: "Mountain Champion",    xp: 92000  },
  { level: 23, name: "Everest Bound",        xp: 108000 },
  { level: 24, name: "Everest Champion",     xp: 126000 },
  { level: 25, name: "Conqueror of Everest", xp: 147000 },
];

// ── Journey Themes ─────────────────────────────────────────────────────────
const JOURNEY_THEMES = {
  mountain: {
    label: "Mountain", emoji: "🏔️", tagline: "Conquer the Summit",
    levels: [
      "Rookie","Wanderer","Trailblazer","Scout","Ranger","Climber","Adventurer",
      "Pathfinder","Mountaineer","Storm Rider","Iron Will","Blizzard Survivor",
      "Altitude Master","Ridge Walker","Summit Seeker","Above the Clouds",
      "Ice Axe","Death Zone","Near the Top","Final Push",
      "Summit Reached","The Conqueror","Everest Bound","Everest Champion","Conqueror of Everest",
    ],
  },
  astronaut: {
    label: "Astronaut", emoji: "🚀", tagline: "Reach for the Stars",
    levels: [
      "Space Dreamer","Mission Candidate","Cadet","Flight Trainee","Mission Specialist",
      "Launch Ready","Countdown","Orbit Reached","Spacewalker","Orbit Master",
      "Moon Bound","Lunar Approach","Moon Walker","Deep Space Pioneer","Asteroid Belt",
      "Jupiter Bound","Outer Rim","Mars Approach","Mars Orbit","Mars Landing",
      "Red Planet Pioneer","Mars Colony","Mars Legend","First Martian","First on Mars",
    ],
  },
  martial: {
    label: "Martial Arts", emoji: "🥋", tagline: "Master Your Mind",
    levels: [
      "White Belt","Yellow Belt","Orange Belt","Green Belt","Blue Belt",
      "Purple Belt","Red Belt","Brown Belt","Black Belt","1st Dan",
      "Iron Fist","Silent Mind","Dragon Spirit","Tiger Heart","Storm Breaker",
      "Shadow Walker","Unbroken","The Sensei","Shihan","Hanshi",
      "Iron Legend","Ancient Master","The Soke","Hall of Champions","Grandmaster",
    ],
  },
  viking: {
    label: "Viking", emoji: "⚔️", tagline: "Legend of the Sagas",
    levels: [
      "Thrall","Freeman","Skald","Huscarl","Shield-Brother",
      "Berserker","Raider","Sea Wolf","Jarl's Guard","Bloodhawk",
      "War Chief","Drakkar Captain","Valhalla Seeker","Thor's Chosen","Jotun Slayer",
      "Saga Writer","Odin's Eye","Ragnarok Survivor","Jarl","High Jarl",
      "Warlord","King of the North","Allfather's Chosen","Einherjar","Legend of the Sagas",
    ],
  },
  ocean: {
    label: "Ocean Diver", emoji: "🌊", tagline: "Descend to the Deep",
    levels: [
      "Beach Walker","Snorkeler","Surface Diver","Open Water Diver","Advanced Diver",
      "Rescue Diver","Night Diver","Deep Diver","Cave Explorer","Wreck Diver",
      "Reef Master","Coral Guardian","Pelagic Diver","Abyss Seeker","Twilight Zone",
      "Midnight Zone","Deep Sea Pioneer","Hadal Explorer","Pressure Tested","Trench Walker",
      "Abyss Master","Shadow of the Deep","Mariana Bound","Mariana Champion","Mariana Legend",
    ],
  },
};

function getThemedLevelName(levelNum) {
  const theme = JOURNEY_THEMES[state?.settings?.journeyTheme] || JOURNEY_THEMES.mountain;
  return theme.levels[levelNum - 1] || XP_LEVELS[levelNum - 1]?.name || "";
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

function recalcXP() {
  let total = 0;
  for (const challenge of Object.values(state.challenges)) {
    for (const day of Object.values(challenge.days)) {
      total += completionInfo(challenge, day).points || 0;
    }
  }
  return total;
}

// ── WoW-style Rarity Tiers ────────────────────────────────────────────────
const TIERS = {
  common:    { label:"Common",    color:"#86efac", border:"#86efac" }, // soft green
  uncommon:  { label:"Uncommon",  color:"#1eff00", border:"#1eff00" }, // WoW classic green
  rare:      { label:"Rare",      color:"#4da6ff", border:"#4da6ff" }, // WoW blue
  epic:      { label:"Epic",      color:"#c070ff", border:"#c070ff" }, // WoW purple
  legendary: { label:"Legendary", color:"#ff8c00", border:"#ff8c00" }, // WoW orange/gold
};

// Plain-English descriptions of each tier for the builder
const TIER_DESC = {
  common:    "Beginner-friendly",
  uncommon:  "Requires consistency",
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
  // Intermediate — consistent effort or existing fitness base needed
  "running":"intermediate","cycling":"intermediate","yoga-flexibility":"intermediate",
  "core-abs":"intermediate","strength":"intermediate","30-pushups":"intermediate",
  "30-squats":"intermediate","30-plank":"intermediate","spin":"intermediate",
  "12-3-30":"intermediate","5k-prep":"intermediate","protein-challenge":"intermediate",
  "weight-loss-30":"intermediate","body-composition":"intermediate",
  "glucose-control":"intermediate",
  "everest-bc":"intermediate","everest-stairmaster":"intermediate","thames-row":"intermediate",
  // Advanced — high consistency demands or health-sensitive protocols
  "75-soft":"advanced","10k-prep":"advanced","run-streak":"advanced",
  "cold-exposure":"advanced","half-marathon-prep":"advanced",
  "cruise-control":"advanced","intermittent-fasting":"advanced",
  "monk-mode":"advanced","project-50":"advanced",
  "camino":"advanced","route66":"advanced","raid-pyrenees":"advanced",
  "danube-row":"advanced","comrades-ultra":"advanced","appalachian":"advanced",
  "tour-de-france":"advanced",
  // Extreme — elite output, multi-month commitment, or medical risk
  "75-hard":"extreme","marathon-training":"extreme",
  "ironman-703":"extreme","ironman-full":"extreme",
  "tough-mudder":"extreme","spartan-race":"extreme",
  "utmb":"extreme","run-5-marathons":"extreme","run-jogle":"extreme",
  "run-trans-america":"extreme","trans-am-bike":"extreme","pct":"extreme",
  "amazon-river":"extreme",
};
const DIFF_LABEL = { beginner:"Beginner", intermediate:"Intermediate", advanced:"Advanced", extreme:"Extreme" };
const DIFF_COLOR = { beginner:"#4caf50", intermediate:"#ff9800", advanced:"#f44336", extreme:"#9c27b0" };

// Safety warnings for high-risk or health-sensitive challenges
const TEMPLATE_SAFETY = {
  "intermittent-fasting": "Not suitable if you are pregnant, have a history of eating disorders, take diabetes medication, or have any chronic illness. Consult your doctor before starting.",
  "cold-exposure": "Never combine breathwork with cold water immersion — risk of fainting or drowning. Breathe normally during cold showers or plunges.",
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
};

// Challenge template → tier
const TEMPLATE_TIERS = {
  // ── Common: 30-day-or-less lifestyle, beginner-friendly
  "dry-month":"common","reading":"common","creative":"common",
  "meditation":"common","sleep-reset":"common","yoga-flexibility":"common",
  "digital-detox":"common","walking":"common","journaling":"common",
  // ── Uncommon: 30-day fitness / requires real consistency
  "30-pushups":"uncommon","dog-walk":"uncommon","cycling":"uncommon",
  "running":"uncommon","strength":"uncommon","no-sugar":"uncommon",
  "morning-routine":"uncommon","core-abs":"uncommon",
  // ── Rare: mentally demanding, 75-day, or short expedition
  "cold-exposure":"rare","intermittent-fasting":"rare",
  "75-soft":"rare","everest-bc":"rare","monk-mode":"rare",
  // ── Epic: strict 75-day, 86-day transformation, long expeditions
  "75-hard":"epic","cruise-control":"epic","camino":"epic","tour-de-france":"epic",
  // ── Legendary: year-long or extreme challenges
  "appalachian":"legendary","route66":"legendary",
  "amazon-river":"legendary","everest-stairmaster":"legendary","pct":"legendary",
  "run-trans-america":"legendary","trans-am-bike":"legendary",
  // ── Epic: demanding multi-month expeditions
  "run-jogle":"epic","danube-row":"epic",
  // ── Rare: shorter expedition routes
  "run-5-marathons":"rare","raid-pyrenees":"rare","thames-row":"rare",
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
  "ironman-703":"epic","ironman-full":"legendary",
  // ── Epic expedition
  "utmb":"epic",
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
    duration: 30, weeklyGoal: 120, defaultMode: "soft", noRestDay: true,
    habits: [
      { id:"yoga",      title:"Morning yoga",              emoji:"🧘", quip:"Sets the tone for everything after.",      type:"binary", points:2 },
      { id:"steps",     title:"Steps",                     emoji:"👟", quip:"8k / 10k / 15k steps.",                  type:"tiered", points:2,
        tiers:[{value:8,label:"8k",points:2},{value:10,label:"10k",points:3},{value:15,label:"15k",points:4}] },
      { id:"protein",   title:"Protein at every meal",     emoji:"🥩", quip:"Protein keeps the muscle, drops the fat.", type:"binary", points:2 },
      { id:"water",     title:"Drink 3L water",            emoji:"💧", quip:"Most hunger is just thirst.",              type:"binary", points:2 },
      { id:"noalcohol", title:"No alcohol or liquid cals", emoji:"🚫", quip:"Empty calories in every form. Skip them.", type:"binary", points:2 },
      { id:"sleep",     title:"7+ hours sleep",            emoji:"🌙", quip:"Sleep is the real supplement.",            type:"binary", points:2 },
      { id:"read",      title:"Read 10 pages",             emoji:"📖", quip:"10 pages a day is a book a month.",       type:"binary", points:2 },
      { id:"run",       title:"Run session",               emoji:"🏃", quip:"Push your pace. Every km counts.",        type:"tiered",  points:2,
        tiers:[{value:1,label:"1 km",points:2},{value:3,label:"3 km",points:3},{value:5,label:"5 km",points:5},{value:"5+",label:"5 km+",points:7}] },
    ]
  },
  {
    id: "75-hard", name: "75 Hard", emoji: "💪", category: "transformation",
    description: "The original mental toughness program. 75 days. Zero compromises.",
    duration: 75, weeklyGoal: 98, defaultMode: "strict", noRestDay: true,
    habits: [
      { id:"w1",       title:"Workout 1 — 45 min",          emoji:"🏋️", quip:"First session done.",               type:"binary", points:3 },
      { id:"w2",       title:"Workout 2 — 45 min outdoors", emoji:"🌤️", quip:"Outdoor. No exceptions.",            type:"binary", points:3 },
      { id:"water4l",  title:"Drink 4L water",              emoji:"💧", quip:"Non-negotiable.",                    type:"binary", points:2 },
      { id:"diet",     title:"Follow diet. No cheat meals.",emoji:"🥗", quip:"No alcohol. No cheat meals.",        type:"binary", points:2 },
      { id:"read10",   title:"Read 10 pages (non-fiction)", emoji:"📖", quip:"10 pages of growth.",               type:"binary", points:2 },
      { id:"photo",    title:"Progress photo",              emoji:"📸", quip:"Document the change.",               type:"binary", points:1 },
    ]
  },
  {
    id: "75-soft", name: "75 Soft", emoji: "🧘", category: "transformation",
    description: "The balanced version. 75 days of consistent, sustainable habits.",
    duration: 75, weeklyGoal: 70, defaultMode: "soft",
    habits: [
      { id:"workout",  title:"Workout 45 min",                  emoji:"🏃", quip:"Move your body.",               type:"binary", points:3 },
      { id:"water3l",  title:"Drink 3L water",                  emoji:"💧", quip:"Most hunger is just thirst.",   type:"binary", points:2 },
      { id:"diet75s",  title:"Eat well (1 social meal/wk ok)",  emoji:"🥗", quip:"Balanced, not perfect.",        type:"binary", points:2 },
      { id:"read10s",  title:"Read 10 pages",                   emoji:"📖", quip:"10 pages a day.",              type:"binary", points:2 },
    ]
  },
  {
    id: "30-pushups", name: "30-Day Push-Up", emoji: "💥", category: "movement",
    description: "Build upper body strength. Start at 10, end at 100.",
    duration: 30, weeklyGoal: 70, defaultMode: "strict",
    habits: [
      { id:"pushups",  title:"Daily push-ups",              emoji:"💪", quip:"Do your push-ups.",                 type:"binary", points:5 },
      { id:"sleep30",  title:"8+ hours sleep",              emoji:"🌙", quip:"Muscles grow at night.",            type:"binary", points:2 },
      { id:"prot30",   title:"Protein at every meal",       emoji:"🥩", quip:"Feed the muscle.",                 type:"binary", points:2 },
    ]
  },
  {
    id: "dry-month", name: "Dry Month", emoji: "🥃", category: "lifestyle",
    description: "30 days, zero alcohol. Feel the difference.",
    duration: 30, weeklyGoal: 80, defaultMode: "strict",
    habits: [
      { id:"noalc",    title:"No alcohol",                  emoji:"🚫", quip:"Not today.",                        type:"binary", points:4 },
      { id:"water30",  title:"Drink 2L water",              emoji:"💧", quip:"Replace the empty with essential.", type:"binary", points:2 },
      { id:"sleep30d", title:"7+ hours sleep",              emoji:"🌙", quip:"Sleep is better sober anyway.",    type:"binary", points:2 },
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
      { id:"dw-dist",    title:"Walk distance",             emoji:"📍", quip:"Short is fine. Going is everything.", type:"tiered", points:2,
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
      { id:"cy-water",   title:"Hydration 2L",              emoji:"💧", quip:"Drink before you're thirsty.",       type:"binary", points:2 },
    ]
  },
  {
    id: "walking", name: "Walking Challenge", emoji: "🚶", category: "movement",
    description: "30 days of daily walking. The simplest habit with the biggest returns.",
    duration: 30, weeklyGoal: 80, defaultMode: "soft",
    habits: [
      { id:"wk-dist",    title:"Daily walk",                emoji:"👟", quip:"Every step counts.",                 type:"tiered", points:2,
        tiers:[{value:2,label:"2 km",points:2},{value:5,label:"5 km",points:3},{value:8,label:"8 km",points:4},{value:10,label:"10 km+",points:6}] },
      { id:"wk-morning", title:"Morning walk before work",  emoji:"🌅", quip:"Before the world gets loud.",       type:"binary", points:2 },
      { id:"wk-phone",   title:"Walk without your phone",   emoji:"📵", quip:"Just you and your thoughts.",       type:"binary", points:2 },
      { id:"wk-stairs",  title:"Take the stairs all day",   emoji:"🏢", quip:"Small choices add up.",             type:"binary", points:1 },
    ]
  },
  {
    id: "running", name: "Running Challenge", emoji: "🏃", category: "movement",
    description: "30 days of running. Build the habit, find the pace, feel the difference.",
    duration: 30, weeklyGoal: 100, defaultMode: "strict",
    habits: [
      { id:"rn-run",     title:"Run session",               emoji:"👟", quip:"Shoes on. Door open. Go.",           type:"tiered", points:3,
        tiers:[{value:1,label:"1 km",points:3},{value:3,label:"3 km",points:4},{value:5,label:"5 km",points:6},{value:10,label:"10 km+",points:9}] },
      { id:"rn-stretch", title:"Post-run stretch",          emoji:"🧘", quip:"Skipping this is how injuries happen.", type:"binary", points:2 },
      { id:"rn-water",   title:"Hydration 2L",              emoji:"💧", quip:"Runners dehydrate fast.",            type:"binary", points:1 },
      { id:"rn-sleep",   title:"Sleep 7+ hours",            emoji:"🌙", quip:"You grow between the runs.",         type:"binary", points:2 },
    ]
  },
  {
    id: "creative", name: "Creative Challenge", emoji: "🎨", category: "lifestyle",
    description: "30 days of daily creative practice. Write, draw, build, make — just create something.",
    duration: 30, weeklyGoal: 70, defaultMode: "soft",
    habits: [
      { id:"cr-create",  title:"Create something today",    emoji:"✨", quip:"It doesn't have to be good. It has to exist.", type:"binary", points:4 },
      { id:"cr-idea",    title:"Brainstorm 10 ideas",       emoji:"💡", quip:"Most will be bad. That's the point.", type:"binary", points:2 },
      { id:"cr-study",   title:"Study your craft",          emoji:"📚", quip:"The greats never stop learning.",    type:"binary", points:2 },
      { id:"cr-noscroll",title:"No mindless scrolling",     emoji:"📵", quip:"Consumption kills creation.",        type:"binary", points:2 },
    ]
  },
  {
    id: "strength", name: "Strength Training", emoji: "🏋️", category: "movement",
    description: "30 days of consistent lifting. Build the habit, then build the muscle.",
    duration: 30, weeklyGoal: 90, defaultMode: "strict",
    habits: [
      { id:"st-lift",    title:"Lift session",              emoji:"🏋️", quip:"Show up. Lift. Repeat.",               type:"binary", points:5 },
      { id:"st-protein", title:"Protein at every meal",     emoji:"🥩", quip:"Muscle is built in the kitchen too.",  type:"binary", points:2 },
      { id:"st-sleep",   title:"8+ hours sleep",            emoji:"🌙", quip:"Muscle grows when you sleep.",         type:"binary", points:2 },
      { id:"st-stretch", title:"Post-lift stretch",         emoji:"🦵", quip:"Skipping this is how injuries happen.",type:"binary", points:1 },
    ]
  },
  {
    id: "meditation", name: "Meditation", emoji: "🧘", category: "lifestyle",
    description: "30 days of daily stillness. Calm the mind, sharpen the focus.",
    duration: 30, weeklyGoal: 70, defaultMode: "soft",
    habits: [
      { id:"med-sit",    title:"Meditate 10 min",           emoji:"🧘", quip:"10 minutes. Eyes closed. Phone away.", type:"binary", points:4 },
      { id:"med-breath", title:"Breathing exercise",        emoji:"💨", quip:"4-7-8 or box breathing. Just breathe.",type:"binary", points:2 },
      { id:"med-screen", title:"No screens 1h before bed",  emoji:"📵", quip:"Protect your sleep and mind.",         type:"binary", points:2 },
      { id:"med-journal",title:"Gratitude journal",         emoji:"✍️", quip:"Three things. Two minutes.",           type:"binary", points:2 },
    ]
  },
  {
    id: "cold-exposure", name: "Cold Exposure", emoji: "🧊", category: "transformation",
    description: "30 days of cold showers. Builds mental resilience like nothing else.",
    duration: 30, weeklyGoal: 75, defaultMode: "strict",
    habits: [
      { id:"ce-cold",    title:"Cold shower",               emoji:"🧊", quip:"Get in. Don't think about it.",        type:"binary", points:5 },
      { id:"ce-breath",  title:"Breathwork (Wim Hof)",      emoji:"💨", quip:"Breathe deep before you go cold.",     type:"binary", points:2 },
      { id:"ce-reflect", title:"Post-session reflection",   emoji:"🧠", quip:"Hardship processed becomes growth.",   type:"binary", points:2 },
    ]
  },
  {
    id: "sleep-reset", name: "Sleep Reset", emoji: "😴", category: "lifestyle",
    description: "21 days to fix your sleep. Consistent schedule, no screens, real rest.",
    duration: 21, weeklyGoal: 80, defaultMode: "strict",
    habits: [
      { id:"sl-hours",   title:"8+ hours sleep",            emoji:"🌙", quip:"Non-negotiable.",                      type:"binary", points:4 },
      { id:"sl-screen",  title:"No screens after 9pm",      emoji:"📵", quip:"Blue light kills melatonin.",          type:"binary", points:3 },
      { id:"sl-caffeine",title:"No caffeine after 2pm",     emoji:"☕", quip:"It stays in your system 6+ hours.",    type:"binary", points:2 },
      { id:"sl-routine", title:"Same wake-up time",         emoji:"⏰", quip:"Consistency locks the rhythm.",        type:"binary", points:2 },
    ]
  },
  {
    id: "no-sugar", name: "No Sugar", emoji: "🚫🍬", category: "lifestyle",
    description: "30 days without added sugar. Clearer skin, better energy, no crashes.",
    duration: 30, weeklyGoal: 75, defaultMode: "strict",
    habits: [
      { id:"ns-nosugar",  title:"Zero added sugar today",    emoji:"🚫", quip:"Read the label. It's in everything.",   type:"binary", points:5 },
      { id:"ns-water",    title:"Drink 2L water",            emoji:"💧", quip:"Cravings are often just dehydration.",  type:"binary", points:2 },
      { id:"ns-fruit",    title:"Eat whole fruit (no juice)",emoji:"🍎", quip:"Fibre intact. Spike avoided.",          type:"binary", points:1 },
      { id:"ns-label",    title:"Read every food label",     emoji:"🔍", quip:"Knowledge is the weapon.",             type:"binary", points:1 },
    ]
  },
  {
    id: "morning-routine", name: "Morning Routine", emoji: "🌅", category: "lifestyle",
    description: "30 days of owning the first hour. Win the morning, win the day.",
    duration: 30, weeklyGoal: 80, defaultMode: "soft",
    habits: [
      { id:"mr-wake",     title:"Wake up on time — no snooze",emoji:"⏰", quip:"First decision of the day. Make it right.", type:"binary", points:3 },
      { id:"mr-move",     title:"Move your body (10 min)",    emoji:"🏃", quip:"Anything counts. Don't overthink it.",  type:"binary", points:3 },
      { id:"mr-nophone",  title:"No phone for first 30 min",  emoji:"📵", quip:"Protect your mind before the world gets in.", type:"binary", points:2 },
      { id:"mr-hydrate",  title:"Drink water before coffee",  emoji:"💧", quip:"You wake up dehydrated every time.",   type:"binary", points:1 },
      { id:"mr-journal",  title:"Write 3 priorities for today",emoji:"📓",quip:"Clear mind. Clear direction.",          type:"binary", points:2 },
    ]
  },
  {
    id: "yoga-flexibility", name: "Yoga & Flexibility", emoji: "🧘‍♀️", category: "movement",
    description: "30 days of daily yoga and stretching. Move better, recover faster, feel lighter.",
    duration: 30, weeklyGoal: 70, defaultMode: "soft",
    habits: [
      { id:"yf-yoga",     title:"Yoga session (20 min+)",     emoji:"🧘", quip:"Show up to the mat. That's the whole job.", type:"binary", points:4 },
      { id:"yf-stretch",  title:"Full-body stretch (10 min)", emoji:"🦵", quip:"Tight muscles are slow muscles.",        type:"binary", points:2 },
      { id:"yf-breathe",  title:"Breathwork (5 min)",         emoji:"💨", quip:"Breath controls everything else.",       type:"binary", points:2 },
      { id:"yf-hydrate",  title:"Hydration 2L",               emoji:"💧", quip:"Flexibility and dehydration don't mix.",  type:"binary", points:1 },
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
    duration: 30, weeklyGoal: 80, defaultMode: "strict",
    habits: [
      { id:"if-fast",     title:"16-hour fast completed",     emoji:"⏱️", quip:"The window is the whole game.",          type:"binary", points:5 },
      { id:"if-water",    title:"Drink water during fast",    emoji:"💧", quip:"Water, black coffee, and tea only.",     type:"binary", points:2 },
      { id:"if-nosnack",  title:"No snacking outside window", emoji:"🚫", quip:"Discipline between meals matters.",      type:"binary", points:2 },
      { id:"if-protein",  title:"Protein-first meal",         emoji:"🥩", quip:"Break the fast right.",                  type:"binary", points:1 },
    ]
  },
  {
    id: "core-abs", name: "Core & Abs", emoji: "🔥", category: "movement",
    description: "30 days of daily core work. Planks, crunches, leg raises — build real strength.",
    duration: 30, weeklyGoal: 80, defaultMode: "strict",
    habits: [
      { id:"ca-core",     title:"Core workout (15 min)",      emoji:"💪", quip:"15 minutes. No excuses.",                type:"binary", points:5 },
      { id:"ca-plank",    title:"2-min plank hold",           emoji:"⏱️", quip:"The plank is honest.",                   type:"binary", points:2 },
      { id:"ca-protein",  title:"Protein at every meal",      emoji:"🥩", quip:"Muscle needs fuel.",                     type:"binary", points:2 },
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
    duration: 30, weeklyGoal: 120, defaultMode: "strict",
    habits: [
      { id:"mm-focus",   title:"Deep work — 2 hours",    emoji:"💻", quip:"Two hours. Zero distractions. Phone off.",        type:"binary", points:5 },
      { id:"mm-nosocial",title:"No social media",        emoji:"📵", quip:"Your attention is your most valuable asset.",      type:"binary", points:3 },
      { id:"mm-learn",   title:"Deliberate learning — 1h",emoji:"📚",quip:"One hour of intentional study every day.",        type:"binary", points:3 },
      { id:"mm-move",    title:"Move your body",         emoji:"🏃", quip:"The mind needs a body that moves.",               type:"binary", points:2 },
      { id:"mm-reflect", title:"Evening reflection",     emoji:"✍️", quip:"What did you build today?",                       type:"binary", points:2 },
    ]
  },

  // ── Endurance Sport Training ─────────────────────────────────────────────
  {
    id: "half-marathon-prep", name: "Half Marathon Prep", emoji: "🏃", category: "endurance",
    description: "12 weeks to race day. Build your base, sharpen your speed, and cross that finish line.",
    duration: 84, weeklyGoal: 75, defaultMode: "soft",
    habits: [
      { id:"hm-run",    title:"Run session",          emoji:"🏃", quip:"Every km counts.",                         type:"binary", points:5 },
      { id:"hm-xt",     title:"Cross-train",          emoji:"🚴", quip:"Swim, bike, yoga — anything non-run.",      type:"binary", points:3 },
      { id:"hm-stretch",title:"Stretch & recover",    emoji:"🦵", quip:"Tight hips = slower times.",               type:"binary", points:2 },
      { id:"hm-sleep",  title:"Sleep 8+ hours",       emoji:"🌙", quip:"Sleep is the best performance drug.",       type:"binary", points:2 },
      { id:"hm-fuel",   title:"Eat & hydrate clean",  emoji:"🥗", quip:"Fuel the engine right.",                   type:"binary", points:3 },
    ]
  },
  {
    id: "marathon-training", name: "Marathon Training", emoji: "🏅", category: "endurance",
    description: "16 weeks of structured training to get you to the 42.2 km finish line.",
    duration: 112, weeklyGoal: 70, defaultMode: "soft",
    habits: [
      { id:"mt-run",    title:"Run session",           emoji:"🏃", quip:"Miles in the bank.",                       type:"binary", points:5 },
      { id:"mt-xt",     title:"Cross-train",           emoji:"🏊", quip:"Active recovery is still recovery.",       type:"binary", points:3 },
      { id:"mt-stretch",title:"Stretch & foam roll",   emoji:"🦵", quip:"15 min saves your IT bands.",              type:"binary", points:2 },
      { id:"mt-sleep",  title:"Sleep 8+ hours",        emoji:"🌙", quip:"Legs rebuild at night.",                   type:"binary", points:2 },
      { id:"mt-fuel",   title:"Fuel & hydrate",        emoji:"🍌", quip:"Carbs are your friend on long-run days.",  type:"binary", points:3 },
    ]
  },
  {
    id: "ironman-703", name: "Ironman 70.3", emoji: "🏊", category: "endurance",
    description: "20 weeks of swim, bike, run. Half the distance — all the glory.",
    duration: 140, weeklyGoal: 70, defaultMode: "soft",
    habits: [
      { id:"703-swim",   title:"Swim session",         emoji:"🏊", quip:"Smooth strokes save energy.",              type:"binary", points:5 },
      { id:"703-bike",   title:"Bike session",         emoji:"🚴", quip:"The bike is where races are won.",         type:"binary", points:5 },
      { id:"703-run",    title:"Run session",          emoji:"🏃", quip:"Hold form when it hurts.",                 type:"binary", points:5 },
      { id:"703-recover",title:"Recovery & stretch",   emoji:"🦵", quip:"Three sports means three ways to injure.", type:"binary", points:2 },
      { id:"703-sleep",  title:"Sleep 8+ hours",       emoji:"🌙", quip:"Training stress + sleep = adaptation.",    type:"binary", points:2 },
    ]
  },
  {
    id: "ironman-full", name: "Full Ironman", emoji: "🏅", category: "endurance",
    description: "24 weeks to conquer 3.8 km swim, 180 km bike, and a full marathon. The ultimate endurance test.",
    duration: 168, weeklyGoal: 65, defaultMode: "soft",
    habits: [
      { id:"im-swim",    title:"Swim session",         emoji:"🏊", quip:"Technique beats thrashing every time.",    type:"binary", points:5 },
      { id:"im-bike",    title:"Bike session",         emoji:"🚴", quip:"Ride smart — you still have to run.",      type:"binary", points:5 },
      { id:"im-run",     title:"Run session",          emoji:"🏃", quip:"Brick runs build race-day legs.",          type:"binary", points:5 },
      { id:"im-strength",title:"Strength training",    emoji:"🏋️", quip:"Injury prevention starts in the gym.",    type:"binary", points:3 },
      { id:"im-recover", title:"Recovery protocol",    emoji:"🛁", quip:"Ice bath, compression, elevation.",        type:"binary", points:2 },
      { id:"im-sleep",   title:"Sleep 8+ hours",       emoji:"🌙", quip:"Ironman is built in the hours you sleep.", type:"binary", points:2 },
    ]
  },
  {
    id: "tough-mudder", name: "Tough Mudder Prep", emoji: "🪖", category: "endurance",
    description: "8 weeks to become obstacle-ready. Mud, walls, electric shocks — bring it on.",
    duration: 56, weeklyGoal: 80, defaultMode: "strict",
    habits: [
      { id:"tm-cardio",  title:"Cardio session",       emoji:"🏃", quip:"You'll be running 16–19 km on race day.",  type:"binary", points:5 },
      { id:"tm-strength",title:"Strength & lift",      emoji:"🏋️", quip:"Carry your teammates over walls.",        type:"binary", points:5 },
      { id:"tm-grip",    title:"Grip & obstacle drills",emoji:"🧗", quip:"Monkey bars are harder than they look.",  type:"binary", points:4 },
      { id:"tm-cold",    title:"Cold exposure",        emoji:"🧊", quip:"Ice water is just part of the course.",    type:"binary", points:3 },
      { id:"tm-mental",  title:"No excuses today",     emoji:"🧠", quip:"Mindset separates finishers from quitters.",type:"binary",points:3 },
    ]
  },
  {
    id: "spartan-race", name: "Spartan Race Prep", emoji: "⚔️", category: "endurance",
    description: "12 weeks of OCR training. 30 burpees per missed obstacle — don't miss any.",
    duration: 84, weeklyGoal: 75, defaultMode: "strict",
    habits: [
      { id:"sr-wod",     title:"Spartan WOD",          emoji:"⚔️", quip:"AROO!",                                   type:"binary", points:5 },
      { id:"sr-obstacle",title:"Obstacle conditioning", emoji:"🧗", quip:"Spear throw, rope climb, sandbag carry.", type:"binary", points:4 },
      { id:"sr-run",     title:"Trail or road run",    emoji:"🏃", quip:"Spartans run on rough terrain.",           type:"binary", points:5 },
      { id:"sr-strength",title:"Strength circuit",     emoji:"🏋️", quip:"Burpees count. Weakness does not.",       type:"binary", points:3 },
      { id:"sr-fuel",    title:"Fuel clean",           emoji:"🥩", quip:"Real food only. Spartan diet.",            type:"binary", points:3 },
    ]
  },

  // ── Health Tracking ──────────────────────────────────────────────────────
  {
    id: "weight-loss-30", name: "Weight Loss 30", emoji: "⚖️", category: "health",
    description: "30 days of daily weigh-ins and healthy habits. Track your weight, build the routine.",
    duration: 30, weeklyGoal: 80, defaultMode: "soft",
    habits: [
      { id:"wl-weight",  title:"Log weight",         emoji:"⚖️", quip:"Same time each morning. Consistency beats precision.", type:"measurement", unit:"weight", decimals:1 },
      { id:"wl-deficit", title:"Calorie deficit day", emoji:"🥗", quip:"Eat less than you burn. Simple, not easy.",           type:"binary",      points:5 },
      { id:"wl-exercise",title:"Exercise 30 min",    emoji:"🏃", quip:"Cardio, weights, walk — it all counts.",              type:"binary",      points:5 },
      { id:"wl-water",   title:"Drink 3L water",     emoji:"💧", quip:"Hunger is often thirst in disguise.",                 type:"binary",      points:3 },
      { id:"wl-sleep",   title:"Sleep 8+ hours",     emoji:"🌙", quip:"Sleep deprivation kills fat loss.",                   type:"binary",      points:2 },
    ]
  },
  {
    id: "body-composition", name: "Body Composition", emoji: "📊", category: "health",
    description: "90 days tracking weight, body fat %, and lean muscle mass. Know your numbers.",
    duration: 90, weeklyGoal: 70, defaultMode: "soft",
    habits: [
      { id:"bc-weight",  title:"Log weight",         emoji:"⚖️", quip:"Weekly is fine — daily is better.",                  type:"measurement", unit:"weight",  decimals:1 },
      { id:"bc-fat",     title:"Log body fat %",     emoji:"📉", quip:"DEXA, calipers, smart scale — pick one and stick to it.", type:"measurement", unit:"%",      decimals:1 },
      { id:"bc-lean",    title:"Log lean mass",      emoji:"💪", quip:"Lean mass = weight × (1 − fat% / 100).",             type:"measurement", unit:"weight",  decimals:1 },
      { id:"bc-protein", title:"Hit protein goal",   emoji:"🥩", quip:"1g per lb of bodyweight. Non-negotiable.",           type:"binary",      points:5 },
      { id:"bc-lift",    title:"Lift session",       emoji:"🏋️", quip:"Muscle doesn't build itself.",                       type:"binary",      points:5 },
    ]
  },
  {
    id: "blood-pressure", name: "Blood Pressure Monitor", emoji: "🩺", category: "health",
    description: "30 days of daily blood pressure logging plus heart-healthy habits. Share the data with your doctor.",
    duration: 30, weeklyGoal: 85, defaultMode: "strict",
    habits: [
      { id:"bp-sys",     title:"Log systolic (top #)",   emoji:"❤️", quip:"Normal: below 120 mmHg.",                        type:"measurement", unit:"mmHg",    decimals:0 },
      { id:"bp-dia",     title:"Log diastolic (bottom #)",emoji:"💙", quip:"Normal: below 80 mmHg.",                        type:"measurement", unit:"mmHg",    decimals:0 },
      { id:"bp-walk",    title:"30-min walk",            emoji:"🚶", quip:"Regular walks lower BP more than most meds.",    type:"binary",      points:5 },
      { id:"bp-sodium",  title:"Low sodium today",       emoji:"🧂", quip:"Under 1,500 mg Na/day for high-BP.",             type:"binary",      points:5 },
      { id:"bp-stress",  title:"Stress management",      emoji:"🧘", quip:"Meditation, breathing, or just a quiet 10 min.", type:"binary",      points:3 },
    ]
  },
  {
    id: "glucose-control", name: "Glucose Control", emoji: "🩸", category: "health",
    description: "60 days of fasting glucose tracking and blood-sugar-friendly habits. Export to share with your doctor.",
    duration: 60, weeklyGoal: 85, defaultMode: "strict",
    habits: [
      { id:"gc-glucose",title:"Log fasting glucose",    emoji:"🩸", quip:"Measure before eating, first thing in the morning.", type:"measurement", unit:"mg/dL",  decimals:0 },
      { id:"gc-lowcarb",title:"Low-carb meals",         emoji:"🥦", quip:"Aim for under 50g net carbs.",                      type:"binary",      points:5 },
      { id:"gc-exercise",title:"Exercise 30 min",       emoji:"🏃", quip:"Muscle is the biggest glucose sink in the body.",    type:"binary",      points:5 },
      { id:"gc-sugar",   title:"No added sugar",        emoji:"🚫", quip:"Check labels. Sugar hides everywhere.",             type:"binary",      points:5 },
      { id:"gc-sleep",   title:"Sleep 8+ hours",        emoji:"🌙", quip:"One bad night raises fasting glucose the next day.",type:"binary",      points:3 },
    ]
  },
  {
    id: "sleep-tracker", name: "Sleep Tracker", emoji: "💤", category: "health",
    description: "30 days of sleep logging plus habits that actually improve sleep quality.",
    duration: 30, weeklyGoal: 85, defaultMode: "strict",
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
    id: "c25k", name: "Couch to 5K", emoji: "🏃", category: "movement",
    description: "9 weeks of run/walk intervals that take beginners from the sofa to a 5K finish line. 3 sessions per week — rest days count too.",
    duration: 63, weeklyGoal: 50, defaultMode: "soft",
    habits: [
      { id:"c25k-run",     title:"Run/walk session",          emoji:"👟", quip:"3 sessions a week. Each one builds the next.",     type:"binary", points:5 },
      { id:"c25k-stretch", title:"Post-session stretch",      emoji:"🦵", quip:"5 minutes now saves weeks of injury later.",       type:"binary", points:2 },
      { id:"c25k-water",   title:"Hydration 2L",              emoji:"💧", quip:"Runners dehydrate faster than they think.",        type:"binary", points:1 },
      { id:"c25k-sleep",   title:"Sleep 7+ hours",            emoji:"🌙", quip:"Legs rebuild at night.",                           type:"binary", points:2 },
    ]
  },
  {
    id: "5k-prep", name: "5K Prep", emoji: "🎽", category: "movement",
    description: "30 days to a faster 5K. Run 4× a week, add strides, and race-day yourself at the end.",
    duration: 30, weeklyGoal: 65, defaultMode: "soft",
    habits: [
      { id:"5k-run",     title:"Run session",             emoji:"🏃", quip:"Shoes on. Door open. Go.",                       type:"tiered", points:3,
        tiers:[{label:"Easy 20 min",pts:3},{label:"Tempo 30 min",pts:5},{label:"Interval session",pts:7}] },
      { id:"5k-strides", title:"Strides after easy runs", emoji:"⚡", quip:"6 × 20-second pick-ups. More speed than you think.", type:"binary", points:2 },
      { id:"5k-stretch", title:"Post-run stretch",        emoji:"🦵", quip:"Tight calves slow you down. Fix them.",             type:"binary", points:2 },
      { id:"5k-sleep",   title:"Sleep 7+ hours",          emoji:"🌙", quip:"Speed adaptations happen in deep sleep.",            type:"binary", points:2 },
    ]
  },
  {
    id: "10k-prep", name: "10K Prep", emoji: "🏅", category: "movement",
    description: "45 days to your best 10K. Build weekly mileage, sharpen with intervals, and trust the process.",
    duration: 45, weeklyGoal: 65, defaultMode: "soft",
    habits: [
      { id:"10k-run",    title:"Run session",            emoji:"🏃", quip:"Every kilometre is a deposit.",                       type:"tiered", points:3,
        tiers:[{label:"Easy 30 min",pts:3},{label:"Tempo 40 min",pts:5},{label:"Long run 60+ min",pts:7}] },
      { id:"10k-xt",     title:"Cross-train",            emoji:"🚴", quip:"Bike, swim, or yoga — protect the legs.",             type:"binary", points:2 },
      { id:"10k-stretch",title:"Stretch & foam-roll",    emoji:"🦵", quip:"15 minutes now = fewer physio bills later.",          type:"binary", points:2 },
      { id:"10k-sleep",  title:"Sleep 8+ hours",         emoji:"🌙", quip:"Volume training demands good recovery.",              type:"binary", points:2 },
    ]
  },
  {
    id: "run-streak", name: "Run Streak", emoji: "🔥", category: "movement",
    description: "Run at least 1 mile every day for 30 days. No exceptions. Simple rule, brutal consistency.",
    duration: 30, weeklyGoal: 60, defaultMode: "strict",
    habits: [
      { id:"rs-run",     title:"Run minimum 1 mile",     emoji:"👟", quip:"One mile. Every day. No skipping.",                  type:"tiered", points:4,
        tiers:[{label:"1 mile",pts:4},{label:"3 miles",pts:6},{label:"5+ miles",pts:8}] },
      { id:"rs-log",     title:"Log your mileage",       emoji:"📊", quip:"What gets measured gets improved.",                   type:"binary", points:1 },
      { id:"rs-stretch", title:"Post-run stretch",       emoji:"🦵", quip:"Daily running without stretching is how streaks end.", type:"binary", points:2 },
      { id:"rs-sleep",   title:"Sleep 7+ hours",         emoji:"🌙", quip:"Recovery is part of the streak.",                    type:"binary", points:2 },
    ]
  },
  {
    id: "30-squats", name: "30-Day Squat", emoji: "🦵", category: "movement",
    description: "A progressive squat challenge that takes you from 20 reps to 250 in 30 days. Lower body strength you'll feel.",
    duration: 30, weeklyGoal: 60, defaultMode: "strict",
    habits: [
      { id:"sq-squats",  title:"Daily squats",           emoji:"🦵", quip:"Whatever today's number is — do it.",                type:"tiered", points:4,
        tiers:[{label:"20–50 reps",pts:4},{label:"51–100 reps",pts:6},{label:"100+ reps",pts:8}] },
      { id:"sq-stretch", title:"Hip flexor stretch",     emoji:"🧘", quip:"Squats tighten hips. Undo it daily.",                type:"binary", points:2 },
      { id:"sq-protein", title:"Protein at every meal",  emoji:"🥩", quip:"Quads don't grow on air.",                           type:"binary", points:2 },
      { id:"sq-sleep",   title:"8+ hours sleep",         emoji:"🌙", quip:"Strength is built while you sleep.",                 type:"binary", points:2 },
    ]
  },
  {
    id: "30-plank", name: "30-Day Plank", emoji: "⏱️", category: "movement",
    description: "Progressive plank challenge — from 20 seconds to 5 minutes over 30 days. Core strength you can actually feel.",
    duration: 30, weeklyGoal: 65, defaultMode: "strict",
    habits: [
      { id:"pl-plank",   title:"Daily plank hold",       emoji:"⏱️", quip:"Whatever today's target is — hold it.",              type:"tiered", points:5,
        tiers:[{label:"Under 1 min",pts:5},{label:"1–3 min",pts:7},{label:"3+ min",pts:9}] },
      { id:"pl-core",    title:"Supplemental core (5 min)",emoji:"💪",quip:"Dead bugs, leg raises, bird-dogs. Keep it short.",  type:"binary", points:2 },
      { id:"pl-stretch", title:"Hip flexor stretch",     emoji:"🦵", quip:"Planks compress the hip flexors. Stretch them out.", type:"binary", points:2 },
    ]
  },
  {
    id: "pilates", name: "Pilates Challenge", emoji: "🌸", category: "movement",
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
    description: "Treadmill at 12% incline, 3 mph, for 30 minutes. Every day for 30 days. Simple, brutal, effective.",
    duration: 30, weeklyGoal: 60, defaultMode: "strict",
    habits: [
      { id:"1230-walk",   title:"12-3-30 session",        emoji:"🏔️", quip:"12% incline. 3 mph. 30 minutes. No shortcuts.",    type:"binary", points:6 },
      { id:"1230-water",  title:"Hydration 2L",           emoji:"💧", quip:"You sweat more than you think on that incline.",    type:"binary", points:2 },
      { id:"1230-stretch",title:"Stretch calves & hamstrings",emoji:"🦵",quip:"High incline walks are brutal on calves.",       type:"binary", points:2 },
    ]
  },
  {
    id: "spin", name: "Spin Challenge", emoji: "🚲", category: "movement",
    description: "30 days of indoor cycling. 4–5 sessions per week of high-intensity spinning to build cardio and legs.",
    duration: 30, weeklyGoal: 65, defaultMode: "soft",
    habits: [
      { id:"sp-ride",    title:"Spin session",            emoji:"🚲", quip:"Clip in. Turn up the resistance. Go.",              type:"tiered", points:4,
        tiers:[{label:"20 min recovery",pts:3},{label:"45 min class",pts:5},{label:"60 min hard ride",pts:7}] },
      { id:"sp-water",   title:"Hydration 2L",            emoji:"💧", quip:"You lose a litre in a hard spin class.",            type:"binary", points:2 },
      { id:"sp-stretch", title:"Stretch hips & quads",    emoji:"🦵", quip:"Indoor cycling locks up the hips. Undo it.",       type:"binary", points:2 },
      { id:"sp-fuel",    title:"Carb-up before long ride", emoji:"🍌", quip:"Empty fuel tanks kill performance.",               type:"binary", points:1 },
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
      { id:"pc-water",   title:"Hydration 2L",             emoji:"💧", quip:"High protein diets need more water. Non-negotiable.", type:"binary", points:1 },
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
    duration: 50, weeklyGoal: 75, defaultMode: "strict",
    habits: [
      { id:"p50-move",   title:"Exercise 30 min",         emoji:"🏋️", quip:"Any movement counts. Showing up is the whole job.", type:"binary", points:4 },
      { id:"p50-read",   title:"Read 10 pages",           emoji:"📖", quip:"10 pages a day is a book a month.",                 type:"binary", points:2 },
      { id:"p50-noalc",  title:"No alcohol",              emoji:"🚫", quip:"50 days sober changes your baseline.",               type:"binary", points:3 },
      { id:"p50-water",  title:"Drink 2L water",          emoji:"💧", quip:"Hydration is the cheapest performance hack.",       type:"binary", points:2 },
      { id:"p50-morning",title:"Morning routine complete", emoji:"🌅", quip:"Start before the world gets loud.",                type:"binary", points:3 },
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

  // ── Expedition Routes ────────────────────────────────────────────────────
  {
    id: "everest-bc", name: "Everest Base Camp", emoji: "🏔️", category: "expedition",
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
      { id:"dist", title:"Log distance", emoji:"🏃", quip:"Walk, run, cycle, swim or row — it all counts.", type:"distance", points:1, unit:"km" },
    ],
  },
  {
    id: "camino", name: "Camino de Santiago", emoji: "⛪", category: "expedition",
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
      { id:"dist", title:"Log distance", emoji:"🚶", quip:"Every step brings you closer to Santiago.", type:"distance", points:1, unit:"km" },
    ],
  },
  {
    id: "appalachian", name: "Appalachian Trail", emoji: "🌲", category: "expedition",
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
      { id:"dist", title:"Log distance", emoji:"🥾", quip:"Miles in the legs. Wilderness in the soul.", type:"distance", points:1, unit:"km" },
    ],
  },
  {
    id: "tour-de-france", name: "Tour de France", emoji: "🚴", category: "expedition",
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
      { id:"dist", title:"Log distance", emoji:"🚴", quip:"Clip in. Every km is a stage.", type:"distance", points:1, unit:"km" },
    ],
  },
  {
    id: "route66", name: "Route 66", emoji: "🚗", category: "expedition",
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
      { id:"dist", title:"Log distance", emoji:"🚗", quip:"Get your kicks. Road is open.", type:"distance", points:1, unit:"km" },
    ],
  },
  {
    id: "amazon-river", name: "Amazon River", emoji: "🌿", category: "expedition",
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
      { id:"dist", title:"Log distance", emoji:"🚣", quip:"The river never stops. Neither do you.", type:"distance", points:1, unit:"km" },
    ],
  },
  {
    id: "pct", name: "Pacific Crest Trail", emoji: "🌲", category: "expedition",
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
      { id:"dist", title:"Log distance", emoji:"🥾", quip:"Every step north is progress.", type:"distance", points:1, unit:"km" },
    ],
  },
  {
    id: "everest-stairmaster", name: "Everest StairMaster", emoji: "🏋️", category: "expedition",
    description: "Climb 2,903 floors — the StairMaster equivalent of summiting Mount Everest from sea level. No oxygen tank. No shortcuts.",
    duration: 365, weeklyGoal: 5, defaultMode: "strict", routeKm: 2903.2,
    milestones: [
      { km: 100,  name: "Foothills",             emoji: "⛰️" },
      { km: 500,  name: "Camp I",                emoji: "⛺" },
      { km: 1000, name: "Camp II",               emoji: "🏕️" },
      { km: 1500, name: "Camp III",              emoji: "❄️" },
      { km: 2000, name: "Death Zone",            emoji: "☠️" },
      { km: 2903, name: "Summit — 8,849 m",     emoji: "🏔️" },
    ],
    habits: [
      { id:"floors", title:"Floors climbed today", emoji:"🏢", quip:"One floor at a time. 2,903 to go.", type:"distance", points:1, unit:"floors" },
    ],
  },

  // ── Running Expeditions ──────────────────────────────────────────────────
  {
    id: "comrades-ultra", name: "Comrades Ultra", emoji: "🏃", category: "expedition",
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
      { id:"cu-run", title:"Running", emoji:"🏃", quip:"Every step toward Durban.", type:"distance", unit:"km" },
    ]
  },
  {
    id: "utmb", name: "Ultra Trail du Mont Blanc", emoji: "⛰️", category: "expedition",
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
      { id:"utmb-run", title:"Running", emoji:"🏃", quip:"The mountains are waiting.", type:"distance", unit:"km" },
    ]
  },
  {
    id: "run-5-marathons", name: "5 Marathon Challenge", emoji: "🏃", category: "expedition",
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
      { id:"dist", title:"Log distance", emoji:"🏃", quip:"Every km counts. Log it.", type:"distance", points:1, unit:"km" },
    ],
  },
  {
    id: "run-jogle", name: "Land's End to John o'Groats", emoji: "🏃", category: "expedition",
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
      { id:"dist", title:"Log distance", emoji:"🏃", quip:"North. Always north.", type:"distance", points:1, unit:"km" },
    ],
  },
  {
    id: "run-trans-america", name: "Trans-America Run", emoji: "🏃", category: "expedition",
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
      { id:"dist", title:"Log distance", emoji:"🏃", quip:"Coast to coast. One step at a time.", type:"distance", points:1, unit:"km" },
    ],
  },

  // ── Additional Cycling Expeditions ──────────────────────────────────────
  {
    id: "raid-pyrenees", name: "Raid Pyrénéen", emoji: "🚴", category: "expedition",
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
      { id:"dist", title:"Log distance", emoji:"🚴", quip:"Pedal. Climb. Breathe.", type:"distance", points:1, unit:"km" },
    ],
  },
  {
    id: "trans-am-bike", name: "Trans-America Bike", emoji: "🚴", category: "expedition",
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
      { id:"dist", title:"Log distance", emoji:"🚴", quip:"Every state. Every climb. No shortcuts.", type:"distance", points:1, unit:"km" },
    ],
  },

  // ── Additional Rowing Expeditions ────────────────────────────────────────
  {
    id: "thames-row", name: "Thames Row", emoji: "🚣", category: "expedition",
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
      { id:"dist", title:"Log distance", emoji:"🚣", quip:"Pull. The river knows the way.", type:"distance", points:1, unit:"km" },
    ],
  },
  {
    id: "danube-row", name: "Danube Row", emoji: "🚣", category: "expedition",
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
      { id:"dist", title:"Log distance", emoji:"🚣", quip:"Downstream. Europe unrolling behind you.", type:"distance", points:1, unit:"km" },
    ],
  },
];

// ── Badge Definitions ──────────────────────────────────────────────────────

// Universal badges — earned once across all challenges (tracked in state.globalBadges)
const UNIVERSAL_BADGES = [
  // Streak milestones (best streak across any challenge)
  { id:"u-3d",     label:"✨ Getting Started",   desc:"Reach a 3-day streak in any challenge.",              test: u => u.longestStreak >= 3 },
  { id:"u-7d",     label:"🔥 On Fire",            desc:"7-day streak.",                                       test: u => u.longestStreak >= 7 },
  { id:"u-14d",    label:"🦾 Iron Week",          desc:"14-day streak.",                                      test: u => u.longestStreak >= 14 },
  { id:"u-21d",    label:"🧠 Habit Locked",       desc:"21-day streak. Neurologically, it's a habit now.",   test: u => u.longestStreak >= 21 },
  { id:"u-30d",    label:"💪 Locked In",          desc:"30-day streak.",                                      test: u => u.longestStreak >= 30 },
  { id:"u-60d",    label:"📆 Two Months",         desc:"60-day streak.",                                      test: u => u.longestStreak >= 60 },
  { id:"u-75d",    label:"🏆 75 Streak",          desc:"75 consecutive days. Legendary.",                     test: u => u.longestStreak >= 75 },
  // Points (all-time total across all challenges)
  { id:"u-p10",    label:"⭐ First Points",       desc:"Earn your first 10 points.",                         test: u => u.totalPts >= 10 },
  { id:"u-p100",   label:"💯 Century",            desc:"100 points total.",                                   test: u => u.totalPts >= 100 },
  { id:"u-p500",   label:"🏅 Point Collector",    desc:"500 total points.",                                   test: u => u.totalPts >= 500 },
  { id:"u-p1k",    label:"💜 Elite",              desc:"1,000 total points. Rare.",                           test: u => u.totalPts >= 1000 },
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
  { id:"u-multi",  label:"🔀 Multi-Tasker",       desc:"Run 2 challenges at the same time.",                 test: u => u.activeChallenges >= 2 },
];

// Lifetime achievements — cross-challenge milestones earned once (tracked in state.globalBadges)
const LIFETIME_BADGES = [
  { id:"lt-100h",   label:"📦 100 Habits",         desc:"Log 100 individual habits across all challenges.",  test: l => l.totalHabitsLogged >= 100 },
  { id:"lt-500h",   label:"🔥 500 Habits",         desc:"Log 500 habits total. You're built different.",    test: l => l.totalHabitsLogged >= 500 },
  { id:"lt-5c",     label:"🎖️ Serial Challenger",  desc:"Complete 5 challenges.",                            test: l => l.completedChallenges >= 5 },
  { id:"lt-cats",   label:"🌍 Well Rounded",        desc:"Complete a challenge in all 3 categories.",        test: l => l.allCategoriesDone },
  { id:"lt-wk10",   label:"📊 Consistent",          desc:"Hit the weekly goal 10 times across all challenges.", test: l => l.weeklyGoalsHit >= 10 },
  { id:"lt-perf",   label:"💎 Perfect Run",         desc:"Complete a challenge without a single missed day.", test: l => l.perfectChallenge },
  { id:"lt-freeze", label:"❄️ Ice Age",             desc:"Use a streak freeze to save a streak.",             test: l => l.freezeUsed },
];

// Template-specific badges — 5 per template, only shown/counted for that challenge (tracked in challenge.badges)
const TEMPLATE_BADGES = {
  "cruise-control": [
    { id:"cc-start",    label:"🌊 Day 1 Done",          desc:"Complete 100% on Day 1.",                          test: c => c.dayNumber >= 1 && c.complete },
    { id:"cc-month",    label:"📅 One Month",            desc:"Complete 4 full weeks.",                           test: c => c.completedWeeks >= 4 },
    { id:"cc-halfway",  label:"⚡ Halfway",              desc:"Reach the 43-day mark.",                           test: c => c.pctDone >= 50 },
    { id:"cc-week8",    label:"📆 Two Months",           desc:"Complete 8 full weeks.",                           test: c => c.completedWeeks >= 8 },
    { id:"cc-done",     label:"🔱 86 Days",              desc:"Complete the full 86-day transformation.",         test: c => c.pctDone >= 99 && c.complete },
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
let todayChallengeId = null;
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
let _cloudAuthError   = "";    // error message for cloud auth form (settings)
let _cloudAuthLoading = false; // loading spinner for cloud auth (settings)
let _shareModalChallenge = null;    // challenge shown in share card modal
let _shareModalDone      = false;   // true = challenge completion card, false = streak card
let _shareCardDataUrl    = null;    // cached base64 PNG of the last drawn share card
let _notifNudgeDismissed = false;   // dismissal flag for the Day-3 notification nudge
let builderQuizAnswers   = { goal: null, time: null, level: null };
let _badgeSheetQueue     = [];       // { label, desc, tier } — queued badge celebrations
let _notifPromptVisible  = false;   // post-challenge-start notification prompt
let _templateFilter      = "all";   // "all" | "short" | "medium" | "long"
let _statsCollapsed      = null;    // null = auto (collapse Day 1-2), true/false = user override
let _savedFlash          = false;   // brief "Saved ✓" indicator after habit tap
let _obAuthError      = "";    // error message for onboarding account screen
let _obAuthLoading    = false; // loading spinner for onboarding account screen
let _obAuthMode       = "signup"; // "signup" | "signin" on the account screen
let _cloudPushTimer   = null;  // debounce timer for cloud push
let _skipCloudPush    = false; // prevent redundant push after pull
let reminderTimeout = null;
let _pwaInstallPrompt = null;  // beforeinstallprompt event (PWA install)
let _showInstallBanner = false; // show the PWA install nudge
let _newWeekBanner = null;     // { pts } — Monday new-week ceremony, null when dismissed
let _levelUpOverlay = null;   // { level, name, emoji, total } — full-screen level-up celebration
let _resetConfirm = false;    // shows inline confirm step before wiping all data

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
    _sb().auth.onAuthStateChange((_, session) => {
      this._user = session?.user || null;
      render();
    });
  },

  async signUp(email, password) {
    const { data, error } = await _sb().auth.signUp({ email, password });
    if (error) return { error: error.message };
    this._user = data.user;
    if (data.session) await this.push();
    return {};
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
    try {
      const stateObj = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      await _sb().from("user_data").upsert({
        user_id: this.uid,
        state_json: stateObj,
        updated_at: new Date().toISOString(),
      });
    } catch(e) { console.warn("Cloud push failed:", e); }
  },

  async pull() {
    if (!this.isSignedIn) return;
    try {
      const { data, error } = await _sb()
        .from("user_data")
        .select("state_json")
        .eq("user_id", this.uid)
        .single();
      if (error || !data?.state_json) return;
      const remote = data.state_json;
      if (!remote || typeof remote !== "object" || !("challenges" in remote)) return;
      const merged = normalizeState(remote);
      for (const [id, c] of Object.entries(state.challenges)) {
        if (!merged.challenges[id]) merged.challenges[id] = c;
        else if ((c.totalPts || 0) > (merged.challenges[id].totalPts || 0)) merged.challenges[id] = c;
      }
      _skipCloudPush = true;
      state = merged;
      saveState();
      _skipCloudPush = false;
      render();
      showToast("☁️ Data restored from cloud.");
    } catch(e) { console.warn("Cloud pull failed:", e); }
  },
};
let onboardingStep = null;   // null = done, 0-3 = active step
let bodyHistoryLimit = 5;    // how many history rows to show in Body tab
let _lastViewKey = "";       // for scroll-to-top on navigation changes
let _animHabitId = null;     // habit that just got checked (for pop animation)
let _eventsBound = false;        // event listeners are added once — not re-added on every render
let viewingDate       = null;     // null = today; set to a past dateKey to backfill habits
let challengeDetailView = "weeks"; // "weeks" | "calendar"
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
    mode:       raw.mode === "rest" ? "rest" : "standard", // minimum/boss → standard
    done:       Array.isArray(raw.done) ? raw.done : [],
    recovered:  raw.recovered  === true,
    pts:        typeof raw.pts === "number" ? raw.pts : 0,
    tiers:      (raw.tiers && typeof raw.tiers === "object") ? raw.tiers : {},
    distances:  (raw.distances && typeof raw.distances === "object") ? raw.distances : {},
    note:       typeof raw.note === "string" ? raw.note : "",
    freezeUsed: raw.freezeUsed === true,
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
    habits:     Array.isArray(raw.habits) ? raw.habits.map(normalizeHabit).filter(Boolean) : [],
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
      journeyTheme:    JOURNEY_THEMES[raw.settings?.journeyTheme] ? raw.settings.journeyTheme : "mountain",
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
    migrations:   (raw.migrations && typeof raw.migrations === "object") ? raw.migrations : {},
    xp:           typeof raw.xp === "number" ? raw.xp : 0,
  };
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
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch(e) {
    console.warn("saveState failed (storage quota?):", e);
    showToast("⚠️ Storage full — export a backup to avoid losing data.");
  }
  // Debounced cloud push — 5 s after last save so rapid taps don't spam
  if (!_skipCloudPush && CloudSync.isSignedIn) {
    clearTimeout(_cloudPushTimer);
    _cloudPushTimer = setTimeout(() => CloudSync.push(), 5000);
  }
}

// ── Date Helpers ───────────────────────────────────────────────────────────

function todayKey() { return toKey(new Date()); }
function toKey(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function parseDate(k) { const [y,m,d]=k.split("-").map(Number); return new Date(y,m-1,d); }
function addDays(key, n) { const d=parseDate(key); d.setDate(d.getDate()+n); return toKey(d); }
function diffDays(a, b) { return Math.round((parseDate(b)-parseDate(a))/86400000); }
function clamp(n,lo,hi) { return Math.max(lo,Math.min(hi,n)); }
function uid() { return Math.random().toString(36).slice(2,10); }
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
  const tier = habit.tiers.find(t => String(t.value) === String(tierValue));
  return tier ? tier.points : 0;
}

function completionInfo(challenge, day) {
  // Rest day: treat as 100% complete, 0 pts
  if (day.mode === "rest") return { done: 1, total: 1, percent: 100, points: 0, maxPoints: 0, multiplier: 1 };
  const active = activeHabits(challenge, day);
  const done = day.done.filter(id => active.some(h => h.id === id)).length;
  const total = active.length;
  const multiplier = 1;
  // Completion bonus only applies for challenges with 3+ habits to avoid doubling small challenges
  const bonusAmt = total >= 3 ? 3 : 0;
  const completionBonus = (done === total && total > 0) ? bonusAmt : 0;
  const basePoints = active.reduce((s, h) => {
    if (!day.done.includes(h.id)) return s;
    if (h.type === "tiered") return s + tierPoints(h, day.tiers?.[h.id]);
    return s + h.points;
  }, 0);
  const baseMax = active.reduce((s, h) => {
    if (h.type === "tiered" && h.tiers?.length) return s + Math.max(...h.tiers.map(t => t.points));
    return s + h.points;
  }, 0);
  const points    = Math.round((basePoints + completionBonus) * multiplier);
  const maxPoints = Math.round((baseMax + bonusAmt) * multiplier);
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
  const totalDays = diffDays(challenge.startDate, challenge.endDate) + 1;
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
    habits,
    days: {},
    badges: [],
    createdAt: todayKey(),
  });
  state.challenges[c.id] = c;
  saveState();
  return c;
}

function updateChallengeStatuses() {
  const today = todayKey();
  let changed = false;
  for (const c of Object.values(state.challenges)) {
    if (c.status === "active" && !c.noEndDate && c.endDate < today) {
      c.finalStreak = calcChallengeStreak(c); // snapshot before status changes
      c.status = "completed";
      // Queue — show first one immediately, rest after user dismisses
      if (!justCompletedId) justCompletedId = c.id;
      else justCompletedIds.push(c.id);
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
        if (!justCompletedId) justCompletedId = challenge.id;
        else justCompletedIds.push(challenge.id);
        trackEvent("Challenge Completed", { challenge: challenge.name, days: challenge.duration });
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
    activeChallenges:    getActiveChallenges().length,
  };

  UNIVERSAL_BADGES.forEach(b => {
    if (!state.globalBadges.includes(b.id) && b.test(uCtx)) {
      state.globalBadges.push(b.id);
      _badgeSheetQueue.push({ label: b.label, desc: b.desc || "", tier: "uncommon" });
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
    weeklyGoalsHit: (() => {
      let n = 0;
      for (const c of allChallenges) {
        for (const w of challengeWeeks(c)) {
          const pts = w.days.reduce((s,k) => {
            const d=c.days[k]; return s+(d?completionInfo(c,d).points:0);
          }, 0);
          if (pts >= c.weeklyGoal) n++;
        }
      }
      return n;
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
  const pts = curWeek.days.reduce((s,k) => {
    const d = challenge.days[k]; return s + (d ? completionInfo(challenge,d).points : 0);
  }, 0);
  if (pts >= challenge.weeklyGoal) {
    challenge.streakFreezes = (challenge.streakFreezes || 0) + 1;
    if (!challenge.streakFreezeWeeksAwarded) challenge.streakFreezeWeeksAwarded = [];
    const isFirst = challenge.streakFreezeWeeksAwarded.length === 0;
    challenge.streakFreezeWeeksAwarded.push(weekKey);
    showBigToast("🏅", "Weekly goal hit!", "Streak freeze banked — it protects your streak if you miss a day.");
    if (isFirst) setTimeout(() => showToast("❄️ Streak Freeze: tap the snowflake bar on any day you miss to use it."), 3500);
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
      <div class="luo-burst">${o.emoji}</div>
      <div class="luo-badge">LEVEL UP</div>
      <div class="luo-level">${o.level}</div>
      <div class="luo-name">${o.name}</div>
      <div class="luo-total">${o.total.toLocaleString()} XP total</div>
      <button class="primary-button luo-cta" data-close-levelup>Keep going 🔥</button>
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
      showBigToast("✅", "Day 1 done.", "Come back tomorrow. Your streak starts now.");
      if (_pwaInstallPrompt && !localStorage.getItem("conqur_install_shown")) {
        setTimeout(() => { _showInstallBanner = true; render(); }, 3000);
      }
      if ("Notification" in window && Notification.permission === "default" && !localStorage.getItem("conqur_notif_asked")) {
        localStorage.setItem("conqur_notif_asked", "1");
        setTimeout(() => { _notifPromptVisible = true; render(); }, 2500);
      }
    }, 500);
  }
  // Halfway
  if (dayNumber >= Math.ceil(totalDays / 2) && info.percent === 100 && !challenge.flags.halfway) {
    challenge.flags.halfway = true;
    setTimeout(() => showBigToast("🎯", "Halfway there.", "Most people quit here. You didn't."), 600);
  }
  // Streak milestones — fire only when the streak just hit that number today
  const STREAK_MILESTONES = [
    { n:7,  icon:"🔥", title:"7-day streak!", sub:"One week straight. The habit is forming." },
    { n:14, icon:"💪", title:"14 days!",       sub:"Two weeks. You're building something real." },
    { n:21, icon:"⚡", title:"21-day streak!", sub:"Three weeks in. This is who you are now." },
    { n:30, icon:"🏆", title:"30 days!",        sub:"One month. Elite 1% territory." },
    { n:50, icon:"🌟", title:"50-day streak!", sub:"Fifty days of showing up. Unbelievable." },
    { n:75,  icon:"👑", title:"75 days!",         sub:"The full distance. You are unstoppable." },
    { n:100, icon:"💎", title:"100-day streak!", sub:"Triple digits. You are an absolute legend." },
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
        setTimeout(() => showBigToast("🏔️", `Phase ${i + 1} complete!`, `Up next: ${nextPhase.name}`), 800);
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
  document.documentElement.setAttribute("data-theme", state?.settings?.journeyTheme || "mountain");
  setDynamicIcon();
}

function render() {
  applyTheme();
  const app = document.getElementById("app");
  // Full-screen onboarding — render only the onboarding screen
  if (onboardingStep !== null) {
    app.innerHTML = renderOnboarding();
    if (!_eventsBound) { bindEvents(); _eventsBound = true; }
    return;
  }
  // Scroll to top when the primary view changes (not for modals/sheet)
  const viewKey = `${activeTab}|${builderOpen}|${settingsOpen}|${viewChallengeId}|${editChallengeId}`;
  if (viewKey !== _lastViewKey && !justCompletedId) {
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
  if (_badgeSheetQueue.length > 0) html += renderBadgeSheet(_badgeSheetQueue[0]);
  if (_levelUpOverlay) html += renderLevelUpOverlay();
  if (_notifPromptVisible) html += renderNotifPrompt();
  html += renderConfirmModal();
  if (_showInstallBanner && _pwaInstallPrompt && !localStorage.getItem("conqur_install_shown")) {
    html += `
    <div class="install-banner">
      <span style="font-size:28px">📲</span>
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
          ppStrip.innerHTML = `<p class="pp-empty">No photos yet — tap 📷 on the progress photo habit to capture one.</p>`;
        } else {
          ppStrip.innerHTML = `<div class="pp-grid">${
            photos.slice(-9).reverse().map(p => {
              const dateStr = p.key.split("_")[1] || "";
              const label = dateStr ? formatDate(parseDate(dateStr), {month:"short", day:"numeric"}) : dateStr;
              return `<div class="pp-item">
                <img src="${p.dataURL}" class="pp-img" alt="Progress ${label}">
                <div class="pp-date">${label}</div>
                <button class="pp-delete" data-delete-photo="${esc(p.key)}" title="Delete photo" aria-label="Delete photo">🗑</button>
              </div>`;
            }).join("")
          }</div><p class="pp-count">${photos.length} photo${photos.length===1?"":"s"}</p>`;
        }
      }).catch(() => { ppStrip.innerHTML = ""; });
    }
  });
}

function renderTopbar() {
  return `
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
  const tabs = [["today","Today"],["challenges","Challenges"],["badges","Badges"]];
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

  const canGoBack  = addDays(effDate, -1) >= minDate;
  const canGoFwd   = !isToday;

  // Comeback: consecutive missed days before today
  const missedStreak = isToday ? getConsecutiveMisses(challenge) : 0;
  const xpInfo  = getLevelInfo(state.xp);
  const xpTheme = JOURNEY_THEMES[state.settings.journeyTheme] || JOURNEY_THEMES.mountain;
  const xpToNext = xpInfo.next ? (xpInfo.next.xp - state.xp).toLocaleString() : null;

  return `
  <main>
    <div class="xp-mini-bar">
      <span class="xmb-badge">${xpTheme.emoji} Lv.${xpInfo.level}</span>
      <span class="xmb-name">${xpInfo.name}</span>
      <span class="xmb-track"><span class="xmb-fill" style="width:${xpInfo.pct}%"></span></span>
      <span class="xmb-hint">${xpToNext ? xpToNext + " XP to next · XP never resets" : "Max Level 🏆"}</span>
    </div>
    ${active.length > 1 ? renderChallengePills(active) : ""}
    ${renderWeeklyRecap(challenge)}
    ${_newWeekBanner ? `
    <div class="new-week-banner">
      <h3>🗓 New week. Clean slate.</h3>
      <p>Last week: <strong>${_newWeekBanner.pts} pts</strong>. Come back stronger.</p>
      <button class="new-week-dismiss" data-dismiss-newweek aria-label="Dismiss">×</button>
    </div>` : ""}
    ${missedStreak >= 2 ? `
    <div class="comeback-banner">
      <strong>Welcome back.</strong> ${missedStreak} days missed — that's okay. <span class="cb-alive">Your challenge is still running.</span> Today still counts.
    </div>` : missedStreak === 1 ? `
    <div class="comeback-banner comeback-banner--soft">
      Streak paused at ${streak} days. Come back today to restart. <span class="cb-alive">Your challenge is still running.</span>
    </div>` : ""}
    <div class="date-nav">
      <button class="date-nav-arrow ${canGoBack?"":"disabled"}" data-date-back ${canGoBack?"":"disabled"} aria-label="Previous day">‹</button>
      <div class="date-nav-center">
        <span class="date-nav-label ${!isToday?"date-nav-past":""}">
          ${isToday ? "Today" : formatDate(parseDate(effDate), {weekday:"short", month:"short", day:"numeric"})}
        </span>
        ${isToday && canGoBack ? `<span class="date-nav-hint">‹ tap to log a past day</span>` : ""}
      </div>
      <button class="date-nav-arrow ${canGoFwd?"":"disabled"}" data-date-fwd ${canGoFwd?"":"disabled"} aria-label="Next day">›</button>
    </div>
    ${!isToday ? `<div class="backfill-banner">✏️ Editing ${formatDate(parseDate(effDate),{weekday:"long"})} — changes save immediately.</div>` : ""}
    <section class="hero">
      <div class="hero-title-row">
        <span class="hero-challenge-name">${esc(challenge.emoji)} ${esc(challenge.name)}</span>
        ${streak > 0 && isToday ? `<span class="hero-streak-chip">🔥${streak}</span>` : ""}
        <span class="hero-day-badge">Day ${dayNumber}${totalDays ? `<span class="hero-day-of"> / ${totalDays}</span>` : ""}</span>
      </div>
      ${journeyPct !== null ? `<div class="journey-track"><div class="journey-fill" style="width:${journeyPct}%"></div></div>` : ""}
      <div class="hero-meta">${phaseInfo ? `🏔 ${phaseInfo.phase.name} · ` : ""}${challenge.noEndDate ? "Ongoing" : daysLeft > 0 ? daysLeft+" days left" : "Final day!"}${isToday ? ` · <button class="link-btn hero-settings-link" data-view-challenge="${challenge.id}">✏️ Edit</button>` : ""}</div>
      ${isToday ? `<div class="greeting">${currentGreeting(challenge, dayNumber, streak)}</div>` : ""}
      ${isToday ? renderModeSelector(day, challenge) : ""}
    </section>
    ${phaseInfo && isToday && dayNumber === phaseInfo.phase.end && dayNumber > 1 ? `
    <div class="boss-day-callout">⚡ Phase finale — last day of <strong>${phaseInfo.phase.name}</strong>. Finish strong.</div>` : ""}

    <section>
      <div class="section-head">
        ${challenge.habits.some(h => h.type === "distance")
          ? `<div class="section-label" style="margin:0">Distance</div>`
          : `<div class="section-label" style="margin:0">Habits</div>
             <div style="font-size:12px;font-weight:300;color:var(--text-dim)">${_savedFlash ? `<span class="saved-flash">Saved ✓</span>` : dayNumber === 1 && info.done === 0 ? "Tap to log your first day →" : `${info.done} / ${info.total}`}</div>`}
      </div>
      <div class="habit-list">
        ${challenge.habits.map(h => renderHabit(h, day, challenge)).join("")}
      </div>
    </section>
    ${isToday ? renderAlmostThereBadge(challenge, streak) : ""}
    ${(() => {
      // Only one nudge at a time: backup (Day 7+, no account) beats notif nudge
      if (!isToday) return "";
      if (shouldShowBackupNudge(challenge)) return renderBackupNudge(challenge);
      if (dayNumber >= 3 && !_notifNudgeDismissed && ("Notification" in window) && Notification.permission === "default") {
        return `<div class="notif-nudge" data-notif-nudge>
          <span class="notif-nudge-icon">🔔</span>
          <span class="notif-nudge-text">Never miss a day — <button class="notif-nudge-link" data-request-notif-permission>enable reminders</button></span>
          <button class="notif-nudge-close" data-dismiss-notif-nudge aria-label="Dismiss">×</button>
        </div>`;
      }
      return "";
    })()}
    ${(() => {
      const tpl = challenge.templateId ? TEMPLATES.find(t=>t.id===challenge.templateId) : null;
      return tpl?.routeKm ? renderRouteProgress(challenge, tpl) : "";
    })()}

    ${(() => {
      const autoCollapse = dayNumber <= 2;
      const collapsed = _statsCollapsed === null ? autoCollapse : _statsCollapsed;
      const chevron = collapsed ? "›" : "‹";
      return `
    <div class="stats-collapsible">
      <button class="stats-collapse-toggle" data-toggle-stats aria-expanded="${!collapsed}">
        <span class="stats-collapse-label">📊 Stats</span>
        <span class="stats-collapse-chevron" style="transform:rotate(${collapsed?"90deg":"270deg"})">${chevron}</span>
      </button>
      ${!collapsed ? `
        ${isToday ? renderXPBar() : ""}
        <section class="today-stage panel">
          ${renderRing(info, day, streak, challenge)}
          ${isToday ? renderStreakFreezeUI(challenge) : ""}
          ${renderCompleteBanner(day, info, challenge, dayNumber, totalDays, isToday)}
        </section>
        ${isToday ? renderWeeklyGoalBar(challenge) : ""}
      ` : ""}
    </div>`;
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
  <main>
    ${renderChallengePills(active)}
    ${isToday ? renderXPBar() : ""}
    <div class="all-today-banner">
      <div class="atb-title">📋 All Active Challenges</div>
      <div class="atb-stats">${totalDone} / ${totalHabits} habits done today · ${allPct}%</div>
    </div>
    ${active.map(c => {
      const day = c.days[effDate] || normalizeDay({});
      const info = completionInfo(c, day);
      const dots = c.habits
        .filter(h => h.type !== "distance")
        .map(h => `<span class="atc-dot${day.done.includes(h.id)?" atc-dot--done":""}">${day.done.includes(h.id)?"✓":"○"}</span>`)
        .join("");
      return `
      <button class="all-today-card" data-today-challenge="${c.id}">
        <div class="atc-row">
          <span class="atc-emoji">${esc(c.emoji)}</span>
          <div class="atc-info">
            <div class="atc-name">${esc(c.name)}</div>
            <div class="atc-dots">${dots}</div>
          </div>
          <div class="atc-right">
            <div class="atc-pct${info.percent===100?" atc-done":""}">${info.percent}%</div>
            <div class="atc-cta">Log →</div>
          </div>
        </div>
        <div class="cc-track"><div class="cc-fill" style="width:${info.percent}%"></div></div>
      </button>`;
    }).join("")}
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
      const todayDot   = todayInfo.percent === 100 ? "✅" : todayInfo.percent > 0 ? "🔸" : "";
      const isExp      = c.habits.some(h => h.type === "distance");
      const expTpl     = isExp && c.templateId ? TEMPLATES.find(t => t.id === c.templateId) : null;
      const distPct    = expTpl?.routeKm
        ? Math.min(100, Math.round((challengeTotalKm(c) / expTpl.routeKm) * 100))
        : null;
      const pctStr     = isExp && distPct !== null
        ? `🗺${distPct}% ⏱${journeyPct}%`
        : `${journeyPct}%`;
      return `<button class="c-pill ${c.id===todayChallengeId?"active":""}" data-today-challenge="${c.id}">
        ${todayDot}${esc(c.emoji)} ${esc(c.name)} <span class="c-pill-pct">${pctStr}</span>
      </button>`;
    }).join("")}
  </div>`;
}

function renderNoChallenge() {
  const today = todayKey();
  const hasPast = Object.values(state.challenges).some(c => c.status !== "active");
  const upcoming = Object.values(state.challenges).filter(c => c.status === "active" && c.startDate > today);
  const isFirstTime = !hasPast && !upcoming.length;
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
    <p class="welcome-sub">${upcoming.length ? "Your next challenge starts soon." : hasPast ? "All challenges complete. Start a new one." : "Pick a challenge. Build the habit. Win."}</p>

    ${isFirstTime ? `
    <p class="welcome-desc">Build any habit in 21–86 days. Log daily, earn streaks and badges, and watch yourself change.</p>
    <div class="welcome-features">
      <div class="wf-item"><span class="wf-icon">🏆</span><span class="wf-text">50+ challenges — 75 Hard, Cold Exposure, Morning Routine, Pacific Crest Trail and more</span></div>
      <div class="wf-item"><span class="wf-icon">😴</span><span class="wf-text">Rest days built in — use your jokers wisely, streak stays safe</span></div>
      <div class="wf-item"><span class="wf-icon">🔥</span><span class="wf-text">Streaks, badges, streak freezes, and weekly recaps that keep you honest</span></div>
      <div class="wf-item"><span class="wf-icon">📵</span><span class="wf-text">Works offline. No ads. Your data stays on your device.</span></div>
    </div>` : ""}

    ${upcoming.length ? `
    <div style="width:100%;max-width:320px;margin:0 auto 16px">
      ${upcoming.map(c=>`
      <button class="challenge-card" data-view-challenge="${c.id}" style="text-align:left;width:100%">
        <div class="cc-top">
          <div class="cc-emoji">${c.emoji}</div>
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
      <span class="don-icon">💾</span>
      <div>Your data lives on this device only. <button class="link-btn" data-open-settings>Create a free account</button> to back it up.</div>
    </div>` : ""}
    ${isFirstTime ? `<p class="welcome-hint">No ads. No tracking. Just you and the challenge.</p>` : ""}
  </main>`;
}

function renderRing(info, day, streak, challenge) {
  const challengePts  = challenge ? (challenge.totalPts || 0) : 0;
  const gracePip      = challenge && graceUsedYesterday(challenge);
  const isExpedition  = challenge?.habits.some(h => h.type === "distance");
  const tpl           = isExpedition && challenge.templateId ? TEMPLATES.find(t => t.id === challenge.templateId) : null;
  const todayKmRaw    = isExpedition ? Object.values(day.distances || {}).reduce((s,v) => s + (Number(v)||0), 0) : null;
  const totalKmNative = isExpedition ? challengeTotalKm(challenge) : null;
  const routeKm       = tpl?.routeKm || null;
  // Unit conversion for ring display
  const ringDistHabit = isExpedition ? challenge.habits.find(h => h.type === "distance") : null;
  const ringIsFloors  = ringDistHabit?.unit === "floors";
  const ringDUnit     = ringIsFloors ? "floors" : (state.settings.units.distance === "miles" ? "mi" : "km");
  const ringFactor    = ringDUnit === "mi" ? 0.621371 : 1;
  const todayKmD      = todayKmRaw !== null ? Math.round(todayKmRaw * ringFactor * 100) / 100 : null;
  const totalKmD      = totalKmNative !== null ? Math.round(totalKmNative * ringFactor * 10) / 10 : null;
  return `
  <div class="ring-wrap ${day.mode==="rest"?"rest":""}">
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
        ? `<div class="percent" style="font-size:2.2rem">😴</div><div class="ring-pts" style="font-size:11px;color:var(--text-dim)">rest day</div>`
        : isExpedition
          ? `<div class="percent" style="font-size:${todayKmD > 0 ? "1.6rem" : "2rem"}">${todayKmD > 0 ? todayKmD.toFixed(ringIsFloors?0:1) : "—"}</div><div class="ring-pts" style="font-size:11px;color:var(--text-dim)">${todayKmD > 0 ? ringDUnit+" today" : "log "+ringDUnit}</div>`
          : `<div class="percent">${info.percent}%</div><div class="ring-pts">${info.points}<span class="ring-pts-max">/${info.maxPoints}</span><span class="ring-pts-label"> pts</span></div>`
      }
    </div>
  </div>
  <div class="ring-stats">
    ${isExpedition ? `
    <div class="ring-stat">
      <div class="ring-stat-value">${totalKmD !== null ? totalKmD.toFixed(ringIsFloors?0:1) : "0"}<span class="ring-stat-sub"> ${ringDUnit}</span></div>
      <div class="ring-stat-label">total distance</div>
    </div>
    <div class="ring-stat-sep"></div>
    <div class="ring-stat">
      <div class="ring-stat-value">${routeKm ? Math.min(100,Math.round((totalKmNative/routeKm)*100)) : "—"}<span class="ring-stat-sub">${routeKm ? "%" : ""}</span></div>
      <div class="ring-stat-label">route done</div>
    </div>` : `
    <div class="ring-stat">
      <div class="ring-stat-value">${info.done}<span class="ring-stat-sub">/${info.total}</span></div>
      <div class="ring-stat-label">habits</div>
    </div>
    <div class="ring-stat-sep"></div>
    <div class="ring-stat">
      <div class="ring-stat-value">${challengePts}</div>
      <div class="ring-stat-label">points</div>
    </div>`}
    <div class="ring-stat-sep"></div>
    <div class="ring-stat">
      <div class="ring-stat-value">${streak}${gracePip?`<span style="font-size:10px;color:#ffcc44;margin-left:2px" title="Grace day used yesterday — don't miss today!">🛟</span>`:""}</div>
      <div class="ring-stat-label">day streak${gracePip?`<span style="display:block;font-size:9px;color:#ffcc44">grace used</span>`:""}</div>
    </div>
  </div>`;
}

function renderStreakFreezeUI(challenge) {
  const freezes = challenge.streakFreezes || 0;
  const yesterday = addDays(todayKey(), -1);
  const yDay = challenge.days[yesterday];
  const yesterdayUnlogged = !dayLogged(yDay) && yesterday >= challenge.startDate;
  if (freezes === 0) return "";
  return `
  <div class="freeze-bar">
    <span class="freeze-bar-label">❄️ ${freezes} streak freeze${freezes > 1 ? "s" : ""}</span>
    ${yesterdayUnlogged
      ? `<button class="pill-btn" data-use-freeze>Protect streak</button>`
      : `<span class="freeze-bar-hint">Ready if you miss a day</span>`}
  </div>`;
}

function renderModeSelector(day, challenge) {
  const template        = challenge?.templateId ? TEMPLATES.find(t => t.id === challenge.templateId) : null;
  const noRestDay       = !!(template?.noRestDay);
  const jokerBudget     = challenge?.jokerBudget ?? 3;
  const todayIsRest     = day.mode === "rest";
  const jokersUsed      = Object.values(challenge?.days || {}).filter(d => d.mode === "rest").length;
  const budgetExhausted = !todayIsRest && jokersUsed >= jokerBudget;
  const jokersLeft      = Math.max(0, jokerBudget - jokersUsed);

  // Compact single-line chip row
  if (noRestDay) {
    return `<div class="mode-chip-row"><button class="mode-chip mode-chip--active" data-mode="rest" title="No rest days on this challenge">🎯 Standard Day <span class="mode-chip-no-rest">· no rest days</span></button></div>`;
  }
  const restLabel = todayIsRest
    ? "😴 Rest Day — active"
    : budgetExhausted
      ? `😴 Rest (0 left)`
      : `😴 Rest Day (${jokersLeft} left)`;
  const restDisabled = budgetExhausted ? "mode-chip--disabled" : "";
  const activeChip   = todayIsRest ? "mode-chip--rest-active" : "mode-chip--active";
  return `
  <div class="mode-chip-row">
    <button class="mode-chip ${!todayIsRest ? activeChip : ""}" data-mode="standard">🎯 Standard</button>
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
      <span class="habit-quip">${locked?"Rest Day — recover well.":esc(habit.quip)}</span>
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
      <span class="habit-quip">Rest Day — recover well.</span>
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
        ${habit.tiers.map(t => `<button class="run-dist ${String(selVal)===String(t.value)?"active":""}" data-tier="${habit.id}" data-tier-val="${t.value}">${t.label}</button>`).join("")}
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
  const displayVal = isFloors ? storedVal :
    (displayUnit === "mi" ? Math.round(storedVal * MI_PER_KM * 100) / 100 : storedVal);

  const tpl       = challenge?.templateId ? TEMPLATES.find(t => t.id === challenge.templateId) : null;
  const totalNative  = tpl?.routeKm ? challengeTotalKm(challenge) : 0;
  // Convert totals to display units for quip text
  const totalDisplay = isFloors ? totalNative :
    (displayUnit === "mi" ? Math.round(totalNative * MI_PER_KM * 10) / 10 : totalNative);
  const routeDisplay = tpl?.routeKm
    ? (isFloors ? tpl.routeKm : (displayUnit === "mi" ? Math.round(tpl.routeKm * MI_PER_KM * 10) / 10 : tpl.routeKm))
    : null;
  const remaining = routeDisplay !== null ? Math.max(0, routeDisplay - totalDisplay) : null;

  if (locked) return `
  <div class="habit-card locked" aria-disabled="true">
    <span class="accent"></span>
    <span class="habit-emoji">🔒</span>
    <span class="habit-info">
      <span class="habit-title">${esc(habit.title)}</span>
      <span class="habit-quip">Rest Day — recover well.</span>
    </span>
    <span class="check-circle"></span>
  </div>`;
  const checked = day.done.includes(habit.id);
  const quip = checked
    ? `${displayVal} ${displayUnit} logged today ✓`
    : remaining !== null && remaining === 0
      ? `${isFloors ? "Summit" : "Route"} complete! 🎉`
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
      <span class="habit-quip">Rest Day — recover well.</span>
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
  const routeNative = template.routeKm;
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
  const milestones = template.milestones || [];
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
      <span class="route-progress-name">${template.emoji} ${template.name}</span>
      <span class="route-progress-km">${totalDisplay.toFixed(1)} <span style="font-weight:300;color:var(--text-dim)">/ ${routeDisplay.toLocaleString()} ${displayUnit}</span></span>
    </div>
    <div class="route-progress-track">
      <div class="route-progress-fill" style="width:${pct}%"></div>
      ${markers}
    </div>
    <div class="route-pace">
      ${remaining > 0
        ? `${remaining.toFixed(1)} ${displayUnit} remaining${next ? ` · next: ${next.emoji} ${next.name}` : ""}`
        : `🎉 ${isFloors ? "Summit reached" : "Route complete"}! You conquered ${template.name}.`}
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
        <div class="ww-goal">${toGoal>0?`${toGoal} ${unit} to go`:"🎯 Goal reached!"}</div>`:""}
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

// Minimal weight chip — only shown in Today if body tracking is active but today not yet logged
function renderWeightChip() {
  const bt = state.bodyTracking;
  if (!bt.startWeight && !bt.entries.length) return ""; // weight tracking not set up
  if (bt.entries.some(e => e.date === todayKey())) return ""; // already logged today
  return `<button class="weight-chip" data-tab="body">⚖️ Log weight</button>`;
}

function renderCompleteBanner(day, info, challenge, dayNumber, totalDays, isToday) {
  if (info.done!==info.total || info.total===0) return "";
  const isExpedition = challenge?.habits.some(h => h.type === "distance");
  if (day.mode==="rest") return `<div class="complete-banner rest-complete"><span class="cb-icon">😴</span><div class="cb-body"><div class="cb-title">Rest Day</div><div class="cb-sub">Recover. Come back stronger.</div></div></div>`;
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
    const tpl         = challenge.templateId ? TEMPLATES.find(t => t.id === challenge.templateId) : null;
    const remNative   = tpl?.routeKm ? Math.max(0, tpl.routeKm - totalNative) : null;
    const todayD = Math.round(todayNative * factor * 10) / 10;
    const totalD = Math.round(totalNative * factor * 10) / 10;
    const remD   = remNative !== null ? Math.round(remNative * factor * 10) / 10 : null;
    const sub = remD !== null
      ? `${totalD.toFixed(1)} ${dUnit} covered · ${remD.toFixed(1)} ${dUnit} to go`
      : `${totalD.toFixed(1)} ${dUnit} covered`;
    return `<div class="complete-banner"><span class="cb-icon">🗺️</span><div class="cb-body"><div class="cb-title">${todayD.toFixed(isFloors?0:1)} ${dUnit} today</div><div class="cb-sub">${sub}</div></div></div>`;
  }
  const currentStreak = challenge ? calcChallengeStreak(challenge) : 0;
  const streakShare = currentStreak >= 2 ? `<button class="cb-share-btn" data-share-streak>📤 Share streak</button>` : "";
  const tomorrowHook = isToday && dayNumber && totalDays && dayNumber < totalDays
    ? `<div class="cb-tomorrow">Day ${dayNumber + 1} tomorrow — 🔥 keep the streak alive</div>`
    : "";
  return `<div class="complete-banner"><span class="cb-icon">🔥</span><div class="cb-body"><div class="cb-title">Full Send</div><div class="cb-sub">All habits done · ${info.points} pts</div>${tomorrowHook}${streakShare}</div></div>`;
}

function renderXPBar() {
  const info    = getLevelInfo(state.xp);
  const isMax   = !info.next;
  const toNext  = isMax ? 0 : info.next.xp - state.xp;
  const c       = currentChallenge();
  const freezes = c ? (c.streakFreezes || 0) : 0;
  return `
  <div class="xp-bar-wrap">
    <div class="xp-bar-header">
      <span class="xp-level-badge">⚡ Lv.${info.level} <span class="xp-level-name">${info.name}</span></span>
      <div style="display:flex;align-items:center;gap:8px">
        ${freezes > 0 ? `<span class="xp-freeze-badge" title="Streak freezes — use one to protect a missed day">❄️ ${freezes}</span>` : ""}
        <span class="xp-bar-to-next">${isMax ? "Max Level" : `${toNext.toLocaleString()} XP to Lv.${info.next.level}`}</span>
      </div>
    </div>
    <div class="xp-bar-track" role="progressbar" aria-valuenow="${info.pct}" aria-valuemin="0" aria-valuemax="100">
      <div class="xp-bar-fill" style="width:${info.pct}%"></div>
    </div>
    <div class="xp-bar-explainer">Points fuel your weekly goal · XP builds your level forever</div>
  </div>`;
}

function renderWeeklyGoalBar(challenge) {
  const today = todayKey();
  const weeks = challengeWeeks(challenge);
  const curWeek = weeks.find(w => w.allDays.includes(today));
  if (!curWeek) return "";
  const pts = curWeek.days.reduce((s,k) => {
    const d = challenge.days[k]; return s + (d ? completionInfo(challenge,d).points : 0);
  }, 0);
  const pct = Math.min(100, Math.round((pts / challenge.weeklyGoal) * 100));
  const hit = pts >= challenge.weeklyGoal;
  const best = challengePersonalBest(challenge);
  const bestLabel = best > 0 ? `<span style="font-size:11px;color:var(--text-dim)">Best: ${best} pts</span>` : "";
  return `
  <div class="weekly-goal-bar">
    <div class="wgb-row">
      <span class="wgb-label">${hit ? "✅ Weekly goal hit!" : `Week: ${pts} / ${challenge.weeklyGoal} pts`}</span>
      <span class="wgb-pct">${pct}%</span>
    </div>
    <div class="wgb-track"><div class="wgb-fill ${hit?"wgb-done":""}" style="width:${pct}%"></div></div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px">
      ${hit ? `<span style="font-size:11px;color:var(--success)">Week badge unlocked 🏅</span>` : `<span style="font-size:11px;color:var(--text-dim)">Hit the goal → badge + streak freeze 🏅</span>`}
      ${bestLabel}
    </div>
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
  const hitGoal = pts >= challenge.weeklyGoal;
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
  const weekKm = isExpedition ? lastWeek.allDays.reduce((s,k) => {
    const d = challenge.days[k];
    if (!d?.distances) return s;
    return s + Object.values(d.distances).reduce((ss,km) => ss + (Number(km)||0), 0);
  }, 0) : null;
  const msgs = hitGoal
    ? ["Last week was strong. Build on it.", "Goal hit. That's what consistency looks like.", "Momentum is real — keep it going."]
    : ["Progress compounds. Keep stacking.", "New week, fresh start. Let's go.", "Every logged day is a win."];
  const msg = msgs[new Date().getDate() % msgs.length];
  return `
  <div class="weekly-recap-card">
    <div class="wrc-top">
      <div class="wrc-title">📋 Week ${lastWeek.num} Review</div>
      <button class="wrc-dismiss" data-dismiss-weekly-recap="${challenge.id}" aria-label="Dismiss">✕</button>
    </div>
    <div class="wrc-stats">
      ${isExpedition
        ? `<div class="wrc-stat"><span class="wrc-val">${weekKm.toFixed(1)}</span><span class="wrc-lbl">km</span></div>`
        : `<div class="wrc-stat"><span class="wrc-val">${pts}</span><span class="wrc-lbl">pts</span></div>`}
      <div class="wrc-sep"></div>
      <div class="wrc-stat"><span class="wrc-val">${logged}/${lastWeek.allDays.length}</span><span class="wrc-lbl">days</span></div>
      <div class="wrc-sep"></div>
      <div class="wrc-stat"><span class="wrc-val">${streak}</span><span class="wrc-lbl">streak</span></div>
    </div>
    ${deltaStr ? `<div class="wrc-delta-row">${deltaStr}</div>` : ""}
    <div class="wrc-msg">${hitGoal ? "✅ Goal hit! " : ""}${msg}</div>
  </div>`;
}


// ── Challenge Suggestions (post-completion) ───────────────────────────────

function suggestNextChallenges(c) {
  const finishedId = c.templateId;
  // Check challenge chain first
  const chainNextId = finishedId && CHALLENGE_CHAINS[finishedId];
  const chainNext   = chainNextId ? TEMPLATES.find(t => t.id === chainNextId) : null;
  const cat  = TEMPLATES.find(t => t.id === finishedId)?.category;
  const pool = TEMPLATES.filter(t => t.id !== finishedId && t.id !== chainNextId);
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
    ${pbCard("🔥 Longest Streak", pb.longestStreak, "days")}
    ${pbCard("⭐ Best Week",       pb.bestWeekPts,   "pts")}
    ${pbCard("✅ Habits Logged",  pb.totalHabits,   "")}
    ${pbCard("📅 Days Shown Up",  pb.totalDays,     "")}
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
  ctx.fillStyle = "#09080f";
  ctx.fillRect(0, 0, s, s);

  // Gradient accent bar top
  const cs = getComputedStyle(document.documentElement);
  const grad = ctx.createLinearGradient(0, 0, s, 0);
  grad.addColorStop(0, cs.getPropertyValue("--primary").trim()   || "#b44fff");
  grad.addColorStop(1, cs.getPropertyValue("--secondary").trim() || "#ff4fa3");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, s, 10);

  // Challenge emoji
  ctx.font      = `${Math.round(s * 0.12)}px serif`;
  ctx.textAlign = "center";
  ctx.fillText(challenge.emoji || "🏆", s / 2, s * 0.25);

  // Challenge name
  ctx.fillStyle = "#f0eff8";
  ctx.font      = `700 ${Math.round(s * 0.065)}px 'Arial', sans-serif`;
  ctx.fillText(challenge.name, s / 2, s * 0.38);

  // Stats pill
  const streak     = calcChallengeStreak(challenge);
  const totalPts   = Object.values(challenge.days).reduce((a, d) => a + (d.pts || 0), 0);
  const dayNum     = challengeDayNumber(challenge);
  const totalDays  = diffDays(challenge.startDate, challenge.endDate) + 1;

  const statLine = isDone
    ? `${totalDays} days · ${totalPts} pts · ${streak}-day streak`
    : `Day ${dayNum} · ${streak}-day streak · ${totalPts} pts`;

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

  ctx.fillStyle = "#c8c5e8";
  ctx.font      = `400 ${Math.round(s * 0.038)}px 'Arial', sans-serif`;
  ctx.fillText(statLine, s / 2, pillY + pillH * 0.64);

  // Headline
  const headline = isDone ? "Challenge complete. 🏆" : `${streak} days straight. 🔥`;
  ctx.fillStyle = grad;
  ctx.font      = `700 ${Math.round(s * 0.055)}px 'Arial', sans-serif`;
  ctx.fillText(headline, s / 2, s * 0.65);

  // Sub copy
  ctx.fillStyle = "#9896b8";
  ctx.font      = `400 ${Math.round(s * 0.033)}px 'Arial', sans-serif`;
  ctx.fillText(isDone ? "Built the habit. Won the challenge." : "One day at a time. conqur.netlify.app", s / 2, s * 0.72);

  // Level + theme line
  const _scLevel = getLevelInfo(state.xp);
  const _scTheme = JOURNEY_THEMES[state.settings.journeyTheme] || JOURNEY_THEMES.mountain;
  ctx.fillStyle = "rgba(152,150,184,0.55)";
  ctx.font      = `400 ${Math.round(s * 0.03)}px 'Arial', sans-serif`;
  ctx.fillText(`${_scTheme.emoji} ${_scTheme.label} · Lv.${_scLevel.level} ${_scLevel.name}`, s / 2, s * 0.81);

  // Watermark
  ctx.fillStyle = "rgba(152,150,184,0.4)";
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
    ? `I just completed the ${_shareModalChallenge.name} challenge on Conqur! 🏆\n${totalDays} days · ${totalPts} pts · ${streak}-day streak.\nBuilding habits that stick. 💪\nconqur.netlify.app`
    : `Day ${dayNum} of my ${_shareModalChallenge.name} challenge — ${streak}-day streak. 🔥\nBuilding habits one day at a time.\nconqur.netlify.app`;

  return `
  <div class="share-modal-overlay" data-close-share-modal>
    <div class="share-modal-inner" onclick="event.stopPropagation()">
      <img src="${_shareCardDataUrl}" class="share-card-img" alt="Share card">
      <div class="share-modal-actions">
        <button class="primary-button" data-share-card-native style="margin-bottom:8px">📤 Share</button>
        <button class="secondary-button" data-download-share-card>⬇️ Save image</button>
        <button class="secondary-button" data-copy-share-text style="margin-top:8px">📋 Copy text</button>
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
  const nextT        = nextId ? TEMPLATES.find(t => t.id === nextId) : null;
  const isExpedition  = c.habits.some(h => h.type === "distance");
  const totalKmNativeM = isExpedition ? challengeTotalKm(c) : null;
  const tpl           = isExpedition && c.templateId ? TEMPLATES.find(t => t.id === c.templateId) : null;
  const routeFinished = tpl?.routeKm && totalKmNativeM >= tpl.routeKm;
  const mDistHabit    = isExpedition ? c.habits.find(h => h.type === "distance") : null;
  const mIsFloors     = mDistHabit?.unit === "floors";
  const mDUnit        = mIsFloors ? "floors" : (state.settings.units.distance === "miles" ? "mi" : "km");
  const mFactor       = mDUnit === "mi" ? 0.621371 : 1;
  const mTotalD       = isExpedition ? Math.round(totalKmNativeM * mFactor * 10) / 10 : null;
  const completionSub = isExpedition
    ? `${mTotalD.toFixed(mIsFloors?0:1)} ${mDUnit} covered · ${totalDays} days · ${finalStreak}-day streak.<br>${routeFinished ? "You finished the route. Legendary." : "You stayed the course. That's what commitment looks like."}`
    : `${totalDays} days · ${totalPts} pts · ${finalStreak}-day streak.<br>That's what commitment looks like.`;
  return `
  <div class="sheet-backdrop" data-close-completion>
    <section class="sheet completion-modal" role="dialog">
      <div class="completion-emoji">${esc(c.emoji)}</div>
      <div class="completion-title">${isExpedition && routeFinished ? "Route Complete!" : "Challenge Complete!"}</div>
      <div class="completion-name">${esc(c.name)}</div>
      <div class="completion-sub">${completionSub}</div>
      ${nextT ? `
      <button class="chain-cta" data-start-suggested="${nextT.id}">
        <span class="chain-cta-pre">Continue your journey</span>
        <span class="chain-cta-main">${nextT.emoji} ${nextT.name} →</span>
        <span class="chain-cta-sub">${nextT.duration} days · Level up 🚀</span>
      </button>` : ""}
      <button class="${nextT?"secondary-button":"primary-button"}" data-close-completion style="margin-top:${nextT?"8":"20"}px">Hell yeah! 🎉</button>
      ${canShare ? `<button class="secondary-button" data-share-completion style="margin-top:8px">🔗 Share your achievement</button>` : ""}
      <button class="secondary-button" data-completion-new-challenge style="margin-top:8px">Browse all challenges →</button>
      ${renderCompletionSuggestions(c)}
    </section>
  </div>`;
}

// ── Challenges Tab ────────────────────────────────────────────────────────

function renderChallenges() {
  const all   = getAllChallenges();
  const isExp = c => c.habits.some(h => h.type === "distance");
  const inSub = c => challengeSubTab === "expeditions" ? isExp(c) : !isExp(c);
  const view  = all.filter(inSub);
  const active = view.filter(c => c.status==="active");
  const paused = view.filter(c => c.status==="paused");
  const past   = view.filter(c => c.status!=="active" && c.status!=="paused");
  const emptyMsg = challengeSubTab === "expeditions"
    ? `No expedition running. <button class="link-btn" data-open-builder>Pick a route?</button>`
    : `No challenge running. <button class="link-btn" data-open-builder>Ready to start something?</button>`;
  const emailCapState = localStorage.getItem("conqur_email_capture");
  const showEmailCapture = challengeSubTab === "habits" && emailCapState !== "dismissed";
  return `
  <main>
    <div class="challenge-sub-tabs">
      <button class="csub-btn${challengeSubTab==="habits"?" active":""}" data-challenge-sub="habits">🎯 Habits</button>
      <button class="csub-btn${challengeSubTab==="expeditions"?" active":""}" data-challenge-sub="expeditions">🗺️ Expeditions</button>
    </div>
    ${showEmailCapture ? (emailCapState === "submitted" ? `
    <div class="email-cap-card email-cap-done">
      <span>✅ You're on the list — we'll let you know when Pro launches!</span>
      <button class="email-cap-x" data-dismiss-email-capture aria-label="Dismiss">×</button>
    </div>` : `
    <div class="email-cap-card">
      <button class="email-cap-x" data-dismiss-email-capture aria-label="Dismiss">×</button>
      <div class="email-cap-title">🚀 Conqur Pro is coming</div>
      <div class="email-cap-sub">📊 Weekly charts · 🏆 Leaderboards · 📤 Export · 🔔 Per-habit reminders<br><span style="color:var(--text-faint);font-size:11px">Be first to know — no spam.</span></div>
      <div class="email-cap-row">
        <input type="email" id="email-cap-input" class="email-cap-input" placeholder="your@email.com" autocomplete="email">
        <button class="email-cap-btn" data-email-capture-submit>Notify me</button>
      </div>
    </div>`) : ""}
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <div class="section-label" style="margin:0">${challengeSubTab==="expeditions"?"Active Routes":"Active Challenges"}</div>
      <button class="pill-btn" data-open-builder>${challengeSubTab==="expeditions"?"+ Route":"+ New"}</button>
    </div>
    ${active.length ? active.map(c=>renderChallengeCard(c)).join("") : `<div class="empty-state">${emptyMsg}</div>`}
    ${paused.length ? `<div class="section-label">⏸ Paused</div>${paused.map(c=>renderChallengeCard(c)).join("")}` : ""}
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
  const totalKmVal   = isExpedition ? challengeTotalKm(c) : null;
  const routePct     = tpl?.routeKm ? Math.min(100, Math.round((totalKmVal / tpl.routeKm) * 100)) : null;
  const distHabit    = isExpedition ? c.habits.find(h => h.type === "distance") : null;
  const isFloors     = distHabit?.unit === "floors";
  const MI_PER_KM    = 0.621371;
  const globalDist   = state.settings.units.distance || "km";
  const dUnit        = isFloors ? "floors" : (globalDist === "miles" ? "mi" : "km");
  const factor       = dUnit === "mi" ? MI_PER_KM : 1;
  const todayNativeKm = isExpedition && day?.distances
    ? Object.values(day.distances).reduce((s,v) => s + (Number(v)||0), 0) : null;
  const tier         = tpl ? (TEMPLATE_TIERS[tpl.id] || "common") : null;
  const tierData     = tier ? TIERS[tier] : null;
  const resumeNudge = c.status === "paused" && c.resumeReminderDate && c.resumeReminderDate <= today;
  return `
  <div class="challenge-card-wrap">
    <button class="challenge-card" data-view-challenge="${c.id}">
      <div class="cc-top">
        <div class="cc-emoji">${esc(c.emoji)}</div>
        <div class="cc-info">
          <div class="cc-name"${tierData?` style="color:${tierData.color}"`:""}>${esc(c.name)}${tierTag(c.templateId)}${c.noEndDate?` <span class="ongoing-badge">Ongoing</span>`:""}</div>
          <div class="cc-meta">${isExpedition && tpl?.routeKm
            ? `${Math.round(totalKmVal * factor * 10)/10} / ${Math.round(tpl.routeKm * factor).toLocaleString()} ${dUnit} · Day ${dayNumber}`
            : c.noEndDate ? `Ongoing · ${c.mode} · Day ${dayNumber}` : `${totalDays}d · ${c.mode} · Day ${dayNumber}`}</div>
        </div>
        <div class="cc-right">
          ${c.status!=="active"
            ? `<div class="cc-status" style="color:${statusColor}">${c.status==="paused"?"⏸ paused":c.status}</div>`
            : isExpedition
              ? `<div class="cc-today">${todayNativeKm !== null && todayNativeKm > 0 ? (Math.round(todayNativeKm*factor*10)/10)+" "+dUnit : "—"}</div>`
              : `<div class="cc-today">${todayInfo?todayInfo.percent+"%":"—"}</div>`}
          <div class="cc-streak">🔥 ${streak}</div>
        </div>
      </div>
      <div class="cc-track">
        <div class="cc-fill" style="width:${isExpedition && routePct !== null ? routePct : pct}%"></div>
      </div>
      <div class="cc-sub">${isExpedition && routePct !== null
        ? `🗺 ${routePct}% dist · ✓ ${todayInfo ? todayInfo.percent : 0}% today · ⏱ ${pct}% time`
        : `${pct}% complete · ${c.badges.length} ${c.badges.length === 1 ? "badge" : "badges"}`}</div>
    </button>
    ${c.status === "active" ? `<button class="pin-btn${c.pinned?" pin-btn--active":""}" data-pin-challenge="${c.id}" aria-label="${c.pinned?"Unpin":"Pin"} challenge" title="${c.pinned?"Unpin":"Pin to top"}">📌</button>` : ""}
    ${resumeNudge ? `<div class="resume-nudge">⏰ Reminder to resume! <button class="link-btn" data-pause-challenge="${c.id}">Resume now →</button></div>` : ""}
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
  const weeks     = challengeWeeks(c);
  const totalDays = c.noEndDate ? null : diffDays(c.startDate, c.endDate)+1;
  const dayNumber = challengeDayNumber(c);
  const pct       = totalDays ? clamp(Math.round((dayNumber/totalDays)*100), 0, 100) : null;
  const streak    = calcChallengeStreak(c);
  const totalPts  = Object.values(c.days).reduce((s,d)=>s+(d.pts||0),0);
  const activeDays = Object.values(c.days).filter(d => d.mode !== "rest" && (d.done.length > 0 || d.recovered));
  const activeDaysDone = activeDays.filter(d => d.done.length > 0 || d.recovered).length;
  const activeTotal = Object.values(c.days).filter(d => d.mode !== "rest").length;
  const activeCompPct = activeTotal ? Math.round((activeDaysDone / activeTotal) * 100) : 0;
  const curWeekIdx = weeks.findIndex(w=>w.allDays.includes(today));
  const hasPhotoHabit = c.habits.some(h => h.id === "photo" || /progress\s*photo/i.test(h.title));
  const nextChainId   = c.templateId && CHALLENGE_CHAINS[c.templateId];
  const nextChainT    = nextChainId ? TEMPLATES.find(t => t.id === nextChainId) : null;
  const tpl           = c.templateId ? TEMPLATES.find(t => t.id === c.templateId) : null;
  const isExpedition  = !!(tpl?.routeKm);
  const totalNativeKm = isExpedition ? challengeTotalKm(c) : null;
  const distHabitDet  = isExpedition ? c.habits.find(h => h.type === "distance") : null;
  const isFloorsDet   = distHabitDet?.unit === "floors";
  const MI_PER_KM_D   = 0.621371;
  const globalDistD   = state.settings.units.distance || "km";
  const dUnitDet      = isFloorsDet ? "floors" : (globalDistD === "miles" ? "mi" : "km");
  const factorDet     = dUnitDet === "mi" ? MI_PER_KM_D : 1;
  const totalKmDisplay = isExpedition ? Math.round(totalNativeKm * factorDet * 10) / 10 : null;
  return `
  <main>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
      <button class="icon-btn" data-close-detail>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
      </button>
      <div>
        <div style="font-size:18px;font-weight:700">${esc(c.emoji)} ${(()=>{ const t=c.templateId?TEMPLATE_TIERS[c.templateId]:null; const td=t?TIERS[t]:null; return td?`<span style="color:${td.color}">${esc(c.name)}</span>${tierTag(c.templateId)}`:esc(c.name); })()}</div>
        <div style="font-size:12px;color:var(--text-dim)">${c.startDate}${c.noEndDate ? " · Ongoing" : ` → ${c.endDate}`}</div>
      </div>
    </div>
    <div class="stats-grid" style="margin-bottom:14px">
      ${statCard("🔥 Streak", streak, "days")}
      ${isExpedition
        ? statCard("🗺️ Distance", totalKmDisplay.toFixed(isFloorsDet?0:1), dUnitDet)
        : statCard("⭐ Total pts", totalPts, "")}
      ${statCard("✅ Active days", `${activeDaysDone}/${activeTotal}`, "")}
      ${statCard("🏅 Badges", c.badges.length, "")}
    </div>
    ${pct !== null ? `<div class="detail-progress-bar" style="margin-bottom:14px"><div class="detail-progress-fill" style="width:${pct}%"></div><div class="detail-progress-label">${pct}% journey complete</div></div>` : `<div class="detail-progress-bar" style="margin-bottom:14px"><div class="detail-progress-label">Day ${dayNumber} · Ongoing</div></div>`}
    ${isExpedition ? renderRouteProgress(c, tpl) : ""}


    ${nextChainT && c.status === "completed" ? `
    <div class="chain-next-banner" data-start-suggested="${nextChainT.id}">
      <div class="cnb-label">Continue your journey →</div>
      <div class="cnb-row">
        <span class="cnb-emoji">${nextChainT.emoji}</span>
        <div class="cnb-info">
          <div class="cnb-name">${nextChainT.name}</div>
          <div class="cnb-meta">${nextChainT.duration} days · Level up 🚀</div>
        </div>
        <span class="cnb-arrow">→</span>
      </div>
    </div>` : ""}

    <div class="detail-view-tabs">
      <button class="dvt-tab ${challengeDetailView==="weeks"?"active":""}" data-detail-view="weeks">Weeks</button>
      <button class="dvt-tab ${challengeDetailView==="calendar"?"active":""}" data-detail-view="calendar">Calendar</button>
    </div>
    ${challengeDetailView === "calendar"
      ? renderMonthCalendar(c)
      : `<div class="week-history">${weeks.map((w,i)=>renderWeekCard(c,w,i===curWeekIdx)).join("")}</div>`}

    <div class="section-label">Habits</div>
    <div class="habit-preview-list" style="margin-bottom:14px">
      ${c.habits.map(h => {
        if (h.type === "distance") {
          const allDays = Object.values(c.days);
          const kmTotal = allDays.reduce((s,d) => s + (Number(d.distances?.[h.id]) || 0), 0);
          const daysLogged = allDays.filter(d => d.done.includes(h.id)).length;
          const routeKm = tpl?.routeKm || 0;
          const routePct = routeKm ? Math.min(100, Math.round((kmTotal / routeKm) * 100)) : null;
          return `<div class="habit-preview-item">
            <span>${esc(h.emoji)} ${esc(h.title)}</span>
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
              <span>${esc(h.emoji)} ${esc(h.title)}</span>
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
        const color = hpct == null ? "var(--text-faint)" : hpct >= 80 ? "var(--success)" : hpct >= 50 ? "#f5a623" : "var(--secondary)";
        return `<div class="habit-preview-item">
          <span>${esc(h.emoji)} ${esc(h.title)}</span>
          ${hpct != null ? `<span class="hpi-rate" style="color:${color}">${hpct}%</span>` : ""}
        </div>`;
      }).join("")}
    </div>

    ${hasPhotoHabit ? `
    <div class="section-label">Progress Photos</div>
    <div id="pp-strip-${c.id}" class="pp-strip"><div class="pp-loading">Loading photos…</div></div>
    ` : ""}

    ${c.habits.some(h => h.type === "measurement") ? `
    <div style="margin-top:16px">
      <button class="secondary-button" data-export-health="${c.id}">📊 Export Health Data (CSV)</button>
    </div>` : ""}
    ${(c.status==="active"||c.status==="paused")?`
    <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap">
      ${c.status==="active"?`<button class="secondary-button" data-edit-challenge="${c.id}">✏️ Edit</button>`:""}
      <button class="secondary-button" data-pause-challenge="${c.id}">${c.status==="paused"?"▶️ Resume":"⏸ Pause"}</button>
      <button class="secondary-button danger" data-abandon-challenge="${c.id}">Abandon</button>
    </div>`:""}
    ${(c.status==="completed"||c.status==="failed")?`
    <div style="margin-top:16px">
      <button class="secondary-button danger" data-delete-challenge="${c.id}">🗑 Delete challenge</button>
    </div>`:""}
  </main>`;
}

function renderEditChallenge(c) {
  if (!c) return `<main><div class="empty-state">Challenge not found.</div></main>`;
  return `
  <main>
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
      <label class="field" style="margin-bottom:20px">
        Weekly point goal
        <input id="ec-goal" type="number" value="${c.weeklyGoal}" min="10" max="500">
      </label>
      <div class="section-label" style="margin:20px 0 8px">Habits</div>
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
            <span class="custom-habit-emoji">${esc(h.emoji)}</span>
            <span class="custom-habit-name">${esc(h.title)}</span>
            <span class="custom-habit-pts">${h.type==="tiered" ? `${h.tiers[0].points}–${h.tiers[h.tiers.length-1].points}pt` : h.points+"pt"}</span>
            <button class="icon-btn" data-ec-edit-habit="${i}" title="Edit">✏️</button>
            <button class="icon-btn" data-ec-delete-habit="${i}" title="Delete" style="color:var(--secondary)">✕</button>
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
              ${newTiers.length>2?`<button class="icon-btn" data-ech-remove-tier="${i}" style="font-size:11px">✕</button>`:""}
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
    <div class="label" style="font-size:11px;font-weight:300;color:var(--text-dim);margin-bottom:6px">${label}</div>
    <div class="stat-value">${value}<span style="font-size:13px;font-weight:300;color:var(--text-dim);margin-left:3px">${unit}</span></div>
  </div>`;
}

function renderWeekCard(c, week, isCurrent) {
  const today = todayKey();
  const pts = week.days.reduce((s,k)=>s+(c.days[k]?completionInfo(c,c.days[k]).points:0),0);
  const logged = week.days.filter(k=>{ const d=c.days[k]; return d&&(d.done.length||d.recovered); }).length;
  const goalPct = Math.min(100,Math.round((pts/c.weeklyGoal)*100));
  const hitGoal = !isCurrent && pts>=c.weeklyGoal;
  // Expedition: sum km across the week
  const isExpedition = c.habits.some(h => h.type === "distance");
  const weekKm = isExpedition ? week.allDays.reduce((s,k) => {
    const d = c.days[k];
    if (!d?.distances) return s;
    return s + Object.values(d.distances).reduce((ss,km) => ss + (Number(km)||0), 0);
  }, 0) : null;
  return `
  <div class="${isCurrent?"week-card week-card-current":"week-card"}">
    <div class="wc-top">
      <span class="wc-num">Week ${week.num}</span>
      ${hitGoal?`<span class="wc-goal-hit">✓ Goal</span>`:`<span class="wc-days">${logged}/${week.allDays.length}</span>`}
    </div>
    <div class="wc-label">${week.label}</div>
    <div class="wc-dots">${week.allDays.map(k=>{
      if(k>today) return `<span class="wdot future"></span>`;
      const d=c.days[k];
      if(!d||(!d.done.length&&!d.recovered)) return `<span class="wdot empty ${k===today?"now":""}"></span>`;
      const inf=completionInfo(c,d);
      if(inf.percent===100) return `<span class="wdot full ${k===today?"now":""}"></span>`;
      return `<span class="wdot partial"></span>`;
    }).join("")}</div>
    <div class="wc-goal-row">
      <span class="wc-pts">${pts} <span class="wc-goal-of">/ ${c.weeklyGoal} pts</span></span>
      ${weekKm !== null ? `<span class="wc-km-badge">${weekKm.toFixed(1)} km</span>` : ""}
    </div>
    <div class="wc-goal-track"><div class="wc-goal-fill ${hitGoal?"wc-goal-done":""}" style="width:${goalPct}%"></div></div>
  </div>`;
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
    if (day.mode === "rest")                             return `<div class="cal-cell cal-rest${todayCls}">😴</div>`;
    if (day.freezeUsed && !day.done.length)              return `<div class="cal-cell cal-freeze${todayCls}">❄️</div>`;
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
      <span class="cal-leg rest">😴 Rest</span>
      <span class="cal-leg freeze">❄️ Frozen</span>
      <span class="cal-leg missed">— Missed</span>
    </div>
  </div>`;
}

// ── Builder Quiz ──────────────────────────────────────────────────────────

function getQuizRecommendation(q) {
  const { goal, time, level } = q;
  if (goal === "fitness" && level === "hardcore" && (time === "60" || time === "90")) return "75-hard";
  if (goal === "fitness" && level === "hardcore") return "cruise-control";
  if (goal === "fitness" && level === "some" && (time === "60" || time === "90")) return "strength";
  if (goal === "fitness" && level === "some") return "running";
  if (goal === "fitness" && level === "beginner") return "morning-routine";
  if (goal === "fitness") return "morning-routine";
  if (goal === "discipline" && level === "hardcore") return "75-hard";
  if (goal === "discipline" && level === "some") return "monk-mode";
  if (goal === "discipline") return "digital-detox";
  if (goal === "wellness") return "morning-routine";
  if (goal === "routine") return "morning-routine";
  return "morning-routine";
}

function renderBuilderQuiz() {
  const q = builderQuizAnswers;
  const ready = q.goal && q.time && q.level;
  const goalOpts  = [
    { id:"fitness",    label:"Get physically fitter",         emoji:"💪" },
    { id:"discipline", label:"Build daily discipline",        emoji:"🎯" },
    { id:"wellness",   label:"Mental health & mindfulness",   emoji:"🧘" },
    { id:"routine",    label:"Build a morning routine",       emoji:"🌅" },
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
    <div class="bq-title">Find your challenge</div>
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
  <main class="builder-shell">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
      <button class="icon-btn" data-close-builder>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
      <div style="font-size:16px;font-weight:700">
        ${builderStep==="quiz"?"Find Your Challenge":builderStep==="template"?"Choose Challenge":builderStep==="quickstart"?"Ready to Start?":"Customise"}
      </div>
    </div>
    ${builderStep==="quiz"       ? renderBuilderQuiz()        : ""}
    ${builderStep==="template"   ? renderBuilderTemplates()   : ""}
    ${builderStep==="quickstart" ? renderBuilderQuickstart()  : ""}
    ${builderStep==="customize"  ? renderBuilderCustomize()   : ""}
  </main>`;
}

function renderBuilderTemplates() {
  const cats = [
    { id:"transformation", label:"🔥 Transformation" },
    { id:"movement",       label:"🏃 Movement"       },
    { id:"endurance",      label:"🏆 Endurance"      },
    { id:"health",         label:"❤️ Health"         },
    { id:"lifestyle",      label:"🌱 Lifestyle"      },
    { id:"expedition",     label:"🗺️ Expeditions"    },
  ];
  const orderedCats = challengeSubTab === "expeditions"
    ? [cats.find(c => c.id === "expedition"), ...cats.filter(c => c.id !== "expedition")]
    : cats;
  const POPULAR_IDS = ["75-hard", "75-soft", "mental-toughness", "cold-shower", "morning-routine", "no-alcohol", "meditation-21", "journaling", "walking", "no-sugar"];
  const filterTabs = [
    { id:"all",      label:"All" },
    { id:"popular",  label:"🔥 Popular" },
    { id:"short",    label:"≤30 days" },
    { id:"medium",   label:"31–60 days" },
    { id:"long",     label:"61+ days" },
  ];
  const passesFilter = t => {
    if (_templateFilter === "popular") return POPULAR_IDS.includes(t.id);
    if (_templateFilter === "short")   return t.duration <= 30;
    if (_templateFilter === "medium")  return t.duration > 30 && t.duration <= 60;
    if (_templateFilter === "long")    return t.duration > 60;
    return true;
  };
  const templateCard = t => {
    const isExpedition = t.category === "expedition";
    const distHabit    = t.habits?.find(h => h.type === "distance");
    const isFloors     = distHabit?.unit === "floors";
    const MI_PER_KM    = 0.621371;
    const globalDist   = state.settings.units.distance || "km";
    const dUnit        = isFloors ? "floors" : (globalDist === "miles" ? "mi" : "km");
    const factor       = dUnit === "mi" ? MI_PER_KM : 1;
    const meta = isExpedition
      ? `${Math.round(t.routeKm * factor).toLocaleString()} ${dUnit} · ${t.duration} days`
      : `${t.duration} days · ${t.defaultMode}`;
    const tier     = TEMPLATE_TIERS[t.id] || "common";
    const tierData = TIERS[tier];
    const diff     = TEMPLATE_DIFFICULTY[t.id] || "intermediate";
    const hasSafety = !!TEMPLATE_SAFETY[t.id];
    return `
    <button class="template-card${isExpedition?" tc-cat expedition":""}" data-select-template="${t.id}">
      <div class="tc-emoji">${t.emoji}${hasSafety?` <span class="tc-safety-icon" title="Safety note">⚠️</span>`:""}</div>
      <div class="tc-name" style="color:${tierData.color}">${t.name}</div>
      <div class="tc-difficulty" style="color:${tierData.color}">${tierData.label} · <span style="color:${DIFF_COLOR[diff]};font-weight:600">${DIFF_LABEL[diff]}</span></div>
      <div class="tc-meta">${meta}</div>
      <div class="tc-desc">${t.description}</div>
    </button>`;
  };
  const filterBar = `<div class="template-filter-bar">${
    filterTabs.map(f => `<button class="template-filter-tab${_templateFilter===f.id?" active":""}" data-template-filter="${f.id}">${f.label}</button>`).join("")
  }</div>`;
  const catSections = orderedCats.map(cat => {
    const group = TEMPLATES.filter(t => t.category === cat.id && passesFilter(t));
    if (!group.length) return "";
    return `
    <div class="template-cat-label">${cat.label}</div>
    <div class="template-grid">${group.map(templateCard).join("")}</div>`;
  }).join("");
  const customSection = _templateFilter === "all" ? `
  <div class="template-cat-label">✏️ Custom</div>
  <div class="template-grid">
    <button class="template-card" data-select-template="custom">
      <div class="tc-emoji">🎯</div>
      <div class="tc-name">Custom</div>
      <div class="tc-meta">Any duration</div>
      <div class="tc-desc">Build your own challenge from scratch.</div>
    </button>
  </div>` : "";
  return filterBar + catSections + customSection;
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
    <div class="ongoing-toggle" style="margin-bottom:14px">
      <label class="ongoing-toggle-label">
        <input type="checkbox" id="bf-ongoing" ${builderForm.noEndDate?"checked":""} style="width:16px;height:16px;accent-color:var(--accent)">
        <span>Ongoing habit — no end date</span>
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
      <span class="field-label">Rest Days</span>
      <span class="mode-desc" style="margin:0">Zero — no rest days on this challenge.</span>
    </div>` : `
    <div class="joker-budget-row" style="margin-bottom:14px">
      <div class="field-label">Rest Days allowed</div>
      <div class="joker-stepper">
        <button class="joker-step-btn" data-joker-adj="-1">−</button>
        <span class="joker-step-val" id="joker-val">${builderForm.jokerBudget}</span>
        <button class="joker-step-btn" data-joker-adj="1">+</button>
      </div>
      <p class="mode-desc" style="margin:4px 0 0">${builderForm.jokerBudget === 0 ? "Zero compromise — no rest days." : `${builderForm.jokerBudget} day${builderForm.jokerBudget===1?"":"s"} you can skip without breaking your streak.`}</p>
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
    <label class="field" style="margin-bottom:4px">
      Weekly goal <span style="font-size:11px;font-weight:300;color:var(--text-dim)">points — auto-set for this challenge</span>
      <input id="bf-goal" type="number" value="${builderForm.weeklyGoal}" min="10" max="500">
    </label>
    ${(() => {
      const habits = builderForm.templateId
        ? (TEMPLATES.find(t=>t.id===builderForm.templateId)?.habits || [])
        : builderForm.habits;
      const maxPtsPerDay = habits.reduce((s,h) => {
        if (h.type === "tiered" && h.tiers?.length) return s + Math.max(...h.tiers.map(t=>t.points||0));
        return s + (h.points||0);
      }, 0);
      const bonus = habits.length >= 3 ? 3 : 0;
      const ptsPerWeek = (maxPtsPerDay + bonus) * 7;
      return ptsPerWeek > 0 ? `<p class="mode-desc" style="margin-bottom:16px">~${ptsPerWeek} pts/week if all habits done daily${bonus ? " (incl. +3 completion bonus)" : ""}</p>` : `<p style="margin-bottom:16px"></p>`;
    })()}
    ${template?.routeKm ? `
    <div class="route-info-card">
      <div class="route-info-header">
        <span class="route-info-emoji">${template.emoji}</span>
        <div>
          <div class="route-info-name">${template.name}</div>
          <div class="route-info-km">${template.routeKm.toLocaleString()} km · ${template.milestones.length} milestones</div>
        </div>
      </div>
      <div class="route-milestones-preview">
        ${template.milestones.map(m => `<span class="route-ms-chip">${m.emoji} ${m.name}</span>`).join("")}
      </div>
      <p class="mode-desc" style="margin:8px 0 0">Log any distance each day — walking, running, cycling, swimming. It all counts toward your route.</p>
    </div>` : `
    <div class="section-label" style="margin:0 0 8px">Habits (${template?template.habits.length:builderForm.habits.length})</div>
    ${template ? `
      <div class="habit-preview-list">
        ${template.habits.map(h=>`<div class="habit-preview-item">${h.emoji} ${h.title}</div>`).join("")}
      </div>` : `
      <div class="custom-habits-list">
        ${builderForm.habits.map((h,i)=>`
          <div class="custom-habit-row">
            <span class="custom-habit-emoji">${esc(h.emoji)}</span>
            <span class="custom-habit-name">${esc(h.title)}</span>
            <span class="custom-habit-pts">${h.type==="tiered" ? `${h.tiers[0].points}–${h.tiers[h.tiers.length-1].points}pt` : h.points+"pt"}</span>
            <button class="icon-btn" data-remove-habit="${i}">✕</button>
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
              ${builderForm.newHabitTiers.length>2?`<button class="icon-btn" data-nh-remove-tier="${i}" style="font-size:11px">✕</button>`:""}
            </div>`).join("")}
            ${builderForm.newHabitTiers.length<5?`<button class="link-btn" data-nh-add-tier style="font-size:12px;margin-top:2px">+ Add tier</button>`:""}
          </div>` : `
          <div class="tier-inputs-simple">
            <span style="font-size:12px;color:var(--text-dim)">Points</span>
            <input id="nh-pts" type="number" value="${builderForm.newHabitPoints}" min="1" max="20" style="width:60px">
          </div>`}
          <button class="pill-btn" data-add-habit style="margin-top:8px;width:100%">+ Add habit</button>
        </div>
      </div>`}
    `}
    <div class="pts-explainer">
      <div class="pts-explainer-title">⭐ How points work</div>
      <div class="pts-explainer-body">Check off habits to earn points. Hit your weekly goal to earn badges. Points reset every Monday — your streak doesn't.</div>
    </div>
    ${("Notification" in window) && Notification.permission === "default" ? `
    <div class="builder-notif-request">
      <div style="font-size:13px;font-weight:700;margin-bottom:4px">🔔 Enable daily reminders?</div>
      <div class="mode-desc" style="margin-bottom:8px">People who enable reminders are far more likely to finish. Takes one tap.</div>
      <button class="secondary-button" style="width:100%" data-request-notif-from-builder>Enable Reminders</button>
    </div>` : ("Notification" in window) && Notification.permission === "granted" ? `
    <div class="builder-reminder-hint">✅ Reminders on — we'll notify you at ${state.settings.reminderTime || "20:00"}.</div>` : `
    <div class="builder-reminder-hint">💡 Enable daily reminders in ⚙️ Settings after you start — it's the best habit for actually finishing.</div>`}
    <div class="builder-cta-footer">
      <button class="primary-button" data-start-challenge>Start Challenge 🚀</button>
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
      <div style="font-size:32px;margin-bottom:8px">📊</div>
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
  const theme = JOURNEY_THEMES[state.settings.journeyTheme] || JOURNEY_THEMES.mountain;
  const roadChunks = [];
  for (let i = 0; i < XP_LEVELS.length; i += 5) {
    roadChunks.push(XP_LEVELS.slice(i, i + 5));
  }
  return `
  <div class="level-profile-card">
    <div class="lp-top">
      <div class="lp-level-num">${theme.emoji} Lv.${info.level}</div>
      <div class="lp-level-name">${info.name}</div>
    </div>
    <div class="xp-bar-track lp-track">
      <div class="xp-bar-fill" style="width:${info.pct}%"></div>
    </div>
    <div class="lp-xp-row">
      <span>${state.xp.toLocaleString()} XP total</span>
      <span>${isMax ? "Max Level 🏆" : `${toNext.toLocaleString()} XP to Lv.${info.next.level}`}</span>
    </div>
    <div class="level-road">
      ${XP_LEVELS.map(lvl => {
        const unlocked = state.xp >= lvl.xp;
        const isCurrent = info.level === lvl.level;
        return `<div class="lvl-node ${unlocked ? "unlocked" : ""} ${isCurrent ? "current" : ""}" title="Lv.${lvl.level} ${getThemedLevelName(lvl.level)}">
          <div class="lvl-node-dot"></div>
          <div class="lvl-node-num">${lvl.level}</div>
        </div>`;
      }).join("")}
    </div>
  </div>`;
}

function renderBadges() {
  const allChallenges    = getAllChallenges();
  // Only show/count template badges for challenges that have been started
  const startedChallenges = allChallenges.filter(c => Object.keys(c.days).length > 0 || c.badges.length > 0);

  // Honest denominator: fixed global pool + per-challenge template sets
  const templateTotal = startedChallenges.reduce((s,c) => s + (TEMPLATE_BADGES[c.templateId]?.length || 0), 0);
  const total  = UNIVERSAL_BADGES.length + LIFETIME_BADGES.length + templateTotal;

  const universalEarned = state.globalBadges.filter(id => UNIVERSAL_BADGES.some(b=>b.id===id)).length;
  const lifetimeEarned  = state.globalBadges.filter(id => LIFETIME_BADGES.some(b=>b.id===id)).length;
  const templateEarned  = allChallenges.reduce((s,c) => s+c.badges.length, 0);
  const earned = universalEarned + lifetimeEarned + templateEarned;

  const pct = total > 0 ? Math.round((earned/total)*100) : 0;
  return `
  <main>
    ${renderLevelProfile()}
    <div class="section-label">Badges</div>
    <div class="more-card">
      <div class="badge-overview">
        <div class="badge-overview-count"><span class="boc-num">${earned}</span><span class="boc-total"> / ${total}</span></div>
        <div class="badge-overview-label">badges earned</div>
      </div>
      <div class="badge-overall-track"><div class="badge-overall-fill" style="width:${pct}%"></div></div>
      ${renderBadgeCat("🌍 Universal", UNIVERSAL_BADGES, state.globalBadges, null)}
      ${renderBadgeCat("💎 Lifetime Achievements", LIFETIME_BADGES, state.globalBadges, null)}
      ${startedChallenges.map(c => {
        const tBadges = TEMPLATE_BADGES[c.templateId];
        if (!tBadges) return "";
        return renderBadgeCat(`${esc(c.emoji)} ${esc(c.name)}`, tBadges, c.badges, c.templateId);
      }).join("")}
    </div>
    ${renderPersonalBests()}
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
    <div class="section-label">Habit Consistency</div>
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
      <div class="pchart-blur-overlay">
        <div class="pchart-pro-content">
          <div class="pchart-pro-lock">🔒</div>
          <div class="pchart-pro-title">Weekly consistency chart</div>
          <div class="pchart-pro-sub">📊 Charts · 🏆 Leaderboards · 📤 Export · 🔔 Per-habit reminders</div>
          <button class="pchart-pro-btn" data-tab="challenges">Join Conqur Pro early access →</button>
        </div>
      </div>
    </div>
  </div>`;
}

function renderBadgeCat(label, defs, earned, templateId) {
  const earnedSet = new Set(earned);
  const count = defs.filter(b=>earnedSet.has(b.id)).length;
  const catTier = templateId ? (TEMPLATE_TIERS[templateId] || "common") : null;

  const renderBadgeTile = (b) => {
    const isEarned = earnedSet.has(b.id);
    const tier = catTier || BADGE_TIERS[b.id] || "common";
    const td   = TIERS[tier];
    const borderStyle = isEarned && td ? `border-color:${td.border};` : "";
    const glowStyle   = isEarned && tier === "legendary" ? `box-shadow:0 0 10px ${td.border};` : "";
    return `
    <div class="badge ${isEarned?"earned":""}" style="${borderStyle}${glowStyle}">
      ${isEarned && td ? `<span class="badge-tier-dot" style="background:${td.color}" title="${td.label}"></span>` : ""}
      <div class="badge-label">${b.label}</div>
      ${b.desc?`<div class="badge-desc">${b.desc}</div>`:""}
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
      <div class="notif-prompt-icon">🔔</div>
      <div class="notif-prompt-title">Day 1 done — great start!</div>
      <div class="notif-prompt-sub">People with daily reminders are 3× more likely to finish. When should we nudge you?</div>
      <div class="notif-time-row">
        <label class="notif-time-label">Reminder time</label>
        <input type="time" id="notif-time-input" class="notif-time-input" value="${curTime}">
      </div>
      <button class="primary-button" style="margin-top:16px" data-notif-prompt-enable>Enable Reminders</button>
      <button class="link-btn notif-prompt-skip-btn" data-notif-prompt-skip>I'll risk forgetting →</button>
    </div>
  </div>`;
}

function renderBadgeSheet(badge) {
  const td = TIERS[badge.tier] || TIERS.common;
  const parts = badge.label.match(/^(\S+)\s*(.*)/);
  const icon  = parts ? parts[1] : badge.label;
  const title = parts ? parts[2] : "";
  return `
  <div class="badge-sheet-overlay" data-close-badge-sheet>
    <div class="badge-sheet" role="dialog" aria-modal="true" aria-label="Badge earned">
      <div class="badge-sheet-icon">${icon}</div>
      <div class="badge-sheet-tier" style="color:${td.color}">${td.label}</div>
      <div class="badge-sheet-title">${esc(title)}</div>
      <div class="badge-sheet-desc">${esc(badge.desc)}</div>
      <div class="badge-sheet-congrats">Achievement unlocked! 🎉</div>
      <button class="primary-button badge-sheet-cta" data-close-badge-sheet>Awesome!</button>
    </div>
  </div>`;
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
    <div class="backup-nudge-icon">☁️</div>
    <div class="backup-nudge-body">
      <div class="backup-nudge-title">Protect your progress</div>
      <div class="backup-nudge-sub">You've built a solid streak — back it up so you never lose it.</div>
    </div>
    <button class="secondary-button" style="margin-top:8px;width:100%" data-preview-onboarding>Back up free →</button>
  </div>`;
}

function renderAlmostThereBadge(challenge, streak) {
  const milestones = [7, 14, 21, 30, 50, 75];
  const next = milestones.find(m => m > streak && (m - streak) <= 2);
  if (!next) return "";
  const diff = next - streak;
  return `<div class="almost-badge-chip">🏅 ${diff === 1 ? "One more day" : "2 days"} to unlock your ${next}-day badge!</div>`;
}

// ── Settings ──────────────────────────────────────────────────────────────

// ── Onboarding ────────────────────────────────────────────────────────────

const ONBOARDING_STEPS = [
  { emoji:"🎯", title:"Pick a challenge",  body:"Choose from 50+ challenges — from Daily Journaling to the Pacific Crest Trail. Each one comes with daily habits to check off." },
  { emoji:"⭐", title:"Earn points daily",  body:"Every habit you check earns points and XP. Hit your weekly goal to unlock a badge and a streak freeze. Points reset Monday — streaks and XP don't." },
  { emoji:"🔥", title:"Come back tomorrow", body:"Your streak grows every day you log. Miss a day? Soft mode gives you grace. Rest days are built in. One day at a time." },
];
// onboardingStep: 0 = hero, 1-3 = info slides, 4 = account screen

function renderObHero() {
  const theme = JOURNEY_THEMES[state.settings.journeyTheme] || JOURNEY_THEMES.mountain;
  return `
  <div class="ob-screen" role="main">
    <div class="ob-hero-top">
      <div class="ob-hero-icon" aria-hidden="true">${theme.emoji}</div>
      <div class="ob-hero-logo">CONQUR</div>
      <div class="ob-hero-tagline">Build the habits.<br>${theme.tagline}.</div>
    </div>
    <ul class="ob-features" aria-label="App features">
      <li class="ob-feature"><span class="ob-feature-icon" aria-hidden="true">🎯</span><span>50+ challenges — from journaling to epic trails</span></li>
      <li class="ob-feature"><span class="ob-feature-icon" aria-hidden="true">⭐</span><span>Daily points, streaks &amp; badges</span></li>
      <li class="ob-feature"><span class="ob-feature-icon" aria-hidden="true">😴</span><span>Rest days &amp; streak protection built in</span></li>
      <li class="ob-feature"><span class="ob-feature-icon" aria-hidden="true">📴</span><span>Works offline — no account required</span></li>
    </ul>
    <button class="primary-button ob-cta" data-ob-next>Let's go →</button>
    <button class="link-btn ob-link" data-ob-to-signin>Already have an account? Sign in</button>
  </div>`;
}

function renderObGoal() {
  const goals = [
    { emoji:"🏃", label:"Get Active",          desc:"Walking, running, cycling",              template:"walking" },
    { emoji:"💪", label:"Transform My Body",    desc:"75 Hard, nutrition, strength",           template:"75-soft" },
    { emoji:"❤️", label:"Track My Health",      desc:"Weight, BP, glucose, sleep",             template:"sleep-tracker" },
    { emoji:"🌱", label:"Build Better Habits",  desc:"Morning routine, journaling, focus",     template:"morning-routine" },
    { emoji:"🏆", label:"Train for an Event",   desc:"Half marathon, ironman, OCR race",       template:"half-marathon-prep" },
    { emoji:"🗺️", label:"Conquer a Route",      desc:"Pacific Crest Trail, Camino, UTMB",     template:"camino" },
  ];
  return `
  <div class="ob-screen ob-screen--slide" role="main">
    <div class="ob-slide-inner">
      <div class="ob-emoji" aria-hidden="true">🎯</div>
      <div class="ob-title">What's your main goal?</div>
      <div class="ob-body">We'll open your recommended challenge — ready to start.</div>
    </div>
    <div class="ob-goal-grid">
      ${goals.map(g => `
      <button class="ob-goal-btn" data-ob-goal="${g.template}">
        <span class="ob-goal-emoji">${g.emoji}</span>
        <div class="ob-goal-info">
          <div class="ob-goal-label">${g.label}</div>
          <div class="ob-goal-desc">${g.desc}</div>
        </div>
        <span class="ob-goal-arrow">→</span>
      </button>`).join("")}
    </div>
    <button class="link-btn ob-link" data-ob-next>Skip — I'll choose myself →</button>
  </div>`;
}

function renderObSlide() {
  const theme = JOURNEY_THEMES[state.settings.journeyTheme] || JOURNEY_THEMES.mountain;
  const slides = [
    { emoji:"🎯", title:"Pick your challenge",
      body:`Choose from 50+ challenges — from daily journaling to epic trails. Each one comes with daily habits to check off and XP to earn on your <strong>${theme.label}</strong> journey.` },
    { emoji:theme.emoji, title:"Earn XP. Level up.",
      body:`Every habit you log earns XP. You start as a <strong>${theme.levels[0]}</strong> and climb all the way to Level 25 — <strong>${theme.levels[24]}</strong>. A real badge of persistence.` },
    { emoji:"🔥", title:"Show up every day.",
      body:`Your streak grows every day you log. Weekly points reset Monday — but your XP and level never do. Every session brings you closer to the top.` },
  ];
  const step = slides[onboardingStep - 2];
  const dots = ONBOARDING_STEPS.map((_,i) =>
    `<span class="ob-dot ${i === onboardingStep - 2 ? "active" : ""}"></span>`).join("");
  const isLast = onboardingStep === ONBOARDING_STEPS.length + 1;
  return `
  <div class="ob-screen ob-screen--slide" role="main">
    <div class="ob-slide-inner">
      <div class="ob-emoji" aria-hidden="true">${step.emoji}</div>
      <div class="ob-title">${step.title}</div>
      <div class="ob-body">${step.body}</div>
    </div>
    <div class="ob-dots" aria-hidden="true">${dots}</div>
    <button class="primary-button ob-cta" data-ob-next>${isLast ? "Let's go →" : "Next →"}</button>
    <button class="link-btn ob-link" data-ob-skip>Skip intro →</button>
  </div>`;
}

function renderObName() {
  const saved = state.settings.name || "";
  return `
  <div class="ob-screen ob-screen--slide" role="main">
    <div class="ob-slide-inner">
      <div class="ob-emoji" aria-hidden="true">👋</div>
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
  return `
  <div class="ob-screen ob-screen--account" role="main">
    <div class="ob-slide-inner">
      <div class="ob-emoji" aria-hidden="true">☁️</div>
      <div class="ob-title">${isSignin ? "Welcome back" : "Save your progress"}</div>
      <div class="ob-body">${isSignin
        ? "Sign in to restore your challenges, streaks and badges."
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
        </div>`}
    <button class="link-btn ob-link" data-ob-toggle-auth>
      ${isSignin ? "No account yet? Create one" : "Already have an account? Sign in"}
    </button>
    <button class="link-btn ob-link ob-link--faint" data-ob-skip-account>Skip — use offline</button>
    ${!isSignin ? `<p class="ob-privacy-note">By creating an account you agree to our <a href="/privacy.html" target="_blank" class="ob-privacy-link">Privacy Policy</a>.</p>` : ""}
  </div>`;
}

function renderObJourney() {
  const cur = state.settings.journeyTheme || "mountain";
  return `
  <div class="ob-screen ob-screen--slide" role="main">
    <div class="ob-slide-inner">
      <div class="ob-emoji" aria-hidden="true">🗺️</div>
      <div class="ob-title">Choose your journey</div>
      <div class="ob-body">Pick the world that fits you. It changes your level names and app colors — and you can switch anytime in Settings.</div>
    </div>
    <div class="ob-journey-grid">
      ${Object.entries(JOURNEY_THEMES).map(([id, t]) => `
      <button class="ob-journey-btn${cur === id ? " selected" : ""}" data-ob-journey="${id}">
        <span class="ob-journey-emoji">${t.emoji}</span>
        <div class="ob-journey-info">
          <div class="ob-journey-label">${t.label}</div>
          <div class="ob-journey-sub">${t.tagline}</div>
          <div class="ob-journey-peak">Lv.25: ${t.levels[24]}</div>
        </div>
        ${cur === id ? `<span class="ob-journey-check">✓</span>` : ""}
      </button>`).join("")}
    </div>
    <button class="primary-button ob-cta" data-ob-next>Continue →</button>
  </div>`;
}

function renderOnboarding() {
  if (onboardingStep === null) return "";
  if (onboardingStep === 0) return renderObHero();
  if (onboardingStep === 1) return renderObJourney();
  if (onboardingStep <= ONBOARDING_STEPS.length + 1) return renderObSlide();
  if (onboardingStep === ONBOARDING_STEPS.length + 2) return renderObName();
  return renderObAccount();
}

function renderDataSettings() {
  return `
  <div class="section-label" style="margin-top:20px">Data</div>
  <div class="more-card">
    <div style="font-size:13px;color:var(--text-dim);margin-bottom:12px">Export a full backup of your challenges, body tracking, and badges as a JSON file.</div>
    <button class="secondary-button" data-export-data>Export backup ↓</button>
    <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border)">
      <div style="font-size:13px;color:var(--text-dim);margin-bottom:8px">Restore from a previously exported backup.</div>
      <label class="secondary-button" style="display:inline-block;cursor:pointer">
        Restore backup ↑
        <input type="file" id="import-file-input" accept=".json" style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none">
      </label>
      <div style="font-size:12px;color:var(--text-dim);margin-top:8px">⚠️ Restoring will overwrite all current data.</div>
    </div>
  </div>
  <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border)">
    ${_resetConfirm ? `
      <div style="background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,0.3);border-radius:10px;padding:14px">
        <div style="font-size:13px;font-weight:700;color:#f87171;margin-bottom:6px">Reset everything?</div>
        <div style="font-size:12px;color:var(--text-dim);margin-bottom:12px">All challenges, XP, badges, streaks, and settings will be permanently deleted. This cannot be undone.</div>
        <div style="display:flex;gap:8px">
          <button class="secondary-button" data-reset-cancel style="flex:1">Cancel</button>
          <button class="primary-button" data-reset-confirm style="flex:1;background:#dc2626;border-color:#dc2626">Yes, reset everything</button>
        </div>
      </div>` : `
      <div style="font-size:13px;color:var(--text-dim);margin-bottom:8px">Erase all data and start fresh.</div>
      <button class="secondary-button" data-reset-app style="color:#f87171;border-color:rgba(220,38,38,0.4)">Reset everything</button>`}
  </div>
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
      <div style="font-size:32px;margin-bottom:10px">🔕</div>
      <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:8px">Notifications are blocked</div>
      <div style="font-size:13px;color:var(--text-dim);line-height:1.6;margin-bottom:14px">${steps}, then tap the button below.</div>
      <button class="secondary-button" style="width:100%" onclick="window.location.reload()">I've enabled them — reload ↻</button>
    </div>`;
  } else if (perm === "default") {
    body = `<button class="primary-button" data-request-notif-permission>Enable reminders 🔔</button>
            <p class="reminder-note" style="margin-top:8px">We'll nudge you once a day if habits are still open.</p>`;
  } else {
    body = `
    <div class="reminder-row">
      <div>
        <div style="font-size:14px;font-weight:700">Daily reminder</div>
        <div style="font-size:12px;color:var(--text-dim);margin-top:2px">Fires when today's habits are incomplete</div>
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
    <button class="secondary-button" data-save-reminder style="margin-top:10px">Save time</button>` : ""}`;
  }
  return `
  <div class="section-label" style="margin-top:20px">Reminders</div>
  <div class="more-card">${body}</div>`;
}

function renderProSection() {
  if (CloudSync.isSignedIn) {
    // Already a member — show compact "Pro" badge + sync controls
    return `
    <div class="section-label">☁️ Cloud Backup</div>
    <div class="more-card" style="margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <span style="font-size:18px">✅</span>
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
  <div class="section-label">⭐ Conqur Pro</div>
  <div class="more-card" style="margin-bottom:14px;background:linear-gradient(135deg,var(--primary-haze),var(--secondary-soft));border:1px solid var(--primary-glow)">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <div style="font-size:16px;font-weight:900;color:var(--text)">Free forever — plus backup</div>
      <div style="font-size:11px;font-weight:700;color:var(--primary);background:var(--primary-haze);border-radius:99px;padding:3px 10px">$4.99/mo</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:7px;margin-bottom:14px">
      <div style="font-size:13px;color:var(--text-dim);display:flex;gap:8px;align-items:flex-start"><span>☁️</span><span><strong style="color:var(--text)">Cloud backup</strong> — your streaks and badges survive a phone wipe or device switch</span></div>
      <div style="font-size:13px;color:var(--text-dim);display:flex;gap:8px;align-items:flex-start"><span>🔄</span><span><strong style="color:var(--text)">Sync across devices</strong> — log on your phone, review on your tablet</span></div>
      <div style="font-size:13px;color:var(--text-dim);display:flex;gap:8px;align-items:flex-start"><span>🚀</span><span><strong style="color:var(--text)">Support development</strong> — early access to new challenges and features</span></div>
    </div>
    ${_cloudAuthError ? `<div class="cloud-auth-error">${esc(_cloudAuthError)}</div>` : ""}
    ${_cloudAuthLoading ? `<div style="text-align:center;padding:12px;color:var(--text-dim);font-size:14px">Loading…</div>` : `
    <label class="field" style="margin-bottom:10px">
      Email
      <input id="cloud-email" type="email" placeholder="your@email.com" autocomplete="email" inputmode="email">
    </label>
    <label class="field" style="margin-bottom:14px">
      Password <span style="font-size:11px;font-weight:400;color:var(--text-dim)">(min 8 characters)</span>
      <input id="cloud-password" type="password" placeholder="Choose a password" autocomplete="new-password">
    </label>
    <div style="display:flex;gap:8px">
      <button class="secondary-button" style="flex:1" data-cloud-signin>Sign In</button>
      <button class="primary-button" style="flex:1" data-cloud-signup>Create Account →</button>
    </div>`}
  </div>`;
}

function renderCloudSync() { return ""; }

function renderSettings() {
  const u = state.settings.units;
  return `
  <main>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
      <button class="icon-btn" data-close-settings>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
      <div style="font-size:16px;font-weight:700">Settings</div>
    </div>
    <div class="section-label">Your Name</div>
    <div class="log-card" style="margin-bottom:14px">
      <label class="field">Name<input id="s-name" type="text" value="${esc(state.settings.name)}" placeholder="Optional"></label>
      <button class="primary-button" data-save-settings style="margin-top:12px">Save</button>
    </div>
    <div class="section-label">Journey &amp; Theme</div>
    <div class="more-card" style="margin-bottom:14px">
      <div style="font-size:12px;color:var(--text-dim);margin-bottom:12px">Changes your level names and app color scheme.</div>
      <div class="ob-journey-grid ob-journey-grid--settings">
        ${Object.entries(JOURNEY_THEMES).map(([id, t]) => {
          const active = (state.settings.journeyTheme || "mountain") === id;
          return `<button class="ob-journey-btn${active ? " selected" : ""}" data-settings-journey="${id}">
            <span class="ob-journey-emoji">${t.emoji}</span>
            <div class="ob-journey-info">
              <div class="ob-journey-label">${t.label}</div>
              <div class="ob-journey-sub">${t.tagline}</div>
              <div class="ob-journey-peak">Lv.25: ${t.levels[24]}</div>
            </div>
            ${active ? `<span class="ob-journey-check">✓</span>` : ""}
          </button>`;
        }).join("")}
      </div>
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
    <div class="section-label" style="margin-top:20px">How Conqur Works</div>
    <div class="more-card" style="font-size:13px;line-height:1.65;color:var(--text-dim)">
      <div style="margin-bottom:12px"><strong style="color:var(--text)">🎯 Challenges</strong> — Pick one of 50+ challenges. Each has daily habits to check off. Complete all habits for the day to earn full points.</div>
      <div style="margin-bottom:12px"><strong style="color:var(--text)">⭐ Points &amp; Weekly Goal</strong> — Each habit is worth points. Hit your weekly goal to earn a streak freeze. Points reset each Monday; XP and streaks don't.</div>
      <div style="margin-bottom:12px"><strong style="color:var(--text)">🔥 Streaks</strong> — Your streak grows every day you log all habits. Soft mode gives you one grace day before it breaks. Rest days don't break streaks.</div>
      <div style="margin-bottom:12px"><strong style="color:var(--text)">😴 Rest Days</strong> — Each challenge allows up to 3 rest days. They're planned recovery — not failures.</div>
      <div style="margin-bottom:12px"><strong style="color:var(--text)">⚡ XP &amp; Levels</strong> — XP accumulates from points across all challenges and never resets. Climb from Base Camp all the way to Everest.</div>
      <div style="margin-bottom:12px"><strong style="color:var(--text)">🏔 Phases</strong> — Longer challenges are split into phases so the finish line always feels reachable. Each phase completion is celebrated.</div>
      <div><strong style="color:var(--text)">🏅 Badges</strong> — Earn badges for streaks, weekly goals, and challenge completions. Proof of everything you've built.</div>
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
    toggleHabit(habitId);
    // Show +pts animation if habit was just checked on (not off)
    const c = currentChallenge();
    const day = c && getChallengeDay(c, effectiveDate());
    if (day?.done.includes(habitId)) {
      const habit = c.habits.find(h => h.id === habitId);
      const pts   = habit?.points ?? 0;
      if (pts > 0) showPtsAnim(pts, rect);
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
  on("[data-open-builder]", () => { builderOpen=true; builderStep="quiz"; builderQuizAnswers={goal:null,time:null,level:null}; builderForm=defaultBuilderForm(); render(); });
  on("[data-close-builder]",() => { builderOpen=false; render(); });
  on("[data-open-settings]",() => { settingsOpen=!settingsOpen; render(); });
  on("[data-close-settings]",()=>{ settingsOpen=false; render(); });
  on("[data-preview-onboarding]", () => { settingsOpen=false; _obAuthError=""; _obAuthMode="signup"; onboardingStep=0; render(); });
  on("[data-view-challenge]",el=>{ viewChallengeId=el.dataset.viewChallenge; challengeDetailView="weeks"; calendarViewMonth=null; render(); });
  on("[data-close-detail]", () => { viewChallengeId=null; challengeDetailView="weeks"; calendarViewMonth=null; render(); });
  on("[data-detail-view]",  el => { challengeDetailView=el.dataset.detailView; render(); });
  on("[data-cal-prev]",     el => { calendarViewMonth=el.dataset.calPrev; render(); });
  on("[data-cal-next]",     el => { calendarViewMonth=el.dataset.calNext; render(); });
  on("[data-use-freeze]",   () => useStreakFreeze());
  on("[data-capture-photo]",el => captureProgressPhoto(el.dataset.capturePhoto));
  on("[data-log-weight]",   () => logWeight());
  on("[data-save-settings]",() => saveSettings());
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
  on("[data-pin-challenge]", el => {
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
    if (desc) desc.textContent = builderForm.jokerBudget === 0 ? "Zero compromise — no rest days." : `${builderForm.jokerBudget} planned day${builderForm.jokerBudget===1?"":"s"} off. Use them wisely.`;
  });
  on("[data-builder-back]", () => {
    if (builderStep === "customize")  { builderStep = "quickstart"; render(); }
    else if (builderStep === "quickstart") { builderStep = "template"; render(); }
    else { builderStep = "quiz"; render(); }
  });
  on("[data-quickstart-customise]", () => { builderStep = "customize"; render(); });
  on("[data-template-filter]", el => { _templateFilter = el.dataset.templateFilter; render(); });
  on("[data-quiz-goal]",  el => { builderQuizAnswers.goal  = el.dataset.quizGoal;  render(); });
  on("[data-quiz-time]",  el => { builderQuizAnswers.time  = el.dataset.quizTime;  render(); });
  on("[data-quiz-level]", el => { builderQuizAnswers.level = el.dataset.quizLevel; render(); });
  on("[data-quiz-find]",  () => { selectTemplate(getQuizRecommendation(builderQuizAnswers)); });
  on("[data-quiz-skip]",  () => { builderStep="template"; render(); });
  on("[data-request-notif-from-builder]", () => requestNotificationPermission());
  on("[data-close-badge-sheet]",    () => { _badgeSheetQueue.shift(); render(); });
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
  on("[data-notif-prompt-enable]",  async () => { _notifPromptVisible = false; await requestNotificationPermission(); render(); });
  on("[data-notif-prompt-skip]",    () => { _notifPromptVisible = false; render(); });
  on("[data-start-challenge]",() => startChallenge());
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
  on("[data-close-share-modal]", () => { _shareModalChallenge = null; _shareCardDataUrl = null; render(); });
  on("[data-share-card-native]", () => {
    if (!_shareModalChallenge || !_shareCardDataUrl) return;
    const streak    = calcChallengeStreak(_shareModalChallenge);
    const totalPts  = Object.values(_shareModalChallenge.days).reduce((a,d)=>a+(d.pts||0),0);
    const totalDays = diffDays(_shareModalChallenge.startDate, _shareModalChallenge.endDate)+1;
    const dayNum    = challengeDayNumber(_shareModalChallenge);
    const text = _shareModalDone
      ? `I just completed the ${_shareModalChallenge.name} challenge on Conqur! 🏆\n${totalDays} days · ${totalPts} pts · ${streak}-day streak.\nBuilding habits that stick. 💪\nconqur.netlify.app`
      : `Day ${dayNum} of my ${_shareModalChallenge.name} challenge — ${streak}-day streak. 🔥\nBuilding habits one day at a time.\nconqur.netlify.app`;
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
      ? `I just completed the ${_shareModalChallenge.name} challenge on Conqur! 🏆\n${totalDays} days · ${totalPts} pts · ${streak}-day streak.\nBuilding habits that stick. 💪\nconqur.netlify.app`
      : `Day ${dayNum} of my ${_shareModalChallenge.name} challenge — ${streak}-day streak. 🔥\nBuilding habits one day at a time.\nconqur.netlify.app`;
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
    showToast("✅ Signed in! Data restored.");
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
    showToast("✅ Account created! Data syncing to cloud.");
    render();
  });
  on("[data-cloud-signout]",   () => { CloudSync.signOut(); _cloudAuthError = ""; render(); });
  on("[data-dismiss-newweek]", () => { _newWeekBanner = null; render(); });
  on("[data-toggle-stats]", () => {
    const autoCollapse = (() => {
      const c = currentChallenge(); if (!c) return false;
      return challengeDayNumber(c) <= 2;
    })();
    const currentlyCollapsed = _statsCollapsed === null ? autoCollapse : _statsCollapsed;
    _statsCollapsed = !currentlyCollapsed;
    render();
  });
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
    showToast("☁️ Data synced to cloud."); render();
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
      `Remove "${h.title}" from this challenge? Past logs for this habit will be cleared.`,
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
    if (!title) { showToast("Enter a habit name."); return; }
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
  on("[data-export-data]",     () => exportData());
  on("[data-reset-app]",       () => { _resetConfirm = true;  render(); });
  on("[data-reset-cancel]",    () => { _resetConfirm = false; render(); });
  on("[data-reset-confirm]",   () => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith("conqur_") || k === STORAGE_KEY || k === OLD_KEY);
    keys.forEach(k => localStorage.removeItem(k));
    CloudSync.signOut().catch(() => {}).finally(() => window.location.reload());
  });
  // Import file — delegated so it works when settings panel opens after first render
  document.addEventListener("change", e => {
    if (!e.target.matches("#import-file-input")) return;
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target.result);
        // Basic shape check — must look like a Conqur backup
        if (!parsed || typeof parsed !== "object" || !("challenges" in parsed)) {
          showToast("That doesn't look like a Conqur backup file."); return;
        }
        const cCount = Object.keys(parsed.challenges || {}).length;
        const normalized = normalizeState(parsed);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        showToast(`Backup restored (${cCount} challenge${cCount===1?"":"s"})! Reloading…`);
        setTimeout(() => window.location.reload(), 1400);
      } catch(err) {
        showToast("Invalid backup file — couldn't restore.");
      }
    };
    reader.readAsText(file);
  });
  // ── Onboarding navigation ──────────────────────────────────────────────────
  on("[data-ob-journey]", el => {
    const id = el.dataset.obJourney;
    if (!JOURNEY_THEMES[id]) return;
    state.settings.journeyTheme = id;
    saveState();
    applyTheme();
    render();
  });
  on("[data-settings-journey]", el => {
    const id = el.dataset.settingsJourney;
    if (!JOURNEY_THEMES[id]) return;
    state.settings.journeyTheme = id;
    saveState();
    applyTheme();
    showToast(`${JOURNEY_THEMES[id].emoji} Journey changed to ${JOURNEY_THEMES[id].label}`);
    render();
  });
  on("[data-ob-next]", () => {
    onboardingStep++;
    render();
  });
  on("[data-ob-skip]", () => {
    // Skip info slides → jump straight to name screen
    onboardingStep = ONBOARDING_STEPS.length + 2;
    _obAuthError = "";
    render();
  });
  on("[data-ob-to-signin]", () => {
    _obAuthMode = "signin";
    onboardingStep = ONBOARDING_STEPS.length + 3; // skip name step for returning users
    _obAuthError = "";
    render();
  });
  on("[data-ob-goal]", el => {
    const templateId = el.dataset.obGoal;
    const tpl = TEMPLATES.find(t => t.id === templateId);
    onboardingStep = null;
    activeTab = "challenges";
    builderOpen = true;
    builderStep = "customize";
    builderForm = defaultBuilderForm();
    if (tpl) {
      builderForm.templateId = templateId;
      builderForm.name       = tpl.name;
      builderForm.emoji      = tpl.emoji;
      builderForm.endDate    = addDays(todayKey(), tpl.duration - 1);
      builderForm.weeklyGoal = tpl.weeklyGoal;
      builderForm.mode       = tpl.defaultMode || "soft";
      builderForm.jokerBudget = tpl.noRestDay ? 0 : 3;
    }
    render();
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
    trackEvent(_obAuthMode === "signup" ? "Account Created" : "Sign In");
    // Success — go to challenge picker (signup) or today tab (signin with existing data)
    onboardingStep = null;
    if (_obAuthMode === "signin" && Object.keys(state.challenges).length > 0) {
      activeTab = "today";
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
  on("[data-confirm-ok]",      () => { const fn = _confirmDialog?.onConfirm; _confirmDialog = null; render(); if (fn) fn(); });
  on("[data-confirm-cancel]",  () => { _confirmDialog = null; render(); });
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
    const inputVal = Math.max(0, parseFloat(e.target.value) || 0);
    logMeasurement(habitId, inputVal);
  });
  // Distance habit input — delegated change event (persists across re-renders)
  document.addEventListener("change", e => {
    if (!e.target.matches("[data-distance-habit]")) return;
    const habitId  = e.target.dataset.distanceHabit;
    const inputVal = Math.max(0, parseFloat(e.target.value) || 0);
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
  // Block rest day if template forbids it, or if joker budget is exhausted
  if (mode === "rest") {
    const tpl = c.templateId ? TEMPLATES.find(t => t.id === c.templateId) : null;
    if (tpl?.noRestDay) { showToast("No rest days on this challenge — that's the point. 💪"); return; }
    const dayKey = effectiveDate();
    const alreadyRest = c.days[dayKey]?.mode === "rest";
    if (!alreadyRest) {
      const used = Object.values(c.days).filter(d => d.mode === "rest").length;
      const budget = c.jokerBudget ?? 3;
      if (used >= budget) {
        showToast(`No rest days left — you used all ${budget}. Keep going. 💪`);
        return;
      }
    }
  }
  const day = getChallengeDay(c, effectiveDate());
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
  if (checking) { day.done.push(id); _animHabitId = id; }
  else          { day.done = day.done.filter(x=>x!==id); _animHabitId = null; }
  updateDayPoints(c, day);
  state.xp = recalcXP();
  const xpGain  = state.xp - xpBefore;
  const lvlInfo = getLevelInfo(state.xp);
  if (lvlInfo.level > levelBefore) {
    const _luT = JOURNEY_THEMES[state.settings.journeyTheme] || JOURNEY_THEMES.mountain;
    setTimeout(() => { _levelUpOverlay = { level: lvlInfo.level, name: lvlInfo.name, emoji: _luT.emoji, total: state.xp }; render(); }, 600);
  } else if (xpGain > 0) {
    showToast(`⚡ +${xpGain} XP`);
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
    if (!day.done.includes(habitId)) { day.done.push(habitId); _animHabitId = habitId; }
  } else {
    day.done = day.done.filter(id => id !== habitId);
    _animHabitId = null;
  }
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
  day.distances[habitId] = km;
  if (km > 0) {
    if (!day.done.includes(habitId)) { day.done.push(habitId); _animHabitId = habitId; }
  } else {
    day.done = day.done.filter(id => id !== habitId);
    _animHabitId = null;
  }
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
  if (String(day.tiers[habitId])===String(val)) {
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
  const xpGain2  = state.xp - xpBefore2;
  const lvlInfo2 = getLevelInfo(state.xp);
  if (lvlInfo2.level > levelBefore2) {
    const _luT2 = JOURNEY_THEMES[state.settings.journeyTheme] || JOURNEY_THEMES.mountain;
    setTimeout(() => { _levelUpOverlay = { level: lvlInfo2.level, name: lvlInfo2.name, emoji: _luT2.emoji, total: state.xp }; render(); }, 600);
  } else if (xpGain2 > 0) {
    showToast(`⚡ +${xpGain2} XP`);
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

function exportData() {
  const json = localStorage.getItem(STORAGE_KEY) || "{}";
  const blob = new Blob([json], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = `conqur-backup-${todayKey()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("Backup downloaded ✓");
}

function saveReminderTime() {
  const el = document.getElementById("reminder-time");
  if (!el || !el.value) return;
  state.settings.reminderTime = el.value;
  saveState(); scheduleReminder();
  showToast("Reminder set for " + el.value + " 🔔"); render();
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
  const xpTheme  = JOURNEY_THEMES[state.settings.journeyTheme] || JOURNEY_THEMES.mountain;
  const weeklyXP = template.habits.reduce((sum, h) => sum + (h.points || 2), 0) * 7;
  return `
  <div class="builder-quickstart">
    <div class="bqs-hero">
      <div class="bqs-emoji">${template.emoji}</div>
      <div class="bqs-tier" style="color:${td.color}">${td.label}</div>
      <div class="bqs-name">${esc(template.name)}</div>
      <div class="bqs-meta">${dur} days · starts today</div>
    </div>
    <div class="bqs-habits">
      ${habits.map(h => `<div class="bqs-habit-row">✓ ${esc(h.title)}</div>`).join("")}
      ${template.habits.length > 5 ? `<div class="bqs-habit-row" style="color:var(--text-faint)">+ ${template.habits.length - 5} more habits</div>` : ""}
    </div>
    <div class="bqs-desc">${esc(template.description)}</div>
    ${TEMPLATE_SAFETY[template.id] ? `<div class="bqs-safety-warning"><span class="bqs-safety-icon">⚠️</span><span>${TEMPLATE_SAFETY[template.id]}</span></div>` : ""}
    <div class="bqs-xp-row">
      ${xpTheme.emoji} Earn ~<strong>${weeklyXP.toLocaleString()} XP</strong> per week logging every habit
    </div>
    <div class="bqs-mode-note">
      ${template.defaultMode === "soft"
        ? "💡 <strong>Soft mode</strong> — one grace day per week if life gets in the way."
        : "⚡ <strong>Strict mode</strong> — no missed days. Zero compromise."}
    </div>
    <div class="builder-cta-footer">
      <button class="primary-button" data-start-challenge>Start ${dur}-Day Challenge 🚀</button>
      <button class="secondary-button" style="margin-top:8px" data-quickstart-customise>Customise first →</button>
      <button class="link-btn" style="margin-top:10px;text-align:center;display:block" data-builder-back>← Choose a different challenge</button>
    </div>
  </div>`;
}

function startChallenge() {
  const nameEl       = document.getElementById("bf-name");
  const startEl      = document.getElementById("bf-start");
  const endEl        = document.getElementById("bf-end");
  const goalEl       = document.getElementById("bf-goal");
  const ongoingEl    = document.getElementById("bf-ongoing");
  const goalWeightEl = document.getElementById("bf-goalweight");
  if (nameEl)       builderForm.name      = nameEl.value.trim();
  if (startEl)      builderForm.startDate = startEl.value;
  if (ongoingEl)    builderForm.noEndDate = ongoingEl.checked;
  if (endEl && !builderForm.noEndDate) builderForm.endDate = endEl.value;
  if (builderForm.noEndDate) builderForm.endDate = "9999-12-31";
  if (goalEl)       builderForm.weeklyGoal = Number(goalEl.value) || 100;
  if (goalWeightEl?.value) builderForm.goalWeight = parseFloat(goalWeightEl.value) || null;
  if (!builderForm.startDate) { showToast("Set a start date."); return; }
  if (!builderForm.noEndDate && !builderForm.endDate) { showToast("Set an end date or enable Ongoing."); return; }
  const template = builderForm.templateId ? TEMPLATES.find(t=>t.id===builderForm.templateId) : null;
  const habitCount = template ? template.habits.length : builderForm.habits.length;
  if (habitCount === 0) { showToast("Add at least one habit first."); return; }
  const c = createChallenge(builderForm);
  todayChallengeId = c.id;
  builderOpen = false;
  activeTab = "today";
  showToast(`${c.emoji} ${c.name} started!`);
  trackEvent("Challenge Started", { challenge: c.name, template: builderForm.templateId || "custom" });
  render();
}

function addCustomHabit() {
  const emoji = (document.getElementById("nh-emoji")?.value||"⭐").trim()||"⭐";
  const name  = (document.getElementById("nh-name")?.value||"").trim();
  if (!name) { showToast("Enter a habit name."); return; }

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
  const goal  = Number(document.getElementById("ec-goal")?.value);
  if (!start || !end || start > end) { showToast("Check your dates."); return; }
  if (name)  c.name       = name;
  if (emoji) c.emoji      = emoji;
  c.startDate  = start;
  c.endDate    = end;
  c.mode       = editForm?.mode || c.mode;
  if (goal > 0) c.weeklyGoal = goal;

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
    if (c.habits.length === 0) { showToast("Add at least one habit."); return; }
  }

  state.xp = recalcXP();
  saveState();
  checkBadges(c);
  editChallengeId = null;
  editForm        = null;
  viewChallengeId = c.id;
  showToast("Challenge updated ✓");
  render();
}

function pauseChallenge(id) {
  const c = getChallenge(id); if (!c) return;
  if (c.status === "paused") {
    // Resuming: push end date forward by however many days it was paused
    const pausedOn = c.pausedOn || todayKey();
    const daysPaused = Math.max(0, diffDays(pausedOn, todayKey()));
    if (daysPaused > 0) c.endDate = addDays(c.endDate, daysPaused);
    c.pausedDays = (c.pausedDays || 0) + daysPaused;   // keep day counter accurate
    c.status = "active";
    delete c.pausedOn;
    showToast(`Challenge resumed. End date moved to ${c.endDate}.`);
  } else {
    c.status = "paused";
    c.pausedOn = todayKey();
    // Prompt for resume reminder (non-blocking)
    const days = parseInt(window.prompt("Remind you to resume in how many days? (leave blank to skip)", "7") || "0", 10);
    if (days > 0) {
      c.resumeReminderDate = addDays(todayKey(), days);
      showToast(`Challenge paused. Reminder set for ${c.resumeReminderDate}.`);
    } else {
      c.resumeReminderDate = null;
      showToast("Challenge paused. End date will adjust when you resume.");
    }
  }
  saveState(); render();
}

function abandonChallenge(id) {
  const c = getChallenge(id); if (!c) return;
  showConfirm(
    `Abandon "${c.name}"? Progress is kept but the challenge will be marked as failed.`,
    () => {
      c.finalStreak = calcChallengeStreak(c);
      c.status = "failed";
      saveState(); viewChallengeId = null;
      showToast("Challenge abandoned."); render();
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
      showToast("Challenge deleted."); render();
    }
  );
}

function useStreakFreeze() {
  const c = currentChallenge(); if (!c) return;
  if ((c.streakFreezes || 0) <= 0) { showToast("No streak freezes available."); return; }
  const yesterday = addDays(todayKey(), -1);
  if (yesterday < c.startDate) { showToast("Nothing to freeze — challenge just started."); return; }
  const day = getChallengeDay(c, yesterday);
  if (dayLogged(day)) { showToast("Yesterday is already logged — no freeze needed."); return; }
  day.freezeUsed = true;
  c.streakFreezes--;
  saveState();
  showToast("❄️ Streak freeze applied! Yesterday is covered. Streak protected.");
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
      showToast("📸 Progress photo saved!");
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
  if (streak >= 50) return `🔥 ${streak}-day streak. You are in the 1%.`;
  if (streak >= 30) return `⚡ ${streak} days straight. Most people never get here.`;
  if (streak >= 21) return `🏆 ${streak} days. The average person quits at day 12. You didn't.`;
  if (streak >= 14) return `🔥 ${streak} in a row. The week-one graveyard is behind you.`;
  if (streak >= 7)  return `⚡ ${streak}-day streak. Habit is forming. Don't stop now.`;
  if (streak >= 3)  return `🔥 ${streak} days in a row. The streak is real.`;
  // Data-driven on total habits logged
  if (totalHabits >= 200) return `${totalHabits} habits logged. You're not the same person you were.`;
  if (totalHabits >= 100) return `${totalHabits} habits. 100 small decisions that add up.`;
  if (totalHabits >= 50)  return `${totalHabits} habits logged. You've built more than you realise.`;
  // Day-number narrative
  if (dayNumber === 1) return `Day 1. Every legend has a first day. Make it count.`;
  if (dayNumber <= 3)  return `Day ${dayNumber} — the hardest days are the first ones. You're in them.`;
  if (dayNumber <= 7)  return `Day ${dayNumber} — still in the building phase. Trust the process.`;
  if (dayNumber >= 21) return `Day ${dayNumber}. Most people never make it this far.`;
  if (dayNumber >= 14) return `Day ${dayNumber}. Habit is forming. Keep the chain unbroken.`;
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
    : `${incomplete.length} challenges`;
  new Notification("Conqur — Don't break the streak 🔥", {
    body: `${names}: you still have habits left for today.`,
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
    showToast("Reminders on! 🔔 You'll be nudged at " + state.settings.reminderTime);
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
    }
  });
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
  const c1 = cs.getPropertyValue("--primary").trim()   || "#b44fff";
  const c2 = cs.getPropertyValue("--secondary").trim() || "#ff4fa3";
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
render();
