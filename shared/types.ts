export interface Book {
  title: string;
  author?: string;
  publisher: string;
  link: string;
  coverImage?: string;
}

export interface Course {
  id: number;
  title: string;
  weeks: number;
  description: string;
  instructor: string;
  videoUrl: string;
}

export interface Semester {
  id: number;
  /** Optimistic-locking counter; sent back on save to detect concurrent edits. */
  version: number;
  title: string;
  subtitle: string;
  description: string;
  courses: Course[];
  books: {
    lecture: Book[];
    required: Book[];
    recommended: Book[];
  };
}

/**
 * Curriculum as it appears in `shared/data.ts`. Seed input has no version —
 * the database assigns one on insert.
 */
export type SeedSemester = Omit<Semester, 'version'>;

/** The user as it is sent to the browser — never carries the password hash. */
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'admin';
  enrolledCourses: number[];
  /** Subset of enrolledCourses the student has marked as finished. */
  completedCourses: number[];
  /** True while the account is still on an admin-issued temporary password. */
  mustChangePassword: boolean;
}

/** Row shape for the admin user management list — no password, ever. */
export interface AdminUserSummary {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'admin';
  createdAt: string;
  enrolledCount: number;
}
