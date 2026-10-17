/*
  One-level parent/child categories.
  - parent_id null = top-level (Shop menu parent)
  - parent_id set = subcategory under a top-level category
*/

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS categories_parent_id_idx ON categories (parent_id);

CREATE OR REPLACE FUNCTION public.enforce_category_parent_rules()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL AND NEW.parent_id = NEW.id THEN
    RAISE EXCEPTION 'A category cannot be its own parent';
  END IF;

  IF NEW.parent_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM categories
      WHERE id = NEW.parent_id AND parent_id IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'Only one level of nesting is allowed (subcategories cannot have children)';
    END IF;

    IF EXISTS (
      SELECT 1 FROM categories
      WHERE parent_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Move or remove child categories before nesting this category under another';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS categories_enforce_parent_rules ON categories;
CREATE TRIGGER categories_enforce_parent_rules
BEFORE INSERT OR UPDATE OF parent_id ON categories
FOR EACH ROW
EXECUTE FUNCTION public.enforce_category_parent_rules();
