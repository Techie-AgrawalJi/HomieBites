#!/bin/bash
DATA_DIR="/home/runner/workspace/data/db"
LOG_FILE="/home/runner/workspace/data/mongod.log"
mkdir -p "$DATA_DIR"

# Kill any stale mongod lock
if [ -f "$DATA_DIR/mongod.lock" ]; then
  rm -f "$DATA_DIR/mongod.lock"
fi

# Start MongoDB in background using & (not --fork so it lives with the workflow)
echo "Starting MongoDB in background..."
mongod --dbpath "$DATA_DIR" --logpath "$LOG_FILE" --bind_ip 127.0.0.1 --port 27017 --quiet &
MONGOD_PID=$!

echo "MongoDB started with PID $MONGOD_PID"
echo "Starting HomieBites API server (will retry MongoDB connection)..."

# Start Express server — it has its own retry logic for MongoDB
cd /home/runner/workspace/server
npm run dev

