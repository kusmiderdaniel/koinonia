-- Add image_url column to link_tree_links for background images
ALTER TABLE link_tree_links
ADD COLUMN image_url TEXT;
