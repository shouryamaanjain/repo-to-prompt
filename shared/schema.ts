import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const repositoryLogs = pgTable("repository_logs", {
  id: serial("id").primaryKey(),
  repositoryUrl: text("repository_url").notNull(),
  fileCount: integer("file_count").notNull(),
  lineCount: integer("line_count").notNull(),
  processedAt: text("processed_at").notNull(),
  success: boolean("success").notNull(),
  errorMessage: text("error_message"),
});

export const insertRepositoryLogSchema = createInsertSchema(repositoryLogs).omit({
  id: true
});

export type InsertRepositoryLog = z.infer<typeof insertRepositoryLogSchema>;
export type RepositoryLog = typeof repositoryLogs.$inferSelect;

// Common validation schema for GitHub repository URLs
export const gitHubUrlSchema = z.string().url().refine(
  (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === 'github.com' && urlObj.pathname.split('/').filter(Boolean).length >= 2;
    } catch (e) {
      return false;
    }
  },
  { message: "Invalid GitHub repository URL. Format should be: https://github.com/username/repository" }
);
