import type { Exam, Exercise, Question } from "@/types";

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
}

export interface ApiExamExercise {
  examId: string;
  exerciseId: string;
  order: number;
  required?: boolean;
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
  const question = row.question ?? {};
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
    duration: exam.duration ?? undefined,
    exerciseIds: sorted.map((l) => l.exerciseId),
    assignedStudentIds,
    questions,
  };
}
