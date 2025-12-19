# Note Summarizer - Implementation Guide

## Overview
This is a complete note summarization web application with a React/TypeScript frontend and Flask Python backend.

## Architecture

### Frontend (Express/Vite/React)
- **Port**: 5000
- **Pages**:
  - `/` - Landing page with document upload and parameter controls
  - `/loading` - Loading animation while summarization processes
  - `/summary` - Summary results with download/copy options

### Backend (Flask/Python)
- **Port**: 5001
- **Endpoint**: `/summarize` (POST)
- **Features**:
  - Document chunking with overlap
  - BART-based text summarization
  - Full text extraction support

## Getting Started

### Option 1: Start Both Servers (Recommended)

Run the startup script that handles both servers:
```bash
bash start_servers.sh
```

This will:
1. Install Python dependencies (first time only)
2. Start Flask server on port 5001
3. Start Express server on port 5000

### Option 2: Manual Setup

**Terminal 1 - Python Server:**
```bash
python3 -m pip install Flask transformers torch nltk PyPDF2 python-docx
python3 python_server.py
```

**Terminal 2 - Node Server:**
```bash
npm run dev
```

## Features Implemented

✅ **Frontend**
- Drag-and-drop document upload
- Word count validation (2000 word limit)
- Customizable chunk length (100-1000 words)
- Customizable overlap length (0-500 words)
- Loading animation with rotating messages
- Summary display with metadata
- Download summary as text file
- Copy summary to clipboard
- Google Gemini-inspired design

✅ **Backend**
- Document processing API
- Sentence-based chunking algorithm with overlap
- BART large CNN summarization model
- Error handling and fallback
- Word count validation

## File Structure
```
├── client/src/
│   ├── pages/
│   │   ├── landing.tsx      # Upload page
│   │   ├── loading.tsx      # Loading page with animations
│   │   ├── summary.tsx      # Summary display page
│   └── App.tsx              # Main router
├── server/
│   ├── routes.ts            # Express API routes
│   ├── storage.ts           # In-memory storage
│   └── index.ts             # Server entry point
├── python_server.py         # Flask summarization server
├── shared/schema.ts         # Shared TypeScript types
└── start_servers.sh         # Startup script
```

## API Endpoints

### POST /api/summarize
Accepts multipart form data with:
- `file` - Document file (text, PDF, or DOCX)
- `chunkLength` - Words per chunk (default: 500)
- `overlapLength` - Overlap words (default: 50)

Returns:
```json
{
  "id": "uuid",
  "fileName": "document.txt",
  "originalWordCount": 1500,
  "summaryText": "...",
  "chunkLength": 500,
  "overlapLength": 50,
  "createdAt": "2024-..."
}
```

## Notes

- First run will download the BART model (~1.6GB) - takes a few minutes
- Python server loads the model once on startup for efficiency
- All text processing is local (no external APIs required)
- Fallback to text truncation if Python server unavailable

## Testing

1. Visit `http://localhost:5000`
2. Upload a text file (or PDF/DOCX)
3. Adjust chunk and overlap parameters
4. Click "Generate Summary"
5. Wait for processing and view results
6. Download or copy the summary

## Troubleshooting

**Python server not starting:**
- Ensure Python 3.6+ is installed
- Run: `python3 -m pip install --upgrade Flask transformers torch nltk PyPDF2 python-docx`

**Flask port already in use:**
- Change Flask port in `python_server.py` line 81 and update Express routes accordingly

**Model download slow:**
- First download is large (~1.6GB). Subsequent runs are much faster.
- Model is cached in `~/.cache/huggingface/`

## Production Notes

For production deployment:
1. Use a proper WSGI server for Flask (e.g., Gunicorn)
2. Implement proper error handling and logging
3. Add authentication if needed
4. Use environment variables for configuration
5. Consider model quantization for smaller memory footprint
