import { Router, type Express, type Request, type Response } from "express";
import { ZodError } from "zod";
import {
  curriculumUpdateSchema,
  enrollSchema,
  loginSchema,
  signupSchema,
} from "../shared/schema";
import {
  attachSession,
  clearSessionCookie,
  createSessionToken,
  hashPassword,
  requireAdmin,
  requireAuth,
  setSessionCookie,
  verifyPassword,
} from "./auth";
import {
  EmailTakenError,
  courseExists,
  createUser,
  enroll,
  getCurriculum,
  getSessionUser,
  getUserByEmail,
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

export function registerRoutes(app: Express): void {
  const api = Router();

  api.use(attachSession);

  api.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  // Auth ----------------------------------------------------------------------

  api.post(
    "/auth/signup",
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
    asyncHandler(async (req, res) => {
      let input;
      try {
        input = loginSchema.parse(req.body);
      } catch (error) {
        res.status(400).json({ message: validationMessage(error as ZodError) });
        return;
      }

      const account = await getUserByEmail(input.email);
      const ok =
        account !== undefined &&
        (await verifyPassword(input.password, account.password));

      if (!account || !ok) {
        res
          .status(401)
          .json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });
        return;
      }

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

  api.delete(
    "/enrollments/:courseId",
    requireAuth,
    asyncHandler(async (req, res) => {
      const courseId = Number(req.params.courseId);
      if (!Number.isInteger(courseId)) {
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
