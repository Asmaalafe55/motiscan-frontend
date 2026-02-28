import { User, UserRole } from "@/types";

// Mock users database
const mockUsers: User[] = [
  // --- Teachers ---
  {
    id: "teacher1",
    email: "teacher1@motiscan.com",
    name: "Sarah Cohen",
    role: "teacher",
    password: "teacher123",
  },
  {
    id: "teacher2",
    email: "teacher2@motiscan.com",
    name: "David Levi",
    role: "teacher",
    password: "teacher123",
  },
  {
    id: "noor",
    email: "noor@test.com",
    name: "Dr. Noor Salim",
    role: "teacher",
    password: "teacher123",
  },
  // --- Students ---
  {
    id: "student1",
    email: "student1@motiscan.com",
    name: "Noa Avraham",
    role: "student",
    password: "student123",
  },
  {
    id: "student2",
    email: "student2@motiscan.com",
    name: "Ethan Ben-David",
    role: "student",
    password: "student123",
  },
  {
    id: "student3",
    email: "student3@motiscan.com",
    name: "Maya Shalom",
    role: "student",
    password: "student123",
  },
  {
    id: "sara",
    email: "sara@test.com",
    name: "Sara Cohen",
    role: "student",
    password: "student123",
  },
  {
    id: "ahmed",
    email: "ahmed@test.com",
    name: "Ahmed Khalil",
    role: "student",
    password: "student123",
  },
  {
    id: "maya",
    email: "maya@test.com",
    name: "Maya Levi",
    role: "student",
    password: "student123",
  },
  {
    id: "omar",
    email: "omar@test.com",
    name: "Omar Hassan",
    role: "student",
    password: "student123",
  },
];

export const authService = {
  login: async (email: string, password: string, role: UserRole): Promise<User | null> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const user = mockUsers.find(
      (u) => u.email === email && u.password === password && u.role === role
    );
    if (!user) return null;
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  getCurrentUser: async (userId: string): Promise<User | null> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const user = mockUsers.find((u) => u.id === userId);
    if (!user) return null;
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  logout: async (): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
  },
};
