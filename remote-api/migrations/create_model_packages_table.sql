-- Migration: Create model_packages table
-- Date: 2024
-- Description: Add table for managing RAG model packages

CREATE TABLE IF NOT EXISTS model_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject VARCHAR(50) NOT NULL,
    version VARCHAR(20) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    file_hash VARCHAR(64),
    manifest_path TEXT,
    download_url TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    published_by UUID REFERENCES users(id),

    -- Unique constraint: one active version per subject
    UNIQUE(subject, version)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_model_packages_subject ON model_packages(subject);
CREATE INDEX IF NOT EXISTS idx_model_packages_is_active ON model_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_model_packages_published_at ON model_packages(published_at);

-- Add foreign key constraint for published_by
ALTER TABLE model_packages
    ADD CONSTRAINT fk_model_packages_published_by
    FOREIGN KEY (published_by) REFERENCES users(id);

-- Add comment
COMMENT ON TABLE model_packages IS 'RAG model packages for different subjects (CS101, PHP1, etc.)';
COMMENT ON COLUMN model_packages.subject IS 'Subject code (e.g., CS101, PHP1)';
COMMENT ON COLUMN model_packages.version IS 'Package version (e.g., v1, v2)';
COMMENT ON COLUMN model_packages.file_path IS 'Path to package file in storage';
COMMENT ON COLUMN model_packages.file_hash IS 'SHA-256 hash of package file';
COMMENT ON COLUMN model_packages.download_url IS 'Public download URL for package';

