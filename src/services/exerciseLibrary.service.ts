import { Exercise, Question, Exam, ExamTemplate, ShapeCopyConfig } from "@/types";
import { placeholderImages } from "@/lib/placeholder-images";

// ---------------------------------------------------------------------------
// SVG helper — generates a data URI for simple model shapes
// ---------------------------------------------------------------------------

function svgDataUri(svgBody: string, w = 400, h = 300): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#f8f8f8"/>${svgBody}</svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// Mock model snapshots (SVG data URIs)
const modelBlueTriangle = svgDataUri(
  `<polygon points="200,60 320,240 80,240" fill="#3b82f6" stroke="#1e40af" stroke-width="3"/>`
);
const modelThreeCircles = svgDataUri(
  `<circle cx="200" cy="80" r="35" fill="#1a1a1a" stroke="#1a1a1a"/>
   <circle cx="200" cy="160" r="35" fill="#1a1a1a" stroke="#1a1a1a"/>
   <circle cx="200" cy="240" r="35" fill="#1a1a1a" stroke="#1a1a1a"/>`
);
const modelRedRectangle = svgDataUri(
  `<rect x="80" y="90" width="240" height="120" fill="#ef4444" stroke="#b91c1c" stroke-width="3"/>`
);
const modelDiamondGreen = svgDataUri(
  `<polygon points="200,50 330,150 200,250 70,150" fill="#22c55e" stroke="#15803d" stroke-width="3"/>`
);

// ---------------------------------------------------------------------------
// Mock SHAPE_COPY exercise configs
// ---------------------------------------------------------------------------

const shapeCopyBasicConfig: ShapeCopyConfig = {
  rows: [
    {
      row_number: 1,
      model_snapshot: modelBlueTriangle,
      figureA_rules: [
        { rule: "shape", required: true },
        { rule: "size", required: false },
        { rule: "color", required: true },
        { rule: "number", required: false },
      ],
      figureB_rules: [
        { rule: "shape", required: true },
        { rule: "size", required: true },
        { rule: "color", required: false },
        { rule: "number", required: false },
      ],
      teacher_notes: "Model is a filled blue triangle. Figure A must match shape and color. Figure B must match shape and size.",
    },
    {
      row_number: 2,
      model_snapshot: modelThreeCircles,
      figureA_rules: [
        { rule: "shape", required: true },
        { rule: "size", required: false },
        { rule: "color", required: false },
        { rule: "number", required: true },
      ],
      figureB_rules: [
        { rule: "shape", required: false },
        { rule: "size", required: false },
        { rule: "color", required: true },
        { rule: "number", required: true },
      ],
      teacher_notes: "Model shows 3 stacked black circles. Figure A must match shape and number. Figure B must match color and number.",
    },
  ],
};

const shapeCopyChallengeConfig: ShapeCopyConfig = {
  rows: [
    {
      row_number: 1,
      model_snapshot: modelRedRectangle,
      figureA_rules: [
        { rule: "shape", required: true },
        { rule: "size", required: true },
        { rule: "color", required: false },
        { rule: "number", required: false },
      ],
      figureB_rules: [
        { rule: "shape", required: true },
        { rule: "size", required: false },
        { rule: "color", required: true },
        { rule: "number", required: false },
      ],
      teacher_notes: "Model is a red filled rectangle. Figure A: match shape and size. Figure B: match shape and color.",
    },
    {
      row_number: 2,
      model_snapshot: modelDiamondGreen,
      figureA_rules: [
        { rule: "shape", required: true },
        { rule: "size", required: false },
        { rule: "color", required: true },
        { rule: "number", required: true },
      ],
      figureB_rules: [
        { rule: "shape", required: false },
        { rule: "size", required: true },
        { rule: "color", required: true },
        { rule: "number", required: false },
      ],
      teacher_notes: "Model is a green diamond. Figure A: shape, color, number. Figure B: size and color.",
    },
  ],
};

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

// ---------------------------------------------------------------------------
// Mock exercise library — DIFFERENCES type only
// ---------------------------------------------------------------------------
const mockExercises: Exercise[] = [
  {
    id: "diff-city-nature",
    title: "City vs Nature",
    type: "differences",
    instructions:
      "Look carefully at both outdoor scenes. Find and write down all the differences you can spot between Image 1 and Image 2. Try to find at least 6 differences.",
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
  {
    id: "sc-basic",
    title: "Copy the Shape — Basic",
    type: "shape_copy",
    instructions:
      "Look at the sample picture. In each of the two frames in the same row make a drawing that is the same as the sample only in those aspects indicated by the blue words.",
    content: "",
    tags: ["drawing", "shape-copy", "rule-compliance", "visual"],
    createdAt: daysAgo(3),
    question: {
      id: "sc-basic-q",
      examId: "",
      type: "shape_copy",
      text: "Look at the sample picture. In each of the two frames in the same row make a drawing that is the same as the sample only in those aspects indicated by the blue words.",
      required: true,
      order: 1,
      shapeCopyConfig: shapeCopyBasicConfig,
    },
  },
  {
    id: "sc-challenge",
    title: "Shape and Size Challenge",
    type: "shape_copy",
    instructions:
      "Study the model in each row carefully. Recreate it in Figure A and Figure B, following only the rules highlighted in blue for each figure.",
    content: "",
    tags: ["drawing", "shape-copy", "size", "color", "challenge"],
    createdAt: daysAgo(1),
    question: {
      id: "sc-challenge-q",
      examId: "",
      type: "shape_copy",
      text: "Study the model in each row carefully. Recreate it in Figure A and Figure B, following only the rules highlighted in blue for each figure.",
      required: true,
      order: 1,
      shapeCopyConfig: shapeCopyChallengeConfig,
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
