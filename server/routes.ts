import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { summaryParametersSchema } from "@shared/schema";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  // Summarize document
  app.post("/api/summarize", upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      const content = req.file.buffer.toString("utf-8");
      const wordCount = content.trim().split(/\s+/).length;
      const fileName = req.file.originalname;

      // Validate word count
      if (wordCount > 2000) {
        return res.status(400).json({
          message: `Document exceeds 2000 words (${wordCount} words)`,
        });
      }

      // Parse parameters
      const params = summaryParametersSchema.parse({
        chunkLength: req.body.chunkLength ? Number(req.body.chunkLength) : 500,
        overlapLength: req.body.overlapLength ? Number(req.body.overlapLength) : 50,
      });

      // Create summary record
      const summary = await storage.createSummary({
        fileName,
        originalWordCount: wordCount,
        summaryText: content.substring(0, 500) + "...", // Mock summary
        chunkLength: params.chunkLength,
        overlapLength: params.overlapLength,
        createdAt: new Date().toISOString(),
      });

      res.json(summary);
    } catch (error) {
      console.error("Summarization error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Summarization failed",
      });
    }
  });

  // Get summary by ID
  app.get("/api/summary/:id", async (req: Request, res: Response) => {
    const summary = await storage.getSummary(req.params.id);
    if (!summary) {
      return res.status(404).json({ message: "Summary not found" });
    }
    res.json(summary);
  });

  // List all summaries
  app.get("/api/summaries", async (req: Request, res: Response) => {
    const summaries = await storage.listSummaries();
    res.json(summaries);
  });

  return httpServer;
}
