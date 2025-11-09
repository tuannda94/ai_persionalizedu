#!/bin/bash
# Setup MinIO for file storage

echo "🔧 Setting up MinIO"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    echo "   Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if MinIO container is running
if docker ps | grep -q minio; then
    echo "✅ MinIO container is already running"
    MINIO_RUNNING=true
else
    echo "📦 Starting MinIO container..."

    # Create data directory
    DATA_DIR="$(pwd)/storage/minio-data"
    mkdir -p "$DATA_DIR"

    # Run MinIO container
    docker run -d \
        --name minio \
        -p 9000:9000 \
        -p 9001:9001 \
        -e "MINIO_ROOT_USER=minioadmin" \
        -e "MINIO_ROOT_PASSWORD=minioadmin" \
        -v "$DATA_DIR:/data" \
        minio/minio server /data --console-address ":9001"

    if [ $? -eq 0 ]; then
        echo "✅ MinIO container started"
        MINIO_RUNNING=true
        sleep 3  # Wait for MinIO to start
    else
        echo "❌ Failed to start MinIO container"
        exit 1
    fi
fi

echo ""
echo "✅ MinIO is ready!"
echo ""
echo "📋 Access Information:"
echo "   MinIO API: http://localhost:9000"
echo "   MinIO Console: http://localhost:9001"
echo "   Access Key: minioadmin"
echo "   Secret Key: minioadmin"
echo ""
echo "📝 Update remote-api/.env:"
echo "   STORAGE_TYPE=minio"
echo "   MINIO_ENDPOINT=localhost:9000"
echo "   MINIO_ACCESS_KEY=minioadmin"
echo "   MINIO_SECRET_KEY=minioadmin"
echo "   MINIO_SECURE=false"
echo ""
echo "💡 To stop MinIO:"
echo "   docker stop minio"
echo ""
echo "💡 To remove MinIO container:"
echo "   docker rm minio"

