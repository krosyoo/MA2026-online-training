import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  books,
  courses,
  enrollments,
  semesters,
  users,
  type CourseCreateInput,
  type CurriculumUpdate,
  type SemesterCreateInput,
  type UserRow,
} from "../shared/schema";
import type {
  AdminUserSummary,
  Book,
  EnrollmentRecord,
  Semester,
  User,
} from "../shared/types";

/** Raised when a signup collides with an existing account. */
export class EmailTakenError extends Error {
  constructor() {
    super("이미 사용 중인 이메일입니다.");
    this.name = "EmailTakenError";
  }
}

const MAX_FAILED_ATTEMPTS = 5;

// Curriculum ------------------------------------------------------------------

export async function getCurriculum(): Promise<Semester[]> {
  const [semesterRows, courseRows, bookRows] = await Promise.all([
    getDb()
      .select()
      .from(semesters)
      .orderBy(asc(semesters.sortOrder), asc(semesters.id)),
    getDb()
      .select()
      .from(courses)
      .orderBy(asc(courses.sortOrder), asc(courses.id)),
    getDb().select().from(books).orderBy(asc(books.sortOrder), asc(books.id)),
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
      version: semester.version,
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

/** Raised when another admin saved the same semester first. */
export class CurriculumConflictError extends Error {
  constructor() {
    super(
      "다른 관리자가 먼저 저장했습니다. 최신 내용을 다시 불러온 뒤 수정해주세요.",
    );
    this.name = "CurriculumConflictError";
  }
}

/**
 * Applies the admin dashboard's edits. Semester and course rows are updated
 * in place — never deleted and re-inserted — so that existing enrollments
 * keep pointing at the courses they were made against. Each semester's books
 * are fully replaced instead, which is safe because nothing references a
 * book row.
 *
 * Concurrency: each semester carries a version the dashboard loaded. The
 * update is guarded on it and bumps it, and the guard is evaluated inside the
 * same statement as the write, so two admins saving at once cannot both
 * succeed. If any semester's version has moved, nothing is written at all —
 * the CTE below makes it all-or-nothing rather than leaving a half-applied
 * save. Later steps only run once that check has passed.
 *
 * Every step is a single statement, which keeps it atomic without needing
 * interactive transactions (unavailable on Neon's HTTP driver).
 */
export async function updateCurriculum(
  payload: CurriculumUpdate,
): Promise<void> {
  if (payload.length === 0) return;

  const semesterRows = sql.join(
    payload.map(
      (s) =>
        sql`(${s.id}::integer, ${s.version}::integer, ${s.title}::text, ${s.subtitle}::text, ${s.description}::text)`,
    ),
    sql`, `,
  );

  const result = await getDb().execute(sql`
    WITH v(id, version, title, subtitle, description) AS (
      VALUES ${semesterRows}
    ),
    stale AS (
      SELECT 1 FROM v JOIN semesters s ON s.id = v.id
      WHERE s.version IS DISTINCT FROM v.version
      LIMIT 1
    ),
    updated AS (
      UPDATE semesters AS s
      SET title = v.title,
          subtitle = v.subtitle,
          description = v.description,
          version = s.version + 1
      FROM v
      WHERE s.id = v.id AND NOT EXISTS (SELECT 1 FROM stale)
      RETURNING s.id
    )
    SELECT (SELECT count(*) FROM updated)::int AS updated_count
  `);

  const updatedCount =
    (result as unknown as { rows: { updated_count: number }[] }).rows[0]
      ?.updated_count ?? 0;
  if (updatedCount !== payload.length) {
    throw new CurriculumConflictError();
  }

  const courseUpdates = payload.flatMap((s) => s.courses);
  if (courseUpdates.length > 0) {
    const courseRows = sql.join(
      courseUpdates.map(
        (c) =>
          sql`(${c.id}::integer, ${c.title}::text, ${c.weeks}::integer, ${c.description}::text, ${c.instructor}::text, ${c.videoUrl}::text)`,
      ),
      sql`, `,
    );
    await getDb().execute(sql`
      UPDATE ${courses} AS c
      SET title = v.title,
          weeks = v.weeks,
          description = v.description,
          instructor = v.instructor,
          video_url = v.video_url
      FROM (VALUES ${courseRows}) AS v(id, title, weeks, description, instructor, video_url)
      WHERE c.id = v.id
    `);
  }

  const semesterIds = payload.map((s) => s.id);
  await getDb().delete(books).where(inArray(books.semesterId, semesterIds));

  const newBookRows = payload.flatMap((s) =>
    (["lecture", "required", "recommended"] as const).flatMap((category) =>
      s.books[category].map((b, index) => ({
        semesterId: s.id,
        category,
        title: b.title,
        author: b.author || null,
        publisher: b.publisher,
        link: b.link,
        coverImage: b.coverImage || null,
        sortOrder: index,
      })),
    ),
  );
  if (newBookRows.length > 0) {
    await getDb().insert(books).values(newBookRows);
  }
}

/**
 * Both id assignment and sort_order placement are computed in scalar
 * subqueries within the same INSERT, so a single statement stays correct
 * even if two admins create rows at the same time.
 */
export async function createSemester(
  input: SemesterCreateInput,
): Promise<void> {
  await getDb().execute(sql`
    INSERT INTO semesters (id, title, subtitle, description, sort_order)
    VALUES (
      (SELECT COALESCE(MAX(id), 0) + 1 FROM semesters),
      ${input.title}, ${input.subtitle}, ${input.description},
      (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM semesters)
    )
  `);
}

/**
 * Adding or removing a course changes what the semester contains, so its
 * version moves too. That forces any dashboard still holding the old course
 * list to reload before it can save, instead of writing against a list that
 * no longer matches the database.
 */
export async function createCourse(
  semesterId: number,
  input: CourseCreateInput,
): Promise<void> {
  await getDb().execute(sql`
    WITH inserted AS (
      INSERT INTO courses (id, semester_id, title, weeks, description, instructor, video_url, sort_order)
      VALUES (
        (SELECT COALESCE(MAX(id), 0) + 1 FROM courses),
        ${semesterId}, ${input.title}, ${input.weeks}, ${input.description}, ${input.instructor}, ${input.videoUrl},
        (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM courses WHERE semester_id = ${semesterId})
      )
      RETURNING semester_id
    )
    UPDATE semesters SET version = version + 1
    WHERE id = (SELECT semester_id FROM inserted)
  `);
}

export async function deleteSemester(semesterId: number): Promise<void> {
  await getDb().delete(semesters).where(eq(semesters.id, semesterId));
}

export async function deleteCourse(courseId: number): Promise<void> {
  await getDb().execute(sql`
    WITH removed AS (
      DELETE FROM courses WHERE id = ${courseId} RETURNING semester_id
    )
    UPDATE semesters SET version = version + 1
    WHERE id = (SELECT semester_id FROM removed)
  `);
}

export async function semesterExists(semesterId: number): Promise<boolean> {
  const [row] = await getDb()
    .select({ id: semesters.id })
    .from(semesters)
    .where(eq(semesters.id, semesterId))
    .limit(1);
  return Boolean(row);
}

export async function courseExists(courseId: number): Promise<boolean> {
  const [row] = await getDb()
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);
  return Boolean(row);
}

export async function countEnrollmentsForCourse(
  courseId: number,
): Promise<number> {
  const [row] = await getDb()
    .select({ count: sql<number>`count(*)::int` })
    .from(enrollments)
    .where(eq(enrollments.courseId, courseId));
  return row?.count ?? 0;
}

export async function countEnrollmentsForSemester(
  semesterId: number,
): Promise<number> {
  const [row] = await getDb()
    .select({ count: sql<number>`count(*)::int` })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .where(eq(courses.semesterId, semesterId));
  return row?.count ?? 0;
}

// Users -----------------------------------------------------------------------

export async function getUserByEmail(
  email: string,
): Promise<UserRow | undefined> {
  const [row] = await getDb()
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return row;
}

export async function getUserById(id: string): Promise<UserRow | undefined> {
  const [row] = await getDb().select().from(users).where(eq(users.id, id)).limit(1);
  return row;
}

/**
 * The two fields every request needs to validate a session cookie: the live
 * role (so demotions apply at once) and the tokenVersion the cookie must match.
 */
export async function getSessionSecurity(
  id: string,
): Promise<{ role: "student" | "admin"; tokenVersion: number } | undefined> {
  const [row] = await getDb()
    .select({ role: users.role, tokenVersion: users.tokenVersion })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return row;
}

export async function createUser(input: {
  email: string;
  name: string;
  password: string;
  role?: "student" | "admin";
}): Promise<UserRow> {
  try {
    const [row] = await getDb()
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

export async function listUsers(): Promise<AdminUserSummary[]> {
  const rows = await getDb()
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(asc(users.createdAt));

  const counts = await getDb()
    .select({
      userId: enrollments.userId,
      enrolled: sql<number>`count(*)::int`,
      completed: sql<number>`count(*) FILTER (WHERE ${enrollments.completed})::int`,
    })
    .from(enrollments)
    .groupBy(enrollments.userId);
  const countByUser = new Map(counts.map((c) => [c.userId, c]));

  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name,
    role: r.role,
    createdAt: r.createdAt.toISOString(),
    enrolledCount: countByUser.get(r.id)?.enrolled ?? 0,
    completedCount: countByUser.get(r.id)?.completed ?? 0,
  }));
}

/**
 * Every enrolment, joined out to the names the admin actually needs to read.
 * This is the roster behind "who signed up for what, and who finished" — the
 * dashboard previously showed only a per-user count, which is not enough to
 * run a training programme.
 *
 * Returned whole rather than paginated: the roster is one row per enrolment
 * for a single church's intake, and the client filters and exports from it.
 */
export async function listEnrollments(): Promise<EnrollmentRecord[]> {
  const rows = await getDb()
    .select({
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      courseId: courses.id,
      courseTitle: courses.title,
      semesterId: semesters.id,
      semesterTitle: semesters.title,
      completed: enrollments.completed,
      enrolledAt: enrollments.createdAt,
      completedAt: enrollments.completedAt,
    })
    .from(enrollments)
    .innerJoin(users, eq(enrollments.userId, users.id))
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .innerJoin(semesters, eq(courses.semesterId, semesters.id))
    .orderBy(
      asc(semesters.sortOrder),
      asc(courses.sortOrder),
      asc(users.name),
    );

  return rows.map((r) => ({
    ...r,
    enrolledAt: r.enrolledAt.toISOString(),
    completedAt: r.completedAt?.toISOString() ?? null,
  }));
}

/**
 * Sets a new password hash and bumps tokenVersion, which invalidates every
 * session already issued for the account — the point of a reset is to lock out
 * whoever had the old credentials.
 *
 * `mustChangePassword` marks admin-issued temporary passwords so the UI can
 * push the user to pick their own.
 */
export async function setUserPassword(
  userId: string,
  passwordHash: string,
  options: { mustChangePassword: boolean },
): Promise<number> {
  // A reset also clears any lockout — there is no reason to make someone wait
  // out a lock whose cause was just fixed.
  const [row] = await getDb()
    .update(users)
    .set({
      password: passwordHash,
      mustChangePassword: options.mustChangePassword,
      tokenVersion: sql`${users.tokenVersion} + 1`,
      failedAttempts: 0,
      lockedUntil: null,
    })
    .where(eq(users.id, userId))
    .returning({ tokenVersion: users.tokenVersion });
  return row.tokenVersion;
}

/**
 * Changes a role and rotates tokenVersion so a demoted admin's open tabs lose
 * their elevated access immediately rather than at cookie expiry.
 */
export async function setUserRole(
  userId: string,
  role: "student" | "admin",
): Promise<void> {
  await getDb()
    .update(users)
    .set({ role, tokenVersion: sql`${users.tokenVersion} + 1` })
    .where(eq(users.id, userId));
}

export async function deleteUser(userId: string): Promise<void> {
  await getDb().delete(users).where(eq(users.id, userId));
}

export async function countAdmins(): Promise<number> {
  const [row] = await getDb()
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.role, "admin"));
  return row?.count ?? 0;
}

/**
 * Bumps the failure counter and locks the account for 15 minutes once it
 * reaches the threshold, in one statement so concurrent failed attempts on
 * the same account still count correctly.
 */
export async function recordLoginFailure(userId: string): Promise<void> {
  await getDb().execute(sql`
    UPDATE users
    SET failed_attempts = failed_attempts + 1,
        locked_until = CASE
          WHEN failed_attempts + 1 >= ${MAX_FAILED_ATTEMPTS}
          THEN now() + interval '15 minutes'
          ELSE locked_until
        END
    WHERE id = ${userId}
  `);
}

export async function resetLoginFailures(userId: string): Promise<void> {
  await getDb()
    .update(users)
    .set({ failedAttempts: 0, lockedUntil: null })
    .where(eq(users.id, userId));
}

/**
 * Builds the client-facing user object, including the enrolled and completed
 * course ids the UI reads directly off the session user.
 */
export async function getSessionUser(id: string): Promise<User | undefined> {
  const [row] = await getDb()
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      mustChangePassword: users.mustChangePassword,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!row) return undefined;

  const enrolled = await getDb()
    .select({ courseId: enrollments.courseId, completed: enrollments.completed })
    .from(enrollments)
    .where(eq(enrollments.userId, id))
    .orderBy(asc(enrollments.courseId));

  return {
    ...row,
    enrolledCourses: enrolled.map((e) => e.courseId),
    completedCourses: enrolled.filter((e) => e.completed).map((e) => e.courseId),
  };
}

// Enrollments -----------------------------------------------------------------

export async function enroll(
  userId: string,
  courseId: number,
): Promise<void> {
  await getDb()
    .insert(enrollments)
    .values({ userId, courseId })
    .onConflictDoNothing();
}

export async function unenroll(
  userId: string,
  courseId: number,
): Promise<void> {
  await getDb()
    .delete(enrollments)
    .where(
      and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)),
    );
}

/** Returns false when the user has no enrollment in that course to update. */
export async function setEnrollmentCompleted(
  userId: string,
  courseId: number,
  completed: boolean,
): Promise<boolean> {
  const [row] = await getDb()
    .update(enrollments)
    .set({ completed, completedAt: completed ? new Date() : null })
    .where(
      and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)),
    )
    .returning({ id: enrollments.id });
  return Boolean(row);
}
