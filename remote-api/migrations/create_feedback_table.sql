-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'auto',
    category VARCHAR(50),
    title VARCHAR(255),
    message TEXT,
    app_version VARCHAR(50),
    platform VARCHAR(20),
    conversation_id VARCHAR(255),
    error_code VARCHAR(50),
    error_details TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    priority INTEGER DEFAULT 3,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    admin_notes TEXT,
    resolution TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedback(category);

-- Add comments
COMMENT ON TABLE feedback IS 'Feedback từ student apps - tự động và manual';
COMMENT ON COLUMN feedback.type IS 'auto, manual, error, suggestion, bug, feature';
COMMENT ON COLUMN feedback.status IS 'pending, reviewing, resolved, rejected, archived';
COMMENT ON COLUMN feedback.priority IS '1=critical, 2=high, 3=medium, 4=low, 5=info';

