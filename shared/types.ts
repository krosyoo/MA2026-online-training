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

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: 'student' | 'admin';
  enrolledCourses: number[];
}
