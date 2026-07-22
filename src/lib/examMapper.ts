import type { Exam, Exercise, Question } from "@/types";
import { resolveDifferenceImages, resolveMediaUrl } from "@/lib/mediaUrl";

export interface ApiExam {
  id: string;
  title: string;
  description?: string | null;
  teacherId: string;
  isLive: boolean;
  isTemplate?: boolean;
  duration?: number | null;
  createdAt: string;
  exerciseCount?: number;
  hasSubmitted?: boolean;
}

export interface ApiExamExercise {
  examId: string;
  exerciseId: string;
  order: number;
  required?: boolean;
  /** Present when exam detail endpoints embed full exercise bodies */
  exercise?: {
    id: string;
    type: Exercise["type"];
    title: string;
    instructions: string;
    content?: string | null;
    tags?: string[];
    question?: Partial<Question>;
    createdAt: string;
  };
}

export function mapApiExercise(row: {
  id: string;
  type: Exercise["type"];
  title: string;
  instructions: string;
  content?: string | null;
  tags?: string[];
  question?: Partial<Question>;
  createdAt: string;
}): Exercise {
  const raw = row.question ?? {};
  const question: Partial<Question> = { ...raw };

  if (raw.differenceImages) {
    question.differenceImages = resolveDifferenceImages(raw.differenceImages);
  }

  if (raw.shapeCopyConfig?.rows) {
    question.shapeCopyConfig = {
      ...raw.shapeCopyConfig,
      rows: raw.shapeCopyConfig.rows.map((row) => ({
        ...row,
        model_snapshot: resolveMediaUrl(row.model_snapshot),
      })),
    };
  }

  if (raw.analyticalPerceptionConfig?.cells) {
    question.analyticalPerceptionConfig = {
      ...raw.analyticalPerceptionConfig,
      cells: raw.analyticalPerceptionConfig.cells.map((cell) => ({
        ...cell,
        design_svg: resolveMediaUrl(cell.design_svg),
        section_svg: resolveMediaUrl(cell.section_svg),
      })),
    };
  }

  return {
    id: row.id,
    title: row.title,
    type: row.type,
    instructions: row.instructions,
    content: row.content ?? undefined,
    tags: row.tags ?? [],
    createdAt: row.createdAt,
    question: {
      ...question,
      id: (question.id as string) ?? row.id,
      examId: (question.examId as string) ?? "",
      type: row.type,
      text: (question.text as string) ?? row.instructions,
      required: question.required ?? true,
      order: (question.order as number) ?? 1,
    } as Question,
  };
}

export function exerciseToQuestion(
  exercise: Exercise,
  examId: string,
  order: number,
  required = true
): Question {
  return {
    ...exercise.question,
    id: exercise.id,
    examId,
    type: exercise.type,
    text: exercise.instructions,
    required,
    order,
  };
}

export function buildExam(
  exam: ApiExam,
  exerciseLinks: ApiExamExercise[],
  exercises: Exercise[],
  assignedStudentIds: string[] = []
): Exam {
  const sorted = [...exerciseLinks].sort((a, b) => a.order - b.order);
  const questions: Question[] = sorted
    .map((link) => {
      const ex = exercises.find((e) => e.id === link.exerciseId);
      if (!ex) return null;
      return exerciseToQuestion(ex, exam.id, link.order, link.required ?? true);
    })
    .filter((q): q is Question => q !== null);

  return {
    id: exam.id,
    title: exam.title,
    description: exam.description ?? "",
    teacherId: exam.teacherId,
    createdAt: exam.createdAt,
    isLive: exam.isLive,
    hasSubmitted: exam.hasSubmitted ?? false,
    duration: exam.duration ?? undefined,
    exerciseIds: sorted.map((l) => l.exerciseId),
    assignedStudentIds,
    questions,
  };
}
