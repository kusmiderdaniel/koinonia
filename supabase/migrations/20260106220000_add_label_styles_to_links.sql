-- Add label style columns to link_tree_links
ALTER TABLE link_tree_links
ADD COLUMN IF NOT EXISTS label_bold boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS label_italic boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS label_underline boolean DEFAULT false;
