-- Add card_size column to link_tree_links
ALTER TABLE link_tree_links
ADD COLUMN card_size TEXT DEFAULT 'medium' CHECK (card_size IN ('small', 'medium', 'large'));
