import { fileURLToPath } from "node:url";
import { db } from "./db";
import { books, courses, semesters } from "../shared/schema";
import { INITIAL_SEMESTERS } from "../shared/data";
import { hashPassword } from "./auth";
import { createUser, getUserByEmail } from "./storage";

export interface SeedResult {
  seeded: boolean;
  semesters: number;
  courses: number;
  books: number;
  adminCreated: boolean;
}

async function isCurriculumEmpty(): Promise<boolean> {
  const [row] = await db.select({ id: semesters.id }).from(semesters).limit(1);
  return !row;
}

/**
 * Loads the curriculum shipped in `shared/data.ts` into the database. Does
 * nothing when the curriculum is already present, so it is safe to call on
 * every deploy or to re-run by hand.
 */
export async function seedCurriculum(): Promise<SeedResult> {
  const result: SeedResult = {
    seeded: false,
    semesters: 0,
    courses: 0,
    books: 0,
    adminCreated: false,
  };

  if (await isCurriculumEmpty()) {
    const semesterRows = INITIAL_SEMESTERS.map((semester, index) => ({
      id: semester.id,
      title: semester.title,
      subtitle: semester.subtitle,
      description: semester.description,
      sortOrder: index,
    }));

    const courseRows = INITIAL_SEMESTERS.flatMap((semester) =>
      semester.courses.map((course, index) => ({
        id: course.id,
        semesterId: semester.id,
        title: course.title,
        weeks: course.weeks,
        description: course.description,
        instructor: course.instructor,
        videoUrl: course.videoUrl,
        sortOrder: index,
      })),
    );

    const bookRows = INITIAL_SEMESTERS.flatMap((semester) =>
      (["lecture", "required", "recommended"] as const).flatMap((category) =>
        semester.books[category].map((book, index) => ({
          semesterId: semester.id,
          category,
          title: book.title,
          author: book.author ?? null,
          publisher: book.publisher,
          link: book.link,
          coverImage: book.coverImage ?? null,
          sortOrder: index,
        })),
      ),
    );

    await db.insert(semesters).values(semesterRows);
    if (courseRows.length > 0) await db.insert(courses).values(courseRows);
    if (bookRows.length > 0) await db.insert(books).values(bookRows);

    result.seeded = true;
    result.semesters = semesterRows.length;
    result.courses = courseRows.length;
    result.books = bookRows.length;
  }

  result.adminCreated = await ensureAdmin();
  return result;
}

/**
 * Creates the initial administrator from ADMIN_EMAIL / ADMIN_PASSWORD. Without
 * those variables no admin is created and the dashboard stays unreachable,
 * which is the safe default.
 */
export async function ensureAdmin(): Promise<boolean> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) return false;
  if (password.length < 6) {
    throw new Error("ADMIN_PASSWORD must be at least 6 characters.");
  }
  if (await getUserByEmail(email)) return false;

  await createUser({
    email,
    name: process.env.ADMIN_NAME?.trim() || "관리자",
    password: await hashPassword(password),
    role: "admin",
  });
  return true;
}

/**
 * The curriculum tables use fixed ids from `shared/data.ts` rather than
 * sequences, so nothing else needs resetting here.
 */
async function main(): Promise<void> {
  const result = await seedCurriculum();
  if (result.seeded) {
    console.log(
      `Seeded ${result.semesters} semesters, ${result.courses} courses, ${result.books} books.`,
    );
  } else {
    console.log("Curriculum already present — skipped.");
  }
  console.log(
    result.adminCreated
      ? `Created admin account for ${process.env.ADMIN_EMAIL}.`
      : "No admin account created (already exists, or ADMIN_EMAIL/ADMIN_PASSWORD unset).",
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
