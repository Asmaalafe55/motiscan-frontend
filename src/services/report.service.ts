import { api, ApiError } from "@/lib/api";
import { examService } from "./exam.service";

/**
 * Motivation report as produced by the backend AI engine
 * (POST /api/reports/generate/:submissionId). One report per submission.
 */
export interface ReportScores {
  engagement: number;
  confidence: number;
  persistence: number;
  emotionalState: number;
}

export interface ReportAttribution {
  dimension: keyof ReportScores | string;
  exerciseTitle: string;
  reason: string;
}

export interface Report {
  id: string;
  submissionId: string;
  teacherId: string;
  scores: ReportScores;
  attributions: ReportAttribution[];
  recommendations: string[];
  summary: string;
  generatedAt: string;
}

export const reportService = {
  /** Generate (or regenerate) the AI motivation report for a submission. */
  generateReport: async (submissionId: string): Promise<Report> => {
    const data = await api.post<{ report: Report }>(
      `/api/reports/generate/${submissionId}`
    );
    return data.report;
  },

  /** Fetch an existing report for a submission, or null if none exists yet. */
  getReportBySubmission: async (submissionId: string): Promise<Report | null> => {
    try {
      const data = await api.get<{ report: Report }>(
        `/api/reports/submission/${submissionId}`
      );
      return data.report;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  },

  /** URL to download the report as a PDF (opened directly by the browser). */
  getPdfUrl: (reportId: string): string => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
    return `${base}/api/reports/${reportId}/pdf`;
  },

  /** Dashboard stat: how many reports have been generated so far. */
  getGeneratedCount: async (): Promise<number> => {
    const submissions = await examService.getAllSubmissions();
    return submissions.filter((s) => s.hasReport).length;
  },
};
