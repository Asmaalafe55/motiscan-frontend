import { User, UserRole } from "@/types";

// Mock users database — single source of truth
const mockUsers: User[] = [
  // --- Teacher ---
  {
    id: "noor",
    email: "noor@test.com",
    name: "Dr. Noor Salim",
    role: "teacher",
    password: "teacher123",
  },
  // --- Students ---
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
