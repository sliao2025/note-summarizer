import { type Summary } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getSummary(id: string): Promise<Summary | undefined>;
  createSummary(summary: Omit<Summary, "id">): Promise<Summary>;
  listSummaries(): Promise<Summary[]>;
}

export class MemStorage implements IStorage {
  private summaries: Map<string, Summary>;

  constructor() {
    this.summaries = new Map();
  }

  async getSummary(id: string): Promise<Summary | undefined> {
    return this.summaries.get(id);
  }

  async createSummary(
    summary: Omit<Summary, "id">
  ): Promise<Summary> {
    const id = randomUUID();
    const newSummary: Summary = { ...summary, id };
    this.summaries.set(id, newSummary);
    return newSummary;
  }

  async listSummaries(): Promise<Summary[]> {
    return Array.from(this.summaries.values());
  }
}

export const storage = new MemStorage();
