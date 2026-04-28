import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireSession();
    if (!ctx) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }
    const { searchParams } = request.nextUrl;
    const teacherId = searchParams.get("teacherId");

    const where: Record<string, unknown> = {};
    if (teacherId) where.teacherId = Number(teacherId);
    if (ctx.schoolId != null) {
      where.teacher = { schoolId: ctx.schoolId };
    }
    if (ctx.session.user.role === "teacher") {
      where.teacherId = Number(ctx.session.user.id);
    }

    const teacherSubjects = await prisma.teacherSubject.findMany({
      where,
      include: {
        teacher: { select: { id: true, fullName: true, isPrimary: true } },
        subject: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(teacherSubjects);
  } catch (error) {
    console.error("O'qituvchi fanlarini olishda xatolik:", error);
    return NextResponse.json(
      { error: "O'qituvchi fanlarini olishda xatolik yuz berdi" },
      { status: 500 }
    );
  }
}
