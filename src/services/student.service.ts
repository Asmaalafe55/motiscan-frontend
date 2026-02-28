import { User } from "@/types";

const mockStudents: User[] = [
  { id: "student1", email: "student1@motiscan.com", name: "Noa Avraham",    role: "student" },
  { id: "student2", email: "student2@motiscan.com", name: "Ethan Ben-David", role: "student" },
  { id: "student3", email: "student3@motiscan.com", name: "Maya Shalom",     role: "student" },
  { id: "sara",     email: "sara@test.com",          name: "Sara Cohen",      role: "student" },
  { id: "ahmed",    email: "ahmed@test.com",          name: "Ahmed Khalil",    role: "student" },
  { id: "maya",     email: "maya@test.com",           name: "Maya Levi",       role: "student" },
  { id: "omar",     email: "omar@test.com",           name: "Omar Hassan",     role: "student" },
];

export const studentService = {
  getAllStudents: async (): Promise<User[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockStudents;
  },

  getStudentById: async (studentId: string): Promise<User | null> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockStudents.find((s) => s.id === studentId) || null;
  },

  getStudentsByIds: async (ids: string[]): Promise<User[]> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockStudents.filter((s) => ids.includes(s.id));
  },
};
