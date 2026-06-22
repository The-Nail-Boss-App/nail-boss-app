ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS proposal_version integer,
  ADD COLUMN IF NOT EXISTS client_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS shop_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS service_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS price_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS policy_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS visual_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS draft_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS updated_at bigint;

UPDATE proposals
SET updated_at = created_at
WHERE updated_at IS NULL;
