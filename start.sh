#!/bin/bash

echo "🚀 Starting Backend..."
cd backend
npm run start:dev &
BACK_PID=$!

echo "🚀 Starting Frontend..."
cd ../frontend
npm run dev &
FRONT_PID=$!

echo "✅ All services started"
wait $BACK_PID $FRONT_PID
