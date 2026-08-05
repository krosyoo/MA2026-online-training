import { createContext, useContext, ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { User } from '@shared/types';
import { apiRequest, getQueryFn } from '@/lib/queryClient';

/**
 * `message` carries the server's own reason on failure — a misconfigured
 * deployment must not be reported to the user as a wrong password.
 */
export interface AuthResult {
  ok: boolean;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  signup: (
    email: string,
    password: string,
    name: string,
  ) => Promise<AuthResult>;
  enrollCourse: (courseId: number) => Promise<void>;
  unenrollCourse: (courseId: number) => Promise<void>;
  setCourseCompleted: (courseId: number, completed: boolean) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AUTH_QUERY_KEY = ['/api/auth/me'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // Being signed out is a normal state, not an error, so 401 resolves to null
  // instead of throwing.
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: getQueryFn<User | null>({ on401: 'returnNull' }),
  });

  // Every auth and enrollment endpoint returns the refreshed user, so the cache
  // is updated from the response instead of triggering another round trip.
  const setUser = (next: User | null) => {
    queryClient.setQueryData(AUTH_QUERY_KEY, next);
  };

  const login = async (
    email: string,
    password: string,
  ): Promise<AuthResult> => {
    try {
      const res = await apiRequest('POST', '/api/auth/login', { email, password });
      setUser(await res.json());
      return { ok: true };
    } catch (error) {
      return { ok: false, message: (error as Error).message };
    }
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
  ): Promise<AuthResult> => {
    try {
      const res = await apiRequest('POST', '/api/auth/signup', {
        email,
        password,
        name,
      });
      setUser(await res.json());
      return { ok: true };
    } catch (error) {
      return { ok: false, message: (error as Error).message };
    }
  };

  const logout = async (): Promise<void> => {
    await apiRequest('POST', '/api/auth/logout');
    setUser(null);
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ): Promise<AuthResult> => {
    try {
      const res = await apiRequest('POST', '/api/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setUser(await res.json());
      return { ok: true };
    } catch (error) {
      return { ok: false, message: (error as Error).message };
    }
  };

  const enrollMutation = useMutation({
    mutationFn: async (courseId: number) => {
      const res = await apiRequest('POST', '/api/enrollments', { courseId });
      return (await res.json()) as User;
    },
    onSuccess: setUser,
  });

  const unenrollMutation = useMutation({
    mutationFn: async (courseId: number) => {
      const res = await apiRequest('DELETE', `/api/enrollments/${courseId}`);
      return (await res.json()) as User;
    },
    onSuccess: setUser,
  });

  const completionMutation = useMutation({
    mutationFn: async ({
      courseId,
      completed,
    }: {
      courseId: number;
      completed: boolean;
    }) => {
      const res = await apiRequest('PATCH', `/api/enrollments/${courseId}`, {
        completed,
      });
      return (await res.json()) as User;
    },
    onSuccess: setUser,
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        login,
        logout,
        signup,
        enrollCourse: async (courseId) => {
          await enrollMutation.mutateAsync(courseId);
        },
        unenrollCourse: async (courseId) => {
          await unenrollMutation.mutateAsync(courseId);
        },
        setCourseCompleted: async (courseId, completed) => {
          await completionMutation.mutateAsync({ courseId, completed });
        },
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
