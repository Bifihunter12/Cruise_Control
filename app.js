"use strict";

const APP_VERSION = "2026.06.08.6";
const STORAGE_KEY = "conqur_v1";
const OLD_KEY     = "cruise_mode_v1";
const RING_CIRC   = 2 * Math.PI * 90;
const UPDATE_CHECK_MS = 30 * 60 * 1000;

// ── WoW-style Rarity Tiers ────────────────────────────────────────────────
const TIERS = {
  common:    { label:"Common",    color:"#86efac" }, // soft green
  uncommon:  { label:"Uncommon",  color:"#1eff00" }, // WoW classic green
  rare:      { label:"Rare",      color:"#4da6ff" }, // WoW blue
  epic:      { label:"Epic",      color:"#c070ff" }, // WoW purple
  legendary: { label:"Legendary", color:"#ff8c00" }, // WoW orange/gold
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
  "u-boss1":"common","u-bossw":"uncommon","u-cmback":"common","u-min5":"uncommon",
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
    description: "86 days that change everything. Body, habits, and an unbreakable mind.",
    duration: 86, weeklyGoal: 175, defaultMode: "soft", noRestDay: true,
    habits: [
      { id:"yoga",      title:"Morning yoga",              emoji:"🧘", quip:"Sets the tone for everything after.",           type:"binary", minimum_day:true,  boss_only:false, points:2 },
      { id:"gratitude", title:"Gratitude",                 emoji:"🙏", quip:"Three things. Two minutes. Changes everything.", type:"binary", minimum_day:true,  boss_only:false, points:2 },
      { id:"weighin",   title:"Daily weigh-in",            emoji:"⚖️", quip:"Data beats guessing every time.",               type:"binary", minimum_day:true,  boss_only:false, points:2 },
      { id:"steps",     title:"Steps",                     emoji:"👟", quip:"10k min · 12k standard · 15k boss.",            type:"tiered", minimum_day:true,  boss_only:false, points:2,
        tiers:[{value:10,label:"10k",points:2},{value:12,label:"12k",points:3},{value:15,label:"15k",points:4}] },
      { id:"protein",   title:"Protein at every meal",     emoji:"🥩", quip:"Protein keeps the muscle, drops the fat.",      type:"binary", minimum_day:true,  boss_only:false, points:2 },
      { id:"water",     title:"Drink 3L water",            emoji:"💧", quip:"Most hunger is just thirst.",                   type:"binary", minimum_day:true,  boss_only:false, points:2 },
      { id:"noalcohol", title:"No alcohol or liquid cals", emoji:"🚫", quip:"Empty calories in every form. Skip them.",      type:"binary", minimum_day:true,  boss_only:false, points:2 },
      { id:"nolate",    title:"Stop eating at 8pm",        emoji:"⏰", quip:"Kitchen closes at 8.",                          type:"binary", minimum_day:true,  boss_only:false, points:2 },
      { id:"sleep",     title:"7+ hours sleep",            emoji:"🌙", quip:"Sleep is the real supplement.",                 type:"binary", minimum_day:false, boss_only:false, points:2 },
      { id:"mobility",  title:"Functional mobility",       emoji:"🦵", quip:"Recovery is training too.",                    type:"binary", minimum_day:false, boss_only:false, points:2 },
      { id:"read",      title:"Read 10 pages",             emoji:"📖", quip:"10 pages a day is a book a month.",            type:"binary", minimum_day:false, boss_only:false, points:2 },
      { id:"run",       title:"Run session",               emoji:"🏃", quip:"Boss Day fuel. Go further.",                   type:"tiered", minimum_day:false, boss_only:true,  points:2,
        tiers:[{value:1,label:"1 km",points:2},{value:3,label:"3 km",points:3},{value:5,label:"5 km",points:5},{value:"5+",label:"5 km+",points:7}] },
    ]
  },
  {
    id: "75-hard", name: "75 Hard", emoji: "💪", category: "transformation",
    description: "The original mental toughness program. 75 days. Zero compromises.",
    duration: 75, weeklyGoal: 140, defaultMode: "strict", noRestDay: true,
    habits: [
      { id:"w1",       title:"Workout 1 — 45 min",          emoji:"🏋️", quip:"First session done.",               type:"binary", minimum_day:true,  boss_only:false, points:3 },
      { id:"w2",       title:"Workout 2 — 45 min outdoors", emoji:"🌤️", quip:"Outdoor. No exceptions.",            type:"binary", minimum_day:true,  boss_only:false, points:3 },
      { id:"water4l",  title:"Drink 4L water",              emoji:"💧", quip:"Non-negotiable.",                    type:"binary", minimum_day:true,  boss_only:false, points:2 },
      { id:"diet",     title:"Follow diet. No cheat meals.",emoji:"🥗", quip:"No alcohol. No cheat meals.",        type:"binary", minimum_day:true,  boss_only:false, points:2 },
      { id:"read10",   title:"Read 10 pages (non-fiction)", emoji:"📖", quip:"10 pages of growth.",               type:"binary", minimum_day:true,  boss_only:false, points:2 },
      { id:"photo",    title:"Progress photo",              emoji:"📸", quip:"Document the change.",               type:"binary", minimum_day:true,  boss_only:false, points:1 },
    ]
  },
  {
    id: "75-soft", name: "75 Soft", emoji: "🧘", category: "transformation",
    description: "The balanced version. 75 days of consistent, sustainable habits.",
    duration: 75, weeklyGoal: 120, defaultMode: "soft",
    habits: [
      { id:"workout",  title:"Workout 45 min",                  emoji:"🏃", quip:"Move your body.",               type:"binary", minimum_day:true,  boss_only:false, points:3 },
      { id:"water3l",  title:"Drink 3L water",                  emoji:"💧", quip:"Most hunger is just thirst.",   type:"binary", minimum_day:true,  boss_only:false, points:2 },
      { id:"diet75s",  title:"Eat well (1 social meal/wk ok)",  emoji:"🥗", quip:"Balanced, not perfect.",        type:"binary", minimum_day:true,  boss_only:false, points:2 },
      { id:"read10s",  title:"Read 10 pages",                   emoji:"📖", quip:"10 pages a day.",              type:"binary", minimum_day:false, boss_only:false, points:2 },
    ]
  },
  {
    id: "30-pushups", name: "30-Day Push-Up", emoji: "💥", category: "movement",
    description: "Build upper body strength. Start at 10, end at 100.",
    duration: 30, weeklyGoal: 70, defaultMode: "strict",
    habits: [
      { id:"pushups",  title:"Daily push-ups",              emoji:"💪", quip:"Do your push-ups.",                 type:"binary", minimum_day:true,  boss_only:false, points:5 },
      { id:"sleep30",  title:"8+ hours sleep",              emoji:"🌙", quip:"Muscles grow at night.",            type:"binary", minimum_day:false, boss_only:false, points:2 },
      { id:"prot30",   title:"Protein at every meal",       emoji:"🥩", quip:"Feed the muscle.",                 type:"binary", minimum_day:true,  boss_only:false, points:2 },
    ]
  },
  {
    id: "dry-month", name: "Dry Month", emoji: "🥃", category: "lifestyle",
    description: "30 days, zero alcohol. Feel the difference.",
    duration: 30, weeklyGoal: 80, defaultMode: "strict",
    habits: [
      { id:"noalc",    title:"No alcohol",                  emoji:"🚫", quip:"Not today.",                        type:"binary", minimum_day:true,  boss_only:false, points:4 },
      { id:"water30",  title:"Drink 2L water",              emoji:"💧", quip:"Replace the empty with essential.", type:"binary", minimum_day:true,  boss_only:false, points:2 },
      { id:"sleep30d", title:"7+ hours sleep",              emoji:"🌙", quip:"Sleep is better sober anyway.",    type:"binary", minimum_day:false, boss_only:false, points:2 },
      { id:"journal",  title:"Journal 5 min",               emoji:"✍️", quip:"Write it out.",                   type:"binary", minimum_day:false, boss_only:false, points:2 },
    ]
  },
  {
    id: "reading", name: "Reading Challenge", emoji: "📚", category: "lifestyle",
    description: "Read every day for 30 days. 10 pages minimum.",
    duration: 30, weeklyGoal: 60, defaultMode: "soft",
    habits: [
      { id:"readpg",   title:"Read 10 pages",               emoji:"📖", quip:"10 pages a day is a book a month.", type:"binary", minimum_day:true,  boss_only:false, points:4 },
      { id:"noscreen", title:"No screens 1 hr before bed",  emoji:"📵", quip:"Protect your sleep and focus.",    type:"binary", minimum_day:false, boss_only:false, points:2 },
      { id:"reflect",  title:"Reflect on what you read",    emoji:"🧠", quip:"Understanding beats volume.",      type:"binary", minimum_day:false, boss_only:false, points:2 },
    ]
  },
  {
    id: "dog-walk", name: "Dog Walk Challenge", emoji: "🐕", category: "movement",
    description: "30 days of daily walks with your dog. Fresh air, consistency, and happy paws.",
    duration: 30, weeklyGoal: 75, defaultMode: "soft",
    habits: [
      { id:"dw-walk",    title:"Morning walk",              emoji:"🌅", quip:"Start the day right — both of you.", type:"binary", minimum_day:true,  boss_only:false, points:3 },
      { id:"dw-dist",    title:"Walk distance",             emoji:"📍", quip:"Short is fine. Going is everything.", type:"tiered", minimum_day:true,  boss_only:false, points:2,
        tiers:[{value:1,label:"1 km",points:2},{value:2,label:"2 km",points:3},{value:4,label:"4 km",points:4},{value:6,label:"6 km+",points:6}] },
      { id:"dw-evening", title:"Evening walk",              emoji:"🌆", quip:"Wind down together.",               type:"binary", minimum_day:false, boss_only:false, points:2 },
      { id:"dw-water",   title:"Fresh water for your dog",  emoji:"💧", quip:"Hydration matters for them too.",   type:"binary", minimum_day:true,  boss_only:false, points:1 },
      { id:"dw-longwalk",title:"Long walk — 8 km+",         emoji:"🗺️", quip:"Adventure mode unlocked.",         type:"binary", minimum_day:false, boss_only:true,  points:5 },
    ]
  },
  {
    id: "cycling", name: "Cycling Challenge", emoji: "🚴", category: "movement",
    description: "30 days in the saddle. Build endurance, torch calories, go farther than yesterday.",
    duration: 30, weeklyGoal: 90, defaultMode: "soft",
    habits: [
      { id:"cy-ride",    title:"Bike ride",                 emoji:"🚲", quip:"Clip in. Show up.",                  type:"tiered", minimum_day:true,  boss_only:false, points:3,
        tiers:[{value:5,label:"5 km",points:3},{value:15,label:"15 km",points:4},{value:30,label:"30 km",points:6},{value:50,label:"50 km+",points:9}] },
      { id:"cy-stretch", title:"Stretch & recover",         emoji:"🦵", quip:"The ride you can do tomorrow depends on this.", type:"binary", minimum_day:false, boss_only:false, points:2 },
      { id:"cy-water",   title:"Hydration 2L",              emoji:"💧", quip:"Drink before you're thirsty.",       type:"binary", minimum_day:true,  boss_only:false, points:2 },
      { id:"cy-bigride", title:"Epic ride — 50 km+",        emoji:"🏔️", quip:"Boss mode. Go the distance.",       type:"binary", minimum_day:false, boss_only:true,  points:6 },
    ]
  },
  {
    id: "walking", name: "Walking Challenge", emoji: "🚶", category: "movement",
    description: "30 days of daily walking. The simplest habit with the biggest returns.",
    duration: 30, weeklyGoal: 80, defaultMode: "soft",
    habits: [
      { id:"wk-dist",    title:"Daily walk",                emoji:"👟", quip:"Every step counts.",                 type:"tiered", minimum_day:true,  boss_only:false, points:2,
        tiers:[{value:2,label:"2 km",points:2},{value:5,label:"5 km",points:3},{value:8,label:"8 km",points:4},{value:10,label:"10 km+",points:6}] },
      { id:"wk-morning", title:"Morning walk before work",  emoji:"🌅", quip:"Before the world gets loud.",       type:"binary", minimum_day:true,  boss_only:false, points:2 },
      { id:"wk-phone",   title:"Walk without your phone",   emoji:"📵", quip:"Just you and your thoughts.",       type:"binary", minimum_day:false, boss_only:false, points:2 },
      { id:"wk-stairs",  title:"Take the stairs all day",   emoji:"🏢", quip:"Small choices add up.",             type:"binary", minimum_day:false, boss_only:false, points:1 },
      { id:"wk-big",     title:"Power walk — 12 km+",       emoji:"⚡", quip:"Boss Day: go the distance.",         type:"binary", minimum_day:false, boss_only:true,  points:5 },
    ]
  },
  {
    id: "running", name: "Running Challenge", emoji: "🏃", category: "movement",
    description: "30 days of running. Build the habit, find the pace, feel the difference.",
    duration: 30, weeklyGoal: 100, defaultMode: "strict",
    habits: [
      { id:"rn-run",     title:"Run session",               emoji:"👟", quip:"Shoes on. Door open. Go.",           type:"tiered", minimum_day:true,  boss_only:false, points:3,
        tiers:[{value:1,label:"1 km",points:3},{value:3,label:"3 km",points:4},{value:5,label:"5 km",points:6},{value:10,label:"10 km+",points:9}] },
      { id:"rn-stretch", title:"Post-run stretch",          emoji:"🧘", quip:"Skipping this is how injuries happen.", type:"binary", minimum_day:true, boss_only:false, points:2 },
      { id:"rn-water",   title:"Hydration 2L",              emoji:"💧", quip:"Runners dehydrate fast.",            type:"binary", minimum_day:true,  boss_only:false, points:1 },
      { id:"rn-sleep",   title:"Sleep 7+ hours",            emoji:"🌙", quip:"You grow between the runs.",         type:"binary", minimum_day:false, boss_only:false, points:2 },
      { id:"rn-longrun", title:"Long run — 10 km+",         emoji:"🏅", quip:"Boss Day: leave it all out there.",  type:"binary", minimum_day:false, boss_only:true,  points:6 },
    ]
  },
  {
    id: "creative", name: "Creative Challenge", emoji: "🎨", category: "lifestyle",
    description: "30 days of daily creative practice. Write, draw, build, make — just create something.",
    duration: 30, weeklyGoal: 70, defaultMode: "soft",
    habits: [
      { id:"cr-create",  title:"Create something today",    emoji:"✨", quip:"It doesn't have to be good. It has to exist.", type:"binary", minimum_day:true,  boss_only:false, points:4 },
      { id:"cr-idea",    title:"Brainstorm 10 ideas",       emoji:"💡", quip:"Most will be bad. That's the point.", type:"binary", minimum_day:true,  boss_only:false, points:2 },
      { id:"cr-study",   title:"Study your craft",          emoji:"📚", quip:"The greats never stop learning.",    type:"binary", minimum_day:false, boss_only:false, points:2 },
      { id:"cr-noscroll",title:"No mindless scrolling",     emoji:"📵", quip:"Consumption kills creation.",        type:"binary", minimum_day:false, boss_only:false, points:2 },
      { id:"cr-publish", title:"Share your work",           emoji:"🚀", quip:"Boss Day: put it out into the world.", type:"binary", minimum_day:false, boss_only:true,  points:4 },
    ]
  },
  {
    id: "strength", name: "Strength Training", emoji: "🏋️", category: "movement",
    description: "30 days of consistent lifting. Build the habit, then build the muscle.",
    duration: 30, weeklyGoal: 90, defaultMode: "strict",
    habits: [
      { id:"st-lift",    title:"Lift session",              emoji:"🏋️", quip:"Show up. Lift. Repeat.",               type:"binary", minimum_day:true,  boss_only:false, points:5 },
      { id:"st-protein", title:"Protein at every meal",     emoji:"🥩", quip:"Muscle is built in the kitchen too.",  type:"binary", minimum_day:true,  boss_only:false, points:2 },
      { id:"st-sleep",   title:"8+ hours sleep",            emoji:"🌙", quip:"Muscle grows when you sleep.",         type:"binary", minimum_day:false, boss_only:false, points:2 },
      { id:"st-stretch", title:"Post-lift stretch",         emoji:"🦵", quip:"Skipping this is how injuries happen.",type:"binary", minimum_day:false, boss_only:false, points:1 },
      { id:"st-pr",      title:"Hit a personal record",     emoji:"⚡", quip:"Boss Day: break your own record.",     type:"binary", minimum_day:false, boss_only:true,  points:5 },
    ]
  },
  {
    id: "meditation", name: "Meditation", emoji: "🧘", category: "lifestyle",
    description: "30 days of daily stillness. Calm the mind, sharpen the focus.",
    duration: 30, weeklyGoal: 70, defaultMode: "soft",
    habits: [
      { id:"med-sit",    title:"Meditate 10 min",           emoji:"🧘", quip:"10 minutes. Eyes closed. Phone away.", type:"binary", minimum_day:true,  boss_only:false, points:4 },
      { id:"med-breath", title:"Breathing exercise",        emoji:"💨", quip:"4-7-8 or box breathing. Just breathe.",type:"binary", minimum_day:true,  boss_only:false, points:2 },
      { id:"med-screen", title:"No screens 1h before bed",  emoji:"📵", quip:"Protect your sleep and mind.",         type:"binary", minimum_day:false, boss_only:false, points:2 },
      { id:"med-journal",title:"Gratitude journal",         emoji:"✍️", quip:"Three things. Two minutes.",           type:"binary", minimum_day:false, boss_only:false, points:2 },
      { id:"med-deep",   title:"20-min deep meditation",    emoji:"🌊", quip:"Boss Day: go deeper.",                 type:"binary", minimum_day:false, boss_only:true,  points:4 },
    ]
  },
  {
    id: "cold-exposure", name: "Cold Exposure", emoji: "🧊", category: "transformation",
    description: "30 days of cold showers. Builds mental resilience like nothing else.",
    duration: 30, weeklyGoal: 75, defaultMode: "strict",
    habits: [
      { id:"ce-cold",    title:"Cold shower",               emoji:"🧊", quip:"Get in. Don't think about it.",        type:"binary", minimum_day:true,  boss_only:false, points:5 },
      { id:"ce-breath",  title:"Breathwork (Wim Hof)",      emoji:"💨", quip:"Breathe deep before you go cold.",     type:"binary", minimum_day:false, boss_only:false, points:2 },
      { id:"ce-reflect", title:"Post-session reflection",   emoji:"🧠", quip:"Hardship processed becomes growth.",   type:"binary", minimum_day:false, boss_only:false, points:2 },
      { id:"ce-full",    title:"5-min full cold plunge",    emoji:"❄️", quip:"Boss Day: no warm-up. Full cold.",     type:"binary", minimum_day:false, boss_only:true,  points:5 },
    ]
  },
  {
    id: "sleep-reset", name: "Sleep Reset", emoji: "😴", category: "lifestyle",
    description: "21 days to fix your sleep. Consistent schedule, no screens, real rest.",
    duration: 21, weeklyGoal: 80, defaultMode: "strict",
    habits: [
      { id:"sl-hours",   title:"8+ hours sleep",            emoji:"🌙", quip:"Non-negotiable.",                      type:"binary", minimum_day:true,  boss_only:false, points:4 },
      { id:"sl-screen",  title:"No screens after 9pm",      emoji:"📵", quip:"Blue light kills melatonin.",          type:"binary", minimum_day:true,  boss_only:false, points:3 },
      { id:"sl-caffeine",title:"No caffeine after 2pm",     emoji:"☕", quip:"It stays in your system 6+ hours.",    type:"binary", minimum_day:true,  boss_only:false, points:2 },
      { id:"sl-routine", title:"Same wake-up time",         emoji:"⏰", quip:"Consistency locks the rhythm.",        type:"binary", minimum_day:true,  boss_only:false, points:2 },
      { id:"sl-perfect", title:"All habits, flawless",      emoji:"⭐", quip:"Boss Day: perfect sleep hygiene.",     type:"binary", minimum_day:false, boss_only:true,  points:4 },
    ]
  },
  {
    id: "no-sugar", name: "No Sugar", emoji: "🚫🍬", category: "lifestyle",
    description: "30 days without added sugar. Clearer skin, better energy, no crashes.",
    duration: 30, weeklyGoal: 75, defaultMode: "strict",
    habits: [
      { id:"ns-nosugar",  title:"Zero added sugar today",    emoji:"🚫", quip:"Read the label. It's in everything.",   type:"binary", minimum_day:true,  boss_only:false, points:5 },
      { id:"ns-water",    title:"Drink 2L water",            emoji:"💧", quip:"Cravings are often just dehydration.",  type:"binary", minimum_day:true,  boss_only:false, points:2 },
      { id:"ns-fruit",    title:"Eat whole fruit (no juice)",emoji:"🍎", quip:"Fibre intact. Spike avoided.",          type:"binary", minimum_day:false, boss_only:false, points:1 },
      { id:"ns-label",    title:"Read every food label",     emoji:"🔍", quip:"Knowledge is the weapon.",             type:"binary", minimum_day:false, boss_only:false, points:1 },
      { id:"ns-nocheat",  title:"No sugar AND no sweeteners",emoji:"💎", quip:"Boss Day: pure. No substitutes.",       type:"binary", minimum_day:false, boss_only:true,  points:5 },
    ]
  },
  {
    id: "morning-routine", name: "Morning Routine", emoji: "🌅", category: "lifestyle",
    description: "30 days of owning the first hour. Win the morning, win the day.",
    duration: 30, weeklyGoal: 80, defaultMode: "soft",
    habits: [
      { id:"mr-wake",     title:"Wake up on time — no snooze",emoji:"⏰", quip:"First decision of the day. Make it right.", type:"binary", minimum_day:true,  boss_only:false, points:3 },
      { id:"mr-move",     title:"Move your body (10 min)",    emoji:"🏃", quip:"Anything counts. Don't overthink it.",  type:"binary", minimum_day:true,  boss_only:false, points:3 },
      { id:"mr-nophone",  title:"No phone for first 30 min",  emoji:"📵", quip:"Protect your mind before the world gets in.", type:"binary", minimum_day:true, boss_only:false, points:2 },
      { id:"mr-hydrate",  title:"Drink water before coffee",  emoji:"💧", quip:"You wake up dehydrated every time.",   type:"binary", minimum_day:false, boss_only:false, points:1 },
      { id:"mr-journal",  title:"Write 3 priorities for today",emoji:"📓",quip:"Clear mind. Clear direction.",          type:"binary", minimum_day:false, boss_only:false, points:2 },
      { id:"mr-cold",     title:"Cold shower",                emoji:"🧊", quip:"Boss Day: go cold. All the way.",       type:"binary", minimum_day:false, boss_only:true,  points:4 },
    ]
  },
  {
    id: "yoga-flexibility", name: "Yoga & Flexibility", emoji: "🧘‍♀️", category: "movement",
    description: "30 days of daily yoga and stretching. Move better, recover faster, feel lighter.",
    duration: 30, weeklyGoal: 70, defaultMode: "soft",
    habits: [
      { id:"yf-yoga",     title:"Yoga session (20 min+)",     emoji:"🧘", quip:"Show up to the mat. That's the whole job.", type:"binary", minimum_day:true, boss_only:false, points:4 },
      { id:"yf-stretch",  title:"Full-body stretch (10 min)", emoji:"🦵", quip:"Tight muscles are slow muscles.",        type:"binary", minimum_day:true,  boss_only:false, points:2 },
      { id:"yf-breathe",  title:"Breathwork (5 min)",         emoji:"💨", quip:"Breath controls everything else.",       type:"binary", minimum_day:false, boss_only:false, points:2 },
      { id:"yf-hydrate",  title:"Hydration 2L",               emoji:"💧", quip:"Flexibility and dehydration don't mix.",  type:"binary", minimum_day:false, boss_only:false, points:1 },
      { id:"yf-flow",     title:"45-min full flow class",     emoji:"🌊", quip:"Boss Day: commit to the full session.",   type:"binary", minimum_day:false, boss_only:true,  points:5 },
    ]
  },
  {
    id: "digital-detox", name: "Digital Detox", emoji: "📵", category: "lifestyle",
    description: "30 days of intentional screen use. Take back your attention.",
    duration: 30, weeklyGoal: 70, defaultMode: "soft",
    habits: [
      { id:"dd-limit",    title:"Max 1h social media",        emoji:"📱", quip:"Your attention is the product. Guard it.", type:"binary", minimum_day:true, boss_only:false, points:4 },
      { id:"dd-morning",  title:"No phone first 30 min",      emoji:"🌅", quip:"Start the day on your terms.",            type:"binary", minimum_day:true,  boss_only:false, points:3 },
      { id:"dd-nobed",    title:"No phone in bed",            emoji:"🛏️", quip:"Better sleep starts here.",               type:"binary", minimum_day:false, boss_only:false, points:2 },
      { id:"dd-outside",  title:"Spend 30 min outside",       emoji:"🌳", quip:"Real world. Real rest.",                  type:"binary", minimum_day:false, boss_only:false, points:2 },
      { id:"dd-full",     title:"Zero social media today",    emoji:"🏆", quip:"Boss Day: no apps. Just presence.",       type:"binary", minimum_day:false, boss_only:true,  points:5 },
    ]
  },
  {
    id: "intermittent-fasting", name: "Intermittent Fasting", emoji: "⏱️", category: "transformation",
    description: "30 days of 16:8. Eat in an 8-hour window, fast for 16. Simple, effective.",
    duration: 30, weeklyGoal: 80, defaultMode: "strict",
    habits: [
      { id:"if-fast",     title:"16-hour fast completed",     emoji:"⏱️", quip:"The window is the whole game.",          type:"binary", minimum_day:true,  boss_only:false, points:5 },
      { id:"if-water",    title:"Drink water during fast",    emoji:"💧", quip:"Water, black coffee, and tea only.",     type:"binary", minimum_day:true,  boss_only:false, points:2 },
      { id:"if-nosnack",  title:"No snacking outside window", emoji:"🚫", quip:"Discipline between meals matters.",      type:"binary", minimum_day:false, boss_only:false, points:2 },
      { id:"if-protein",  title:"Protein-first meal",         emoji:"🥩", quip:"Break the fast right.",                  type:"binary", minimum_day:false, boss_only:false, points:1 },
      { id:"if-20",       title:"20-hour fast",               emoji:"⚡", quip:"Boss Day: extend the window.",           type:"binary", minimum_day:false, boss_only:true,  points:5 },
    ]
  },
  {
    id: "core-abs", name: "Core & Abs", emoji: "🔥", category: "movement",
    description: "30 days of daily core work. Planks, crunches, leg raises — build real strength.",
    duration: 30, weeklyGoal: 80, defaultMode: "strict",
    habits: [
      { id:"ca-core",     title:"Core workout (15 min)",      emoji:"💪", quip:"15 minutes. No excuses.",                type:"binary", minimum_day:true,  boss_only:false, points:5 },
      { id:"ca-plank",    title:"2-min plank hold",           emoji:"⏱️", quip:"The plank is honest.",                   type:"binary", minimum_day:true,  boss_only:false, points:2 },
      { id:"ca-protein",  title:"Protein at every meal",      emoji:"🥩", quip:"Muscle needs fuel.",                     type:"binary", minimum_day:false, boss_only:false, points:2 },
      { id:"ca-stretch",  title:"Hip flexor stretch",         emoji:"🦵", quip:"Core work tightens everything. Stretch.", type:"binary", minimum_day:false, boss_only:false, points:1 },
      { id:"ca-beast",    title:"30-min full core blast",     emoji:"🏆", quip:"Boss Day: all out. Burn.",               type:"binary", minimum_day:false, boss_only:true,  points:5 },
    ]
  },

  {
    id: "journaling", name: "Daily Journaling", emoji: "✍️", category: "lifestyle",
    description: "30 days of daily writing. Process your thoughts, track your growth, find clarity.",
    duration: 30, weeklyGoal: 70, defaultMode: "soft",
    habits: [
      { id:"jn-write",  title:"Write in journal",         emoji:"📓", quip:"Even five minutes counts. Just start.",          type:"binary", minimum_day:true,  boss_only:false, points:4 },
      { id:"jn-prompt", title:"Answer a writing prompt",  emoji:"💡", quip:"A question asked is a thought unlocked.",        type:"binary", minimum_day:false, boss_only:false, points:2 },
      { id:"jn-gratit", title:"List 3 gratitudes",        emoji:"🙏", quip:"What you appreciate, appreciates.",              type:"binary", minimum_day:false, boss_only:false, points:2 },
      { id:"jn-review", title:"Review yesterday's entry", emoji:"🔄", quip:"Reflection compounds the learning.",            type:"binary", minimum_day:false, boss_only:false, points:1 },
      { id:"jn-deep",   title:"Write 2+ full pages",      emoji:"📖", quip:"Boss Day: go deep. Let it all out.",             type:"binary", minimum_day:false, boss_only:true,  points:4 },
    ]
  },
  {
    id: "monk-mode", name: "Monk Mode", emoji: "🧠", category: "transformation",
    description: "30 days of intense focus. No social media, no distractions — just deep work, learning, and execution.",
    duration: 30, weeklyGoal: 120, defaultMode: "strict",
    habits: [
      { id:"mm-focus",   title:"Deep work — 2 hours",    emoji:"💻", quip:"Two hours. Zero distractions. Phone off.",        type:"binary", minimum_day:true,  boss_only:false, points:5 },
      { id:"mm-nosocial",title:"No social media",        emoji:"📵", quip:"Your attention is your most valuable asset.",      type:"binary", minimum_day:true,  boss_only:false, points:3 },
      { id:"mm-learn",   title:"Deliberate learning — 1h",emoji:"📚",quip:"One hour of intentional study every day.",        type:"binary", minimum_day:true,  boss_only:false, points:3 },
      { id:"mm-move",    title:"Move your body",         emoji:"🏃", quip:"The mind needs a body that moves.",               type:"binary", minimum_day:false, boss_only:false, points:2 },
      { id:"mm-reflect", title:"Evening reflection",     emoji:"✍️", quip:"What did you build today?",                       type:"binary", minimum_day:false, boss_only:false, points:2 },
      { id:"mm-ultra",   title:"4-hour deep work block", emoji:"⚡", quip:"Boss Day: go full monk.",                          type:"binary", minimum_day:false, boss_only:true,  points:6 },
    ]
  },

  // ── Expedition Routes ────────────────────────────────────────────────────
  {
    id: "everest-bc", name: "Everest Base Camp", emoji: "🏔️", category: "expedition",
    description: "Trek 130 km through the Himalayas to the foot of the world's highest peak.",
    duration: 45, weeklyGoal: 20, defaultMode: "soft", routeKm: 130,
    milestones: [
      { km: 10,  name: "Phakding",          emoji: "🏡" },
      { km: 40,  name: "Namche Bazaar",      emoji: "🏙️" },
      { km: 65,  name: "Tengboche",          emoji: "⛩️" },
      { km: 100, name: "Gorak Shep",         emoji: "⛺" },
      { km: 130, name: "Everest Base Camp",  emoji: "🏔️" },
    ],
    habits: [
      { id:"dist", title:"Log distance", emoji:"🏃", quip:"Walk, run, cycle, swim or row — it all counts.", type:"distance", minimum_day:true, boss_only:false, points:1, unit:"km" },
    ],
  },
  {
    id: "camino", name: "Camino de Santiago", emoji: "⛪", category: "expedition",
    description: "Walk 790 km across Spain on the ancient pilgrimage route to Santiago de Compostela.",
    duration: 90, weeklyGoal: 20, defaultMode: "soft", routeKm: 790,
    milestones: [
      { km: 75,  name: "Pamplona",               emoji: "🏟️" },
      { km: 250, name: "Burgos",                  emoji: "🏰" },
      { km: 400, name: "León",                    emoji: "🦁" },
      { km: 590, name: "Ponferrada",              emoji: "🏯" },
      { km: 790, name: "Santiago de Compostela",  emoji: "⛪" },
    ],
    habits: [
      { id:"dist", title:"Log distance", emoji:"🚶", quip:"Every step brings you closer to Santiago.", type:"distance", minimum_day:true, boss_only:false, points:1, unit:"km" },
    ],
  },
  {
    id: "appalachian", name: "Appalachian Trail", emoji: "🌲", category: "expedition",
    description: "Hike the full 3,540 km from Georgia to Maine — one of the world's great long trails.",
    duration: 365, weeklyGoal: 20, defaultMode: "soft", routeKm: 3540,
    milestones: [
      { km: 300,  name: "Shenandoah Valley",    emoji: "🌿" },
      { km: 900,  name: "Pennsylvania",          emoji: "🪨" },
      { km: 1800, name: "New England",           emoji: "🍂" },
      { km: 2600, name: "White Mountains, NH",   emoji: "❄️" },
      { km: 3540, name: "Mount Katahdin, Maine", emoji: "🏔️" },
    ],
    habits: [
      { id:"dist", title:"Log distance", emoji:"🥾", quip:"Miles in the legs. Wilderness in the soul.", type:"distance", minimum_day:true, boss_only:false, points:1, unit:"km" },
    ],
  },
  {
    id: "tour-de-france", name: "Tour de France", emoji: "🚴", category: "expedition",
    description: "Ride the full 3,490 km route of the world's most iconic cycling race.",
    duration: 120, weeklyGoal: 20, defaultMode: "soft", routeKm: 3490,
    milestones: [
      { km: 400,  name: "Brittany Coast",     emoji: "🌊" },
      { km: 900,  name: "Massif Central",     emoji: "🗺️" },
      { km: 1600, name: "The Pyrenees",       emoji: "⛰️" },
      { km: 2400, name: "The Alps",           emoji: "🏔️" },
      { km: 3490, name: "Paris — Champs-Élysées", emoji: "🗼" },
    ],
    habits: [
      { id:"dist", title:"Log distance", emoji:"🚴", quip:"Clip in. Every km is a stage.", type:"distance", minimum_day:true, boss_only:false, points:1, unit:"km" },
    ],
  },
  {
    id: "route66", name: "Route 66", emoji: "🚗", category: "expedition",
    description: "Travel the 3,940 km Mother Road from Chicago, Illinois to Santa Monica, California.",
    duration: 180, weeklyGoal: 20, defaultMode: "soft", routeKm: 3940,
    milestones: [
      { km: 500,  name: "Springfield, IL",   emoji: "🌽" },
      { km: 1100, name: "Oklahoma City",      emoji: "🏙️" },
      { km: 1900, name: "Amarillo, TX",       emoji: "🤠" },
      { km: 2700, name: "Albuquerque, NM",    emoji: "🌵" },
      { km: 3940, name: "Santa Monica Pier",  emoji: "🎡" },
    ],
    habits: [
      { id:"dist", title:"Log distance", emoji:"🚗", quip:"Get your kicks. Road is open.", type:"distance", minimum_day:true, boss_only:false, points:1, unit:"km" },
    ],
  },
  {
    id: "amazon-river", name: "Amazon River", emoji: "🌿", category: "expedition",
    description: "Navigate 6,437 km down the world's greatest river from the Andes to the Atlantic.",
    duration: 365, weeklyGoal: 20, defaultMode: "soft", routeKm: 6437,
    milestones: [
      { km: 500,  name: "Iquitos, Peru",   emoji: "🐊" },
      { km: 1500, name: "Leticia",          emoji: "🦜" },
      { km: 3000, name: "Manaus",           emoji: "🏙️" },
      { km: 5000, name: "Santarém",         emoji: "🌊" },
      { km: 6437, name: "Atlantic Ocean",   emoji: "🌊" },
    ],
    habits: [
      { id:"dist", title:"Log distance", emoji:"🚣", quip:"The river never stops. Neither do you.", type:"distance", minimum_day:true, boss_only:false, points:1, unit:"km" },
    ],
  },
  {
    id: "pct", name: "Pacific Crest Trail", emoji: "🌲", category: "expedition",
    description: "Walk 4,286 km from the Mexican border to the Canadian border — through the Sierra Nevada and Cascades. 5 months. No shortcuts.",
    duration: 150, weeklyGoal: 20, defaultMode: "soft", routeKm: 4286,
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
      { id:"dist", title:"Log distance", emoji:"🥾", quip:"Every step north is progress.", type:"distance", minimum_day:true, boss_only:false, points:1, unit:"km" },
    ],
  },
  {
    id: "everest-stairmaster", name: "Everest StairMaster", emoji: "🏋️", category: "expedition",
    description: "Climb 2,903 floors — the StairMaster equivalent of summiting Mount Everest from sea level. No oxygen tank. No shortcuts.",
    duration: 365, weeklyGoal: 20, defaultMode: "strict", routeKm: 2903.2,
    milestones: [
      { km: 100,  name: "Foothills",             emoji: "⛰️" },
      { km: 500,  name: "Camp I",                emoji: "⛺" },
      { km: 1000, name: "Camp II",               emoji: "🏕️" },
      { km: 1500, name: "Camp III",              emoji: "❄️" },
      { km: 2000, name: "Death Zone",            emoji: "☠️" },
      { km: 2903, name: "Summit — 8,849 m",     emoji: "🏔️" },
    ],
    habits: [
      { id:"floors", title:"Floors climbed today", emoji:"🏢", quip:"One floor at a time. 2,903 to go.", type:"distance", minimum_day:true, boss_only:false, points:1, unit:"floors" },
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
  { id:"u-boss1",  label:"👑 Boss Energy",        desc:"Complete a Boss Day.",                                test: u => u.bossCompleted >= 1 },
  { id:"u-bossw",  label:"👑 Boss Week",          desc:"3+ Boss Days in one week.",                          test: u => u.bossWeek },
  { id:"u-cmback", label:"🧡 Comeback Kid",       desc:"Use the Save My Day recovery.",                      test: u => u.anyRecovered },
  { id:"u-min5",   label:"⚡ Minimum Warrior",    desc:"Use Minimum Day mode 5 times.",                      test: u => u.minimumUsed >= 5 },
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
    { id:"pu-boss",     label:"👑 Beast Mode",           desc:"Complete 5 Boss Days.",                            test: c => c.bossCompleted >= 5 },
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
    { id:"cr-boss",     label:"🚀 Shipped It",           desc:"Complete a Boss Day creative session.",             test: c => c.bossCompleted >= 1 },
    { id:"cr-halfway",  label:"✨ Halfway",              desc:"15 creative sessions.",                            test: c => c.daysLogged >= 15 },
    { id:"cr-done",     label:"✅ Creative Month Done",  desc:"Complete 30 days of creativity.",                  test: c => c.pctDone >= 99 && c.complete },
  ],
  "strength": [
    { id:"st-first",    label:"🏋️ First Rep",            desc:"Log your first lift session.",                     test: c => c.hasLifted },
    { id:"st-pr",       label:"⚡ PR Hunter",             desc:"Hit a personal record on Boss Day.",               test: c => c.hasPR },
    { id:"st-week",     label:"💪 Training Week",        desc:"7-day lifting streak.",                            test: c => c.streak >= 7 },
    { id:"st-20",       label:"🏋️ Gym Rat",              desc:"Log 20 lift sessions.",                            test: c => c.liftsLogged >= 20 },
    { id:"st-done",     label:"✅ Strength Month Done",  desc:"Complete 30 days of strength training.",           test: c => c.pctDone >= 99 && c.complete },
  ],
  "meditation": [
    { id:"med-first",   label:"🧘 First Sit",            desc:"Log your first meditation.",                       test: c => c.meditationLogged >= 1 },
    { id:"med-week",    label:"🌿 Inner Peace",          desc:"7-day meditation streak.",                         test: c => c.meditationStreak >= 7 },
    { id:"med-deep",    label:"🌊 Deep State",           desc:"Complete a Boss Day meditation.",                   test: c => c.bossCompleted >= 1 },
    { id:"med-halfway", label:"🧘 Halfway",              desc:"15 meditation sessions.",                          test: c => c.meditationLogged >= 15 },
    { id:"med-done",    label:"✅ Meditation Month Done",desc:"Complete 30 days of meditation.",                  test: c => c.pctDone >= 99 && c.complete },
  ],
  "cold-exposure": [
    { id:"ce-first",    label:"🧊 First Plunge",         desc:"Take your first cold shower.",                     test: c => c.coldShowersLogged >= 1 },
    { id:"ce-week",     label:"❄️ Cold Warrior",         desc:"7-day cold shower streak.",                        test: c => c.coldShowerStreak >= 7 },
    { id:"ce-plunge",   label:"🏔️ Ice Bath",             desc:"Complete a full cold plunge on Boss Day.",         test: c => c.hasColdPlunge },
    { id:"ce-halfway",  label:"🧊 Halfway",              desc:"15 cold sessions.",                                test: c => c.coldShowersLogged >= 15 },
    { id:"ce-done",     label:"✅ Cold Month Done",      desc:"Complete 30 days of cold exposure.",               test: c => c.pctDone >= 99 && c.complete },
  ],
  "sleep-reset": [
    { id:"sl-first",    label:"😴 Lights Out",           desc:"Log your first sleep habit.",                      test: c => c.sleepHabitsLogged >= 1 },
    { id:"sl-week",     label:"🌙 Deep Sleeper",         desc:"7-day sleep streak.",                              test: c => c.sleepStreak >= 7 },
    { id:"sl-boss",     label:"⭐ Perfect Night",        desc:"Complete a Boss Day sleep routine.",               test: c => c.bossCompleted >= 1 },
    { id:"sl-halfway",  label:"😴 Halfway",              desc:"10+ days of sleep habits.",                        test: c => c.sleepHabitsLogged >= 10 },
    { id:"sl-done",     label:"✅ Sleep Reset Done",     desc:"Complete all 21 days.",                            test: c => c.pctDone >= 99 && c.complete },
  ],
  "no-sugar": [
    { id:"ns-first",    label:"🚫 Sugar Free",           desc:"Your first no-sugar day.",                         test: c => c.noSugarLogged >= 1 },
    { id:"ns-week",     label:"🍎 Sweet Freedom",        desc:"7-day no-sugar streak.",                           test: c => c.noSugarStreak >= 7 },
    { id:"ns-halfway",  label:"🚫 Halfway",              desc:"15 sugar-free days.",                              test: c => c.noSugarLogged >= 15 },
    { id:"ns-pure",     label:"💎 Pure",                 desc:"Complete a Boss Day with zero sweeteners.",         test: c => c.bossCompleted >= 1 },
    { id:"ns-done",     label:"✅ No Sugar Done",        desc:"Complete 30 days without added sugar.",            test: c => c.pctDone >= 99 && c.complete },
  ],
  "morning-routine": [
    { id:"mr-first",    label:"🌅 Early Bird",           desc:"Complete your first morning routine.",             test: c => c.morningRoutineLogged >= 1 },
    { id:"mr-week",     label:"☀️ Sunrise Club",         desc:"7-day morning streak.",                            test: c => c.morningRoutineStreak >= 7 },
    { id:"mr-cold",     label:"🧊 Cold Morning",         desc:"Complete a Boss Day morning routine.",             test: c => c.bossCompleted >= 1 },
    { id:"mr-halfway",  label:"🌅 Halfway",              desc:"15 mornings logged.",                              test: c => c.morningRoutineLogged >= 15 },
    { id:"mr-done",     label:"✅ Morning Routine Done", desc:"Complete 30 days of morning routines.",            test: c => c.pctDone >= 99 && c.complete },
  ],
  "yoga-flexibility": [
    { id:"yf-first",    label:"🧘 First Flow",           desc:"Complete your first yoga session.",                 test: c => c.yogaLogged >= 1 },
    { id:"yf-week",     label:"🌿 Flexible Mind",        desc:"7-day yoga streak.",                               test: c => c.yogaStreak >= 7 },
    { id:"yf-flow",     label:"🌊 Full Flow",            desc:"Complete a Boss Day yoga session.",                 test: c => c.bossCompleted >= 1 },
    { id:"yf-halfway",  label:"🧘 Halfway",              desc:"15 yoga sessions.",                                test: c => c.yogaLogged >= 15 },
    { id:"yf-done",     label:"✅ Yoga Month Done",      desc:"Complete 30 days of yoga.",                        test: c => c.pctDone >= 99 && c.complete },
  ],
  "digital-detox": [
    { id:"dd-first",    label:"📵 Unplugged",            desc:"Complete your first detox day.",                    test: c => c.detoxLogged >= 1 },
    { id:"dd-week",     label:"🌳 Screen Free",          desc:"7-day detox streak.",                              test: c => c.detoxStreak >= 7 },
    { id:"dd-zero",     label:"🏆 Zero Social",          desc:"Complete a Boss Day with zero social media.",       test: c => c.bossCompleted >= 1 },
    { id:"dd-halfway",  label:"📵 Halfway",              desc:"15 detox days.",                                   test: c => c.detoxLogged >= 15 },
    { id:"dd-done",     label:"✅ Detox Done",           desc:"Complete 30 days of digital detox.",               test: c => c.pctDone >= 99 && c.complete },
  ],
  "intermittent-fasting": [
    { id:"if-first",    label:"⏱️ First Fast",            desc:"Complete your first 16-hour fast.",               test: c => c.fastingLogged >= 1 },
    { id:"if-week",     label:"🔥 Fat Adapted",          desc:"7-day fasting streak.",                            test: c => c.fastingStreak >= 7 },
    { id:"if-20hr",     label:"⚡ 20-Hour Fast",         desc:"Complete a Boss Day fast.",                         test: c => c.bossCompleted >= 1 },
    { id:"if-halfway",  label:"⏱️ Halfway",              desc:"15 fasts completed.",                              test: c => c.fastingLogged >= 15 },
    { id:"if-done",     label:"✅ Fasting Month Done",   desc:"Complete 30 days of fasting.",                     test: c => c.pctDone >= 99 && c.complete },
  ],
  "core-abs": [
    { id:"ca-first",    label:"💪 Core Activated",       desc:"Log your first core session.",                     test: c => c.coreLogged >= 1 },
    { id:"ca-week",     label:"🔥 Iron Core",            desc:"7-day core streak.",                               test: c => c.streak >= 7 },
    { id:"ca-blast",    label:"🏆 Core Blast",           desc:"Complete a Boss Day core workout.",                 test: c => c.bossCompleted >= 1 },
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
let _cloudAuthError   = "";    // error message for cloud auth form
let _cloudAuthLoading = false; // loading spinner for cloud auth
let _cloudPushTimer   = null;  // debounce timer for cloud push
let _skipCloudPush    = false; // prevent redundant push after pull
let reminderTimeout = null;

// ── Cloud Sync (Netlify Functions + Blobs) ─────────────────────────────────
const CloudSync = {
  get token()    { return localStorage.getItem("conqur_token")  || null; },
  get uid()      { return localStorage.getItem("conqur_uid")    || null; },
  get userEmail(){ return localStorage.getItem("conqur_cemail") || null; },
  get isSignedIn(){ return !!this.token && !!this.uid; },

  async _api(path, method, body, token) {
    const res = await fetch(`/.netlify/functions/${path}`, {
      method: method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      },
      body: (method && method !== "GET" && body !== undefined) ? JSON.stringify(body) : undefined,
    });
    return res.json();
  },

  async signUp(email, password) {
    const res = await this._api("auth", "POST", { action:"signup", email, password }).catch(e => ({ error: e.message }));
    if (res.error) return { error: res.error };
    localStorage.setItem("conqur_token",  res.token);
    localStorage.setItem("conqur_uid",    res.uid);
    localStorage.setItem("conqur_cemail", res.email);
    this.push();
    return {};
  },

  async signIn(email, password) {
    const res = await this._api("auth", "POST", { action:"signin", email, password }).catch(e => ({ error: e.message }));
    if (res.error) return { error: res.error };
    localStorage.setItem("conqur_token",  res.token);
    localStorage.setItem("conqur_uid",    res.uid);
    localStorage.setItem("conqur_cemail", res.email);
    await this.pull();
    return {};
  },

  signOut() {
    localStorage.removeItem("conqur_token");
    localStorage.removeItem("conqur_uid");
    localStorage.removeItem("conqur_cemail");
    render();
  },

  async push() {
    if (!this.isSignedIn) return;
    try {
      await fetch("/.netlify/functions/sync", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.token}`,
        },
        body: localStorage.getItem(STORAGE_KEY) || "{}",
      });
    } catch(e) { console.warn("Cloud push failed:", e); }
  },

  async pull() {
    if (!this.isSignedIn) return;
    try {
      const res = await fetch("/.netlify/functions/sync", {
        headers: { "Authorization": `Bearer ${this.token}` },
      });
      const remote = await res.json();
      if (!remote || typeof remote !== "object" || !("challenges" in remote)) return;
      const merged = normalizeState(remote);
      // Merge: keep local challenges if they have more progress
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
    habits: [],
    newHabitEmoji: "⭐",
    newHabitName: "",
    newHabitPoints: 2,
  };
}

function saveBuilderFormFromDOM() {
  const nameEl  = document.getElementById("bf-name");
  const startEl = document.getElementById("bf-start");
  const endEl   = document.getElementById("bf-end");
  const goalEl  = document.getElementById("bf-goal");
  const emojiEl = document.getElementById("bf-emoji");
  if (nameEl)                builderForm.name       = nameEl.value;
  if (startEl?.value)        builderForm.startDate  = startEl.value;
  if (endEl?.value)          builderForm.endDate    = endEl.value;
  if (goalEl)                builderForm.weeklyGoal = Number(goalEl.value) || builderForm.weeklyGoal;
  if (emojiEl?.value.trim()) builderForm.emoji      = emojiEl.value.trim();
}

function normalizeDay(raw) {
  if (!raw || typeof raw !== "object") raw = {};
  return {
    mode:       ["minimum","standard","boss","rest"].includes(raw.mode) ? raw.mode : "standard",
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
    type:        ["binary","tiered","distance"].includes(raw.type) ? raw.type : "binary",
    minimum_day: raw.minimum_day !== false,
    boss_only:   raw.boss_only   === true,
    points:      typeof raw.points === "number" && raw.points >= 1 ? Math.round(raw.points) : 2,
  };
  if (typeof raw.unit === "string") habit.unit = raw.unit;
  if (Array.isArray(raw.tiers))     habit.tiers = raw.tiers;
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
      mode:      ["minimum","standard","boss","rest"].includes(d.mode) ? d.mode : "standard",
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
  const totalDays = diffDays(c.startDate, c.endDate) + 1;
  return clamp(diffDays(c.startDate, d) + 1 - (c.pausedDays || 0), 1, totalDays);
}

// ── Challenge Engine ───────────────────────────────────────────────────────

function getActiveChallenges() {
  const today = todayKey();
  return Object.values(state.challenges).filter(c =>
    c.status === "active" && c.startDate <= today && c.endDate >= today
  );
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
  if (day.mode === "rest")     return [];           // rest day: no habits required
  if (day.mode === "minimum")  return challenge.habits.filter(h => h.minimum_day);
  if (day.mode === "standard") return challenge.habits.filter(h => !h.boss_only);
  return challenge.habits;
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
  const multiplier = day.mode === "boss" ? 1.5 : 1;
  const completionBonus = (done === total && total > 0) ? 3 : 0;
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
  const maxPoints = Math.round((baseMax + 3) * multiplier);
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
  const end    = parseDate(challenge.endDate);
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
    if (c.status === "active" && c.endDate < today) {
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
    h.id==="ce-full" || (h.boss_only && /cold/i.test(h.title))
  ).map(h=>h.id);
  const _medIds     = challenge.habits.filter(h =>
    h.id==="med-sit" || /meditat/i.test(h.title)
  ).map(h=>h.id);
  const _liftIds    = challenge.habits.filter(h =>
    h.id==="st-lift" || /lift session/i.test(h.title)
  ).map(h=>h.id);
  const _prIds      = challenge.habits.filter(h =>
    h.id==="st-pr" || (h.boss_only && /personal record/i.test(h.title))
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
    bossCompleted:         allDays.filter(d => d.mode==="boss" && d.done.length > 0).length,
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
      showToast(`${b.label} earned!`);
      earned = true;
      // Completion badge → finalise challenge status and queue the modal
      if (b.id.endsWith("-done") && challenge.status !== "completed") {
        challenge.finalStreak = calcChallengeStreak(challenge);
        challenge.status = "completed";
        if (!justCompletedId) justCompletedId = challenge.id;
        else justCompletedIds.push(challenge.id);
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
    bossCompleted: allDaysAll.filter(d => d.mode==="boss" && d.done.length > 0).length,
    bossWeek: allChallenges.some(c =>
      challengeWeeks(c).some(w =>
        w.allDays.filter(k => { const d=c.days[k]; return d&&d.mode==="boss"&&d.done.length>0; }).length >= 3
      )
    ),
    anyRecovered:  allDaysAll.some(d => d.recovered),
    minimumUsed:   allDaysAll.filter(d => d.mode==="minimum" && d.done.length > 0).length,
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
      showToast(`${b.label} earned!`);
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
      showToast(`${b.label} earned!`);
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
    challenge.streakFreezeWeeksAwarded.push(weekKey);
    showToast("❄️ Streak Freeze earned — weekly goal hit!");
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

// ── Render Core ────────────────────────────────────────────────────────────

function render() {
  // Persist note before DOM replacement — prevents content loss when tapping habits mid-typing
  const _noteEl = document.getElementById("day-note");
  if (_noteEl) {
    const _nc = currentChallenge();
    if (_nc) { const _nd = getChallengeDay(_nc, effectiveDate()); if (_nd.note !== _noteEl.value) { _nd.note = _noteEl.value; saveState(); } }
  }
  const app = document.getElementById("app");
  // Scroll to top when the primary view changes (not for modals/sheet)
  const viewKey = `${activeTab}|${builderOpen}|${settingsOpen}|${viewChallengeId}|${editChallengeId}`;
  if (viewKey !== _lastViewKey && !justCompletedId && onboardingStep === null) {
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
    html += activeTab === "body"       ? renderBody()       : "";
    html += activeTab === "badges"     ? renderBadges()     : "";
    html += sheetOpen                  ? renderSaveDaySheet() : "";
  }
  html += renderNav();
  if (justCompletedId) {
    const _cc = getChallenge(justCompletedId);
    if (_cc) html += renderCompletionModal(_cc);
  }
  if (onboardingStep !== null) html += renderOnboarding();
  html += renderConfirmModal();
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
              <stop offset="0%" stop-color="#b44fff"/>
              <stop offset="100%" stop-color="#ff4fa3"/>
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
  const tabs = [["today","Today"],["challenges","Challenges"],["body","Body"],["badges","Badges"]];
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

  // Auto-select first challenge if none selected or selection invalid
  if (!todayChallengeId || !active.find(c => c.id === todayChallengeId)) {
    todayChallengeId = active[0].id;
  }
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
  const totalDays  = diffDays(challenge.startDate, challenge.endDate)+1;
  const dayNumber  = challengeDayNumber(challenge, effDate);
  const daysLeft   = Math.max(0, diffDays(today, challenge.endDate));
  const journeyPct = clamp(Math.round((dayNumber/totalDays)*100), 0, 100);
  const streak     = calcChallengeStreak(challenge);

  const canGoBack  = addDays(effDate, -1) >= minDate;
  const canGoFwd   = !isToday;

  return `
  <main>
    ${active.length > 1 ? renderChallengePills(active) : ""}
    ${renderWeeklyRecap(challenge)}
    <div class="date-nav">
      <button class="date-nav-arrow ${canGoBack?"":"disabled"}" data-date-back ${canGoBack?"":"disabled"} aria-label="Previous day">‹</button>
      <span class="date-nav-label ${!isToday?"date-nav-past":""}">
        ${isToday ? "Today" : formatDate(parseDate(effDate), {weekday:"short", month:"short", day:"numeric"})}
      </span>
      <button class="date-nav-arrow ${canGoFwd?"":"disabled"}" data-date-fwd ${canGoFwd?"":"disabled"} aria-label="Next day">›</button>
    </div>
    ${!isToday ? `<div class="backfill-banner">✏️ Editing ${formatDate(parseDate(effDate),{weekday:"long"})} — changes save immediately.</div>` : ""}
    <section class="hero">
      <div class="day-label">${esc(challenge.emoji)} ${esc(challenge.name)}</div>
      <div class="day-count">Day ${dayNumber} <span style="font-weight:300;font-size:0.55em;color:var(--text-dim)">of ${totalDays}</span></div>
      <div class="subtitle">${daysLeft > 0 ? daysLeft+" days remaining" : "Final day!"} · ${challenge.mode} mode</div>
      ${isToday ? `<div class="greeting">${currentGreeting()}</div>` : ""}
      <div class="journey-track"><div class="journey-fill" style="width:${journeyPct}%"></div></div>
    </section>

    <section class="today-stage panel">
      ${renderRing(info, day, streak, challenge)}
      ${isToday ? renderStreakFreezeUI(challenge) : ""}
      ${isToday ? renderWeightChip() : ""}
      ${renderCompleteBanner(day, info, challenge)}
      ${info.done===0 ? (() => {
        const isExped = challenge.habits.some(h => h.type === "distance");
        return `<p class="empty-copy">${isExped ? "No distance logged yet — enter your km below." : "Nothing logged yet. What's first?"}</p>`;
      })() : ""}
    </section>

    <section>
      <div class="section-head">
        <div class="section-label" style="margin:0">Daily Mode</div>
      </div>
      ${renderModeSelector(day, challenge)}
    </section>

    ${isToday ? renderWeeklyGoalBar(challenge) : ""}

    <section>
      <div class="section-head">
        ${challenge.habits.some(h => h.type === "distance")
          ? `<div class="section-label" style="margin:0">Distance</div>`
          : `<div class="section-label" style="margin:0">Habits</div>
             <div style="font-size:12px;font-weight:300;color:var(--text-dim)">${info.done} / ${info.total}</div>`}
      </div>
      <div class="habit-list">
        ${challenge.habits.map(h => renderHabit(h, day, challenge)).join("")}
      </div>
      ${(() => {
        const tpl = challenge.templateId ? TEMPLATES.find(t=>t.id===challenge.templateId) : null;
        return (isToday && !day.recovered && info.done < info.total && !tpl?.noRestDay)
          ? `<button class="link-btn rough-day-link" data-open-sheet>Having a rough day?</button>` : "";
      })()}
    </section>
    ${(() => {
      const tpl = challenge.templateId ? TEMPLATES.find(t=>t.id===challenge.templateId) : null;
      return tpl?.routeKm ? renderRouteProgress(challenge, tpl) : "";
    })()}
    ${renderDayNote(day)}
    ${renderPastNotes(challenge)}
  </main>
  ${renderSaveDayButton(day, info, challenge)}`;
}

function renderChallengePills(active) {
  return `
  <div class="challenge-pills">
    ${active.map(c => {
      const d = getChallengeDay(c);
      const info = completionInfo(c, d);
      return `<button class="c-pill ${c.id===todayChallengeId?"active":""}" data-today-challenge="${c.id}">
        ${esc(c.emoji)} ${esc(c.name)} <span class="c-pill-pct">${info.percent}%</span>
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
        <defs><linearGradient id="wg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#b44fff"/><stop offset="100%" stop-color="#ff4fa3"/></linearGradient></defs>
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
      <div class="wf-item"><span class="wf-icon">🏆</span><span class="wf-text">21 challenges — 75 Hard, Cold Exposure, Morning Routine, Fasting and more</span></div>
      <div class="wf-item"><span class="wf-icon">👑</span><span class="wf-text">Boss Days, Rest Days, Minimum Days — built for real life, not perfection</span></div>
      <div class="wf-item"><span class="wf-icon">🔥</span><span class="wf-text">Streaks, badges, streak freezes, and weekly recaps that keep you honest</span></div>
      <div class="wf-item"><span class="wf-icon">📵</span><span class="wf-text">Works offline. No account. No ads. Free forever. Your data stays on your device.</span></div>
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
    ${isFirstTime ? `<p class="welcome-hint">No account needed. No ads. No BS.</p>` : ""}
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
  <div class="ring-wrap ${day.mode==="boss"?"boss":day.mode==="rest"?"rest":""}">
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
      <circle class="ring-value ${day.mode==="boss"?"boss-mode":""} ${day.mode==="minimum"&&info.percent===100?"minimum-full":""} ${day.mode==="rest"?"rest-mode":""}" cx="110" cy="110" r="90" data-percent="${info.percent}"/>
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
      <div class="ring-stat-value">${challengePts}${day.mode==="boss"?`<span class="boss-badge">×1.5</span>`:""}</div>
      <div class="ring-stat-label">challenge pts</div>
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
  const template      = challenge?.templateId ? TEMPLATES.find(t => t.id === challenge.templateId) : null;
  const noRestDay     = !!(template?.noRestDay);
  const jokerBudget   = challenge?.jokerBudget ?? 3;
  // Count rest days used (excluding today's current selection so user can toggle freely)
  const todayIsRest   = day.mode === "rest";
  const jokersUsed    = Object.values(challenge?.days || {}).filter(d => d.mode === "rest").length;
  const jokersLeft    = Math.max(0, jokerBudget - jokersUsed + (todayIsRest ? 0 : 0));
  const budgetExhausted = !todayIsRest && jokersUsed >= jokerBudget;

  const modeDesc = {
    minimum:  "Locks non-essential habits. Streak stays safe.",
    standard: "All habits available. Normal day.",
    boss:     "Every habit unlocked. Points × 1.5. Go all out.",
    rest:     budgetExhausted
      ? `No rest days left (${jokerBudget}/${jokerBudget} used).`
      : `Rest day. No habits required. Streak preserved. (${jokersUsed}/${jokerBudget} used)`,
  };

  const modes = noRestDay
    ? [["minimum","Minimum"],["standard","Standard"],["boss","Boss Day"]]
    : [["minimum","Minimum"],["standard","Standard"],["boss","Boss Day"],["rest", budgetExhausted ? `Rest (0 left)` : `Rest Day${jokerBudget > 0 ? ` (${jokerBudget - jokersUsed} left)` : ""}`]];

  return `
  <div class="mode-selector">${modes.map(([id,label]) =>
    `<button class="mode-button ${id==="rest"?"rest-mode-btn":""} ${day.mode===id?"active":""} ${id==="rest"&&budgetExhausted?"mode-btn-disabled":""}" data-mode="${id}" ${id==="rest"&&budgetExhausted?`aria-disabled="true"`:""} >${label}</button>`).join("")}</div>
  <p class="mode-desc">${modeDesc[day.mode]||""}</p>`;
}

function renderHabit(habit, day, challenge) {
  if (habit.type === "tiered")   return renderTieredHabit(habit, day, challenge);
  if (habit.type === "distance") return renderDistanceHabit(habit, day, challenge);
  const locked  = day.mode==="rest" || (day.mode==="minimum" && !habit.minimum_day) || (day.mode!=="boss" && habit.boss_only);
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
      <span class="habit-title">${esc(habit.title)}${habit.boss_only?`<span class="boss-pip">👑</span>`:""}</span>
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
      <span class="habit-title">${esc(habit.title)}${habit.boss_only?`<span class="boss-pip">👑</span>`:""}</span>
      <span class="habit-quip">${locked?(day.mode==="rest"?"Rest Day — recover well.":day.mode==="minimum"?"Minimum Day — locked.":"Switch to Boss Day."):esc(habit.quip)}</span>
    </span>
    <span class="check-circle">${checked?"✓":""}</span>
  </button>`;
}

function renderTieredHabit(habit, day, challenge) {
  const locked  = day.mode==="rest" || (day.mode==="minimum" && !habit.minimum_day) || (day.mode!=="boss" && habit.boss_only);
  const checked = day.done.includes(habit.id);
  const selVal  = day.tiers?.[habit.id] ?? null;
  if (locked) return `
  <div class="habit-card locked" aria-disabled="true">
    <span class="accent" style="${habit.boss_only?"background:linear-gradient(135deg,#ffcc44,#ff9500)":""}"></span>
    <span class="habit-emoji">${habit.boss_only?"👑":"🔒"}</span>
    <span class="habit-info">
      <span class="habit-title">${esc(habit.title)}</span>
      <span class="habit-quip">${day.mode==="rest"?"Rest Day — recover well.":day.mode==="minimum"?"Minimum Day — locked.":"Switch to Boss Day."}</span>
    </span>
    <span class="check-circle"></span>
  </div>`;
  const popping = _animHabitId === habit.id;
  return `
  <div class="habit-card run-habit ${checked?"checked":""} ${popping?"habit-pop":""}">
    <span class="accent" style="${habit.boss_only?"background:linear-gradient(135deg,#ffcc44,#ff9500)":""}"></span>
    <span class="habit-emoji">${esc(habit.emoji)}</span>
    <div class="run-body">
      <span class="habit-title">${esc(habit.title)}${habit.boss_only?`<span class="boss-pip">👑</span>`:""}</span>
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

function renderCompleteBanner(day, info, challenge) {
  if (info.done!==info.total || info.total===0) return "";
  const hasNote   = !!(day.note?.trim());
  const noteNudge = hasNote ? "" : `<button class="cb-note-nudge" onclick="document.getElementById('day-note')?.focus()">✍️ Add today's note</button>`;
  const isExpedition = challenge?.habits.some(h => h.type === "distance");
  if (day.mode==="rest") return `<div class="complete-banner rest-complete"><span class="cb-icon">😴</span><div class="cb-body"><div class="cb-title">Rest Day</div><div class="cb-sub">Recover. Come back stronger.</div>${noteNudge}</div></div>`;
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
    return `<div class="complete-banner"><span class="cb-icon">🗺️</span><div class="cb-body"><div class="cb-title">${todayD.toFixed(isFloors?0:1)} ${dUnit} today</div><div class="cb-sub">${sub}</div>${noteNudge}</div></div>`;
  }
  if (day.mode==="minimum") return `<div class="complete-banner minimum-complete"><span class="cb-icon">🛡</span><div class="cb-body"><div class="cb-title">Minimum Day Done</div><div class="cb-sub">Streak protected.</div>${noteNudge}</div></div>`;
  if (day.mode==="boss")    return `<div class="complete-banner boss-complete"><span class="cb-icon">👑</span><div class="cb-body"><div class="cb-title">BOSS DAY COMPLETE</div><div class="cb-sub">${info.points} pts · Absolute unit.</div>${noteNudge}</div></div>`;
  return `<div class="complete-banner"><span class="cb-icon">🔥</span><div class="cb-body"><div class="cb-title">Full Send</div><div class="cb-sub">All habits done · ${info.points} pts</div>${noteNudge}</div></div>`;
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
  return `
  <div class="weekly-goal-bar">
    <div class="wgb-row">
      <span class="wgb-label">${hit ? "✅ Weekly goal hit!" : `Week: ${pts} / ${challenge.weeklyGoal} pts`}</span>
      <span class="wgb-pct">${pct}%</span>
    </div>
    <div class="wgb-track"><div class="wgb-fill ${hit?"wgb-done":""}" style="width:${pct}%"></div></div>
    ${hit ? "" : `<div style="font-size:11px;color:var(--text-faint);margin-top:4px">Hit the goal to unlock week badges 🏅</div>`}
  </div>`;
}

// ── Weekly Recap (Sunday card) ────────────────────────────────────────────

function renderWeeklyRecap(challenge) {
  if (new Date().getDay() !== 0) return "";                    // only Sundays
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

// ── Day Note ──────────────────────────────────────────────────────────────

function renderDayNote(day) {
  const len = (day.note || "").length;
  return `
  <section style="margin-top:6px">
    <div class="section-label">📝 Today's Note</div>
    <div class="day-note-card">
      <textarea class="day-note-input" id="day-note" placeholder="How did today go? Wins, struggles, anything…" maxlength="500">${esc(day.note || "")}</textarea>
      <div class="day-note-hint" id="day-note-hint">${len}/500</div>
    </div>
  </section>`;
}

function renderPastNotes(challenge) {
  const today = todayKey();
  // Collect last 7 days with notes (excluding today)
  const entries = [];
  for (let i = 1; i <= 7; i++) {
    const k = addDays(today, -i);
    if (k < challenge.startDate) break;
    const d = challenge.days[k];
    if (d?.note?.trim()) entries.push({ key: k, note: d.note.trim() });
  }
  if (!entries.length) return "";
  return `
  <section style="margin-top:2px">
    <div class="section-label" style="margin-bottom:6px">Past Notes</div>
    ${entries.map(e => `
    <div class="past-note-card">
      <div class="pnc-date">${formatDate(parseDate(e.key), {weekday:"short",month:"short",day:"numeric"})}</div>
      <div class="pnc-text">${esc(e.note.length > 160 ? e.note.slice(0,160)+"…" : e.note)}</div>
    </div>`).join("")}
  </section>`;
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

function renderSaveDayButton(day, info, challenge) {
  if (info.done>=info.total || day.recovered || activeTab!=="today" || builderOpen) return "";
  const template  = challenge?.templateId ? TEMPLATES.find(t => t.id === challenge.templateId) : null;
  if (template?.noRestDay) return "";
  return `<button class="save-day" data-open-sheet>Save My Day</button>`;
}

const microActions = [
  "Drink a full glass of water right now",
  "Take a 10-minute walk",
  "Eat something with protein before the kitchen closes",
  "Do 5 minutes of stretching before bed",
  "Set a wake-up time and put the phone down",
  "Log your day even if it wasn't perfect",
];
let selectedMicro = pickRandom(microActions, 3);

function renderSaveDaySheet() {
  return `
  <div class="sheet-backdrop" data-close-sheet>
    <section class="sheet" role="dialog">
      <h2 style="font-size:16px;font-weight:700;margin:12px 0 4px">Here's your minimum:</h2>
      <div class="micro-list">
        ${selectedMicro.map(a=>`<label class="micro-action"><input type="checkbox"> <span>${a}</span></label>`).join("")}
      </div>
      <button class="primary-button" data-recovered>That's enough. You showed up.</button>
    </section>
  </div>`;
}

function shareAchievement(text) {
  if (navigator.share) {
    navigator.share({ title: "Conqur", text }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(text).then(() => showToast("Copied to clipboard!")).catch(() => showToast(text));
  }
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
  const all    = getAllChallenges();
  const active = all.filter(c => c.status==="active");
  const paused = all.filter(c => c.status==="paused");
  const past   = all.filter(c => c.status!=="active" && c.status!=="paused");
  return `
  <main>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <div class="section-label" style="margin:0">Active Challenges</div>
      <button class="pill-btn" data-open-builder>+ New</button>
    </div>
    ${active.length ? active.map(c=>renderChallengeCard(c)).join("") : `<div class="empty-state">No active challenges. <button class="link-btn" data-open-builder>Start one</button></div>`}
    ${paused.length ? `<div class="section-label">⏸ Paused</div>${paused.map(c=>renderChallengeCard(c)).join("")}` : ""}
    ${past.length   ? `<div class="section-label">Past Challenges</div>${past.map(c=>renderChallengeCard(c)).join("")}` : ""}
  </main>`;
}

function renderChallengeCard(c) {
  const today        = todayKey();
  const totalDays    = diffDays(c.startDate, c.endDate)+1;
  const dayNumber    = challengeDayNumber(c);
  const pct          = clamp(Math.round((dayNumber/totalDays)*100), 0, 100);
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
  return `
  <button class="challenge-card" data-view-challenge="${c.id}">
    <div class="cc-top">
      <div class="cc-emoji">${esc(c.emoji)}</div>
      <div class="cc-info">
        <div class="cc-name"${tierData?` style="color:${tierData.color}"`:""}>${esc(c.name)}</div>
        <div class="cc-meta">${isExpedition && tpl?.routeKm
          ? `${Math.round(totalKmVal * factor * 10)/10} / ${Math.round(tpl.routeKm * factor).toLocaleString()} ${dUnit} · Day ${dayNumber}`
          : `${totalDays}d · ${c.mode} · Day ${dayNumber}`}</div>
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
      ? `${routePct}% of route · ${c.badges.length} badges`
      : `${pct}% complete · ${c.badges.length} badges`}</div>
  </button>`;
}

// ── Challenge Detail ──────────────────────────────────────────────────────

function renderChallengeDetail(c) {
  if (!c) return `<main><div class="empty-state">Challenge not found.</div></main>`;
  const today     = todayKey();
  const weeks     = challengeWeeks(c);
  const totalDays = diffDays(c.startDate, c.endDate)+1;
  const dayNumber = challengeDayNumber(c);
  const pct       = clamp(Math.round((dayNumber/totalDays)*100), 0, 100);
  const streak    = calcChallengeStreak(c);
  const totalPts  = Object.values(c.days).reduce((s,d)=>s+(d.pts||0),0);
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
        <div style="font-size:18px;font-weight:700">${esc(c.emoji)} ${(()=>{ const t=c.templateId?TEMPLATE_TIERS[c.templateId]:null; const td=t?TIERS[t]:null; return td?`<span style="color:${td.color}">${esc(c.name)}</span>`:esc(c.name); })()}</div>
        <div style="font-size:12px;color:var(--text-dim)">${c.startDate} → ${c.endDate}</div>
      </div>
    </div>
    <div class="stats-grid" style="margin-bottom:14px">
      ${statCard("🔥 Streak", streak, "days")}
      ${isExpedition
        ? statCard("🗺️ Distance", totalKmDisplay.toFixed(isFloorsDet?0:1), dUnitDet)
        : statCard("⭐ Total pts", totalPts, "")}
      ${statCard("📅 Progress", pct+"%", "")}
      ${statCard("🏅 Badges", c.badges.length, "")}
    </div>
    ${isExpedition ? renderRouteProgress(c, tpl) : ""}


    ${nextChainT && c.status !== "active" ? `
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
        const allDays = Object.values(c.days);
        const available = allDays.filter(d => {
          if (d.mode === "minimum" && !h.minimum_day) return false;
          if (h.boss_only && d.mode !== "boss") return false;
          return d.done.length > 0 || d.recovered;
        });
        const done = available.filter(d => d.done.includes(h.id)).length;
        const hpct = available.length ? Math.round((done / available.length) * 100) : null;
        const color = hpct == null ? "var(--text-faint)" : hpct >= 80 ? "var(--success)" : hpct >= 50 ? "#f5a623" : "var(--secondary)";
        return `<div class="habit-preview-item">
          <span>${esc(h.emoji)} ${esc(h.title)}${h.boss_only ? ` <span style="font-size:10px;opacity:.6">👑</span>` : ""}</span>
          ${hpct != null ? `<span class="hpi-rate" style="color:${color}">${hpct}%</span>` : ""}
        </div>`;
      }).join("")}
    </div>

    ${hasPhotoHabit ? `
    <div class="section-label">Progress Photos</div>
    <div id="pp-strip-${c.id}" class="pp-strip"><div class="pp-loading">Loading photos…</div></div>
    ` : ""}

    ${(c.status==="active"||c.status==="paused")?`
    <div style="margin-top:20px;display:flex;gap:8px;flex-wrap:wrap">
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
            return `
            <div class="ech-edit-row">
              <div class="ech-edit-top">
                <input id="ech-emoji" class="emoji-input" type="text" value="${esc(h.emoji)}" maxlength="2" style="width:48px">
                <input id="ech-title" type="text" value="${esc(h.title)}" placeholder="Habit name" style="flex:1">
                <input id="ech-pts" type="number" value="${h.points}" min="1" max="10" style="width:52px">
              </div>
              <div class="ech-edit-flags">
                <label class="ech-flag"><input type="checkbox" id="ech-minimum" ${h.minimum_day?"checked":""}> Minimum day</label>
                <label class="ech-flag"><input type="checkbox" id="ech-boss" ${h.boss_only?"checked":""}> Boss only 👑</label>
              </div>
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
            <span class="custom-habit-pts">${h.points}pt</span>
            <button class="icon-btn" data-ec-edit-habit="${i}" title="Edit">✏️</button>
            <button class="icon-btn" data-ec-delete-habit="${i}" title="Delete" style="color:var(--secondary)">✕</button>
          </div>`;
        }).join("")}
        <div class="add-habit-row">
          <input id="ech-new-emoji" class="emoji-input" type="text" value="${esc(editForm?.newHabitEmoji||"⭐")}" maxlength="2" placeholder="⭐">
          <input id="ech-new-title" type="text" value="${esc(editForm?.newHabitTitle||"")}" placeholder="New habit name" style="flex:1">
          <input id="ech-new-pts" type="number" value="${editForm?.newHabitPoints||2}" min="1" max="10" style="width:52px">
          <button class="pill-btn" data-ec-add-habit>Add</button>
        </div>
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
      if(d.mode==="boss"&&inf.percent===100) return `<span class="wdot boss"></span>`;
      if(d.mode==="minimum"&&inf.percent===100) return `<span class="wdot min"></span>`;
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
    if (day.mode === "boss" && info.percent === 100)     return `<div class="cal-cell cal-boss${todayCls}">👑</div>`;
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
      <span class="cal-leg boss">👑 Boss</span>
      <span class="cal-leg rest">😴 Rest</span>
      <span class="cal-leg freeze">❄️ Frozen</span>
      <span class="cal-leg missed">— Missed</span>
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
        ${builderStep==="template"?"Choose Challenge":builderStep==="customize"?"Customize":"Review"}
      </div>
    </div>
    ${builderStep==="template" ? renderBuilderTemplates() : ""}
    ${builderStep==="customize" ? renderBuilderCustomize() : ""}
  </main>`;
}

function renderBuilderTemplates() {
  const cats = [
    { id:"transformation", label:"🔥 Transformation" },
    { id:"movement",       label:"🏃 Movement"       },
    { id:"lifestyle",      label:"🌱 Lifestyle"      },
    { id:"expedition",     label:"🗺️ Expeditions"    },
  ];
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
    return `
    <button class="template-card${isExpedition?" tc-cat expedition":""}" data-select-template="${t.id}">
      <div class="tc-emoji">${t.emoji}</div>
      <div class="tc-name" style="color:${tierData.color}">${t.name}</div>
      <div class="tc-meta">${meta}</div>
      <div class="tc-desc">${t.description}</div>
    </button>`;
  };
  return cats.map(cat => {
    const group = TEMPLATES.filter(t => t.category === cat.id);
    if (!group.length) return "";
    return `
    <div class="template-cat-label">${cat.label}</div>
    <div class="template-grid">${group.map(templateCard).join("")}</div>`;
  }).join("") + `
  <div class="template-cat-label">✏️ Custom</div>
  <div class="template-grid">
    <button class="template-card" data-select-template="custom">
      <div class="tc-emoji">🎯</div>
      <div class="tc-name">Custom</div>
      <div class="tc-meta">Any duration</div>
      <div class="tc-desc">Build your own challenge from scratch.</div>
    </button>
  </div>`;
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
    <div class="field-grid" style="margin-bottom:14px">
      <label class="field">Start date<input id="bf-start" type="date" value="${builderForm.startDate}"></label>
      <label class="field">End date<input id="bf-end" type="date" value="${builderForm.endDate}"></label>
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
      <div class="field-label">Rest Days (your budget)</div>
      <div class="joker-stepper">
        <button class="joker-step-btn" data-joker-adj="-1">−</button>
        <span class="joker-step-val" id="joker-val">${builderForm.jokerBudget}</span>
        <button class="joker-step-btn" data-joker-adj="1">+</button>
      </div>
      <p class="mode-desc" style="margin:4px 0 0">${builderForm.jokerBudget === 0 ? "Zero compromise — no rest days." : `${builderForm.jokerBudget} planned day${builderForm.jokerBudget===1?"":"s"} off. Use them wisely.`}</p>
    </div>`}
    <label class="field" style="margin-bottom:16px">
      Weekly point goal
      <input id="bf-goal" type="number" value="${builderForm.weeklyGoal}" min="10" max="500">
    </label>
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
            <span class="custom-habit-pts">${h.points}pt</span>
            <button class="icon-btn" data-remove-habit="${i}">✕</button>
          </div>`).join("")}
        <div class="add-habit-row">
          <input id="nh-emoji" class="emoji-input" type="text" value="${esc(builderForm.newHabitEmoji)}" maxlength="2" placeholder="⭐">
          <input id="nh-name" type="text" value="${esc(builderForm.newHabitName)}" placeholder="Habit name" style="flex:1">
          <input id="nh-pts" type="number" value="${builderForm.newHabitPoints}" min="1" max="10" style="width:52px">
          <button class="pill-btn" data-add-habit>Add</button>
        </div>
      </div>`}
    `}
    <button class="primary-button" style="margin-top:20px" data-start-challenge>
      Start Challenge 🚀
    </button>
    <button class="secondary-button" style="margin-top:8px" data-builder-back>← Back</button>
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
      <linearGradient id="cg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#b44fff"/><stop offset="100%" stop-color="#ff4fa3"/></linearGradient>
      <linearGradient id="cga" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#b44fff" stop-opacity="0.22"/><stop offset="100%" stop-color="#ff4fa3" stop-opacity="0"/></linearGradient>
    </defs>
    <path d="${area}" fill="url(#cga)"/>
    <path d="${line}" fill="none" stroke="url(#cg)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    ${coords.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="3" fill="url(#cg)"/>`).join("")}
    <text x="${coords[0][0]}" y="${H-2}" fill="var(--text-faint)" font-size="9" text-anchor="middle">${vals[0].toFixed(1)}</text>
    <text x="${coords[coords.length-1][0]}" y="${H-2}" fill="var(--text-faint)" font-size="9" text-anchor="middle">${vals[vals.length-1].toFixed(1)}</text>
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
  </main>`;
}

function renderBadgeCat(label, defs, earned, templateId) {
  const earnedSet = new Set(earned);
  const count = defs.filter(b=>earnedSet.has(b.id)).length;
  // Determine tier for badges in this category: template badges use template tier, others use BADGE_TIERS
  const catTier = templateId ? (TEMPLATE_TIERS[templateId] || "common") : null;
  return `
  <div class="badge-cat">
    <div class="badge-cat-header">
      <span class="badge-cat-name">${label}</span>
      <span class="badge-cat-count">${count} / ${defs.length}</span>
    </div>
    <div class="badge-grid">
      ${defs.map(b => {
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
      }).join("")}
    </div>
  </div>`;
}

// ── Settings ──────────────────────────────────────────────────────────────

// ── Onboarding ────────────────────────────────────────────────────────────

const ONBOARDING_STEPS = [
  { emoji:"🏆", title:"Welcome to Conqur", body:"Build habits. Win challenges. Earn badges. This is your mission control.", tab:null },
  { emoji:"📅", title:"Today Tab",         body:"Your daily dashboard. Log habits, track your ring, and see your streak.", tab:"today" },
  { emoji:"⚡", title:"Challenges",         body:"Pick a template or build your own. Run multiple challenges at once.", tab:"challenges" },
  { emoji:"📊", title:"Body & Badges",      body:"Track weight, measurements, and unlock badges as you hit milestones.", tab:"body" },
];

function renderOnboarding() {
  if (onboardingStep === null || onboardingStep >= ONBOARDING_STEPS.length) return "";
  const step = ONBOARDING_STEPS[onboardingStep];
  const isLast = onboardingStep === ONBOARDING_STEPS.length - 1;
  const dots = ONBOARDING_STEPS.map((_,i) =>
    `<span class="ob-dot ${i===onboardingStep?"active":""}"></span>`).join("");
  return `
  <div class="sheet-backdrop ob-backdrop">
    <section class="sheet ob-card" role="dialog">
      <div class="ob-emoji">${step.emoji}</div>
      <div class="ob-title">${step.title}</div>
      <div class="ob-body">${step.body}</div>
      <div class="ob-dots">${dots}</div>
      <button class="primary-button" data-ob-next style="margin-top:16px">${isLast?"Pick your first challenge →":"Next →"}</button>
      <button class="link-btn" data-ob-skip style="margin-top:8px;display:block;text-align:center">Skip tour</button>
    </section>
  </div>`;
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
      <div style="font-size:12px;color:var(--text-faint);margin-top:8px">⚠️ Restoring will overwrite all current data.</div>
    </div>
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
    body = `<p class="reminder-note">Notifications are blocked. Go to your browser settings → Site permissions to enable them.</p>`;
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

function renderCloudSync() {
  if (CloudSync.isSignedIn) {
    return `
    <div class="section-label">☁️ Cloud Sync</div>
    <div class="more-card" style="margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <span style="font-size:18px">✅</span>
        <div>
          <div style="font-size:13px;font-weight:700;color:var(--text-primary)">${esc(CloudSync.userEmail || "")}</div>
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
  <div class="section-label">☁️ Cloud Sync</div>
  <div class="more-card" style="margin-bottom:14px">
    <p style="font-size:13px;color:var(--text-secondary);margin:0 0 12px">Save your data to the cloud. Survive a new phone, reinstall, or device switch — sign in to restore everything.</p>
    ${_cloudAuthError ? `<div class="cloud-auth-error">${esc(_cloudAuthError)}</div>` : ""}
    ${_cloudAuthLoading ? `<div style="text-align:center;padding:16px;color:var(--text-dim);font-size:14px">Loading…</div>` : `
    <label class="field" style="margin-bottom:10px">
      Email
      <input id="cloud-email" type="email" placeholder="your@email.com" autocomplete="email" inputmode="email">
    </label>
    <label class="field" style="margin-bottom:14px">
      Password <span style="font-size:11px;font-weight:400;color:var(--text-dim)">(min 8 characters)</span>
      <input id="cloud-password" type="password" placeholder="••••••••" autocomplete="current-password">
    </label>
    <div style="display:flex;gap:8px">
      <button class="secondary-button" style="flex:1" data-cloud-signin>Sign In</button>
      <button class="primary-button" style="flex:1" data-cloud-signup>Create Account</button>
    </div>`}
  </div>`;
}

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
    <div class="section-label">Units</div>
    <div class="more-card">
      <div style="margin-bottom:14px">
        <div style="font-size:12px;font-weight:700;color:var(--text-dim);margin-bottom:8px">Weight</div>
        <div class="mode-selector">
          <button class="mode-button ${u.weight==="lbs"?"active":""}" data-unit-weight="lbs">lbs</button>
          <button class="mode-button ${u.weight==="kg"?"active":""}" data-unit-weight="kg">kg</button>
        </div>
      </div>
      <div style="margin-bottom:14px">
        <div style="font-size:12px;font-weight:700;color:var(--text-dim);margin-bottom:8px">Distance</div>
        <div class="mode-selector">
          <button class="mode-button ${u.distance==="km"?"active":""}" data-unit-distance="km">km</button>
          <button class="mode-button ${u.distance==="miles"?"active":""}" data-unit-distance="miles">miles</button>
        </div>
      </div>
      <div>
        <div style="font-size:12px;font-weight:700;color:var(--text-dim);margin-bottom:8px">Measurements</div>
        <div class="mode-selector">
          <button class="mode-button ${u.measurements==="cm"?"active":""}" data-unit-measurements="cm">cm</button>
          <button class="mode-button ${u.measurements==="in"?"active":""}" data-unit-measurements="in">in</button>
        </div>
      </div>
    </div>
    ${renderCloudSync()}
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
  on("[data-tab]",          el => { activeTab=el.dataset.tab; builderOpen=false; settingsOpen=false; viewChallengeId=null; editChallengeId=null; editForm=null; sheetOpen=false; bodyHistoryLimit=5; viewingDate=null; render(); });
  on("[data-mode]",         el => setMode(el.dataset.mode));
  on("[data-habit]",        el => toggleHabit(el.dataset.habit));
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
  on("[data-open-settings]",() => { settingsOpen=true; render(); });
  on("[data-close-settings]",()=>{ settingsOpen=false; render(); });
  on("[data-view-challenge]",el=>{ viewChallengeId=el.dataset.viewChallenge; challengeDetailView="weeks"; calendarViewMonth=null; render(); });
  on("[data-close-detail]", () => { viewChallengeId=null; challengeDetailView="weeks"; calendarViewMonth=null; render(); });
  on("[data-detail-view]",  el => { challengeDetailView=el.dataset.detailView; render(); });
  on("[data-cal-prev]",     el => { calendarViewMonth=el.dataset.calPrev; render(); });
  on("[data-cal-next]",     el => { calendarViewMonth=el.dataset.calNext; render(); });
  on("[data-use-freeze]",   () => useStreakFreeze());
  on("[data-capture-photo]",el => captureProgressPhoto(el.dataset.capturePhoto));
  on("[data-open-sheet]",   () => { selectedMicro=pickRandom(microActions,3); sheetOpen=true; render(); });
  on("[data-close-sheet]",  (el,e) => { if(e.target.matches("[data-close-sheet]")){ sheetOpen=false; render(); }});
  on("[data-recovered]",    () => markRecovered());
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
  on("[data-builder-back]", () => { builderStep="template"; render(); });
  on("[data-start-challenge]",() => startChallenge());
  on("[data-add-habit]",    () => { saveBuilderFormFromDOM(); addCustomHabit(); });
  on("[data-remove-habit]", el => { saveBuilderFormFromDOM(); removeCustomHabit(Number(el.dataset.removeHabit)); });
  on("[data-close-completion]",       (el,e) => { if(e.target.closest("[data-close-completion]")){ justCompletedId = justCompletedIds.length ? justCompletedIds.shift() : null; render(); }});
  on("[data-completion-new-challenge]",     () => { justCompletedId=null; justCompletedIds=[]; builderOpen=true; builderStep="template"; builderForm=defaultBuilderForm(); render(); });
  on("[data-share-completion]", () => {
    const c = justCompletedId ? getChallenge(justCompletedId) : null; if (!c) return;
    const totalDays   = diffDays(c.startDate, c.endDate) + 1;
    const totalPts    = Object.values(c.days).reduce((s,d) => s+(d.pts||0), 0);
    const streak      = c.finalStreak ?? calcChallengeStreak(c);
    const isExpedition = c.habits.some(h => h.type === "distance");
    const totalKmVal  = isExpedition ? challengeTotalKm(c) : null;
    const text = isExpedition
      ? `I just covered ${totalKmVal.toFixed(1)} km on the ${c.name} expedition on Conqur! 🗺️\n${totalDays} days · ${streak}-day streak.\nEvery km counts. 💪`
      : `I just completed the ${c.name} challenge on Conqur! 🏆\n${totalDays} days · ${totalPts} pts · ${streak}-day streak.\nBuilding habits that stick. 💪`;
    shareAchievement(text);
  });
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
  on("[data-cloud-signout]", () => { CloudSync.signOut(); _cloudAuthError = ""; render(); });
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
    const emoji = (document.getElementById("ech-emoji")?.value || "⭐").trim() || "⭐";
    const title = (document.getElementById("ech-title")?.value || "").trim();
    const pts   = Math.max(1, Math.min(10, Number(document.getElementById("ech-pts")?.value) || 2));
    const minDay  = document.getElementById("ech-minimum")?.checked ?? true;
    const bossOnly = document.getElementById("ech-boss")?.checked ?? false;
    if (!title) { showToast("Habit needs a name."); return; }
    editForm.habits[i] = { ...editForm.habits[i], emoji, title, points: pts, minimum_day: minDay, boss_only: bossOnly };
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
    const pts   = Math.max(1, Math.min(10, Number(document.getElementById("ech-new-pts")?.value) || 2));
    if (!title) { showToast("Enter a habit name."); return; }
    editForm.habits.push({ id: uid(), title, emoji, quip: "", type: "binary", minimum_day: true, boss_only: false, points: pts });
    editForm.newHabitEmoji  = "⭐";
    editForm.newHabitTitle  = "";
    editForm.newHabitPoints = 2;
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
  on("[data-ob-next]",         () => {
    onboardingStep++;
    const step = ONBOARDING_STEPS[onboardingStep];
    if (step?.tab) activeTab = step.tab;
    if (onboardingStep >= ONBOARDING_STEPS.length) {
      onboardingStep = null;
      activeTab = "challenges";
      builderOpen = true;
      builderStep = "template";
      builderForm = defaultBuilderForm();
    }
    render();
  });
  on("[data-ob-skip]",         () => { onboardingStep = null; activeTab = "today"; render(); });
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
  on("[data-delete-challenge]", el => deleteChallenge(el.dataset.deleteChallenge));
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
  // Day note — delegated so it works after tab switches and re-renders
  document.addEventListener("blur", e => {
    if (e.target.id === "day-note") saveNote();
  }, true); // capture phase so blur (which doesn't bubble) is caught
  document.addEventListener("input", e => {
    if (e.target.id !== "day-note") return;
    const hint = document.getElementById("day-note-hint");
    if (hint) hint.textContent = `${e.target.value.length}/500`;
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
  // Warn if switching to a more restrictive mode would uncheck logged habits
  if (mode === "minimum" && day.mode !== "minimum" && day.done.length > 0) {
    const willLose = day.done.filter(id => !c.habits.find(h=>h.id===id)?.minimum_day).length;
    if (willLose > 0) {
      showConfirm(
        `Switching to Minimum Day will uncheck ${willLose} logged habit${willLose>1?"s":""}. Continue?`,
        () => { applyMode(c, day, mode); }
      );
      return;
    }
  }
  applyMode(c, day, mode);
}

function applyMode(c, day, mode) {
  day.mode = mode;
  if (mode==="minimum") day.done = day.done.filter(id => c.habits.find(h=>h.id===id)?.minimum_day);
  if (mode==="standard") day.done = day.done.filter(id => !c.habits.find(h=>h.id===id)?.boss_only);
  updateDayPoints(c, day);
  saveState();
  if (mode==="minimum") showToast("Minimum day set. Streak is safe.");
  if (mode==="boss")    showToast("Boss Day unlocked. Go big.");
  checkBadges(c);
  render();
}

function toggleHabit(id) {
  const c = currentChallenge(); if (!c) return;
  const habit = c.habits.find(h=>h.id===id); if (!habit) return;
  const day = getChallengeDay(c, effectiveDate());
  if (day.mode==="minimum" && !habit.minimum_day) return;
  if (day.mode!=="boss"    &&  habit.boss_only)   return;
  if (day.done.includes(id)) { day.done = day.done.filter(x=>x!==id); _animHabitId = null; }
  else { day.done.push(id); _animHabitId = id; }
  updateDayPoints(c, day);
  saveState(); navigator.vibrate?.(10);
  checkBadges(c); render();
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
  saveState();
  checkBadges(c);
  render();
}

function selectTier(habitId, rawVal) {
  const c = currentChallenge(); if (!c) return;
  const habit = c.habits.find(h=>h.id===habitId); if (!habit) return;
  const day = getChallengeDay(c, effectiveDate());
  if (day.mode==="minimum" && !habit.minimum_day) return;
  if (day.mode!=="boss"    &&  habit.boss_only)   return;
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
  saveState(); navigator.vibrate?.(10);
  checkBadges(c); render();
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
  builderStep = "customize";
  render();
}

function startChallenge() {
  const nameEl  = document.getElementById("bf-name");
  const startEl = document.getElementById("bf-start");
  const endEl   = document.getElementById("bf-end");
  const goalEl  = document.getElementById("bf-goal");
  if (nameEl)  builderForm.name      = nameEl.value.trim();
  if (startEl) builderForm.startDate = startEl.value;
  if (endEl)   builderForm.endDate   = endEl.value;
  if (goalEl)  builderForm.weeklyGoal= Number(goalEl.value)||100;
  if (!builderForm.startDate||!builderForm.endDate) { showToast("Set start and end dates."); return; }
  const template = builderForm.templateId ? TEMPLATES.find(t=>t.id===builderForm.templateId) : null;
  const habitCount = template ? template.habits.length : builderForm.habits.length;
  if (habitCount === 0) { showToast("Add at least one habit first."); return; }
  const c = createChallenge(builderForm);
  todayChallengeId = c.id;
  builderOpen = false;
  activeTab = "today";
  showToast(`${c.emoji} ${c.name} started!`);
  render();
}

function addCustomHabit() {
  const emoji = (document.getElementById("nh-emoji")?.value||"⭐").trim()||"⭐";
  const name  = (document.getElementById("nh-name")?.value||"").trim();
  const pts   = Number(document.getElementById("nh-pts")?.value||2);
  if (!name) { showToast("Enter a habit name."); return; }
  builderForm.habits.push({ id:uid(), title:name, emoji, quip:"", type:"binary", minimum_day:true, boss_only:false, points:pts });
  builderForm.newHabitEmoji = "⭐";
  builderForm.newHabitName  = "";
  builderForm.newHabitPoints = 2;
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
    showToast("Challenge paused. End date will adjust when you resume.");
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
        updateDayPoints(c, day); saveState(); checkBadges(c);
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

function currentGreeting() {
  const h = new Date().getHours();
  if (h<12) return "Good morning — the mission continues.";
  if (h<18) return "Afternoon check-in — how are we doing?";
  return "Evening — let's close this out.";
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
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#b44fff"/><stop offset="100%" stop-color="#ff4fa3"/></linearGradient></defs><rect width="192" height="192" rx="42" fill="#000"/><circle cx="96" cy="96" r="76" fill="none" stroke="#111" stroke-width="11"/><circle cx="96" cy="96" r="76" fill="none" stroke="url(#g)" stroke-width="11" stroke-linecap="round" stroke-dasharray="358 120" transform="rotate(-90 96 96)"/><text x="96" y="96" text-anchor="middle" dominant-baseline="central" font-family="'Lato',system-ui,sans-serif" font-weight="900" font-size="88" fill="url(#g)">C</text></svg>`;
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
// Show onboarding for truly new users (no challenges, never migrated)
if (!Object.keys(state.challenges).length && !state.migrations["cruiseModeImport_v1"]) {
  onboardingStep = 0;
}
saveState();
scheduleReminder();
setDynamicIcon();
render();
