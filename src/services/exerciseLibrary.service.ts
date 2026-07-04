import { Exercise, Exam, ExamTemplate, Question } from "@/types";
import { api, ApiError } from "@/lib/api";
import { mapApiExercise } from "@/lib/examMapper";

interface ExercisesResponse {
  exercises: Exercise[];
}

interface ExerciseResponse {
  exercise: Exercise;
}

export const exerciseLibraryService = {
  getAllExercises: async (): Promise<Exercise[]> => {
    const data = await api.get<ExercisesResponse>("/api/exercises");
    return data.exercises.map((ex) => mapApiExercise(ex));
  },

  getExerciseById: async (id: string): Promise<Exercise | null> => {
    try {
      const data = await api.get<ExerciseResponse>(`/api/exercises/${id}`);
      return mapApiExercise(data.exercise);
    } catch {
      return null;
    }
  },

  getExercisesByIds: async (ids: string[]): Promise<Exercise[]> => {
    const results = await Promise.all(ids.map((id) => exerciseLibraryService.getExerciseById(id)));
    return results.filter((ex): ex is Exercise => ex !== null);
  },

  searchExercisesByTag: async (tag: string): Promise<Exercise[]> => {
    const all = await exerciseLibraryService.getAllExercises();
    return all.filter((ex) => ex.tags.includes(tag));
  },

  createExercise: async (
    exercise: Omit<Exercise, "id" | "createdAt"> & { question: Question }
  ): Promise<Exercise> => {
    const data = await api.post<ExerciseResponse>("/api/exercises", {
      type: exercise.type,
      title: exercise.title,
      instructions: exercise.instructions,
      content: exercise.content,
      tags: exercise.tags,
      question: exercise.question,
    });
    return mapApiExercise(data.exercise);
  },

  updateExercise: async (id: string, updates: Partial<Exercise>): Promise<Exercise | null> => {
    try {
      const current = await exerciseLibraryService.getExerciseById(id);
      if (!current) return null;

      const data = await api.put<ExerciseResponse>(`/api/exercises/${id}`, {
        type: updates.type ?? current.type,
        title: updates.title ?? current.title,
        instructions: updates.instructions ?? current.instructions,
        content: updates.content ?? current.content,
        tags: updates.tags ?? current.tags,
        question: updates.question ?? current.question,
      });
      return mapApiExercise(data.exercise);
    } catch {
      return null;
    }
  },

  deleteExercise: async (id: string): Promise<{ ok: boolean; reason?: string }> => {
    try {
      await api.delete(`/api/exercises/${id}`);
      return { ok: true };
    } catch (err) {
      if (err instanceof ApiError) {
        return { ok: false, reason: err.message };
      }
      return { ok: false, reason: "Failed to delete exercise." };
    }
  },

  // Templates — not yet backed by API
  getTemplates: async (): Promise<ExamTemplate[]> => [],

  createTemplateFromExam: async (exam: Exam): Promise<ExamTemplate> => ({
    id: `tmpl-${Date.now()}`,
    title: exam.title,
    description: exam.description,
    teacherId: exam.teacherId,
    createdAt: new Date().toISOString(),
    exerciseIds: exam.exerciseIds ?? exam.questions.map((q) => q.id),
  }),

  getTemplateById: async (_templateId: string): Promise<ExamTemplate | null> => null,
};
