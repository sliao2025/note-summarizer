#!/bin/bash

# Install Python dependencies
echo "Installing Python dependencies..."
python3 -m pip install -q Flask transformers torch nltk PyPDF2 python-docx 2>/dev/null || python3 -m pip install Flask transformers torch nltk PyPDF2 python-docx

# Start Python server in background
echo "Starting Python summarization server on port 5001..."
python3 python_server.py &
PYTHON_PID=$!

# Give Python server time to start
sleep 5

# Start Node server
echo "Starting Express server on port 5000..."
npm run dev

# Cleanup on exit
trap "kill $PYTHON_PID" EXIT
