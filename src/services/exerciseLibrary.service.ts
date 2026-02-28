import { Exercise, Question, Exam, ExamTemplate } from "@/types";
import { placeholderImages } from "@/lib/placeholder-images";

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

// ---------------------------------------------------------------------------
// Mock exercise library
// ---------------------------------------------------------------------------
const mockExercises: Exercise[] = [
  // --- Legacy exercises (general motivation types) ---
  {
    id: "ex1",
    title: "Algebra Confidence Check",
    type: "rating_scale",
    instructions: "Rate your confidence in solving basic algebraic equations from 1 to 10.",
    content: "",
    tags: ["math", "algebra", "self-assessment"],
    createdAt: daysAgo(30),
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
    createdAt: daysAgo(28),
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
    createdAt: daysAgo(25),
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
  // --- Part-8 DIFFERENCES exercises ---
  {
    id: "diff-city-nature",
    title: "City vs Nature",
    type: "differences",
    instructions:
      "Look carefully at both outdoor scenes. Find and write down all the differences you can spot between Image 1 and Image 2. Try to find at least 7 differences.",
    content: "",
    tags: ["visual", "differences", "observation", "outdoor"],
    createdAt: daysAgo(10),
    question: {
      id: "diff-city-nature-q",
      examId: "",
      type: "differences",
      text: "Look carefully at both outdoor scenes. Find and write down all the differences you can spot between Image 1 and Image 2.",
      required: true,
      order: 1,
      differenceImages: {
        image1Url: placeholderImages.garden2A,
        image2Url: placeholderImages.garden2B,
      },
      expectedAnswerNotes:
        "6 differences: sun position, cloud removed, door colour red→blue, tree removed, flower colour orange→purple, birds added.",
    },
  },
  {
    id: "diff-kitchen",
    title: "Kitchen Scene",
    type: "differences",
    instructions:
      "Study both kitchen images carefully. Write a list of every difference you notice. There are 5 differences to find.",
    content: "",
    tags: ["visual", "differences", "observation", "kitchen"],
    createdAt: daysAgo(8),
    question: {
      id: "diff-kitchen-q",
      examId: "",
      type: "differences",
      text: "Study both kitchen images carefully. Write a list of every difference you notice. There are 5 differences to find.",
      required: true,
      order: 1,
      differenceImages: {
        image1Url: placeholderImages.kitchen3A,
        image2Url: placeholderImages.kitchen3B,
      },
      expectedAnswerNotes:
        "5 differences: curtains added to window, fridge colour white→beige, 3 cups reduced to 2, green pear removed, wall clock added.",
    },
  },
  {
    id: "diff-classroom",
    title: "Classroom Setup",
    type: "differences",
    instructions:
      "Compare the two classroom images below. Find and describe 6 differences between them.",
    content: "",
    tags: ["visual", "differences", "observation", "classroom"],
    createdAt: daysAgo(5),
    question: {
      id: "diff-classroom-q",
      examId: "",
      type: "differences",
      text: "Compare the two classroom images below. Find and describe 6 differences between them.",
      required: true,
      order: 1,
      differenceImages: {
        image1Url: placeholderImages.classroom4A,
        image2Url: placeholderImages.classroom4B,
      },
      expectedAnswerNotes:
        "6 differences: chalkboard colour green→dark, 3 desks→2 desks, clock removed, apple added on teacher's desk, bookshelf has fewer books, extra small window added.",
    },
  },
  // --- Legacy differences exercises from first build ---
  {
    id: "diff-ex1",
    title: "Spot the Differences — Living Room",
    type: "differences",
    instructions:
      "Look carefully at both images of the living room. Find and describe all the differences you can see between Image 1 and Image 2.",
    content: "",
    tags: ["visual", "differences", "observation"],
    createdAt: daysAgo(15),
    question: {
      id: "diff-ex1-q",
      examId: "",
      type: "differences",
      text: "Look carefully at both images of the living room. Find and describe all the differences you can see between Image 1 and Image 2.",
      required: true,
      order: 1,
      differenceImages: {
        image1Url: placeholderImages.room1A,
        image2Url: placeholderImages.room1B,
      },
      expectedAnswerNotes:
        "5 differences: sofa colour, lamp position, green painting, window divider, bookshelf vs plant.",
    },
  },
  {
    id: "diff-ex2",
    title: "Spot the Differences — Garden Scene",
    type: "differences",
    instructions:
      "Examine both garden images carefully. Write down every difference you notice between the two pictures.",
    content: "",
    tags: ["visual", "differences", "observation", "nature"],
    createdAt: daysAgo(12),
    question: {
      id: "diff-ex2-q",
      examId: "",
      type: "differences",
      text: "Examine both garden images carefully. Write down every difference you notice between the two pictures.",
      required: true,
      order: 1,
      differenceImages: {
        image1Url: placeholderImages.garden2A,
        image2Url: placeholderImages.garden2B,
      },
      expectedAnswerNotes:
        "6 differences: sun position, cloud removed, door colour, tree removed, flower colour, birds added.",
    },
  },
];

const mockTemplates: ExamTemplate[] = [];

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------
export const exerciseLibraryService = {
  getAllExercises: async (): Promise<Exercise[]> => {
    await new Promise((r) => setTimeout(r, 200));
    return [...mockExercises];
  },

  getExerciseById: async (id: string): Promise<Exercise | null> => {
    await new Promise((r) => setTimeout(r, 150));
    return mockExercises.find((ex) => ex.id === id) ?? null;
  },

  getExercisesByIds: async (ids: string[]): Promise<Exercise[]> => {
    await new Promise((r) => setTimeout(r, 150));
    return ids
      .map((id) => mockExercises.find((ex) => ex.id === id))
      .filter((ex): ex is Exercise => ex !== undefined);
  },

  searchExercisesByTag: async (tag: string): Promise<Exercise[]> => {
    await new Promise((r) => setTimeout(r, 200));
    return mockExercises.filter((ex) => ex.tags.includes(tag));
  },

  createExercise: async (
    exercise: Omit<Exercise, "id" | "createdAt"> & { question: Question }
  ): Promise<Exercise> => {
    await new Promise((r) => setTimeout(r, 300));
    const newExercise: Exercise = {
      ...exercise,
      id: `ex-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    mockExercises.push(newExercise);
    return newExercise;
  },

  updateExercise: async (id: string, updates: Partial<Exercise>): Promise<Exercise | null> => {
    await new Promise((r) => setTimeout(r, 300));
    const idx = mockExercises.findIndex((ex) => ex.id === id);
    if (idx === -1) return null;
    mockExercises[idx] = { ...mockExercises[idx], ...updates };
    return mockExercises[idx];
  },

  deleteExercise: async (id: string): Promise<{ ok: boolean; reason?: string }> => {
    await new Promise((r) => setTimeout(r, 300));
    const idx = mockExercises.findIndex((ex) => ex.id === id);
    if (idx === -1) return { ok: false, reason: "Exercise not found." };
    mockExercises.splice(idx, 1);
    return { ok: true };
  },

  // Templates
  getTemplates: async (): Promise<ExamTemplate[]> => {
    await new Promise((r) => setTimeout(r, 200));
    return [...mockTemplates];
  },

  createTemplateFromExam: async (exam: Exam): Promise<ExamTemplate> => {
    await new Promise((r) => setTimeout(r, 300));
    const template: ExamTemplate = {
      id: `tmpl-${Date.now()}`,
      title: exam.title,
      description: exam.description,
      teacherId: exam.teacherId,
      createdAt: new Date().toISOString(),
      exerciseIds: exam.exerciseIds ?? exam.questions.map((q) => q.id),
    };
    mockTemplates.push(template);
    return template;
  },

  getTemplateById: async (templateId: string): Promise<ExamTemplate | null> => {
    await new Promise((r) => setTimeout(r, 200));
    return mockTemplates.find((t) => t.id === templateId) ?? null;
  },
};
