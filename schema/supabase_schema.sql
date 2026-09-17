-- ==============================================================================
-- TicketlyCRM - Supabase PostgreSQL Schema
-- ==============================================================================
-- Run this SQL in your Supabase Dashboard:
-- 1. Open your Supabase Project -> SQL Editor -> New Query
-- 2. Paste this entire file and click "Run"
-- ==============================================================================

-- Enable UUID extension if needed in the future
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. TICKETS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    ticket_id VARCHAR(32) NOT NULL UNIQUE,
    customer_name VARCHAR(128) NOT NULL,
    customer_email VARCHAR(128) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Open',
    priority VARCHAR(32) NOT NULL DEFAULT 'Medium',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast searching and filtering on tickets
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_id ON tickets (ticket_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets (status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets (priority);
CREATE INDEX IF NOT EXISTS idx_tickets_customer_email ON tickets (customer_email);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets (created_at DESC);

-- Composite / Search-friendly indexes for name and subject
CREATE INDEX IF NOT EXISTS idx_tickets_customer_name ON tickets (customer_name);
CREATE INDEX IF NOT EXISTS idx_tickets_subject ON tickets (subject);

-- ------------------------------------------------------------------------------
-- 2. NOTES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    ticket_id VARCHAR(32) NOT NULL,
    note_text TEXT NOT NULL,
    author VARCHAR(128) NOT NULL DEFAULT 'Support Agent',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_notes_ticket
        FOREIGN KEY (ticket_id)
        REFERENCES tickets (ticket_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Indexes for notes lookup
CREATE INDEX IF NOT EXISTS idx_notes_ticket_id ON notes (ticket_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes (created_at ASC);

-- ------------------------------------------------------------------------------
-- 3. AUTOMATIC UPDATED_AT TRIGGER (OPTIONAL BUT RECOMMENDED)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_tickets_updated_at ON tickets;
CREATE TRIGGER trg_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- Verification Query: Check created tables
-- ==============================================================================
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
