import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export interface RequireSessionResult {
  session: Session;
  schoolId: number | null;
}

/**
 * Helper for API routes — returns session and the user's schoolId scope.
 * Web platform has no admin role; everything is scoped to a single school.
 */
export async function requireSession(): Promise<RequireSessionResult | null> {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  const schoolId = session.user.schoolId ?? null;
  return { session, schoolId };
}

/** Apply schoolId filter to a where object based on session. */
export function applySchoolFilter<T extends Record<string, unknown>>(
  where: T,
  ctx: RequireSessionResult,
  fieldName: string = "schoolId"
): T {
  if (ctx.schoolId == null) {
    return { ...where, [fieldName]: -1 } as T;
  }
  return { ...where, [fieldName]: ctx.schoolId } as T;
}

export async function assertStudentInScope(
  studentId: number,
  ctx: RequireSessionResult
): Promise<boolean> {
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
  if (ctx.schoolId == null) return false;
  const exists = await prisma.class.findFirst({
    where: { id: classId, schoolId: ctx.schoolId },
    select: { id: true },
  });
  return !!exists;
}
