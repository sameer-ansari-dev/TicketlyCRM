-- TicketlyCRM production migration (PostgreSQL / Supabase)
-- Run once before deploying the application change.

-- Normalize values that only differ by whitespace/case. Unknown values are left
-- untouched for review instead of silently changing business meaning.
UPDATE tickets
SET status = CASE lower(trim(status))
    WHEN 'open' THEN 'Open'
    WHEN 'in progress' THEN 'In Progress'
    WHEN 'closed' THEN 'Closed'
    ELSE status
END;

CREATE TABLE IF NOT EXISTS ticket_sequences (
    sequence_key INTEGER PRIMARY KEY CHECK (sequence_key = 1),
    next_value INTEGER NOT NULL CHECK (next_value >= 1001)
);

INSERT INTO ticket_sequences (sequence_key, next_value)
SELECT 1, COALESCE(MAX(CASE WHEN ticket_id ~ '^TKT-[0-9]+$'
    THEN CAST(substring(ticket_id FROM 5) AS INTEGER) END), 1000) + 1
FROM tickets
ON CONFLICT (sequence_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS attachments (
    id SERIAL PRIMARY KEY,
    ticket_id VARCHAR(32) NOT NULL REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL UNIQUE,
    content_type VARCHAR(100) NOT NULL,
    size_bytes INTEGER NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 10485760),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attachments_ticket_id ON attachments(ticket_id);

-- Safe consistency audit queries (should all return zero rows except status review).
-- SELECT ticket_id, COUNT(*) FROM tickets GROUP BY ticket_id HAVING COUNT(*) > 1;
-- SELECT status, COUNT(*) FROM tickets GROUP BY status;
-- SELECT n.id FROM notes n LEFT JOIN tickets t ON t.ticket_id = n.ticket_id WHERE t.ticket_id IS NULL;
-- SELECT a.id FROM attachments a LEFT JOIN tickets t ON t.ticket_id = a.ticket_id WHERE t.ticket_id IS NULL;
