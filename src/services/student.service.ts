import { User } from "@/types";
import { api } from "@/lib/api";

interface StudentsResponse {
  students: User[];
}

export const studentService = {
  getAllStudents: async (): Promise<User[]> => {
    const data = await api.get<StudentsResponse>("/api/students?limit=100");
    return data.students;
  },

  getStudentById: async (studentId: string): Promise<User | null> => {
    try {
      return await api.get<User>(`/api/students/${studentId}`);
    } catch {
      return null;
    }
  },

  getStudentsByIds: async (ids: string[]): Promise<User[]> => {
    const results = await Promise.all(ids.map((id) => studentService.getStudentById(id)));
    return results.filter((s): s is User => s !== null);
  },

  createStudent: async (
    data: Pick<User, "email" | "name"> & Partial<Pick<User, "phone" | "grade" | "avatarUrl">>
  ): Promise<User> => {
    return api.post<User>("/api/students", data);
  },

  updateStudent: async (
    studentId: string,
    updates: Partial<Omit<User, "id" | "email" | "role" | "password">>
  ): Promise<User | null> => {
    try {
      return await api.put<User>(`/api/students/${studentId}`, updates);
    } catch {
      return null;
    }
  },

  deleteStudent: async (studentId: string): Promise<boolean> => {
    try {
      await api.delete(`/api/students/${studentId}`);
      return true;
    } catch {
      return false;
    }
  },

  sendPasswordReset: async (studentId: string): Promise<string> => {
    const data = await api.post<{ message: string }>(
      `/api/students/${studentId}/send-password-reset`
    );
    return data.message;
  },
};
