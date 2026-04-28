import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export interface RequireSessionResult {
  session: Session;
  schoolId: number | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

/**
 * Helper for API routes — returns session, schoolId scope, and admin flags.
 * - Super-admin (admin with no schoolId) sees all schools.
 * - School-admin and other roles are scoped to their schoolId.
 */
export async function requireSession(): Promise<RequireSessionResult | null> {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  const role = session.user.role;
  const isAdmin = role === "admin";
  const schoolId = session.user.schoolId ?? null;
  const isSuperAdmin = isAdmin && (schoolId === null || schoolId === undefined);
  return { session, schoolId, isAdmin, isSuperAdmin };
}

/** Apply schoolId filter to a where object based on session. Super-admin gets no extra filter. */
export function applySchoolFilter<T extends Record<string, unknown>>(
  where: T,
  ctx: RequireSessionResult,
  fieldName: string = "schoolId"
): T {
  if (ctx.isSuperAdmin) return where;
  if (ctx.schoolId == null) {
    return { ...where, [fieldName]: -1 } as T;
  }
  return { ...where, [fieldName]: ctx.schoolId } as T;
}

/** Verify a particular school-bound entity is accessible. */
export async function assertStudentInScope(
  studentId: number,
  ctx: RequireSessionResult
): Promise<boolean> {
  if (ctx.isSuperAdmin) return true;
  if (ctx.schoolId == null) return false;
  const exists = await prisma.student.findFirst({
    where: { id: studentId, schoolId: ctx.schoolId },
    select: { id: true },
  });
  return !!exists;
}

export async function assertTeacherInScope(
  teacherId: number,
  ctx: RequireSessionResult
): Promise<boolean> {
  if (ctx.isSuperAdmin) return true;
  if (ctx.schoolId == null) return false;
  const exists = await prisma.teacher.findFirst({
    where: { id: teacherId, schoolId: ctx.schoolId },
    select: { id: true },
  });
  return !!exists;
}

export async function assertClassInScope(
  classId: number,
  ctx: RequireSessionResult
): Promise<boolean> {
  if (ctx.isSuperAdmin) return true;
  if (ctx.schoolId == null) return false;
  const exists = await prisma.class.findFirst({
    where: { id: classId, schoolId: ctx.schoolId },
    select: { id: true },
  });
  return !!exists;
}
