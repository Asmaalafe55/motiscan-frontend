import { Exam, ExamSubmission, Answer } from "@/types";
import { placeholderImages } from "@/lib/placeholder-images";

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

// ---------------------------------------------------------------------------
// Mock exams — single source of truth
// Only DIFFERENCES exercise type. No math, no multiple-choice, no open-text.
// ---------------------------------------------------------------------------
const mockExams: Exam[] = [
  // ---- Exam 1: Motivation Assessment — Group A (LIVE) ----
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
        id: "examA-q1",
        examId: "examA",
        type: "differences",
        required: true,
        order: 1,
        text: "Look carefully at both outdoor scenes. Find and write down all the differences you can spot between Image 1 and Image 2. Try to find at least 6 differences.",
        differenceImages: {
          image1Url: placeholderImages.garden2A,
          image2Url: placeholderImages.garden2B,
        },
        expectedAnswerNotes:
          "6 differences: sun position, cloud removed, door colour red→blue, tree removed, flower colour orange→purple, birds added.",
      },
      {
        id: "examA-q2",
        examId: "examA",
        type: "differences",
        required: true,
        order: 2,
        text: "Study both kitchen images carefully. Write a list of every difference you notice. There are 5 differences to find.",
        differenceImages: {
          image1Url: placeholderImages.kitchen3A,
          image2Url: placeholderImages.kitchen3B,
        },
        expectedAnswerNotes:
          "5 differences: curtains added to window, fridge colour white→beige, 3 cups reduced to 2, green pear removed, wall clock added.",
      },
    ],
  },

  // ---- Exam 2: Cognitive Evaluation — Group B (DRAFT, session not open) ----
  {
    id: "examB",
    title: "Cognitive Evaluation — Group B",
    description: "Attention and observation exercises",
    teacherId: "noor",
    teacherName: "Dr. Noor Salim",
    createdAt: daysAgo(3),
    isLive: false,
    exerciseIds: ["diff-kitchen", "diff-classroom"],
    assignedStudentIds: ["maya", "omar", "sara"],
    questions: [
      {
        id: "examB-q1",
        examId: "examB",
        type: "differences",
        required: true,
        order: 1,
        text: "Study both kitchen images carefully. Write a list of every difference you notice. There are 5 differences to find.",
        differenceImages: {
          image1Url: placeholderImages.kitchen3A,
          image2Url: placeholderImages.kitchen3B,
        },
        expectedAnswerNotes:
          "5 differences: curtains added to window, fridge colour white→beige, 3 cups reduced to 2, green pear removed, wall clock added.",
      },
      {
        id: "examB-q2",
        examId: "examB",
        type: "differences",
        required: true,
        order: 2,
        text: "Compare the two classroom images below. Find and describe 6 differences between them.",
        differenceImages: {
          image1Url: placeholderImages.classroom4A,
          image2Url: placeholderImages.classroom4B,
        },
        expectedAnswerNotes:
          "6 differences: chalkboard colour green→dark, 3 desks→2 desks, clock removed, apple added on teacher's desk, bookshelf has fewer books, extra small window added.",
      },
    ],
  },

  // ---- Exam 3: Attention and Focus Test (COMPLETED — session closed, all submitted) ----
  {
    id: "examC",
    title: "Attention and Focus Test",
    description: "Visual attention and focus assessment",
    teacherId: "noor",
    teacherName: "Dr. Noor Salim",
    createdAt: daysAgo(10),
    isLive: false,
    exerciseIds: ["diff-city-nature", "diff-classroom"],
    assignedStudentIds: ["ahmed", "maya"],
    questions: [
      {
        id: "examC-q1",
        examId: "examC",
        type: "differences",
        required: true,
        order: 1,
        text: "Look carefully at both outdoor scenes. Find and write down all the differences you can spot between Image 1 and Image 2. Try to find at least 6 differences.",
        differenceImages: {
          image1Url: placeholderImages.garden2A,
          image2Url: placeholderImages.garden2B,
        },
        expectedAnswerNotes:
          "6 differences: sun position, cloud removed, door colour red→blue, tree removed, flower colour orange→purple, birds added.",
      },
      {
        id: "examC-q2",
        examId: "examC",
        type: "differences",
        required: true,
        order: 2,
        text: "Compare the two classroom images below. Find and describe 6 differences between them.",
        differenceImages: {
          image1Url: placeholderImages.classroom4A,
          image2Url: placeholderImages.classroom4B,
        },
        expectedAnswerNotes:
          "6 differences: chalkboard colour green→dark, 3 desks→2 desks, clock removed, apple added on teacher's desk, bookshelf has fewer books, extra small window added.",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Mock submissions — pre-seeded for completed exams
// Sara submitted examA, Ahmed & Maya submitted examC
// ---------------------------------------------------------------------------
const mockSubmissions: ExamSubmission[] = [
  {
    id: "sub-sara-examA",
    examId: "examA",
    studentId: "sara",
    answers: [
      { questionId: "examA-q1", value: "Sun moved to the right; a cloud disappeared; door changed from red to blue; tree was removed; flowers changed from orange to purple; birds were added in the sky." },
      { questionId: "examA-q2", value: "Curtains appeared on the window; fridge changed from white to beige; one cup was removed; the pear is gone; a wall clock was added." },
    ],
    submittedAt: daysAgo(1),
    timeSpent: 2340,
  },
  {
    id: "sub-ahmed-examC",
    examId: "examC",
    studentId: "ahmed",
    answers: [
      { questionId: "examC-q1", value: "The sun moved; a cloud was removed; the door colour changed; a tree disappeared; flowers changed colour; birds appeared." },
      { questionId: "examC-q2", value: "Chalkboard became darker; one desk was removed; the clock is gone; an apple appeared; fewer books on the shelf; a small window was added." },
    ],
    submittedAt: daysAgo(2),
    timeSpent: 1980,
  },
  {
    id: "sub-maya-examC",
    examId: "examC",
    studentId: "maya",
    answers: [
      { questionId: "examC-q1", value: "Sun is in different position; no cloud; door changed colour; tree missing; flowers different colour; birds added." },
      { questionId: "examC-q2", value: "Board colour changed; fewer desks; clock removed; apple on desk; fewer books; extra window." },
    ],
    submittedAt: daysAgo(2),
    timeSpent: 2100,
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

  /** Check if a student has already submitted a specific exam */
  hasStudentSubmitted: async (examId: string, studentId: string): Promise<boolean> => {
    await new Promise((r) => setTimeout(r, 100));
    return mockSubmissions.some((s) => s.examId === examId && s.studentId === studentId);
  },
};
