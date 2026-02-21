import { MotivationReport } from "@/types";

const mockReports: MotivationReport[] = [
  {
    id: "report1",
    studentId: "student1",
    examId: "exam1",
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    scores: {
      engagement: 85,
      confidence: 78,
      persistence: 82,
      emotionalState: 80,
    },
    insights: [
      "Student showed high engagement throughout the exam",
      "Demonstrated good problem-solving approach in open-ended questions",
      "Confidence level is moderate, with room for improvement",
      "Maintained focus and persistence even with challenging questions",
    ],
    recommendations: [
      "Encourage more practice with algebraic equations to boost confidence",
      "Provide positive reinforcement for detailed explanations",
      "Consider additional support materials for complex problem-solving",
    ],
  },
];

export const reportService = {
  getAllReports: async (): Promise<MotivationReport[]> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return mockReports;
  },

  getReportById: async (reportId: string): Promise<MotivationReport | null> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockReports.find((r) => r.id === reportId) || null;
  },

  getReportsByStudent: async (studentId: string): Promise<MotivationReport[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockReports.filter((r) => r.studentId === studentId);
  },

  generateReport: async (
    studentId: string,
    examId: string,
    submissionId: string
  ): Promise<MotivationReport> => {
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate AI processing
    
    // Mock AI-generated report
    const report: MotivationReport = {
      id: `report${Date.now()}`,
      studentId,
      examId,
      submittedAt: new Date().toISOString(),
      scores: {
        engagement: Math.floor(Math.random() * 30) + 70, // 70-100
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
