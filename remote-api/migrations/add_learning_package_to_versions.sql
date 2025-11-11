-- Migration: Add learning package fields to app_versions table
-- Date: 2024-11-12
-- Description: Add fields to support learning packages (embeddings, RAG index, config) bundled with app versions

-- Add learning package fields
ALTER TABLE app_versions
    ADD COLUMN IF NOT EXISTS learning_package_url TEXT,
    ADD COLUMN IF NOT EXISTS learning_package_hash VARCHAR(64),
    ADD COLUMN IF NOT EXISTS learning_package_size BIGINT,
    ADD COLUMN IF NOT EXISTS learning_package_manifest TEXT,
    ADD COLUMN IF NOT EXISTS has_learning_package BOOLEAN DEFAULT FALSE;

-- Add comments
COMMENT ON COLUMN app_versions.learning_package_url IS 'URL to learning package zip file containing embeddings, RAG index, config, and scripts';
COMMENT ON COLUMN app_versions.learning_package_hash IS 'SHA-256 hash of learning package file';
COMMENT ON COLUMN app_versions.learning_package_size IS 'Size of learning package in bytes';
COMMENT ON COLUMN app_versions.learning_package_manifest IS 'JSON manifest describing package contents (embeddings, RAG index paths, config, etc.)';
COMMENT ON COLUMN app_versions.has_learning_package IS 'Flag indicating if this version includes a learning package';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_app_versions_has_learning_package ON app_versions(has_learning_package);

