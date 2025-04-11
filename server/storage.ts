import { 
  repositoryLogs, 
  type RepositoryLog, 
  type InsertRepositoryLog 
} from "@shared/schema";

export interface IStorage {
  logRepositoryProcessing(log: InsertRepositoryLog): Promise<RepositoryLog>;
  getRecentLogs(limit: number): Promise<RepositoryLog[]>;
}

export class MemStorage implements IStorage {
  private logs: Map<number, RepositoryLog>;
  private currentId: number;

  constructor() {
    this.logs = new Map();
    this.currentId = 1;
  }

  async logRepositoryProcessing(log: InsertRepositoryLog): Promise<RepositoryLog> {
    const id = this.currentId++;
    const repositoryLog: RepositoryLog = { ...log, id };
    this.logs.set(id, repositoryLog);
    return repositoryLog;
  }

  async getRecentLogs(limit: number): Promise<RepositoryLog[]> {
    return Array.from(this.logs.values())
      .sort((a, b) => new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
