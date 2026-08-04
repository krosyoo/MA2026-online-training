import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "./db";
import {
  books,
  courses,
  enrollments,
  semesters,
  users,
  type CurriculumUpdate,
  type UserRow,
} from "../shared/schema";
import type { Book, Semester, User } from "../shared/types";

/** Raised when a signup collides with an existing account. */
export class EmailTakenError extends Error {
  constructor() {
    super("이미 사용 중인 이메일입니다.");
    this.name = "EmailTakenError";
  }
}

// Curriculum ------------------------------------------------------------------

export async function getCurriculum(): Promise<Semester[]> {
  const [semesterRows, courseRows, bookRows] = await Promise.all([
    db
      .select()
      .from(semesters)
      .orderBy(asc(semesters.sortOrder), asc(semesters.id)),
    db.select().from(courses).orderBy(asc(courses.sortOrder), asc(courses.id)),
    db.select().from(books).orderBy(asc(books.sortOrder), asc(books.id)),
  ]);

  return semesterRows.map((semester) => {
    const semesterBooks = bookRows.filter((b) => b.semesterId === semester.id);
    const byCategory = (
      category: "lecture" | "required" | "recommended",
    ): Book[] =>
      semesterBooks
        .filter((b) => b.category === category)
        .map((b) => ({
          title: b.title,
          author: b.author ?? undefined,
          publisher: b.publisher,
          link: b.link,
          coverImage: b.coverImage ?? undefined,
        }));

    return {
      id: semester.id,
      title: semester.title,
      subtitle: semester.subtitle,
      description: semester.description,
      courses: courseRows
        .filter((c) => c.semesterId === semester.id)
        .map((c) => ({
          id: c.id,
          title: c.title,
          weeks: c.weeks,
          description: c.description,
          instructor: c.instructor,
          videoUrl: c.videoUrl,
        })),
      books: {
        lecture: byCategory("lecture"),
        required: byCategory("required"),
        recommended: byCategory("recommended"),
      },
    };
  });
}

/**
 * Applies the admin dashboard's edits. Rows are updated in place — never
 * deleted and re-inserted — so that existing enrollments keep pointing at the
 * courses they were made against.
 *
 * Each table is updated with a single statement, which keeps the operation
 * atomic per table without needing interactive transactions (unavailable on
 * Neon's HTTP driver).
 */
export async function updateCurriculum(
  payload: CurriculumUpdate,
): Promise<void> {
  if (payload.length > 0) {
    const rows = sql.join(
      payload.map(
        (s) =>
          sql`(${s.id}::integer, ${s.title}::text, ${s.subtitle}::text, ${s.description}::text)`,
      ),
      sql`, `,
    );
    await db.execute(sql`
      UPDATE ${semesters} AS s
      SET title = v.title, subtitle = v.subtitle, description = v.description
      FROM (VALUES ${rows}) AS v(id, title, subtitle, description)
      WHERE s.id = v.id
    `);
  }

  const courseUpdates = payload.flatMap((s) => s.courses);
  if (courseUpdates.length > 0) {
    const rows = sql.join(
      courseUpdates.map(
        (c) =>
          sql`(${c.id}::integer, ${c.title}::text, ${c.weeks}::integer, ${c.description}::text, ${c.instructor}::text, ${c.videoUrl}::text)`,
      ),
      sql`, `,
    );
    await db.execute(sql`
      UPDATE ${courses} AS c
      SET title = v.title,
          weeks = v.weeks,
          description = v.description,
          instructor = v.instructor,
          video_url = v.video_url
      FROM (VALUES ${rows}) AS v(id, title, weeks, description, instructor, video_url)
      WHERE c.id = v.id
    `);
  }
}

export async function courseExists(courseId: number): Promise<boolean> {
  const [row] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);
  return Boolean(row);
}

// Users -----------------------------------------------------------------------

export async function getUserByEmail(
  email: string,
): Promise<UserRow | undefined> {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return row;
}

export async function getUserRole(
  id: string,
): Promise<"student" | "admin" | undefined> {
  const [row] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return row?.role;
}

export async function createUser(input: {
  email: string;
  name: string;
  password: string;
  role?: "student" | "admin";
}): Promise<UserRow> {
  try {
    const [row] = await db
      .insert(users)
      .values({
        email: input.email.toLowerCase(),
        name: input.name,
        password: input.password,
        role: input.role ?? "student",
      })
      .returning();
    return row;
  } catch (error) {
    // 23505 = unique_violation; the email index is the only unique constraint.
    if ((error as { code?: string }).code === "23505") {
      throw new EmailTakenError();
    }
    throw error;
  }
}

/**
 * Builds the client-facing user object, including the enrolled course ids the
 * UI reads directly off the session user.
 */
export async function getSessionUser(id: string): Promise<User | undefined> {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!row) return undefined;

  const enrolled = await db
    .select({ courseId: enrollments.courseId })
    .from(enrollments)
    .where(eq(enrollments.userId, id))
    .orderBy(asc(enrollments.courseId));

  return { ...row, enrolledCourses: enrolled.map((e) => e.courseId) };
}

// Enrollments -----------------------------------------------------------------

export async function enroll(
  userId: string,
  courseId: number,
): Promise<void> {
  await db
    .insert(enrollments)
    .values({ userId, courseId })
    .onConflictDoNothing();
}

export async function unenroll(
  userId: string,
  courseId: number,
): Promise<void> {
  await db
    .delete(enrollments)
    .where(
      and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)),
    );
}
