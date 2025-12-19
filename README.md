# Note Summarizer

A full-stack note summarization web application with a React/TypeScript frontend and GPU-accelerated ML backend via Modal.

![Note Summarizer](generated-icon.png)

## 🚀 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel                                │
│  ┌─────────────────────┐    ┌──────────────────────────────┐ │
│  │   Static Frontend   │    │   Serverless API Functions   │ │
│  │   (React + Vite)    │───▶│   /api/summarize             │ │
│  │                     │    │   /api/health                │ │
│  └─────────────────────┘    └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────┐
│                        Modal                                 │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │   GPU-Accelerated Python Functions                       │ │
│  │   - BART-large-CNN Summarization Model                   │ │
│  │   - Sentence-based Text Chunking                         │ │
│  │   - T4 GPU for Fast Inference                            │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## ✨ Features

- **Document Upload**: Drag-and-drop interface for TXT, PDF, and DOCX files
- **Word Count Validation**: Maximum 2000 words per document
- **Customizable Parameters**: Adjust chunk length and overlap for summarization
- **Loading Animation**: Beautiful loading page with rotating status messages
- **Summary Display**: View, copy, and download generated summaries
- **Google Gemini-Inspired Design**: Clean, modern UI with dark/light mode support

## 📦 Project Structure

```
NoteSummarizer/
├── api/                    # Vercel serverless functions
│   ├── summarize.ts        # Main summarization endpoint
│   └── health.ts           # Health check endpoint
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/          # Page components
│   │   │   ├── landing.tsx # Upload page
│   │   │   ├── loading.tsx # Processing page
│   │   │   └── summary.tsx # Results page
│   │   ├── components/     # Reusable UI components
│   │   └── App.tsx         # Main router
│   └── index.html
├── modal_backend/          # Modal ML backend
│   ├── app.py              # Modal app with BART model
│   └── requirements.txt    # Python dependencies
├── shared/                 # Shared TypeScript types
├── vercel.json             # Vercel configuration
└── package.json
```

## 🛠️ Local Development

### Prerequisites

- Node.js 18+
- Python 3.11+ (for local ML testing)
- Modal CLI (for deploying ML backend)

### Install Dependencies

```bash
npm install
```

### Run Frontend Only (Development)

```bash
npm run dev:frontend
```

This starts the Vite dev server at `http://localhost:5173`.

> Note: Without the Modal backend, the app will use a basic fallback summarization.

### Run Full Stack Locally (With Express Backend)

```bash
npm run dev
```

This starts the Express server at `http://localhost:5000`.

## 🚀 Deployment

### Step 1: Push to GitHub

1. **Create a new GitHub repository**

2. **Push your code:**
   ```bash
   git add .
   git commit -m "Initial commit - Note Summarizer"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/note-summarizer.git
   git push -u origin main
   ```

### Step 2: Deploy Modal Backend

1. **Install Modal CLI:**
   ```bash
   pip install modal
   ```

2. **Authenticate with Modal:**
   ```bash
   modal setup
   ```

3. **Deploy the ML backend:**
   ```bash
   cd modal_backend
   modal deploy app.py
   ```

4. **Copy the endpoint URL** from the deployment output:
   ```
   ✓ Created https://YOUR_USERNAME--note-summarizer-summarize-endpoint.modal.run
   ```

### Step 3: Connect GitHub to Vercel

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**

2. **Click "Add New..." → "Project"**

3. **Import your GitHub repository:**
   - Select "Import Git Repository"
   - Choose your `note-summarizer` repository
   - Click "Import"

4. **Configure the project:**
   - **Framework Preset**: Other
   - **Build Command**: `npm run build:vercel`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. **Add Environment Variables:**
   - Click "Environment Variables"
   - Add: `MODAL_ENDPOINT` = `https://YOUR_USERNAME--note-summarizer-summarize-endpoint.modal.run`

6. **Click "Deploy"**

### Automatic Deployments

Once connected, Vercel will automatically deploy:
- ✅ Every push to `main` → Production deployment
- ✅ Every pull request → Preview deployment

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MODAL_ENDPOINT` | URL of the Modal summarization endpoint | Yes (for ML summarization) |

## 📝 API Endpoints

### POST /api/summarize

Summarizes the provided document content.

**Request Body:**
```json
{
  "content": "The text content to summarize...",
  "fileName": "document.txt",
  "chunkLength": 500,
  "overlapLength": 50
}
```

**Response:**
```json
{
  "id": "uuid",
  "fileName": "document.txt",
  "originalWordCount": 1500,
  "summaryText": "The generated summary...",
  "chunkLength": 500,
  "overlapLength": 50,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### GET /api/health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🧪 Testing

1. Visit your deployed URL or `http://localhost:5173` (local)
2. Upload a text file (or PDF/DOCX)
3. Adjust chunk and overlap parameters if desired
4. Click "Generate Summary"
5. Wait for processing and view results
6. Download or copy the summary

## 🔧 Configuration

### Summarization Parameters

| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| Chunk Length | 100-1000 | 500 | Words per chunk for processing |
| Overlap Length | 0-500 | 50 | Overlapping words between chunks |

### Modal GPU Options

The Modal backend uses a T4 GPU by default. You can modify `modal_backend/app.py` to use different GPU types:

```python
@app.cls(
    gpu="A10G",  # Options: T4, A10G, A100, H100
    container_idle_timeout=300,
)
```

## 🐛 Troubleshooting

### Modal deployment fails
- Ensure you're authenticated: `modal setup`
- Check Python version compatibility (3.11 recommended)

### Vercel build fails
- Check the build logs in Vercel dashboard
- Ensure TypeScript compiles: `npm run check`

### Summarization returns fallback text
- Check if `MODAL_ENDPOINT` is set correctly in Vercel Environment Variables
- Verify Modal deployment is running: visit the Modal dashboard

### First request is slow
- The first request triggers model loading (~30s)
- Subsequent requests are much faster (warm container)

## 📄 License

MIT
