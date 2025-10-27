import { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '@shared/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  signup: (email: string, password: string, name: string) => boolean;
  enrollCourse: (courseId: number) => void;
  unenrollCourse: (courseId: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'student@test.com',
    password: 'password',
    name: '김학생',
    role: 'student',
    enrolledCourses: []
  },
  {
    id: '2',
    email: 'admin@test.com',
    password: 'password',
    name: '이관리자',
    role: 'admin',
    enrolledCourses: []
  }
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, password: string): boolean => {
    const foundUser = users.find(
      u => u.email === email && u.password === password
    );
    if (foundUser) {
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const signup = (email: string, password: string, name: string): boolean => {
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return false;
    }

    const newUser: User = {
      id: Date.now().toString(),
      email,
      password,
      name,
      role: 'student',
      enrolledCourses: []
    };

    setUsers([...users, newUser]);
    setUser(newUser);
    return true;
  };

  const enrollCourse = (courseId: number) => {
    if (!user) return;

    const updatedUser = {
      ...user,
      enrolledCourses: [...user.enrolledCourses, courseId]
    };

    setUser(updatedUser);
    setUsers(users.map(u => u.id === user.id ? updatedUser : u));
  };

  const unenrollCourse = (courseId: number) => {
    if (!user) return;

    const updatedUser = {
      ...user,
      enrolledCourses: user.enrolledCourses.filter(id => id !== courseId)
    };

    setUser(updatedUser);
    setUsers(users.map(u => u.id === user.id ? updatedUser : u));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, signup, enrollCourse, unenrollCourse }}>
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
