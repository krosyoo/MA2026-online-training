import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  role: text("role", { enum: ["student", "admin"] })
    .notNull()
    .default("student"),
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const semesters = pgTable("semesters", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const courses = pgTable("courses", {
  id: integer("id").primaryKey(),
  semesterId: integer("semester_id")
    .notNull()
    .references(() => semesters.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  weeks: integer("weeks").notNull(),
  description: text("description").notNull(),
  instructor: text("instructor").notNull(),
  videoUrl: text("video_url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  semesterId: integer("semester_id")
    .notNull()
    .references(() => semesters.id, { onDelete: "cascade" }),
  category: text("category", {
    enum: ["lecture", "required", "recommended"],
  }).notNull(),
  title: text("title").notNull(),
  author: text("author"),
  publisher: text("publisher").notNull(),
  link: text("link").notNull(),
  coverImage: text("cover_image"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const enrollments = pgTable(
  "enrollments",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: integer("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    completed: boolean("completed").notNull().default(false),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userCourseUnique: unique("enrollments_user_course_unique").on(
      table.userId,
      table.courseId,
    ),
  }),
);

/**
 * Backs the login/signup throttle. `key` is a caller-chosen bucket such as
 * `login-ip:1.2.3.4` or `login-email:user@example.com`; count and windowStart
 * implement a fixed window that resets once it expires (see
 * `server/rateLimit.ts`).
 */
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  windowStart: timestamp("window_start").notNull().defaultNow(),
});

export type UserRow = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type SemesterRow = typeof semesters.$inferSelect;
export type CourseRow = typeof courses.$inferSelect;
export type BookRow = typeof books.$inferSelect;

// Request payload validation --------------------------------------------------

export const signupSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해주세요."),
  email: z.string().trim().email("유효한 이메일을 입력해주세요."),
  password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다."),
});

export const loginSchema = z.object({
  email: z.string().trim().email("유효한 이메일을 입력해주세요."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

export const enrollSchema = z.object({
  courseId: z.number().int(),
});

export const enrollmentUpdateSchema = z.object({
  completed: z.boolean(),
});

const bookInputSchema = z.object({
  title: z.string().trim().min(1, "도서 제목을 입력해주세요."),
  author: z.string().trim().optional(),
  publisher: z.string().trim().min(1, "출판사를 입력해주세요."),
  link: z.string().trim().min(1, "링크를 입력해주세요."),
  coverImage: z.string().trim().optional(),
});

const booksInputSchema = z.object({
  lecture: z.array(bookInputSchema),
  required: z.array(bookInputSchema),
  recommended: z.array(bookInputSchema),
});

const courseUpdateSchema = z.object({
  id: z.number().int(),
  title: z.string().trim().min(1),
  weeks: z.number().int().min(1),
  description: z.string(),
  instructor: z.string(),
  videoUrl: z.string(),
});

const semesterUpdateSchema = z.object({
  id: z.number().int(),
  title: z.string().trim().min(1),
  subtitle: z.string(),
  description: z.string(),
  courses: z.array(courseUpdateSchema),
  books: booksInputSchema,
});

/**
 * The admin dashboard edits existing semesters, courses and books in place.
 * Semesters and courses are matched by id (never created or removed here —
 * see semesterCreateSchema/courseCreateSchema for that). Each semester's
 * books are fully replaced, which is safe because nothing else references a
 * book row.
 */
export const curriculumUpdateSchema = z.array(semesterUpdateSchema);

export const semesterCreateSchema = z.object({
  title: z.string().trim().min(1, "학기 제목을 입력해주세요."),
  subtitle: z.string().trim().default(""),
  description: z.string().trim().default(""),
});

export const courseCreateSchema = z.object({
  title: z.string().trim().min(1, "강의 제목을 입력해주세요."),
  weeks: z.number().int().min(1, "기간은 1주 이상이어야 합니다."),
  description: z.string().trim().default(""),
  instructor: z.string().trim().default(""),
  videoUrl: z.string().trim().default(""),
});

/** Admin-initiated reset. Omit `password` to have the server generate one. */
export const adminResetPasswordSchema = z.object({
  password: z.string().min(6).optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CurriculumUpdate = z.infer<typeof curriculumUpdateSchema>;
export type BookInput = z.infer<typeof bookInputSchema>;
export type SemesterCreateInput = z.infer<typeof semesterCreateSchema>;
export type CourseCreateInput = z.infer<typeof courseCreateSchema>;
