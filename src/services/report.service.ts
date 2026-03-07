import { MotivationReport } from "@/types";

// Legacy report service — kept for dashboard stats only.
// The main AI reports are generated on-the-fly in /teacher/reports/[studentId]/[examId].
const mockReports: MotivationReport[] = [];

export const reportService = {
  getAllReports: async (): Promise<MotivationReport[]> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return [...mockReports];
  },

  getReportById: async (reportId: string): Promise<MotivationReport | null> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockReports.find((r) => r.id === reportId) || null;
  },

  getReportsByStudent: async (studentId: string): Promise<MotivationReport[]> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockReports.filter((r) => r.studentId === studentId);
  },

  generateReport: async (
    studentId: string,
    examId: string,
    _submissionId: string
  ): Promise<MotivationReport> => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const report: MotivationReport = {
      id: `report${Date.now()}`,
      studentId,
      examId,
      submittedAt: new Date().toISOString(),
      scores: {
        engagement: Math.floor(Math.random() * 30) + 70,
        confidence: Math.floor(Math.random() * 30) + 70,
        persistence: Math.floor(Math.random() * 30) + 70,
        emotionalState: Math.floor(Math.random() * 30) + 70,
      },
      insights: [
        "AI-generated insight based on answer analysis",
        "Pattern detected in response style",
        "Motivation indicators analyzed",
      ],
      recommendations: [
        "Personalized recommendation based on performance",
        "Suggested follow-up activities",
      ],
    };
    mockReports.push(report);
    return report;
  },
};
