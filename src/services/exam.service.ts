import { Exam, ExamSubmission, Answer } from "@/types";
import { api } from "@/lib/api";
import {
  ApiExam,
  ApiExamExercise,
  buildExam,
} from "@/lib/examMapper";
import { exerciseLibraryService } from "./exerciseLibrary.service";
import { getSocket } from "@/lib/socket";

interface ExamsListResponse {
  exams: ApiExam[];
}

interface ExamDetailResponse {
  exam: ApiExam;
  exercises: ApiExamExercise[];
  assignedStudentIds?: string[];
}

interface SubmissionsResponse {
  submissions: ExamSubmission[];
}

async function loadFullExam(
  exam: ApiExam,
  exerciseLinks: ApiExamExercise[],
  assignedStudentIds: string[] = []
): Promise<Exam> {
  const ids = exerciseLinks.map((l) => l.exerciseId);
  const exercises = await exerciseLibraryService.getExercisesByIds(ids);
  return buildExam(exam, exerciseLinks, exercises, assignedStudentIds);
}

function summaryExam(exam: ApiExam): Exam {
  const count = exam.exerciseCount ?? 0;
  return {
    id: exam.id,
    title: exam.title,
    description: exam.description ?? "",
    teacherId: exam.teacherId,
    createdAt: exam.createdAt,
    isLive: exam.isLive,
    duration: exam.duration ?? undefined,
    exerciseIds: [],
    assignedStudentIds: [],
    questions: Array.from({ length: count }, (_, i) => ({
      id: `summary-${exam.id}-${i}`,
      examId: exam.id,
      type: "differences" as const,
      text: "",
      required: true,
      order: i + 1,
    })),
  };
}

export const examService = {
  getAllExams: async (_teacherId?: string): Promise<Exam[]> => {
    const data = await api.get<ExamsListResponse>("/api/exams");
    return data.exams.map(summaryExam);
  },

  getExamById: async (examId: string): Promise<Exam | null> => {
    try {
      const data = await api.get<ExamDetailResponse>(`/api/exams/${examId}`);
      return loadFullExam(data.exam, data.exercises, data.assignedStudentIds ?? []);
    } catch {
      return null;
    }
  },

  getLiveExams: async (): Promise<Exam[]> => {
    const data = await api.get<ExamsListResponse>("/api/exams");
    return data.exams.filter((e) => e.isLive).map(summaryExam);
  },

  getLiveExamsForStudent: async (_studentId: string): Promise<Exam[]> => {
    const data = await api.get<ExamsListResponse>("/api/student/exams");
    return data.exams.map(summaryExam);
  },

  getExamsForStudent: async (_studentId: string): Promise<Exam[]> => {
    return examService.getLiveExamsForStudent(_studentId);
  },

  getExamForStudent: async (examId: string): Promise<Exam | null> => {
    try {
      const data = await api.get<ExamDetailResponse>(`/api/student/exams/${examId}`);
      return loadFullExam(data.exam, data.exercises);
    } catch {
      return null;
    }
  },

  createExam: async (exam: Omit<Exam, "id" | "createdAt" | "isLive">): Promise<Exam> => {
    const exercises = (exam.exerciseIds ?? []).map((exerciseId, index) => ({
      exerciseId,
      order: index + 1,
      required: true,
    }));

    const data = await api.post<ExamDetailResponse>("/api/exams", {
      title: exam.title,
      description: exam.description,
      exercises,
      assignedStudentIds: exam.assignedStudentIds ?? [],
    });

    return loadFullExam(data.exam, data.exercises, data.assignedStudentIds ?? []);
  },

  updateExam: async (examId: string, updates: Partial<Exam>): Promise<Exam | null> => {
    const current = await examService.getExamById(examId);
    if (!current) return null;

    const merged = { ...current, ...updates };
    const exercises = (merged.exerciseIds ?? []).map((exerciseId, index) => ({
      exerciseId,
      order: index + 1,
      required: true,
    }));

    const data = await api.put<ExamDetailResponse>(`/api/exams/${examId}`, {
      title: merged.title,
      description: merged.description,
      isLive: merged.isLive,
      isTemplate: false,
      duration: merged.duration ?? null,
      exercises,
      assignedStudentIds: merged.assignedStudentIds ?? [],
    });

    return loadFullExam(data.exam, data.exercises, data.assignedStudentIds ?? []);
  },

  // Append students to an existing exam without replacing current assignments.
  // Returns the full, updated list of assigned student ids.
  addStudentsToExam: async (examId: string, studentIds: string[]): Promise<string[]> => {
    const data = await api.post<{ assignedStudentIds: string[] }>(
      `/api/exams/${examId}/students`,
      { studentIds }
    );
    return data.assignedStudentIds ?? [];
  },

  openLiveSession: async (examId: string): Promise<Exam | null> => {
    const updated = await examService.updateExam(examId, { isLive: true });
    if (updated) {
      getSocket().emit("teacher:openSession", { examId });
    }
    return updated;
  },

  closeLiveSession: async (examId: string): Promise<Exam | null> => {
    getSocket().emit("teacher:closeSession", { examId });
    return examService.updateExam(examId, { isLive: false });
  },

  submitExam: async (
    examId: string,
    studentId: string,
    answers: Answer[],
    timeSpent: number
  ): Promise<ExamSubmission> => {
    getSocket().emit("student:submit");
    // The submission is persisted/finalized via submissionService inside the
    // exam page; this local record is only used for the immediate UI response.
    return {
      id: `sub-${Date.now()}`,
      examId,
      studentId,
      answers,
      submittedAt: new Date().toISOString(),
      timeSpent,
    };
  },

  // Teacher: all of a single student's submitted exams (across this teacher's exams).
  getSubmissionsForStudent: async (studentId: string): Promise<ExamSubmission[]> => {
    const data = await api.get<SubmissionsResponse>(
      `/api/submissions?studentId=${encodeURIComponent(studentId)}`
    );
    return data.submissions;
  },

  // Teacher: all submissions for a single exam.
  getSubmissionsForExam: async (examId: string): Promise<ExamSubmission[]> => {
    const data = await api.get<SubmissionsResponse>(
      `/api/submissions?examId=${encodeURIComponent(examId)}`
    );
    return data.submissions;
  },

  // Teacher: every submitted submission across all of this teacher's exams.
  getAllSubmissions: async (): Promise<ExamSubmission[]> => {
    const data = await api.get<SubmissionsResponse>("/api/submissions");
    return data.submissions;
  },

  // Student: the logged-in student's own submitted exams.
  getMySubmissions: async (): Promise<ExamSubmission[]> => {
    const data = await api.get<SubmissionsResponse>("/api/submissions/mine");
    return data.submissions;
  },

  hasStudentSubmitted: async (examId: string, studentId: string): Promise<boolean> => {
    const data = await api.get<SubmissionsResponse>(
      `/api/submissions?examId=${encodeURIComponent(examId)}&studentId=${encodeURIComponent(studentId)}`
    );
    return data.submissions.length > 0;
  },
};
