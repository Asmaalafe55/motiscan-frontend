import { Exam, Question, ExamSubmission, Answer } from "@/types";
import { placeholderImages } from "@/lib/placeholder-images";

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

// ---------------------------------------------------------------------------
// Mock exams database
// ---------------------------------------------------------------------------
const mockExams: Exam[] = [
  // ---- Legacy exams (teacher1) ----
  {
    id: "exam1",
    title: "Math Assessment - Algebra Basics",
    description: "Test your understanding of basic algebraic concepts",
    teacherId: "teacher1",
    teacherName: "Sarah Cohen",
    createdAt: daysAgo(7),
    isLive: false,
    duration: 30,
    assignedStudentIds: ["student1", "student2", "student3"],
    questions: [
      {
        id: "q1", examId: "exam1", type: "multiple_choice",
        text: "What is the solution to 2x + 5 = 13?",
        options: ["x = 3", "x = 4", "x = 5", "x = 6"],
        required: true, order: 1,
      },
      {
        id: "q2", examId: "exam1", type: "open_text",
        text: "Explain how you would solve the equation 3x - 7 = 14",
        required: true, order: 2,
      },
      {
        id: "q3", examId: "exam1", type: "rating_scale",
        text: "How confident are you with solving linear equations?",
        required: true, order: 3,
      },
      {
        id: "q4", examId: "exam1", type: "likert_scale",
        text: "I enjoy solving math problems",
        options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        required: true, order: 4,
      },
    ],
  },
  {
    id: "exam2",
    title: "Science Quiz - Physics Fundamentals",
    description: "Basic physics concepts and principles",
    teacherId: "teacher1",
    teacherName: "Sarah Cohen",
    createdAt: daysAgo(3),
    isLive: true,
    duration: 20,
    assignedStudentIds: ["student1", "student2", "student3"],
    questions: [
      {
        id: "q5", examId: "exam2", type: "multiple_choice",
        text: "What is the unit of force?",
        options: ["Joule", "Newton", "Watt", "Pascal"],
        required: true, order: 1,
      },
      {
        id: "q6", examId: "exam2", type: "open_text",
        text: "Describe Newton's First Law of Motion in your own words",
        required: true, order: 2,
      },
      {
        id: "q7", examId: "exam2", type: "rating_scale",
        text: "Rate your understanding of physics concepts (1-10)",
        required: true, order: 3,
      },
      {
        id: "q8", examId: "exam2", type: "differences",
        text: "Look carefully at both images of the living room. Find and describe all the differences you can see between Image 1 and Image 2.",
        required: true, order: 4,
        differenceImages: {
          image1Url: placeholderImages.room1A,
          image2Url: placeholderImages.room1B,
        },
        expectedAnswerNotes:
          "5 differences: sofa colour, lamp position, green painting, window divider, bookshelf vs plant.",
      },
    ],
  },
  // ---- Part-8 exams (Dr. Noor Salim) ----
  {
    id: "examA",
    title: "Motivation Assessment — Group A",
    description: "Visual cognitive exercises for motivation analysis",
    teacherId: "noor",
    teacherName: "Dr. Noor Salim",
    createdAt: daysAgo(5),
    isLive: true,
    exerciseIds: ["diff-city-nature", "diff-kitchen"],
    assignedStudentIds: ["sara", "ahmed"],
    questions: [
      {
        id: "examA-q1", examId: "examA", type: "differences", required: true, order: 1,
        text: "Look carefully at both outdoor scenes. Find and write down all the differences you can spot between Image 1 and Image 2. Try to find at least 7 differences.",
        differenceImages: {
          image1Url: placeholderImages.garden2A,
          image2Url: placeholderImages.garden2B,
        },
        expectedAnswerNotes:
          "6 differences: sun position, cloud removed, door colour, tree removed, flower colour, birds added.",
      },
      {
        id: "examA-q2", examId: "examA", type: "differences", required: true, order: 2,
        text: "Study both kitchen images carefully. Write a list of every difference you notice. There are 5 differences to find.",
        differenceImages: {
          image1Url: placeholderImages.kitchen3A,
          image2Url: placeholderImages.kitchen3B,
        },
        expectedAnswerNotes:
          "5 differences: curtains, fridge colour, 3→2 cups, pear removed, clock added.",
      },
    ],
  },
  {
    id: "examB",
    title: "Cognitive Evaluation — Group B",
    description: "Attention and observation exercises",
    teacherId: "noor",
    teacherName: "Dr. Noor Salim",
    createdAt: daysAgo(2),
    isLive: false,
    exerciseIds: ["diff-kitchen", "diff-classroom"],
    assignedStudentIds: ["maya", "omar"],
    questions: [
      {
        id: "examB-q1", examId: "examB", type: "differences", required: true, order: 1,
        text: "Study both kitchen images carefully. Write a list of every difference you notice. There are 5 differences to find.",
        differenceImages: {
          image1Url: placeholderImages.kitchen3A,
          image2Url: placeholderImages.kitchen3B,
        },
        expectedAnswerNotes:
          "5 differences: curtains, fridge colour, 3→2 cups, pear removed, clock added.",
      },
      {
        id: "examB-q2", examId: "examB", type: "differences", required: true, order: 2,
        text: "Compare the two classroom images below. Find and describe 6 differences between them.",
        differenceImages: {
          image1Url: placeholderImages.classroom4A,
          image2Url: placeholderImages.classroom4B,
        },
        expectedAnswerNotes:
          "6 differences: chalkboard colour, 3→2 desks, clock removed, apple added, fewer books, extra window.",
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
    submittedAt: daysAgo(2),
    timeSpent: 1200,
  },
];

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------
export const examService = {
  getAllExams: async (teacherId?: string): Promise<Exam[]> => {
    await new Promise((r) => setTimeout(r, 400));
    return teacherId ? mockExams.filter((e) => e.teacherId === teacherId) : [...mockExams];
  },

  getExamById: async (examId: string): Promise<Exam | null> => {
    await new Promise((r) => setTimeout(r, 300));
    return mockExams.find((e) => e.id === examId) ?? null;
  },

  getLiveExams: async (): Promise<Exam[]> => {
    await new Promise((r) => setTimeout(r, 300));
    return mockExams.filter((e) => e.isLive);
  },

  /** Returns live exams where the student is assigned */
  getLiveExamsForStudent: async (studentId: string): Promise<Exam[]> => {
    await new Promise((r) => setTimeout(r, 300));
    return mockExams.filter(
      (e) => e.isLive && (e.assignedStudentIds?.includes(studentId) ?? false)
    );
  },

  /** Returns all exams assigned to this student (live or not) */
  getExamsForStudent: async (studentId: string): Promise<Exam[]> => {
    await new Promise((r) => setTimeout(r, 300));
    return mockExams.filter((e) => e.assignedStudentIds?.includes(studentId) ?? false);
  },

  createExam: async (
    exam: Omit<Exam, "id" | "createdAt" | "isLive">
  ): Promise<Exam> => {
    await new Promise((r) => setTimeout(r, 500));
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
    await new Promise((r) => setTimeout(r, 400));
    const idx = mockExams.findIndex((e) => e.id === examId);
    if (idx === -1) return null;
    mockExams[idx] = { ...mockExams[idx], ...updates };
    return mockExams[idx];
  },

  openLiveSession: async (examId: string): Promise<Exam | null> => {
    return examService.updateExam(examId, { isLive: true });
  },

  closeLiveSession: async (examId: string): Promise<Exam | null> => {
    return examService.updateExam(examId, { isLive: false });
  },

  submitExam: async (
    examId: string,
    studentId: string,
    answers: Answer[],
    timeSpent: number
  ): Promise<ExamSubmission> => {
    await new Promise((r) => setTimeout(r, 500));
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

  getSubmissionsForStudent: async (studentId: string): Promise<ExamSubmission[]> => {
    await new Promise((r) => setTimeout(r, 300));
    return mockSubmissions.filter((s) => s.studentId === studentId);
  },

  getSubmissionsForExam: async (examId: string): Promise<ExamSubmission[]> => {
    await new Promise((r) => setTimeout(r, 300));
    return mockSubmissions.filter((s) => s.examId === examId);
  },
};
