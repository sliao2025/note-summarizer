import type { VercelRequest, VercelResponse } from '@vercel/node';

// Modal endpoint URL - will be set after Modal deployment
const MODAL_ENDPOINT = process.env.MODAL_ENDPOINT || '';

interface SummarizeRequest {
  content: string;
  fileName?: string;
  fileType?: string;
  isBase64?: boolean;
  chunkLength?: number;
  overlapLength?: number;
}

interface SummaryResponse {
  id: string;
  fileName: string;
  originalWordCount: number;
  summaryText: string;
  chunkLength: number;
  overlapLength: number;
  createdAt: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body as SummarizeRequest;
    const { 
      content, 
      fileName = 'document.txt',
      fileType = 'txt',
      isBase64 = false,
      chunkLength = 500, 
      overlapLength = 50 
    } = body;

    if (!content) {
      return res.status(400).json({ message: 'No content provided' });
    }

    let summaryText = '';
    let wordCount = 0;

    if (MODAL_ENDPOINT) {
      // Call Modal endpoint for summarization
      try {
        const modalResponse = await fetch(MODAL_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            fileType,
            isBase64,
            chunkLength,
            overlapLength,
          }),
        });

        if (!modalResponse.ok) {
          const errorData = await modalResponse.json().catch(() => ({}));
          console.error('Modal error:', errorData);
          throw new Error(errorData.error || 'Summarization failed');
        }

        const result = await modalResponse.json();
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        summaryText = result.summary;
        wordCount = result.wordCount || 0;
      } catch (error) {
        console.error('Modal endpoint error:', error);
        throw error; // Re-throw to show the actual error
      }
    } else {
      // No Modal endpoint configured - return error
      return res.status(503).json({
        message: 'Summarization service not configured. Please set MODAL_ENDPOINT environment variable.',
      });
    }

    const summary: SummaryResponse = {
      id: crypto.randomUUID(),
      fileName,
      originalWordCount: wordCount,
      summaryText,
      chunkLength,
      overlapLength,
      createdAt: new Date().toISOString(),
    };

    return res.status(200).json(summary);
  } catch (error) {
    console.error('Summarization error:', error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : 'Summarization failed',
    });
  }
}
