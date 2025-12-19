import type { VercelRequest, VercelResponse } from '@vercel/node';

// Modal endpoint URL - will be set after Modal deployment
const MODAL_ENDPOINT = process.env.MODAL_ENDPOINT || '';

interface SummarizeRequest {
  content: string;
  fileName?: string;
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
      chunkLength = 500, 
      overlapLength = 50 
    } = body;

    if (!content) {
      return res.status(400).json({ message: 'No content provided' });
    }

    // Word count validation
    const wordCount = content.trim().split(/\s+/).length;
    if (wordCount > 2000) {
      return res.status(400).json({
        message: `Document exceeds 2000 words (${wordCount} words)`,
      });
    }

    let summaryText = '';

    if (MODAL_ENDPOINT) {
      // Call Modal endpoint for summarization
      try {
        const modalResponse = await fetch(MODAL_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
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
      } catch (error) {
        console.error('Modal endpoint error:', error);
        // Fallback to basic truncation if Modal unavailable
        summaryText = createFallbackSummary(content);
      }
    } else {
      // No Modal endpoint configured - use fallback
      console.warn('MODAL_ENDPOINT not configured, using fallback summarization');
      summaryText = createFallbackSummary(content);
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

/**
 * Fallback summarization when Modal is not available.
 * Extracts key sentences from the document.
 */
function createFallbackSummary(content: string): string {
  // Simple extractive summary: take first sentence from each paragraph
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());
  const sentences: string[] = [];
  
  for (const para of paragraphs) {
    // Get first sentence of each paragraph
    const firstSentence = para.split(/[.!?]+/)[0];
    if (firstSentence && firstSentence.trim().length > 20) {
      sentences.push(firstSentence.trim() + '.');
    }
  }
  
  // If we got less than 3 sentences, try a different approach
  if (sentences.length < 3) {
    const allSentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    // Take first 5 sentences
    return allSentences.slice(0, 5).map(s => s.trim()).join('. ') + '.';
  }
  
  return sentences.slice(0, 10).join(' ');
}
