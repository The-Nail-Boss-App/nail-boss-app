CREATE TABLE IF NOT EXISTS schema_migrations (
  id text PRIMARY KEY,
  checksum text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE TYPE proposal_status AS ENUM ('Sent', 'Viewed', 'Accepted', 'ChangesRequested', 'Declined');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS designs (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  shape text NOT NULL,
  length double precision NOT NULL CHECK (length >= 0 AND length <= 1),
  width double precision NOT NULL CHECK (width >= 0 AND width <= 1),
  base_color_hex text NOT NULL,
  effect text NOT NULL,
  effect_color_hex text NOT NULL,
  tags text[] NOT NULL DEFAULT ARRAY[]::text[],
  created_at bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS proposals (
  id uuid PRIMARY KEY,
  design_id uuid NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  price numeric(10, 2) NOT NULL CHECK (price > 0),
  status proposal_status NOT NULL DEFAULT 'Sent',
  notes text NOT NULL DEFAULT '',
  created_at bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS proposal_status_history (
  id uuid PRIMARY KEY,
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  old_status proposal_status,
  new_status proposal_status NOT NULL,
  note text NOT NULL DEFAULT '',
  created_at bigint NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_designs_created_at ON designs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON proposals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proposals_design_id ON proposals(design_id);
CREATE INDEX IF NOT EXISTS idx_proposal_status_history_proposal_id_created_at
  ON proposal_status_history(proposal_id, created_at ASC);
