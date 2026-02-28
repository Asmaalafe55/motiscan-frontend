import { Exercise, QuestionType, Question, Exam, ExamTemplate } from "@/types";

// Mock exercise library
const mockExercises: Exercise[] = [
  {
    id: "ex1",
    title: "Algebra Confidence Check",
    type: "rating_scale",
    instructions: "Rate your confidence in solving basic algebraic equations from 1 to 10.",
    content: "",
    tags: ["math", "algebra", "self-assessment"],
    question: {
      id: "ex1-q",
      examId: "",
      type: "rating_scale",
      text: "How confident do you feel solving basic algebraic equations?",
      required: true,
      order: 1,
    },
  },
  {
    id: "ex2",
    title: "Growth Mindset Reflection",
    type: "open_text",
    instructions:
      "Ask the student to reflect on a recent challenge in class and how they responded.",
    content: "",
    tags: ["reflection", "mindset", "motivation"],
    question: {
      id: "ex2-q",
      examId: "",
      type: "open_text",
      text: "Describe a recent challenge you faced in class and how you responded.",
      required: true,
      order: 1,
    },
  },
  {
    id: "ex3",
    title: "Enjoyment of Subject",
    type: "likert_scale",
    instructions: "Measure how much the student enjoys this subject.",
    content: "",
    tags: ["likert", "enjoyment"],
    question: {
      id: "ex3-q",
      examId: "",
      type: "likert_scale",
      text: "I enjoy learning this subject.",
      options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
      required: true,
      order: 1,
    },
  },
];

const mockTemplates: ExamTemplate[] = [];

export const exerciseLibraryService = {
  getAllExercises: async (): Promise<Exercise[]> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockExercises;
  },

  searchExercisesByTag: async (tag: string): Promise<Exercise[]> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockExercises.filter((ex) => ex.tags.includes(tag));
  },

  getExerciseById: async (id: string): Promise<Exercise | null> => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return mockExercises.find((ex) => ex.id === id) || null;
  },

  createExercise: async (exercise: Omit<Exercise, "id" | "question"> & { question: Question }): Promise<Exercise> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const newExercise: Exercise = {
      ...exercise,
      id: `ex-${Date.now()}`,
    };
    mockExercises.push(newExercise);
    return newExercise;
  },

  // Templates
  getTemplates: async (): Promise<ExamTemplate[]> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockTemplates;
  },

  createTemplateFromExam: async (exam: Exam): Promise<ExamTemplate> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const template: ExamTemplate = {
      id: `tmpl-${Date.now()}`,
      title: exam.title,
      description: exam.description,
      teacherId: exam.teacherId,
      createdAt: new Date().toISOString(),
      exerciseIds: exam.questions.map((q) => q.id),
    };
    mockTemplates.push(template);
    return template;
  },

  getTemplateById: async (templateId: string): Promise<ExamTemplate | null> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockTemplates.find((t) => t.id === templateId) || null;
  },
};

