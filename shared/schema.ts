import { z } from "zod";

// Document and Summary schemas
export const uploadDocumentSchema = z.object({
  fileName: z.string(),
  content: z.string(),
  wordCount: z.number(),
});

export const summaryParametersSchema = z.object({
  chunkLength: z.number().min(100).max(1000).default(500),
  overlapLength: z.number().min(0).max(500).default(50),
});

export const summarySchema = z.object({
  id: z.string(),
  fileName: z.string(),
  originalWordCount: z.number(),
  summaryText: z.string(),
  chunkLength: z.number(),
  overlapLength: z.number(),
  createdAt: z.string(),
});

export type UploadDocument = z.infer<typeof uploadDocumentSchema>;
export type SummaryParameters = z.infer<typeof summaryParametersSchema>;
export type Summary = z.infer<typeof summarySchema>;
