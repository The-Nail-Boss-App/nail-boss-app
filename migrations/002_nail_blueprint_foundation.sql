-- Milestone 3: Nail Blueprint and Layered Design Foundation
-- Non-destructive migration that preserves existing flat design columns.

ALTER TABLE designs
  ADD COLUMN IF NOT EXISTS updated_at bigint;

UPDATE designs
SET updated_at = created_at
WHERE updated_at IS NULL;

ALTER TABLE designs
  ALTER COLUMN updated_at SET DEFAULT ((extract(epoch FROM clock_timestamp()) * 1000)::bigint);

ALTER TABLE designs
  ALTER COLUMN updated_at SET NOT NULL;

CREATE TABLE IF NOT EXISTS design_blueprints (
  design_id uuid PRIMARY KEY REFERENCES designs(id) ON DELETE CASCADE,
  schema_version integer NOT NULL DEFAULT 1,
  document jsonb NOT NULL,
  created_at bigint NOT NULL,
  updated_at bigint NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_design_blueprints_document_gin
  ON design_blueprints USING gin (document jsonb_path_ops);

INSERT INTO design_blueprints (design_id, schema_version, document, created_at, updated_at)
SELECT
  d.id,
  1,
  jsonb_build_object(
    'schemaVersion', 1,
    'canvas', jsonb_build_object(
      'mode', 'single-nail',
      'activeNailId', 'nail-1'
    ),
    'nails', jsonb_build_array(
      jsonb_build_object(
        'id', 'nail-1',
        'slot', 'accent',
        'shape', d.shape,
        'length', d.length,
        'width', d.width,
        'baseColorHex', d.base_color_hex,
        'layers', jsonb_build_array(
          jsonb_build_object(
            'id', 'base-layer',
            'type', 'base',
            'name', 'Base Color',
            'visible', true,
            'locked', true,
            'opacity', 1,
            'order', 0,
            'transform', jsonb_build_object(
              'x', 0.5,
              'y', 0.5,
              'scaleX', 1,
              'scaleY', 1,
              'rotation', 0
            ),
            'data', jsonb_build_object(
              'colorHex', d.base_color_hex,
              'effect', d.effect,
              'effectColorHex', d.effect_color_hex
            )
          )
        )
      )
    ),
    'metadata', jsonb_build_object('tags', to_jsonb(d.tags))
  ),
  d.created_at,
  COALESCE(d.updated_at, d.created_at)
FROM designs d
ON CONFLICT (design_id) DO NOTHING;
