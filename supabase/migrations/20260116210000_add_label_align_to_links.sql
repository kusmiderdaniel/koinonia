-- Add label_align column to link_tree_links table
-- Allows alignment of link labels: left, center, right (default: center)

ALTER TABLE link_tree_links
ADD COLUMN label_align TEXT NOT NULL DEFAULT 'center'
CHECK (label_align IN ('left', 'center', 'right'));

-- Add comment for documentation
COMMENT ON COLUMN link_tree_links.label_align IS 'Text alignment for the link label: left, center, or right';
