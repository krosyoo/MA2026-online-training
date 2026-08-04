import { Router, type Express, type Request, type Response } from "express";
import { ZodError } from "zod";
import { databaseUrl, sessionSecret } from "./env";
import {
  adminResetPasswordSchema,
  courseCreateSchema,
  curriculumUpdateSchema,
  enrollSchema,
  enrollmentUpdateSchema,
  loginSchema,
  semesterCreateSchema,
  signupSchema,
} from "../shared/schema";
import {
  attachSession,
  clearSessionCookie,
  createSessionToken,
  generateTemporaryPassword,
  hashPassword,
  requireAdmin,
  requireAuth,
  setSessionCookie,
  verifyPassword,
} from "./auth";
import { rateLimitByIp } from "./rateLimit";
import {
  EmailTakenError,
  countEnrollmentsForCourse,
  countEnrollmentsForSemester,
  courseExists,
  createCourse,
  createSemester,
  createUser,
  deleteCourse,
  deleteSemester,
  enroll,
  getCurriculum,
  getSessionUser,
  getUserByEmail,
  getUserById,
  listUsers,
  recordLoginFailure,
  resetLoginFailures,
  semesterExists,
  setEnrollmentCompleted,
  setUserPassword,
  unenroll,
  updateCurriculum,
} from "./storage";
import { seedCurriculum } from "./seed";

/** Turns a thrown Zod error into the first human-readable message. */
function validationMessage(error: ZodError): string {
  return error.issues[0]?.message ?? "요청 형식이 올바르지 않습니다.";
}

function asyncHandler(
  handler: (req: Request, res: Response) => Promise<void>,
): (req: Request, res: Response, next: (err?: unknown) => void) => void {
  return (req, res, next) => {
    handler(req, res).catch(next);
  };
}

/** Parses a positive integer route param, or null if it is not one. */
function intParam(value: string): number | null {
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
}

export function registerRoutes(app: Express): void {
  const api = Router();

  api.use(attachSession);

  /**
   * Answers even when the deployment is only half-configured, and reports which
   * settings are still missing. Booleans only — never the values themselves.
   */
  api.get("/health", (_req, res) => {
    res.json({
      ok: true,
      database: Boolean(databaseUrl()),
      sessionSecret: Boolean(sessionSecret()),
    });
  });

  // Auth ----------------------------------------------------------------------

  api.post(
    "/auth/signup",
    rateLimitByIp("signup", 60 * 60 * 1000, 8),
    asyncHandler(async (req, res) => {
      let input;
      try {
        input = signupSchema.parse(req.body);
      } catch (error) {
        res.status(400).json({ message: validationMessage(error as ZodError) });
        return;
      }

      try {
        const created = await createUser({
          email: input.email,
          name: input.name,
          password: await hashPassword(input.password),
        });

        setSessionCookie(
          res,
          await createSessionToken({ id: created.id, role: created.role }),
        );
        res.status(201).json(await getSessionUser(created.id));
      } catch (error) {
        if (error instanceof EmailTakenError) {
          res.status(409).json({ message: error.message });
          return;
        }
        throw error;
      }
    }),
  );

  api.post(
    "/auth/login",
    rateLimitByIp("login", 10 * 60 * 1000, 20),
    asyncHandler(async (req, res) => {
      let input;
      try {
        input = loginSchema.parse(req.body);
      } catch (error) {
        res.status(400).json({ message: validationMessage(error as ZodError) });
        return;
      }

      const account = await getUserByEmail(input.email);

      if (account?.lockedUntil && account.lockedUntil.getTime() > Date.now()) {
        const minutes = Math.ceil(
          (account.lockedUntil.getTime() - Date.now()) / 60_000,
        );
        res.status(429).json({
          message: `로그인 시도가 너무 많아 계정이 잠겼습니다. ${minutes}분 후 다시 시도해주세요.`,
        });
        return;
      }

      const ok =
        account !== undefined &&
        (await verifyPassword(input.password, account.password));

      if (!account || !ok) {
        // Only bump the counter for accounts that actually exist — otherwise
        // this becomes a way to discover which emails are registered.
        if (account) await recordLoginFailure(account.id);
        res
          .status(401)
          .json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });
        return;
      }

      await resetLoginFailures(account.id);
      setSessionCookie(
        res,
        await createSessionToken({ id: account.id, role: account.role }),
      );
      res.json(await getSessionUser(account.id));
    }),
  );

  api.post("/auth/logout", (_req, res) => {
    clearSessionCookie(res);
    res.json({ ok: true });
  });

  api.get(
    "/auth/me",
    asyncHandler(async (req, res) => {
      if (!req.auth) {
        res.status(401).json({ message: "로그인이 필요합니다." });
        return;
      }

      const user = await getSessionUser(req.auth.id);
      if (!user) {
        // The account was removed while the cookie was still valid.
        clearSessionCookie(res);
        res.status(401).json({ message: "로그인이 필요합니다." });
        return;
      }
      res.json(user);
    }),
  );

  // Curriculum ----------------------------------------------------------------

  api.get(
    "/semesters",
    asyncHandler(async (_req, res) => {
      res.json(await getCurriculum());
    }),
  );

  api.put(
    "/semesters",
    requireAdmin,
    asyncHandler(async (req, res) => {
      let input;
      try {
        input = curriculumUpdateSchema.parse(req.body);
      } catch (error) {
        res.status(400).json({ message: validationMessage(error as ZodError) });
        return;
      }

      await updateCurriculum(input);
      res.json(await getCurriculum());
    }),
  );

  api.post(
    "/admin/semesters",
    requireAdmin,
    asyncHandler(async (req, res) => {
      let input;
      try {
        input = semesterCreateSchema.parse(req.body);
      } catch (error) {
        res.status(400).json({ message: validationMessage(error as ZodError) });
        return;
      }

      await createSemester(input);
      res.status(201).json(await getCurriculum());
    }),
  );

  api.delete(
    "/admin/semesters/:id",
    requireAdmin,
    asyncHandler(async (req, res) => {
      const semesterId = intParam(req.params.id);
      if (semesterId === null) {
        res.status(400).json({ message: "학기 번호가 올바르지 않습니다." });
        return;
      }
      if (!(await semesterExists(semesterId))) {
        res.status(404).json({ message: "학기를 찾을 수 없습니다." });
        return;
      }

      const enrolledCount = await countEnrollmentsForSemester(semesterId);
      if (enrolledCount > 0 && req.query.force !== "true") {
        res.status(409).json({
          message: `이 학기의 강의에 ${enrolledCount}건의 수강신청이 있습니다. 강제로 삭제하려면 다시 확인해주세요.`,
          enrolledCount,
        });
        return;
      }

      await deleteSemester(semesterId);
      res.json(await getCurriculum());
    }),
  );

  api.post(
    "/admin/semesters/:id/courses",
    requireAdmin,
    asyncHandler(async (req, res) => {
      const semesterId = intParam(req.params.id);
      if (semesterId === null) {
        res.status(400).json({ message: "학기 번호가 올바르지 않습니다." });
        return;
      }
      if (!(await semesterExists(semesterId))) {
        res.status(404).json({ message: "학기를 찾을 수 없습니다." });
        return;
      }

      let input;
      try {
        input = courseCreateSchema.parse(req.body);
      } catch (error) {
        res.status(400).json({ message: validationMessage(error as ZodError) });
        return;
      }

      await createCourse(semesterId, input);
      res.status(201).json(await getCurriculum());
    }),
  );

  api.delete(
    "/admin/courses/:id",
    requireAdmin,
    asyncHandler(async (req, res) => {
      const courseId = intParam(req.params.id);
      if (courseId === null) {
        res.status(400).json({ message: "강의 번호가 올바르지 않습니다." });
        return;
      }
      if (!(await courseExists(courseId))) {
        res.status(404).json({ message: "강의를 찾을 수 없습니다." });
        return;
      }

      const enrolledCount = await countEnrollmentsForCourse(courseId);
      if (enrolledCount > 0 && req.query.force !== "true") {
        res.status(409).json({
          message: `이 강의에 ${enrolledCount}건의 수강신청이 있습니다. 강제로 삭제하려면 다시 확인해주세요.`,
          enrolledCount,
        });
        return;
      }

      await deleteCourse(courseId);
      res.json(await getCurriculum());
    }),
  );

  // Admin: user management -----------------------------------------------------

  api.get(
    "/admin/users",
    requireAdmin,
    asyncHandler(async (_req, res) => {
      res.json(await listUsers());
    }),
  );

  /**
   * No email provider is configured, so this is the recovery path when a
   * student forgets their password: an admin generates a one-time value here
   * and relays it out-of-band. The plaintext is returned exactly once and
   * never stored or logged.
   */
  api.post(
    "/admin/users/:id/reset-password",
    requireAdmin,
    asyncHandler(async (req, res) => {
      let input;
      try {
        input = adminResetPasswordSchema.parse(req.body ?? {});
      } catch (error) {
        res.status(400).json({ message: validationMessage(error as ZodError) });
        return;
      }

      const target = await getUserById(req.params.id);
      if (!target) {
        res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        return;
      }

      const temporaryPassword = input.password ?? generateTemporaryPassword();
      await setUserPassword(target.id, await hashPassword(temporaryPassword));

      res.json({ email: target.email, temporaryPassword });
    }),
  );

  // Enrollments ---------------------------------------------------------------

  api.post(
    "/enrollments",
    requireAuth,
    asyncHandler(async (req, res) => {
      let input;
      try {
        input = enrollSchema.parse(req.body);
      } catch (error) {
        res.status(400).json({ message: validationMessage(error as ZodError) });
        return;
      }

      if (!(await courseExists(input.courseId))) {
        res.status(404).json({ message: "강의를 찾을 수 없습니다." });
        return;
      }

      await enroll(req.auth!.id, input.courseId);
      res.status(201).json(await getSessionUser(req.auth!.id));
    }),
  );

  api.patch(
    "/enrollments/:courseId",
    requireAuth,
    asyncHandler(async (req, res) => {
      const courseId = intParam(req.params.courseId);
      if (courseId === null) {
        res.status(400).json({ message: "강의 번호가 올바르지 않습니다." });
        return;
      }

      let input;
      try {
        input = enrollmentUpdateSchema.parse(req.body);
      } catch (error) {
        res.status(400).json({ message: validationMessage(error as ZodError) });
        return;
      }

      const updated = await setEnrollmentCompleted(
        req.auth!.id,
        courseId,
        input.completed,
      );
      if (!updated) {
        res.status(404).json({ message: "수강 신청 내역을 찾을 수 없습니다." });
        return;
      }

      res.json(await getSessionUser(req.auth!.id));
    }),
  );

  api.delete(
    "/enrollments/:courseId",
    requireAuth,
    asyncHandler(async (req, res) => {
      const courseId = intParam(req.params.courseId);
      if (courseId === null) {
        res.status(400).json({ message: "강의 번호가 올바르지 않습니다." });
        return;
      }

      await unenroll(req.auth!.id, courseId);
      res.json(await getSessionUser(req.auth!.id));
    }),
  );

  // First-run bootstrap -------------------------------------------------------

  /**
   * Loads the curriculum into an empty database. Disabled unless SEED_SECRET is
   * configured, and a no-op once the curriculum exists, so it cannot be used to
   * overwrite live content.
   */
  api.post(
    "/seed",
    asyncHandler(async (req, res) => {
      const secret = process.env.SEED_SECRET;
      if (!secret) {
        res.status(404).json({ message: "Not found" });
        return;
      }
      if (req.get("x-seed-secret") !== secret) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      res.json(await seedCurriculum());
    }),
  );

  app.use("/api", api);

  // Anything under /api that did not match must not fall through to the SPA
  // catch-all, or the client would receive HTML where it expects JSON.
  app.use("/api", (_req, res) => {
    res.status(404).json({ message: "API endpoint not found" });
  });
}
