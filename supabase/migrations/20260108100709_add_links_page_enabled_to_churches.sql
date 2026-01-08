-- Add links_page_enabled column to churches table
-- When a church is created, the links page is disabled by default

ALTER TABLE churches
ADD COLUMN links_page_enabled BOOLEAN NOT NULL DEFAULT false;

-- Add a comment explaining the column
COMMENT ON COLUMN churches.links_page_enabled IS 'Whether the public links page is enabled for this church. Defaults to false.';
