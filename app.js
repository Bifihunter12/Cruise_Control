"use strict";

const APP_VERSION = "2026.06.07.4";
const STORAGE_KEY = "conqur_v1";
const OLD_KEY     = "cruise_mode_v1";
const RING_CIRC   = 2 * Math.PI * 90;
const UPDATE_CHECK_MS = 30 * 60 * 1000;

// ── Built-in Templates ─────────────────────────────────────────────────────

const TEMPLATES = [
  {
    id: "cruise-control", name: "Mental Toughness", emoji: "🔱", category: "transformation",
    description: "86 days that change everything. Body, habits, and an unbreakable mind.",
    duration: 86, weeklyGoal: 175, defaultMode: "soft",
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
    duration: 75, weeklyGoal: 140, defaultMode: "strict",
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
];

// ── Badge Definitions ──────────────────────────────────────────────────────

const CHALLENGE_BADGES = [
  { id:"first-wave",      label:"🌊 First Wave",        desc:"Complete all habits on Day 1.",                    test: c => c.dayNumber >= 1 && c.complete },
  { id:"getting-started", label:"✨ Getting Started",   desc:"3-day streak.",                                    test: c => c.streak >= 3 },
  { id:"work-week",       label:"📅 Work Week",         desc:"5-day streak.",                                    test: c => c.streak >= 5 },
  { id:"on-fire",         label:"🔥 On Fire",           desc:"7-day streak.",                                    test: c => c.streak >= 7 },
  { id:"iron-week",       label:"🦾 Iron Week",         desc:"14-day streak.",                                   test: c => c.streak >= 14 },
  { id:"habit-locked",    label:"🧠 Habit Locked",      desc:"21-day streak. Neurologically, it's a habit now.", test: c => c.streak >= 21 },
  { id:"locked-in",       label:"💪 Locked In",         desc:"30-day streak.",                                   test: c => c.streak >= 30 },
  { id:"45-days",         label:"⚡ 45 Days Strong",    desc:"45-day streak.",                                   test: c => c.streak >= 45 },
  { id:"two-months",      label:"📆 Two Months",        desc:"60-day streak.",                                   test: c => c.streak >= 60 },
  { id:"75-complete",     label:"🏆 75 Complete",       desc:"75-day streak.",                                   test: c => c.streak >= 75 },
  { id:"perfect-week",    label:"🌟 Perfect Week",      desc:"Log every single day for 7 days straight.",        test: c => c.loggedLast7 >= 7 },
  { id:"halfway",         label:"🌊 Halfway",           desc:"Complete all habits on the halfway day.",          test: c => c.pctDone >= 50 && c.complete },
  { id:"challenge-done",  label:"✅ Challenge Done",    desc:"Finish the entire challenge.",                     test: c => c.pctDone >= 99 && c.complete },
  { id:"boss-energy",     label:"👑 Boss Energy",       desc:"Complete a Boss Day.",                             test: c => c.anyBoss },
  { id:"boss-week",       label:"👑 Boss Week",         desc:"3+ Boss Days in one week.",                       test: c => c.bossWeek },
  { id:"first-points",    label:"⭐ First Points",      desc:"Earn your first 10 points.",                       test: c => c.totalPts >= 10 },
  { id:"century",         label:"💯 Century",           desc:"Earn 100 points in this challenge.",               test: c => c.totalPts >= 100 },
  { id:"point-collector", label:"🏅 Point Collector",   desc:"Earn 250 points.",                                 test: c => c.totalPts >= 250 },
  { id:"high-scorer",     label:"🏆 High Scorer",       desc:"Earn 500 points.",                                 test: c => c.totalPts >= 500 },
  { id:"elite",           label:"💜 Elite",             desc:"Earn 750 points. Rare.",                           test: c => c.totalPts >= 750 },
  { id:"comeback-kid",    label:"🧡 Comeback Kid",      desc:"Use the Save My Day recovery on a hard day.",      test: c => c.anyRecovered },
  { id:"minimum-warrior", label:"⚡ Minimum Warrior",   desc:"Use Minimum Day mode 5 times.",                    test: c => c.minimumCompleted >= 5 },
  { id:"first-run",       label:"👟 First Run",         desc:"Log your first run session.",                      test: c => c.runsLogged >= 1 },
  { id:"five-runs",       label:"🏃 Five Runs",         desc:"Log 5 run sessions.",                              test: c => c.runsLogged >= 5 },
  { id:"ten-runs",        label:"🔟 Ten Runs",          desc:"Log 10 run sessions.",                             test: c => c.runsLogged >= 10 },
  { id:"twenty-runs",     label:"🏃 20 Runs",           desc:"Log 20 run sessions.",                             test: c => c.runsLogged >= 20 },
  { id:"5k-done",         label:"🏅 5k Done",           desc:"Run at least 5 km in a single session.",           test: c => c.hasRun5k },
  { id:"beyond-5k",       label:"🔥 Beyond 5k",         desc:"Run further than 5 km.",                           test: c => c.hasRun5kPlus },
  { id:"on-the-scale",    label:"⚖️ On The Scale",      desc:"Log your first body check-in.",                   test: c => c.totalWeighIns >= 1 },
  { id:"first-pound",     label:"📉 First Pound",       desc:"Lose at least 1 lb from your start weight.",       test: c => c.weightLost >= 1 },
  { id:"5lbs-down",       label:"📉 5 lbs Down",        desc:"Lose 5 lbs from your start weight.",               test: c => c.weightLost >= 5 },
  { id:"10lbs-down",      label:"💪 10 lbs Down",       desc:"Lose 10 lbs from your start weight.",              test: c => c.weightLost >= 10 },
  { id:"15lbs-down",      label:"🔥 15 lbs Down",       desc:"Lose 15 lbs. Seriously impressive.",               test: c => c.weightLost >= 15 },
  { id:"goal-reached",    label:"🎯 Goal Reached",      desc:"Hit your goal weight.",                            test: c => c.weightGoalReached },
  { id:"downward-trend",  label:"📈 Downward Trend",    desc:"5 consecutive weigh-ins trending down.",           test: c => c.downwardTrend >= 5 },
  { id:"week-1-done",     label:"📅 Week 1 Done",       desc:"Complete your first full week (hit the goal).",    test: c => c.completedWeeks >= 1 },
  { id:"week-3-done",     label:"📅 3 Weeks Done",      desc:"Complete 3 full weeks.",                           test: c => c.completedWeeks >= 3 },
  { id:"week-5-done",     label:"📆 5 Weeks Done",      desc:"Complete 5 full weeks.",                           test: c => c.completedWeeks >= 5 },
  { id:"week-8-done",     label:"📆 8 Weeks Done",      desc:"Complete 8 full weeks — two months.",              test: c => c.completedWeeks >= 8 },
  { id:"sober-week",      label:"🚫 Sober Week",        desc:"7-day alcohol-free streak.",                       test: c => c.soberStreak >= 7 },
  { id:"sober-month",     label:"💎 Sober Month",       desc:"30-day alcohol-free streak.",                      test: c => c.soberStreak >= 30 },
  { id:"data-driven",     label:"📊 Data Driven",       desc:"Log your weight 7 days in a row.",                 test: c => c.weighInStreak >= 7 },
  // Cold Exposure
  { id:"first-plunge",    label:"🧊 First Plunge",      desc:"Log your first cold shower.",                      test: c => c.coldShowersLogged >= 1 },
  { id:"cold-warrior",    label:"❄️ Cold Warrior",      desc:"7-day cold shower streak. Your body's adapting.",  test: c => c.coldShowerStreak >= 7 },
  { id:"ice-bath",        label:"🏔️ Ice Bath",           desc:"Complete a full cold plunge on Boss Day.",         test: c => c.hasColdPlunge },
  // Meditation
  { id:"first-sit",       label:"🧘 First Sit",          desc:"Log your first meditation session.",               test: c => c.meditationLogged >= 1 },
  { id:"inner-peace",     label:"🌿 Inner Peace",        desc:"7-day meditation streak.",                         test: c => c.meditationStreak >= 7 },
  // Strength
  { id:"first-rep",       label:"🏋️ First Rep",          desc:"Log your first lift session.",                     test: c => c.hasLifted },
  { id:"gym-rat",         label:"💪 Gym Rat",            desc:"Log 20 lift sessions.",                            test: c => c.liftsLogged >= 20 },
  { id:"pr-hunter",       label:"⚡ PR Hunter",           desc:"Hit a personal record on Boss Day.",               test: c => c.hasPR },
  // Sleep
  { id:"lights-out",      label:"😴 Lights Out",         desc:"Complete your first sleep habit.",                 test: c => c.sleepHabitsLogged >= 1 },
  { id:"deep-sleeper",    label:"🌙 Deep Sleeper",       desc:"7-day sleep streak. Your body thanks you.",        test: c => c.sleepStreak >= 7 },
];

const GLOBAL_BADGES = [
  { id:"g-first-challenge",  label:"🚀 First Challenge",  desc:"Complete your first challenge.",              test: g => g.completedChallenges >= 1 },
  { id:"g-triple-threat",    label:"🏆 Triple Threat",    desc:"Complete 3 challenges.",                      test: g => g.completedChallenges >= 3 },
  { id:"g-multi-tasker",     label:"🔀 Multi-Tasker",     desc:"Run 2 challenges at the same time.",          test: g => g.activeChallenges >= 2 },
];

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
let justCompletedId = null;
let reminderTimeout = null;
let onboardingStep = null;   // null = done, 0-3 = active step
let bodyHistoryLimit = 5;    // how many history rows to show in Body tab
let _lastViewKey = "";       // for scroll-to-top on navigation changes
let _animHabitId = null;     // habit that just got checked (for pop animation)

function defaultBuilderForm() {
  return {
    templateId: null,
    name: "",
    emoji: "🎯",
    startDate: todayKey(),
    endDate: addDays(todayKey(), 29),
    mode: "soft",
    weeklyGoal: 100,
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
    mode:      ["minimum","standard","boss","rest"].includes(raw.mode) ? raw.mode : "standard",
    done:      Array.isArray(raw.done) ? raw.done : [],
    recovered: raw.recovered === true,
    pts:       typeof raw.pts === "number" ? raw.pts : 0,
    tiers:     (raw.tiers && typeof raw.tiers === "object") ? raw.tiers : {},
    note:      typeof raw.note === "string" ? raw.note : "",
  };
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
    habits:     Array.isArray(raw.habits) ? raw.habits : [],
    days,
    badges:      Array.isArray(raw.badges) ? raw.badges : [],
    createdAt:   raw.createdAt || todayKey(),
    pausedOn:    raw.pausedOn    || null,
    pausedDays:  typeof raw.pausedDays === "number" ? raw.pausedDays : 0,
    finalStreak: raw.finalStreak ?? null,
    totalPts:    typeof raw.totalPts === "number" ? raw.totalPts : 0,
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
  // Build the challenge
  const template = TEMPLATES.find(t => t.id === "cruise-control");
  const c = normalizeChallenge({
    id: "cruise-migrated",
    name: "Cruise Control",
    emoji: "🚢",
    description: "Your original 86-day transformation challenge.",
    templateId: "cruise-control",
    startDate: "2026-06-01",
    endDate: "2026-08-25",
    mode: "soft",
    status: "active",
    weeklyGoal: 175,
    habits: template ? template.habits : [],
    days: newDays,
    badges: Array.isArray(old.badges) ? old.badges : [],
    createdAt: "2026-06-01",
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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

function getChallengeDay(challenge, key = todayKey()) {
  if (!challenge.days[key]) {
    challenge.days[key] = { mode:"standard", done:[], recovered:false, pts:0, tiers:{} };
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

function updateDayPoints(challenge, day) {
  const info = completionInfo(challenge, day);
  day.pts = info.points;
}

function dayLogged(day) {
  return day && (day.done.length > 0 || day.recovered || day.mode === "rest");
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
      if (!justCompletedId) justCompletedId = c.id;
      changed = true;
    }
  }
  if (changed) saveState();
}

// ── Badge Checks ───────────────────────────────────────────────────────────

function checkBadges(challenge) {
  const today = todayKey();
  const day   = getChallengeDay(challenge);
  const info  = completionInfo(challenge, day);
  const allDays = Object.values(challenge.days);
  const streak  = calcChallengeStreak(challenge);
  const totalPts = allDays.reduce((s,d) => s+(d.pts||0), 0);
  const totalDays = diffDays(challenge.startDate, challenge.endDate) + 1;
  const dayNumber = challengeDayNumber(challenge);
  const pctDone   = Math.round((dayNumber / totalDays) * 100);

  // Template-agnostic habit detection
  // Run habits: tiered with a 1 km tier (matches "run", "rn-run"; excludes cycling, walking, dog walk)
  const _runIds  = challenge.habits.filter(h =>
    h.type==="tiered" && h.tiers?.some(t => Number(t.value)===1 && /\bkm\b/i.test(t.label))
  ).map(h=>h.id);
  // Sober habits: habits whose ID or title mentions alcohol
  const _soberIds = challenge.habits.filter(h =>
    h.id==="noalcohol" || h.id==="noalc" || /alcohol/i.test(h.title)
  ).map(h=>h.id);
  // Weigh-in habits: habits whose ID or title mentions weigh
  const _weighIds = challenge.habits.filter(h =>
    h.id==="weighin" || /weigh/i.test(h.title)
  ).map(h=>h.id);
  // Cold shower habits
  const _coldIds = challenge.habits.filter(h =>
    h.id==="ce-cold" || /cold shower/i.test(h.title)
  ).map(h=>h.id);
  const _coldBossIds = challenge.habits.filter(h =>
    h.id==="ce-full" || (h.boss_only && /cold/i.test(h.title))
  ).map(h=>h.id);
  // Meditation habits
  const _meditationIds = challenge.habits.filter(h =>
    h.id==="med-sit" || /meditat/i.test(h.title)
  ).map(h=>h.id);
  // Lift/strength habits
  const _liftIds = challenge.habits.filter(h =>
    h.id==="st-lift" || /lift session/i.test(h.title)
  ).map(h=>h.id);
  const _prIds = challenge.habits.filter(h =>
    h.id==="st-pr" || (h.boss_only && /personal record/i.test(h.title))
  ).map(h=>h.id);
  // Sleep habits (matches "8+ hours sleep", "7+ hours sleep", "Sleep 7+ hours")
  const _sleepIds = challenge.habits.filter(h =>
    h.id==="sl-hours" || /\d\+.{0,8}sleep|sleep.{0,8}\d\+/i.test(h.title)
  ).map(h=>h.id);

  const ctx = {
    dayNumber, pctDone, streak, totalPts,
    complete:         info.done === info.total && info.total > 0,
    anyBoss:          allDays.some(d => d.mode==="boss" && d.done.length),
    bossWeek:         lastNDays(7).filter(k => challenge.days[k]?.mode==="boss" && challenge.days[k]?.done.length).length >= 3,
    anyRecovered:     allDays.some(d => d.recovered),
    minimumCompleted: allDays.filter(d => d.mode==="minimum" && d.done.length > 0).length,
    loggedLast7:      lastNDays(7).filter(k => { const d=challenge.days[k]; return d&&(d.done.length||d.recovered); }).length,
    runsLogged:       _runIds.length ? allDays.filter(d => _runIds.some(id => d.done.includes(id))).length : 0,
    hasRun5k:         _runIds.length ? allDays.some(d => _runIds.some(id => { const v=d.tiers?.[id]; return v==="5+"||Number(v)>=5; })) : false,
    hasRun5kPlus:     _runIds.length ? allDays.some(d => _runIds.some(id => d.tiers?.[id]==="5+" || Number(d.tiers?.[id])>5)) : false,
    soberStreak:      _soberIds.length ? Math.max(0,..._soberIds.map(id=>habitStreakCount(challenge,id))) : 0,
    weighInStreak:    _weighIds.length ? Math.max(0,..._weighIds.map(id=>habitStreakCount(challenge,id))) : state.bodyTracking.entries.length,
    totalWeighIns:    state.bodyTracking.entries.length,
    weightLost:       (() => {
      const sw = state.bodyTracking.startWeight;
      const entries = state.bodyTracking.entries;
      if (!sw || !entries.length) return 0;
      return Math.max(0, sw - entries[entries.length-1].weight);
    })(),
    weightGoalReached: (() => {
      const gw = state.bodyTracking.goalWeight;
      const entries = state.bodyTracking.entries;
      if (!gw || !entries.length) return false;
      return entries[entries.length-1].weight <= gw;
    })(),
    downwardTrend: (() => {
      let n=0;
      const e = state.bodyTracking.entries;
      for (let i=e.length-1;i>0;i--) { if(e[i].weight<e[i-1].weight) n++; else break; }
      return n;
    })(),
    completedWeeks: (() => {
      return challengeWeeks(challenge).filter(w => {
        const lastDay = w.allDays[w.allDays.length-1];
        if (!lastDay || lastDay >= today) return false;
        return w.allDays.length > 0 && w.allDays.every(k => {
          const d = challenge.days[k]; return d && (d.done.length || d.recovered);
        });
      }).length;
    })(),
    coldShowersLogged: _coldIds.length ? allDays.filter(d=>_coldIds.some(id=>d.done.includes(id))).length : 0,
    coldShowerStreak:  _coldIds.length ? Math.max(0,..._coldIds.map(id=>habitStreakCount(challenge,id))) : 0,
    hasColdPlunge:     _coldBossIds.length ? allDays.some(d=>_coldBossIds.some(id=>d.done.includes(id))) : false,
    meditationLogged:  _meditationIds.length ? allDays.filter(d=>_meditationIds.some(id=>d.done.includes(id))).length : 0,
    meditationStreak:  _meditationIds.length ? Math.max(0,..._meditationIds.map(id=>habitStreakCount(challenge,id))) : 0,
    hasLifted:         _liftIds.length ? allDays.some(d=>_liftIds.some(id=>d.done.includes(id))) : false,
    liftsLogged:       _liftIds.length ? allDays.filter(d=>_liftIds.some(id=>d.done.includes(id))).length : 0,
    hasPR:             _prIds.length ? allDays.some(d=>_prIds.some(id=>d.done.includes(id))) : false,
    sleepHabitsLogged: _sleepIds.length ? allDays.filter(d=>_sleepIds.some(id=>d.done.includes(id))).length : 0,
    sleepStreak:       _sleepIds.length ? Math.max(0,..._sleepIds.map(id=>habitStreakCount(challenge,id))) : 0,
  };

  let earned = false;
  CHALLENGE_BADGES.forEach(b => {
    if (!challenge.badges.includes(b.id) && b.test(ctx)) {
      challenge.badges.push(b.id);
      showToast(`${b.label} earned!`);
      earned = true;
      if (b.id === "challenge-done" && !justCompletedId) {
        challenge.finalStreak = calcChallengeStreak(challenge);
        challenge.status = "completed";
        justCompletedId = challenge.id;
      }
    }
  });

  // Global badges
  const gCtx = {
    completedChallenges: Object.values(state.challenges).filter(c=>c.status==="completed").length,
    activeChallenges: getActiveChallenges().length,
    longestStreak: Math.max(0, ...Object.values(state.challenges).map(c => calcChallengeStreak(c))),
  };
  GLOBAL_BADGES.forEach(b => {
    if (!state.globalBadges.includes(b.id) && b.test(gCtx)) {
      state.globalBadges.push(b.id);
      showToast(`${b.label} earned!`);
      earned = true;
    }
  });

  if (earned) saveState();
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

// ── Render Core ────────────────────────────────────────────────────────────

function render() {
  // Persist note before DOM replacement — prevents content loss when tapping habits mid-typing
  const _noteEl = document.getElementById("day-note");
  if (_noteEl) {
    const _nc = currentChallenge();
    if (_nc) { const _nd = getChallengeDay(_nc); if (_nd.note !== _noteEl.value) { _nd.note = _noteEl.value; saveState(); } }
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
  app.innerHTML = html;
  bindEvents();
  requestAnimationFrame(() => { updateRingVisuals(); _animHabitId = null; });
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
  const day  = getChallengeDay(challenge);
  const info = completionInfo(challenge, day);
  const today = todayKey();
  const totalDays  = diffDays(challenge.startDate, challenge.endDate)+1;
  const dayNumber  = challengeDayNumber(challenge);
  const daysLeft   = Math.max(0, diffDays(today, challenge.endDate));
  const journeyPct = clamp(Math.round((dayNumber/totalDays)*100), 0, 100);
  const streak     = calcChallengeStreak(challenge);

  return `
  <main>
    ${active.length > 1 ? renderChallengePills(active) : ""}
    ${renderWeeklyRecap(challenge)}
    <section class="hero">
      <div class="day-label">${challenge.emoji} ${challenge.name}</div>
      <div class="day-count">Day ${dayNumber} <span style="font-weight:300;font-size:0.55em;color:var(--text-dim)">of ${totalDays}</span></div>
      <div class="subtitle">${daysLeft > 0 ? daysLeft+" days remaining" : "Final day!"} · ${challenge.mode} mode</div>
      <div class="greeting">${currentGreeting()}</div>
      <div class="journey-track"><div class="journey-fill" style="width:${journeyPct}%"></div></div>
    </section>

    <section class="today-stage panel">
      ${renderRing(info, day, streak, challenge)}
      ${renderWeightWidget()}
      ${renderTodayWeightLog()}
      ${renderCompleteBanner(day, info, challenge)}
      ${info.done===0 ? `<p class="empty-copy">Nothing logged yet. What's first?</p>` : ""}
    </section>

    <section>
      <div class="section-head">
        <div class="section-label" style="margin:0">Daily Mode</div>
      </div>
      ${renderModeSelector(day)}
    </section>

    ${renderWeeklyGoalBar(challenge)}

    <section>
      <div class="section-head">
        <div class="section-label" style="margin:0">Habits</div>
        <div style="font-size:12px;font-weight:300;color:var(--text-dim)">${info.done} / ${info.total}</div>
      </div>
      <div class="habit-list">
        ${challenge.habits.map(h => renderHabit(h, day, challenge)).join("")}
      </div>
      ${(!day.recovered && info.done < info.total) ? `<button class="link-btn rough-day-link" data-open-sheet>Having a rough day?</button>` : ""}
    </section>
    ${renderDayNote(day)}
    ${renderPastNotes(challenge)}
  </main>
  ${renderSaveDayButton(day, info)}`;
}

function renderChallengePills(active) {
  return `
  <div class="challenge-pills">
    ${active.map(c => {
      const d = getChallengeDay(c);
      const info = completionInfo(c, d);
      return `<button class="c-pill ${c.id===todayChallengeId?"active":""}" data-today-challenge="${c.id}">
        ${c.emoji} ${c.name} <span class="c-pill-pct">${info.percent}%</span>
      </button>`;
    }).join("")}
  </div>`;
}

function renderNoChallenge() {
  const today = todayKey();
  const hasPast = Object.values(state.challenges).some(c => c.status !== "active");
  const upcoming = Object.values(state.challenges).filter(c => c.status === "active" && c.startDate > today);
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
    <p class="welcome-sub">${upcoming.length ? "Your next challenge starts soon." : hasPast ? "All challenges complete. Start a new one." : "Build the habits. Win the challenge."}</p>
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
    ${hasPast || upcoming.length ? "" : `<p class="welcome-hint">Choose from templates or build your own</p>`}
  </main>`;
}

function renderRing(info, day, streak, challenge) {
  const challengePts = challenge ? (challenge.totalPts || 0) : 0;
  const gracePip = challenge && graceUsedYesterday(challenge);
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
        : `<div class="percent">${info.percent}%</div><div class="ring-pts">${info.points}<span class="ring-pts-max">/${info.maxPoints}</span><span class="ring-pts-label"> pts</span></div>`
      }
    </div>
  </div>
  <div class="ring-stats">
    <div class="ring-stat">
      <div class="ring-stat-value">${info.done}<span class="ring-stat-sub">/${info.total}</span></div>
      <div class="ring-stat-label">habits</div>
    </div>
    <div class="ring-stat-sep"></div>
    <div class="ring-stat">
      <div class="ring-stat-value">${challengePts}${day.mode==="boss"?`<span class="boss-badge">×1.5</span>`:""}</div>
      <div class="ring-stat-label">challenge pts</div>
    </div>
    <div class="ring-stat-sep"></div>
    <div class="ring-stat">
      <div class="ring-stat-value">${streak}${gracePip?`<span style="font-size:10px;color:#ffcc44;margin-left:2px" title="Grace day used yesterday — don't miss today!">🛟</span>`:""}</div>
      <div class="ring-stat-label">day streak${gracePip?`<span style="display:block;font-size:9px;color:#ffcc44">grace used</span>`:""}</div>
    </div>
  </div>`;
}

function renderModeSelector(day) {
  const modeDesc = {
    minimum:  "Locks non-essential habits. Streak stays safe.",
    standard: "All habits available. Normal day.",
    boss:     "Every habit unlocked. Points × 1.5. Go all out.",
    rest:     "Planned rest day. No habits required. Streak preserved.",
  };
  return `
  <div class="mode-selector">${[["minimum","Minimum"],["standard","Standard"],["boss","Boss Day"],["rest","Rest Day"]].map(([id,label]) =>
    `<button class="mode-button ${id==="rest"?"rest-mode-btn":""} ${day.mode===id?"active":""}" data-mode="${id}">${label}</button>`).join("")}</div>
  <p class="mode-desc">${modeDesc[day.mode]||""}</p>`;
}

function renderHabit(habit, day, challenge) {
  if (habit.type === "tiered") return renderTieredHabit(habit, day, challenge);
  const locked  = day.mode==="rest" || (day.mode==="minimum" && !habit.minimum_day) || (day.mode!=="boss" && habit.boss_only);
  const checked = day.done.includes(habit.id);
  const popping = _animHabitId === habit.id;
  return `
  <button class="habit-card ${checked?"checked":""} ${locked?"locked":""} ${popping?"habit-pop":""}" data-habit="${habit.id}" ${locked?`aria-disabled="true"`:""}>
    <span class="accent"></span>
    <span class="habit-emoji">${locked?"🔒":habit.emoji}</span>
    <span class="habit-info">
      <span class="habit-title">${habit.title}${habit.boss_only?`<span class="boss-pip">👑</span>`:""}</span>
      <span class="habit-quip">${locked?(day.mode==="rest"?"Rest Day — recover well.":day.mode==="minimum"?"Minimum Day — locked.":"Switch to Boss Day."):habit.quip}</span>
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
      <span class="habit-title">${habit.title}</span>
      <span class="habit-quip">${day.mode==="rest"?"Rest Day — recover well.":day.mode==="minimum"?"Minimum Day — locked.":"Switch to Boss Day."}</span>
    </span>
    <span class="check-circle"></span>
  </div>`;
  const popping = _animHabitId === habit.id;
  return `
  <div class="habit-card run-habit ${checked?"checked":""} ${popping?"habit-pop":""}">
    <span class="accent" style="${habit.boss_only?"background:linear-gradient(135deg,#ffcc44,#ff9500)":""}"></span>
    <span class="habit-emoji">${habit.emoji}</span>
    <div class="run-body">
      <span class="habit-title">${habit.title}${habit.boss_only?`<span class="boss-pip">👑</span>`:""}</span>
      <div class="run-distances">
        ${habit.tiers.map(t => `<button class="run-dist ${String(selVal)===String(t.value)?"active":""}" data-tier="${habit.id}" data-tier-val="${t.value}">${t.label}</button>`).join("")}
      </div>
    </div>
    <span class="check-circle">${checked && selVal != null ? (tierPoints(habit,selVal)+"pts") : checked ? "✓" : ""}</span>
  </div>`;
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

function renderCompleteBanner(day, info, challenge) {
  if (info.done!==info.total || info.total===0) return "";
  const hasNote = !!(day.note?.trim());
  const noteNudge = hasNote ? "" : `<button class="cb-note-nudge" onclick="document.getElementById('day-note')?.focus()">✍️ Add today's note</button>`;
  if (day.mode==="rest")    return `<div class="complete-banner rest-complete"><span class="cb-icon">😴</span><div class="cb-body"><div class="cb-title">Rest Day</div><div class="cb-sub">Recover. Come back stronger.</div>${noteNudge}</div></div>`;
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
      <div class="wrc-stat"><span class="wrc-val">${pts}</span><span class="wrc-lbl">pts</span></div>
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
  const cat = TEMPLATES.find(t => t.id === finishedId)?.category;
  let pool = cat
    ? TEMPLATES.filter(t => t.id !== finishedId && t.category === cat)
    : TEMPLATES.filter(t => t.id !== finishedId);
  if (pool.length < 2) pool = TEMPLATES.filter(t => t.id !== finishedId);
  return pickRandom(pool, 2);
}

function renderCompletionSuggestions(c) {
  const sugs = suggestNextChallenges(c);
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

function renderSaveDayButton(day, info) {
  if (info.done>=info.total || day.recovered || activeTab!=="today" || builderOpen) return "";
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
  const totalDays   = diffDays(c.startDate, c.endDate) + 1;
  const totalPts    = Object.values(c.days).reduce((s,d) => s+(d.pts||0), 0);
  const finalStreak = c.finalStreak ?? calcChallengeStreak(c);
  const canShare    = !!navigator.share || !!navigator.clipboard;
  return `
  <div class="sheet-backdrop" data-close-completion>
    <section class="sheet completion-modal" role="dialog">
      <div class="completion-emoji">${c.emoji}</div>
      <div class="completion-title">Challenge Complete!</div>
      <div class="completion-name">${c.name}</div>
      <div class="completion-sub">${totalDays} days · ${totalPts} pts · ${finalStreak}-day streak.<br>That's what commitment looks like.</div>
      <button class="primary-button" data-close-completion style="margin-top:20px">Hell yeah! 🎉</button>
      ${canShare ? `<button class="secondary-button" data-share-completion style="margin-top:8px">🔗 Share your achievement</button>` : ""}
      <button class="secondary-button" data-completion-new-challenge style="margin-top:8px">Start next challenge →</button>
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
  const today = todayKey();
  const totalDays = diffDays(c.startDate, c.endDate)+1;
  const dayNumber = challengeDayNumber(c);
  const pct = clamp(Math.round((dayNumber/totalDays)*100), 0, 100);
  // Use stored finalStreak for finished challenges so it stays accurate
  const streak = (c.status==="completed"||c.status==="failed") && c.finalStreak!=null
    ? c.finalStreak : calcChallengeStreak(c);
  const day = c.days[today];
  const todayInfo = day ? completionInfo(c, day) : null;
  const statusColor = c.status==="completed"?"var(--success)":c.status==="failed"?"var(--secondary)":c.status==="paused"?"var(--text-dim)":"";
  return `
  <button class="challenge-card" data-view-challenge="${c.id}">
    <div class="cc-top">
      <div class="cc-emoji">${c.emoji}</div>
      <div class="cc-info">
        <div class="cc-name">${c.name}</div>
        <div class="cc-meta">${totalDays}d · ${c.mode} · Day ${dayNumber}</div>
      </div>
      <div class="cc-right">
        ${c.status!=="active"?`<div class="cc-status" style="color:${statusColor}">${c.status==="paused"?"⏸ paused":c.status}</div>`
          :`<div class="cc-today">${todayInfo?todayInfo.percent+"%":"—"}</div>`}
        <div class="cc-streak">🔥 ${streak}</div>
      </div>
    </div>
    <div class="cc-track">
      <div class="cc-fill" style="width:${pct}%"></div>
    </div>
    <div class="cc-sub">${pct}% complete · ${c.badges.length} badges</div>
  </button>`;
}

// ── Challenge Detail ──────────────────────────────────────────────────────

function renderChallengeDetail(c) {
  if (!c) return `<main><div class="empty-state">Challenge not found.</div></main>`;
  const today = todayKey();
  const weeks = challengeWeeks(c);
  const totalDays = diffDays(c.startDate, c.endDate)+1;
  const dayNumber = challengeDayNumber(c);
  const pct = clamp(Math.round((dayNumber/totalDays)*100), 0, 100);
  const streak = calcChallengeStreak(c);
  const totalPts = Object.values(c.days).reduce((s,d)=>s+(d.pts||0),0);
  const curWeekIdx = weeks.findIndex(w=>w.allDays.includes(today));
  return `
  <main>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
      <button class="icon-btn" data-close-detail>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
      </button>
      <div>
        <div style="font-size:18px;font-weight:700">${c.emoji} ${c.name}</div>
        <div style="font-size:12px;color:var(--text-dim)">${c.startDate} → ${c.endDate}</div>
      </div>
    </div>
    <div class="stats-grid" style="margin-bottom:14px">
      ${statCard("🔥 Streak",    streak,    "days")}
      ${statCard("⭐ Total pts", totalPts,  "")}
      ${statCard("📅 Progress",  pct+"%",   "")}
      ${statCard("🏅 Badges",   c.badges.length,"")}
    </div>
    <div class="section-label">All Weeks</div>
    <div class="week-history">
      ${weeks.map((w,i)=>renderWeekCard(c,w,i===curWeekIdx)).join("")}
    </div>
    <div class="section-label">Habits</div>
    <div class="habit-preview-list" style="margin-bottom:14px">
      ${c.habits.map(h => {
        const allDays = Object.values(c.days);
        // Only count days where this habit was available (not locked by mode/boss)
        const available = allDays.filter(d => {
          if (d.mode === "minimum" && !h.minimum_day) return false;
          if (h.boss_only && d.mode !== "boss") return false;
          return d.done.length > 0 || d.recovered; // only count logged days
        });
        const done = available.filter(d => d.done.includes(h.id)).length;
        const pct  = available.length ? Math.round((done / available.length) * 100) : null;
        const color = pct == null ? "var(--text-faint)" : pct >= 80 ? "var(--success)" : pct >= 50 ? "#f5a623" : "var(--secondary)";
        return `<div class="habit-preview-item">
          <span>${h.emoji} ${h.title}${h.boss_only ? ` <span style="font-size:10px;opacity:.6">👑</span>` : ""}</span>
          ${pct != null ? `<span class="hpi-rate" style="color:${color}">${pct}%</span>` : ""}
        </div>`;
      }).join("")}
    </div>
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
      <button class="primary-button" data-save-edit>Save Changes ✓</button>
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
    </div>
    <div class="wc-goal-track"><div class="wc-goal-fill ${hitGoal?"wc-goal-done":""}" style="width:${goalPct}%"></div></div>
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
  ];
  const templateCard = t => `
    <button class="template-card" data-select-template="${t.id}">
      <div class="tc-emoji">${t.emoji}</div>
      <div class="tc-name">${t.name}</div>
      <div class="tc-meta">${t.duration} days · ${t.defaultMode}</div>
      <div class="tc-desc">${t.description}</div>
    </button>`;
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
    <label class="field" style="margin-bottom:16px">
      Weekly point goal
      <input id="bf-goal" type="number" value="${builderForm.weeklyGoal}" min="10" max="500">
    </label>
    <div class="section-label" style="margin:0 0 8px">Habits (${template?template.habits.length:builderForm.habits.length})</div>
    ${template ? `
      <div class="habit-preview-list">
        ${template.habits.map(h=>`<div class="habit-preview-item">${h.emoji} ${h.title}</div>`).join("")}
      </div>` : `
      <div class="custom-habits-list">
        ${builderForm.habits.map((h,i)=>`
          <div class="custom-habit-row">
            <span class="custom-habit-emoji">${h.emoji}</span>
            <span class="custom-habit-name">${h.title}</span>
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
  const allChallenges = getAllChallenges();
  // Only count challenges that have at least one logged day (not empty shells or deleted)
  const activeChallenges = allChallenges.filter(c => Object.keys(c.days).length > 0 || c.badges.length > 0);
  const total  = GLOBAL_BADGES.length + CHALLENGE_BADGES.length * activeChallenges.length;
  const earned = state.globalBadges.length + allChallenges.reduce((s,c) => s+c.badges.length, 0);
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
      ${renderBadgeCat("🌍 Global", GLOBAL_BADGES, state.globalBadges)}
      ${allChallenges.map(c=>renderBadgeCat(`${c.emoji} ${c.name}`, CHALLENGE_BADGES, c.badges)).join("")}
    </div>
    ${renderPersonalBests()}
  </main>`;
}

function renderBadgeCat(label, defs, earned) {
  const earnedSet = new Set(earned);
  const count = defs.filter(b=>earnedSet.has(b.id)).length;
  return `
  <div class="badge-cat">
    <div class="badge-cat-header">
      <span class="badge-cat-name">${label}</span>
      <span class="badge-cat-count">${count} / ${defs.length}</span>
    </div>
    <div class="badge-grid">
      ${defs.map(b=>`
      <div class="badge ${earnedSet.has(b.id)?"earned":""}">
        <div class="badge-label">${b.label}</div>
        ${b.desc?`<div class="badge-desc">${b.desc}</div>`:""}
      </div>`).join("")}
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
      <button class="primary-button" data-ob-next style="margin-top:16px">${isLast?"Let's go! 🚀":"Next →"}</button>
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
  on("[data-tab]",          el => { activeTab=el.dataset.tab; builderOpen=false; settingsOpen=false; viewChallengeId=null; editChallengeId=null; editForm=null; sheetOpen=false; bodyHistoryLimit=5; render(); });
  on("[data-mode]",         el => setMode(el.dataset.mode));
  on("[data-habit]",        el => toggleHabit(el.dataset.habit));
  on("[data-tier]",         el => selectTier(el.dataset.tier, el.dataset.tierVal));
  on("[data-chart]",        el => { activeChartTab=el.dataset.chart; render(); });
  on("[data-today-challenge]", el => { todayChallengeId=el.dataset.todayChallenge; render(); });
  on("[data-open-builder]", () => { builderOpen=true; builderStep="template"; builderForm=defaultBuilderForm(); render(); });
  on("[data-close-builder]",() => { builderOpen=false; render(); });
  on("[data-open-settings]",() => { settingsOpen=true; render(); });
  on("[data-close-settings]",()=>{ settingsOpen=false; render(); });
  on("[data-view-challenge]",el=>{ viewChallengeId=el.dataset.viewChallenge; render(); });
  on("[data-close-detail]", () => { viewChallengeId=null; render(); });
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
  on("[data-builder-back]", () => { builderStep="template"; render(); });
  on("[data-start-challenge]",() => startChallenge());
  on("[data-add-habit]",    () => { saveBuilderFormFromDOM(); addCustomHabit(); });
  on("[data-remove-habit]", el => { saveBuilderFormFromDOM(); removeCustomHabit(Number(el.dataset.removeHabit)); });
  on("[data-close-completion]",       (el,e) => { if(e.target.closest("[data-close-completion]")){ justCompletedId=null; render(); }});
  on("[data-completion-new-challenge]",     () => { justCompletedId=null; builderOpen=true; builderStep="template"; builderForm=defaultBuilderForm(); render(); });
  on("[data-share-completion]", () => {
    const c = justCompletedId ? getChallenge(justCompletedId) : null; if (!c) return;
    const totalDays = diffDays(c.startDate, c.endDate) + 1;
    const totalPts  = Object.values(c.days).reduce((s,d) => s+(d.pts||0), 0);
    const streak    = c.finalStreak ?? calcChallengeStreak(c);
    shareAchievement(`I just completed the ${c.name} challenge on Conqur! 🏆\n${totalDays} days · ${totalPts} pts · ${streak}-day streak.\nBuilding habits that stick. 💪`);
  });
  on("[data-log-today-weight]", () => logTodayWeight());
  on("[data-edit-challenge]", el => {
    const c = getChallenge(el.dataset.editChallenge); if (!c) return;
    editForm = { mode: c.mode };  // snapshot — so Cancel truly reverts
    editChallengeId = el.dataset.editChallenge;
    viewChallengeId = null;
    render();
  });
  on("[data-close-edit]",    () => { viewChallengeId=editChallengeId; editChallengeId=null; editForm=null; render(); });
  on("[data-ec-mode]",       el => { if (editForm) { editForm.mode=el.dataset.ecMode; render(); } });
  on("[data-save-edit]",         () => saveEditChallenge());
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
  const importInput = document.getElementById("import-file-input");
  if (importInput) {
    importInput.addEventListener("change", e => {
      const file = e.target.files?.[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const parsed = JSON.parse(ev.target.result);
          const normalized = normalizeState(parsed);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
          showToast("Backup restored! Reloading…");
          setTimeout(() => window.location.reload(), 1200);
        } catch(err) {
          showToast("Invalid backup file — couldn't restore.");
        }
      };
      reader.readAsText(file);
    });
  }
  on("[data-ob-next]",         () => {
    onboardingStep++;
    const step = ONBOARDING_STEPS[onboardingStep];
    if (step?.tab) activeTab = step.tab;
    if (onboardingStep >= ONBOARDING_STEPS.length) { onboardingStep = null; activeTab = "today"; }
    render();
  });
  on("[data-ob-skip]",         () => { onboardingStep = null; activeTab = "today"; render(); });
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
    justCompletedId = null;
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
  // Day note: auto-save on blur without re-render
  const noteEl = document.getElementById("day-note");
  if (noteEl) {
    noteEl.addEventListener("blur", saveNote);
    noteEl.addEventListener("input", () => {
      const hint = document.getElementById("day-note-hint");
      if (hint) hint.textContent = `${noteEl.value.length}/500`;
    });
  }
}

function on(sel, fn) {
  document.querySelectorAll(sel).forEach(el => el.addEventListener("click", e => fn(el,e)));
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
  const day = getChallengeDay(c);
  // Warn if switching to a more restrictive mode would uncheck logged habits
  if (mode === "minimum" && day.mode !== "minimum" && day.done.length > 0) {
    const willLose = day.done.filter(id => !c.habits.find(h=>h.id===id)?.minimum_day).length;
    if (willLose > 0 && !confirm(`Switching to Minimum Day will uncheck ${willLose} logged habit${willLose>1?"s":""}. Continue?`)) return;
  }
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
  const day = getChallengeDay(c);
  if (day.mode==="minimum" && !habit.minimum_day) return;
  if (day.mode!=="boss"    &&  habit.boss_only)   return;
  if (day.done.includes(id)) { day.done = day.done.filter(x=>x!==id); _animHabitId = null; }
  else { day.done.push(id); _animHabitId = id; }
  updateDayPoints(c, day);
  saveState(); navigator.vibrate?.(10);
  checkBadges(c); render();
}

function selectTier(habitId, rawVal) {
  const c = currentChallenge(); if (!c) return;
  const habit = c.habits.find(h=>h.id===habitId); if (!habit) return;
  const day = getChallengeDay(c);
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
  const day = getChallengeDay(c);
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
  c.mode       = editForm?.mode || c.mode;   // use editForm snapshot, not a mutated c.mode
  if (goal > 0) c.weeklyGoal = goal;
  saveState();
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
  if (!confirm(`Abandon "${c.name}"? Progress is kept but it will be marked as failed.`)) return;
  c.finalStreak = calcChallengeStreak(c);
  c.status = "failed";
  saveState(); viewChallengeId=null;
  showToast("Challenge abandoned."); render();
}

function deleteChallenge(id) {
  const c = getChallenge(id); if (!c) return;
  if (!confirm(`Delete "${c.name}"? All progress will be permanently removed.`)) return;
  delete state.challenges[id];
  saveState(); viewChallengeId=null;
  showToast("Challenge deleted."); render();
}

function saveNote() {
  const c = currentChallenge(); if (!c) return;
  const day = getChallengeDay(c);
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
  const el = document.createElement("div");
  el.className = "toast"; el.textContent = msg;
  stack.appendChild(el);
  setTimeout(()=>el.remove(), 2500);
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

async function checkForAppUpdate() {
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
  document.addEventListener("visibilitychange",()=>{ if(!document.hidden) { checkForAppUpdate(); scheduleReminder(); } });
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
// Show onboarding for truly new users (no challenges, never migrated)
if (!Object.keys(state.challenges).length && !state.migrations["cruiseModeImport_v1"]) {
  onboardingStep = 0;
}
saveState();
scheduleReminder();
setDynamicIcon();
render();
