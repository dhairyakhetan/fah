-- Member of the Month: allow several honorees per team per month.
-- Owner decision 2026-10-03 (sheet row "members of the month pick feature doesn't
-- allow to choose more than 1 member per team"). Was one per team per month.
--
-- WHAT CHANGES: the only thing that enforced "one per team" was a unique INDEX
-- on (period, team_id). No table constraint, no trigger, no view depends on it,
-- and every RLS policy and submit_mom_photo() already work per row. So the whole
-- migration is swapping that index for one that still refuses the SAME member
-- twice in a team-month.
--
-- APPLIED LIVE 2026-10-03, in two steps so the old code and the new code both
-- worked the whole time:
--   Step 1 (before the deploy): create the new index. Harmless to the old code,
--          whose ON CONFLICT (period, team_id) still has its old index.
--   Step 2 (after the deploy is live): drop the old index.

-- Step 1
create unique index if not exists member_of_the_month_period_team_member_key
  on public.member_of_the_month (period, team_id, member_id);

-- Step 2 (only once code using ON CONFLICT (period, team_id, member_id) is live)
drop index if exists public.member_of_the_month_period_team_key;

-- Verify: expect exactly one unique index besides the primary key, on all three columns.
-- select indexname, indexdef from pg_indexes where tablename = 'member_of_the_month';
