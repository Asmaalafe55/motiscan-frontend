import { User, UserRole } from "@/types";
import { api, setToken } from "@/lib/api";

interface AuthResponse {
  token: string;
  user: User;
}

interface MeResponse {
  user: User;
}

export const authService = {
  login: async (email: string, password: string, role: UserRole): Promise<User | null> => {
    try {
      const data = await api.post<AuthResponse>("/api/auth/login", { email, password, role });
      setToken(data.token);
      return data.user;
    } catch {
      return null;
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    try {
      const data = await api.get<MeResponse>("/api/auth/me");
      return data.user;
    } catch {
      return null;
    }
  },

  logout: async (): Promise<void> => {
    setToken(null);
  },
};
