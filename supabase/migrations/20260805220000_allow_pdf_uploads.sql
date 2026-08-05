-- ============================================================
-- CUPID MATCH CHAT — Allow Document Uploads in Storage
-- Generated: 2026-08-05
-- Removes mime type restrictions on chat-media bucket to
-- allow PDF, DOC, ZIP, and future file types.
-- ============================================================

UPDATE storage.buckets
SET allowed_mime_types = NULL
WHERE id = 'chat-media';

SELECT 'Storage mime types restriction removed.' AS result;
