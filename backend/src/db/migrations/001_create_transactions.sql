-- Migration: Create transactions table
-- Description: Initial schema for storing financial transactions

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    source TEXT NOT NULL,
    date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- Add comments for documentation
COMMENT ON TABLE transactions IS 'Stores user financial transactions';
COMMENT ON COLUMN transactions.id IS 'Unique transaction identifier (UUID)';
COMMENT ON COLUMN transactions.user_id IS 'User who owns this transaction';
COMMENT ON COLUMN transactions.amount IS 'Transaction amount in local currency';
COMMENT ON COLUMN transactions.description IS 'Human-readable transaction description';
COMMENT ON COLUMN transactions.category IS 'Transaction category (Food, Transport, etc.)';
COMMENT ON COLUMN transactions.source IS 'Payment method (UPI, Card, Cash, etc.)';
COMMENT ON COLUMN transactions.date IS 'Date when transaction occurred';
COMMENT ON COLUMN transactions.created_at IS 'Timestamp when record was created';

