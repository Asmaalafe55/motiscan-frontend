import { User } from "@/types";

const mockStudents: User[] = [
  { id: "sara",  email: "sara@test.com",  name: "Sara Cohen",   role: "student" },
  { id: "ahmed", email: "ahmed@test.com", name: "Ahmed Khalil", role: "student" },
  { id: "maya",  email: "maya@test.com",  name: "Maya Levi",    role: "student" },
  { id: "omar",  email: "omar@test.com",  name: "Omar Hassan",  role: "student" },
];

export const studentService = {
  getAllStudents: async (): Promise<User[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return [...mockStudents];
  },

  getStudentById: async (studentId: string): Promise<User | null> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockStudents.find((s) => s.id === studentId) || null;
  },

  getStudentsByIds: async (ids: string[]): Promise<User[]> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockStudents.filter((s) => ids.includes(s.id));
  },

  createStudent: async (
    data: Pick<User, "email" | "name"> & Partial<Pick<User, "phone" | "grade" | "avatarUrl">>
  ): Promise<User> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const existing = mockStudents.find((s) => s.email === data.email);
    if (existing) throw new Error("Email already exists");
    const newStudent: User = {
      id: `student-${Date.now()}`,
      role: "student",
      ...data,
    };
    mockStudents.push(newStudent);
    return newStudent;
  },

  updateStudent: async (
    studentId: string,
    updates: Partial<Omit<User, "id" | "email" | "role" | "password">>
  ): Promise<User | null> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const idx = mockStudents.findIndex((s) => s.id === studentId);
    if (idx === -1) return null;
    mockStudents[idx] = { ...mockStudents[idx], ...updates };
    return mockStudents[idx];
  },

  deleteStudent: async (studentId: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const idx = mockStudents.findIndex((s) => s.id === studentId);
    if (idx === -1) return false;
    mockStudents.splice(idx, 1);
    return true;
  },
};
