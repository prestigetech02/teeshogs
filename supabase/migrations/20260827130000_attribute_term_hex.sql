/*
  Store hex values on attribute terms so storefront color swatches match admin.
*/

ALTER TABLE attribute_terms
  ADD COLUMN IF NOT EXISTS hex text;

-- Prefer the color attribute type for the seeded color taxonomy
UPDATE attributes
SET type = 'color'
WHERE slug = 'color'
  AND type <> 'color';

-- Seed hex for known color terms (by slug)
UPDATE attribute_terms AS t
SET hex = v.hex
FROM attributes AS a,
(
  VALUES
    ('black', '#1A1A1A'),
    ('white', '#F5F5F5'),
    ('ivory', '#FFFFF0'),
    ('cream', '#FFFDD0'),
    ('camel', '#C19A6B'),
    ('navy', '#000080'),
    ('charcoal', '#36454F'),
    ('olive', '#808000'),
    ('sage-green', '#8F9779'),
    ('terracotta', '#E2725B'),
    ('dusty-rose', '#C8A2A2'),
    ('blush', '#FFB6C1'),
    ('burgundy', '#800020'),
    ('emerald', '#50C878'),
    ('midnight', '#0A0A2E')
) AS v(slug, hex)
WHERE a.slug = 'color'
  AND t.attribute_id = a.id
  AND t.slug = v.slug
  AND t.hex IS NULL;
