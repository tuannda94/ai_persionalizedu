#!/bin/bash
# Example environment variables cho backend

# Ollama configuration
export OLLAMA_URL=http://localhost:11434/api/generate
export OLLAMA_MODEL=llama3

# Hoặc dùng model khác:
# export OLLAMA_MODEL=llama3
# export OLLAMA_MODEL=phi3:mini

# Backend port (mặc định 8000)
export BACKEND_PORT=8000

# (Tùy chọn) Cloud telemetry endpoint
# export CLOUD_TELEMETRY_URL=https://your-school-server.com/api/telemetry
# export TELEMETRY_API_KEY=your-api-key
