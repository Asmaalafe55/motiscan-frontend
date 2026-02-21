import { Exam, Question, ExamSubmission, Answer } from "@/types";

// Mock exams database
const mockExams: Exam[] = [
  {
    id: "exam1",
    title: "Math Assessment - Algebra Basics",
    description: "Test your understanding of basic algebraic concepts",
    teacherId: "teacher1",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    isLive: false,
    duration: 30,
    questions: [
      {
        id: "q1",
        examId: "exam1",
        type: "multiple_choice",
        text: "What is the solution to 2x + 5 = 13?",
        options: ["x = 3", "x = 4", "x = 5", "x = 6"],
        required: true,
        order: 1,
      },
      {
        id: "q2",
        examId: "exam1",
        type: "open_text",
        text: "Explain how you would solve the equation 3x - 7 = 14",
        required: true,
        order: 2,
      },
      {
        id: "q3",
        examId: "exam1",
        type: "rating_scale",
        text: "How confident are you with solving linear equations?",
        required: true,
        order: 3,
      },
      {
        id: "q4",
        examId: "exam1",
        type: "likert_scale",
        text: "I enjoy solving math problems",
        options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        required: true,
        order: 4,
      },
    ],
  },
  {
    id: "exam2",
    title: "Science Quiz - Physics Fundamentals",
    description: "Basic physics concepts and principles",
    teacherId: "teacher1",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    isLive: true,
    duration: 20,
    questions: [
      {
        id: "q5",
        examId: "exam2",
        type: "multiple_choice",
        text: "What is the unit of force?",
        options: ["Joule", "Newton", "Watt", "Pascal"],
        required: true,
        order: 1,
      },
      {
        id: "q6",
        examId: "exam2",
        type: "open_text",
        text: "Describe Newton's First Law of Motion in your own words",
        required: true,
        order: 2,
      },
      {
        id: "q7",
        examId: "exam2",
        type: "rating_scale",
        text: "Rate your understanding of physics concepts (1-10)",
        required: true,
        order: 3,
      },
    ],
  },
];

const mockSubmissions: ExamSubmission[] = [
  {
    id: "sub1",
    examId: "exam1",
    studentId: "student1",
    answers: [
      { questionId: "q1", value: "x = 4" },
      { questionId: "q2", value: "I would add 7 to both sides, then divide by 3" },
      { questionId: "q3", value: 8 },
      { questionId: "q4", value: "Agree" },
    ],
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    timeSpent: 1200,
  },
];

export const examService = {
  getAllExams: async (teacherId?: string): Promise<Exam[]> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    if (teacherId) {
      return mockExams.filter((exam) => exam.teacherId === teacherId);
    }
    return mockExams;
  },

  getExamById: async (examId: string): Promise<Exam | null> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockExams.find((exam) => exam.id === examId) || null;
  },

  getLiveExams: async (): Promise<Exam[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockExams.filter((exam) => exam.isLive);
  },

  createExam: async (exam: Omit<Exam, "id" | "createdAt" | "isLive">): Promise<Exam> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newExam: Exam = {
      ...exam,
      id: `exam${Date.now()}`,
      createdAt: new Date().toISOString(),
      isLive: false,
    };
    mockExams.push(newExam);
    return newExam;
  },

  updateExam: async (examId: string, updates: Partial<Exam>): Promise<Exam | null> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const index = mockExams.findIndex((exam) => exam.id === examId);
    if (index === -1) return null;
    mockExams[index] = { ...mockExams[index], ...updates };
    return mockExams[index];
  },

  openLiveSession: async (examId: string): Promise<Exam | null> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return examService.updateExam(examId, { isLive: true });
  },

  closeLiveSession: async (examId: string): Promise<Exam | null> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return examService.updateExam(examId, { isLive: false });
  },

  submitExam: async (
    examId: string,
    studentId: string,
    answers: Answer[],
    timeSpent: number
  ): Promise<ExamSubmission> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const submission: ExamSubmission = {
      id: `sub${Date.now()}`,
      examId,
      studentId,
      answers,
      submittedAt: new Date().toISOString(),
      timeSpent,
    };
    mockSubmissions.push(submission);
    return submission;
  },

  getSubmissionsByStudent: async (studentId: string): Promise<ExamSubmission[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockSubmissions.filter((sub) => sub.studentId === studentId);
  },

  getSubmissionsByExam: async (examId: string): Promise<ExamSubmission[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockSubmissions.filter((sub) => sub.examId === examId);
  },
};
