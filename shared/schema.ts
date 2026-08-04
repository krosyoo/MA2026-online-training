import { sql } from "drizzle-orm";
import {
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
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userCourseUnique: unique("enrollments_user_course_unique").on(
      table.userId,
      table.courseId,
    ),
  }),
);

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
});

/**
 * The admin dashboard edits existing semesters and courses in place. It never
 * creates or removes rows, so the payload is a list of updates keyed by id.
 */
export const curriculumUpdateSchema = z.array(semesterUpdateSchema);

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CurriculumUpdate = z.infer<typeof curriculumUpdateSchema>;
