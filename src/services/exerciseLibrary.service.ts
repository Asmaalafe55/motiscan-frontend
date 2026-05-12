import { Exercise, Question, Exam, ExamTemplate, ShapeCopyConfig, AnalyticalPerceptionConfig } from "@/types";
import { placeholderImages } from "@/lib/placeholder-images";
import { MOCK_DESIGN_SVGS, MOCK_SECTION_SVGS } from "@/components/exercises/analytical/ShapeSVGs";

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
// Mock ANALYTICAL_PERCEPTION configs (declared early, before mockExercises)
// ---------------------------------------------------------------------------

const apBasicConfig: AnalyticalPerceptionConfig = {
  grid_size: "2x4",
  cells: [
    // A1: Diamond with inner diamond → 4 triangular wedge sections between outer and inner diamond
    { cell_label: "A1", design_svg: MOCK_DESIGN_SVGS.diamondInner, section_svg: MOCK_SECTION_SVGS.triangle,      correct_answer: 4, teacher_notes: "4 triangular wedge sections between the outer and inner diamond." },
    // A2: Square with X + cross → 8 triangular sections total
    { cell_label: "A2", design_svg: MOCK_DESIGN_SVGS.squareX,      section_svg: MOCK_SECTION_SVGS.triangle,      correct_answer: 8, teacher_notes: "X + cross lines divide the square into 8 triangular sections." },
    // A3: Rectangle with 2 ovals → closed oval section, answer = 2
    { cell_label: "A3", design_svg: MOCK_DESIGN_SVGS.rectOvals,    section_svg: MOCK_SECTION_SVGS.oval,           correct_answer: 2, teacher_notes: "2 oval shapes inside the rectangle." },
    // A4: Triangle with 2 inner triangles → 3 triangles total
    { cell_label: "A4", design_svg: MOCK_DESIGN_SVGS.triangleInner,section_svg: MOCK_SECTION_SVGS.triangle,      correct_answer: 3, teacher_notes: "3 nested triangles: outer + 2 inner." },
    // B1: Rectangle with 3 oval columns → closed oval section, answer = 3
    { cell_label: "B1", design_svg: MOCK_DESIGN_SVGS.rectColumns,  section_svg: MOCK_SECTION_SVGS.oval,           correct_answer: 3, teacher_notes: "3 oval column shapes inside the rectangle." },
    // B2: Parallelogram with inner parallelogram → 2 parallelograms
    { cell_label: "B2", design_svg: MOCK_DESIGN_SVGS.parallelogram,section_svg: MOCK_SECTION_SVGS.parallelogram,  correct_answer: 2, teacher_notes: "2 parallelogram shapes (outer + inner)." },
    // B3: Circle with 5 small circles on hexagon vertices → 5 small circles
    { cell_label: "B3", design_svg: MOCK_DESIGN_SVGS.circleHex,    section_svg: MOCK_SECTION_SVGS.circle,         correct_answer: 5, teacher_notes: "5 small circles placed at the hexagon vertices." },
    // B4: 3 overlapping rectangles → closed rectangle section, answer = 3
    { cell_label: "B4", design_svg: MOCK_DESIGN_SVGS.overlapRects, section_svg: MOCK_SECTION_SVGS.rect,           correct_answer: 3, teacher_notes: "3 overlapping rectangles." },
  ],
};

const apChallengeConfig: AnalyticalPerceptionConfig = {
  grid_size: "2x3",
  cells: [
    // A1: Concentric squares → 4 squares
    { cell_label: "A1", design_svg: MOCK_DESIGN_SVGS.concentricSquares, section_svg: MOCK_SECTION_SVGS.square,   correct_answer: 4,  teacher_notes: "4 concentric squares." },
    // A2: Star/asterisk (6 lines through circle) → 12 triangular segments, section is closed triangle
    { cell_label: "A2", design_svg: MOCK_DESIGN_SVGS.star,              section_svg: MOCK_SECTION_SVGS.triangle, correct_answer: 12, teacher_notes: "6 lines through a circle create 12 triangular segments." },
    // A3: Dot grid 4×4 → 16 circle dots
    { cell_label: "A3", design_svg: MOCK_DESIGN_SVGS.dotGrid,           section_svg: MOCK_SECTION_SVGS.circle,   correct_answer: 16, teacher_notes: "4×4 dot grid = 16 circular dots." },
    // B1: Zigzag rows → 5 rows of chevrons, section is a closed chevron shape
    { cell_label: "B1", design_svg: MOCK_DESIGN_SVGS.zigzag,            section_svg: MOCK_SECTION_SVGS.chevron,  correct_answer: 5,  teacher_notes: "5 rows of chevron/zigzag lines." },
    // B2: Triangle with inner triangles → 3 triangles
    { cell_label: "B2", design_svg: MOCK_DESIGN_SVGS.triangleInner,     section_svg: MOCK_SECTION_SVGS.triangle, correct_answer: 3,  teacher_notes: "3 triangles (outer + 2 inner)." },
    // B3: Rectangle with 2 ovals → closed oval section, answer = 2
    { cell_label: "B3", design_svg: MOCK_DESIGN_SVGS.rectOvals,         section_svg: MOCK_SECTION_SVGS.oval,     correct_answer: 2,  teacher_notes: "2 oval shapes inside rectangle." },
  ],
};

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
    id: "priority-order-your-tasks",
    title: "Order Your Tasks",
    type: "priority_sort",
    instructions:
      "Look at the tasks below and drag them into the order that feels most important to you right now. 1 is the most important, and 6 is the least.",
    content: "",
    tags: ["motivation", "priorities", "self_reflection"],
    createdAt: daysAgo(2),
    question: {
      id: "priority-order-your-tasks-q",
      examId: "",
      type: "priority_sort",
      text: "Drag each task into the ranking from 1 (most important) to 6 (least important) based on what matters to you right now.",
      required: true,
      order: 1,
      prioritySortData: {
        tasks: [
          { id: "finish-homework", title: "Finish Homework", icon: "📚" },
          { id: "help-a-friend", title: "Help a Friend", icon: "🤝" },
          { id: "study-for-exam", title: "Study for Exam", icon: "📝" },
          { id: "sports-activity", title: "Sports Activity", icon: "⚽" },
          { id: "family-time", title: "Family Time", icon: "🏠" },
          { id: "free-reading", title: "Free Reading", icon: "📖" },
        ],
      },
      expectedAnswerNotes:
        "No single correct order. The ranking reflects how the student currently prioritises academic work, relationships, leisure, and family time.",
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
  {
    id: "ap-basic",
    title: "Shape Recognition — Basic",
    type: "analytical_perception",
    instructions:
      "On each line write the number of times that the section next to it appears in the design.",
    content: "",
    tags: ["analytical", "perception", "visual", "counting", "shapes"],
    createdAt: daysAgo(2),
    question: {
      id: "ap-basic-q",
      examId: "",
      type: "analytical_perception",
      text: "On each line write the number of times that the section next to it appears in the design.",
      required: true,
      order: 1,
      analyticalPerceptionConfig: apBasicConfig,
    },
  },
  {
    id: "ap-challenge",
    title: "Complex Pattern Analysis",
    type: "analytical_perception",
    instructions:
      "On each line write the number of times that the section next to it appears in the design.",
    content: "",
    tags: ["analytical", "perception", "visual", "complex", "patterns"],
    createdAt: daysAgo(0),
    question: {
      id: "ap-challenge-q",
      examId: "",
      type: "analytical_perception",
      text: "On each line write the number of times that the section next to it appears in the design.",
      required: true,
      order: 1,
      analyticalPerceptionConfig: apChallengeConfig,
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
