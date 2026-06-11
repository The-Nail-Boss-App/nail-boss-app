CREATE TABLE IF NOT EXISTS designs (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  shape TEXT NOT NULL CHECK (shape IN ('Almond', 'Coffin', 'Square', 'Stiletto', 'Oval')),
  length DOUBLE PRECISION NOT NULL CHECK (length >= 0 AND length <= 1),
  width DOUBLE PRECISION NOT NULL CHECK (width >= 0 AND width <= 1),
  base_color_hex TEXT NOT NULL,
  effect TEXT NOT NULL CHECK (effect IN ('Solid', 'Gradient', 'Chrome', 'CatEye', 'Marble')),
  effect_color_hex TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY,
  design_id UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price > 0),
  status TEXT NOT NULL CHECK (status IN ('Sent', 'Viewed', 'Accepted', 'ChangesRequested', 'Declined')),
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proposal_status_history (
  id BIGSERIAL PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  previous_status TEXT CHECK (previous_status IN ('Sent', 'Viewed', 'Accepted', 'ChangesRequested', 'Declined')),
  new_status TEXT NOT NULL CHECK (new_status IN ('Sent', 'Viewed', 'Accepted', 'ChangesRequested', 'Declined')),
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_designs_created_at ON designs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON proposals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proposals_design_id ON proposals(design_id);
CREATE INDEX IF NOT EXISTS idx_proposal_status_history_proposal_id ON proposal_status_history(proposal_id, created_at ASC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_designs_updated_at') THEN
    CREATE TRIGGER set_designs_updated_at
    BEFORE UPDATE ON designs
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_proposals_updated_at') THEN
    CREATE TRIGGER set_proposals_updated_at
    BEFORE UPDATE ON proposals
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
