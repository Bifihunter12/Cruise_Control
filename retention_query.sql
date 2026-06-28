-- Conqur retention — run in the Supabase SQL editor (Dashboard → SQL Editor → New query).
--
-- Measures real D1 / D7 / D30 retention for signed-in users, computed from the
-- habit-log dates already stored in each user's synced state. No new tracking,
-- no app change — this reads data that already exists.
--
-- "Retained at day N" here means: the user was still logging habits at least N days
-- after their first log. Only users old enough to have had the chance are counted
-- (a user who signed up 3 days ago can't yet count toward D7 or D30).

with logs as (
  -- One row per (user, date) on which they actually logged something.
  select ud.user_id, day_key::date as d
  from user_data ud
  cross join lateral jsonb_each(coalesce(ud.state_json->'challenges', '{}'::jsonb)) as ch(cid, cval)
  cross join lateral jsonb_each(coalesce(cval->'days', '{}'::jsonb)) as dy(day_key, dval)
  where day_key ~ '^\d{4}-\d{2}-\d{2}$'
    and (
      coalesce(jsonb_array_length(dval->'done'), 0) > 0
      or coalesce((dval->>'pts')::numeric, 0) > 0
    )
  group by ud.user_id, day_key
),
span as (
  select
    user_id,
    min(d)            as first_day,
    max(d)            as last_day,
    (max(d) - min(d)) as lifespan_days,   -- how many days between first and last log
    count(*)          as active_days       -- total distinct days they logged
  from logs
  group by user_id
)
select
  count(*)                                                                            as total_users,
  round(avg(active_days), 1)                                                          as avg_active_days,

  count(*) filter (where first_day <= current_date - 1)                               as eligible_d1,
  count(*) filter (where first_day <= current_date - 1  and lifespan_days >= 1)       as retained_d1,
  round(100.0 * count(*) filter (where first_day <= current_date - 1  and lifespan_days >= 1)
        / nullif(count(*) filter (where first_day <= current_date - 1), 0), 1)        as d1_pct,

  count(*) filter (where first_day <= current_date - 7)                               as eligible_d7,
  count(*) filter (where first_day <= current_date - 7  and lifespan_days >= 7)       as retained_d7,
  round(100.0 * count(*) filter (where first_day <= current_date - 7  and lifespan_days >= 7)
        / nullif(count(*) filter (where first_day <= current_date - 7), 0), 1)        as d7_pct,

  count(*) filter (where first_day <= current_date - 30)                              as eligible_d30,
  count(*) filter (where first_day <= current_date - 30 and lifespan_days >= 30)      as retained_d30,
  round(100.0 * count(*) filter (where first_day <= current_date - 30 and lifespan_days >= 30)
        / nullif(count(*) filter (where first_day <= current_date - 30), 0), 1)       as d30_pct
from span;


-- ── Per-user detail (uncomment to see each account's logging span) ───────────────
-- with logs as (
--   select ud.user_id, day_key::date as d
--   from user_data ud
--   cross join lateral jsonb_each(coalesce(ud.state_json->'challenges', '{}'::jsonb)) as ch(cid, cval)
--   cross join lateral jsonb_each(coalesce(cval->'days', '{}'::jsonb)) as dy(day_key, dval)
--   where day_key ~ '^\d{4}-\d{2}-\d{2}$'
--     and (coalesce(jsonb_array_length(dval->'done'), 0) > 0 or coalesce((dval->>'pts')::numeric, 0) > 0)
--   group by ud.user_id, day_key
-- )
-- select user_id, min(d) as first_day, max(d) as last_day,
--        (max(d) - min(d)) as lifespan_days, count(*) as active_days
-- from logs group by user_id order by first_day;
