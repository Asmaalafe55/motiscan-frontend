import { User } from "@/types";

const mockStudents: User[] = [
  {
    id: "student1",
    email: "student1@motiscan.com",
    name: "Noa Avraham",
    role: "student",
  },
  {
    id: "student2",
    email: "student2@motiscan.com",
    name: "Ethan Ben-David",
    role: "student",
  },
  {
    id: "student3",
    email: "student3@motiscan.com",
    name: "Maya Shalom",
    role: "student",
  },
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
};
