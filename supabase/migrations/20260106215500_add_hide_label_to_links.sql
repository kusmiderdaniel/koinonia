-- Add hide_label column to link_tree_links
ALTER TABLE link_tree_links
ADD COLUMN IF NOT EXISTS hide_label boolean DEFAULT false;
