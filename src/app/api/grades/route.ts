import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireSession();
    if (!ctx) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }
    const { searchParams } = request.nextUrl;
    const studentId = searchParams.get("studentId");
    const teacherId = searchParams.get("teacherId");
    const subjectId = searchParams.get("subjectId");
    const classId = searchParams.get("classId");
    const quarter = searchParams.get("quarter");
    const gradeType = searchParams.get("gradeType");

    const where: Record<string, unknown> = {};
    if (studentId) where.studentId = Number(studentId);
    if (teacherId) where.teacherId = Number(teacherId);
    if (subjectId) where.subjectId = Number(subjectId);
    if (classId) where.classId = Number(classId);
    if (quarter) where.quarter = Number(quarter);
    if (gradeType) where.gradeType = gradeType;

    if (!ctx.isSuperAdmin && ctx.schoolId != null) {
      where.student = { schoolId: ctx.schoolId };
    }

    if (ctx.session.user.role === "student") {
      where.studentId = Number(ctx.session.user.id);
    } else if (ctx.session.user.role === "parent") {
      const links = await prisma.parentStudent.findMany({
        where: { parentId: Number(ctx.session.user.id) },
        select: { studentId: true },
      });
      where.studentId = { in: links.map((l) => l.studentId) };
    }

    const grades = await prisma.grade.findMany({
      where,
      include: {
        student: { select: { id: true, fullName: true } },
        teacher: { select: { id: true, fullName: true } },
        subject: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
      },
      orderBy: { gradeDate: "desc" },
    });

    return NextResponse.json(grades);
  } catch (error) {
    console.error("Baholarni olishda xatolik:", error);
    return NextResponse.json(
      { error: "Baholarni olishda xatolik yuz berdi" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "teacher") {
      return NextResponse.json(
        { error: "Ruxsat berilmagan. Faqat o'qituvchilar baho qo'ya oladi" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { studentId, teacherId, subjectId, classId, gradeType, topic, value, quarter, note, gradeDate, replace } = body;

    if (!studentId || !teacherId || !subjectId || !classId || value === undefined || !quarter) {
      return NextResponse.json(
        { error: "Majburiy maydonlar to'ldirilmagan" },
        { status: 400 }
      );
    }

    if (Number(session.user.id) !== Number(teacherId)) {
      return NextResponse.json(
        { error: "Faqat o'zingizning baholaringizni qo'sha olasiz" },
        { status: 403 }
      );
    }

    const gType = gradeType || "daily";

    if (replace || gType === "quarter" || gType === "year") {
      const existing = await prisma.grade.findFirst({
        where: {
          studentId: Number(studentId),
          subjectId: Number(subjectId),
          classId: Number(classId),
          gradeType: gType,
          ...(gType !== "year" ? { quarter: Number(quarter) } : {}),
        },
      });
      if (existing) {
        const updated = await prisma.grade.update({
          where: { id: existing.id },
          data: {
            value: Number(value),
            topic: topic || "",
            note: note || "",
            teacherId: Number(teacherId),
            gradeDate: gradeDate ? new Date(gradeDate) : new Date(),
          },
          include: {
            student: { select: { id: true, fullName: true } },
            teacher: { select: { id: true, fullName: true } },
            subject: { select: { id: true, name: true } },
            class: { select: { id: true, name: true } },
          },
        });
        return NextResponse.json(updated);
      }
    }

    const grade = await prisma.grade.create({
      data: {
        studentId: Number(studentId),
        teacherId: Number(teacherId),
        subjectId: Number(subjectId),
        classId: Number(classId),
        gradeType: gType,
        topic: topic || "",
        value: Number(value),
        quarter: Number(quarter),
        note: note || "",
        gradeDate: gradeDate ? new Date(gradeDate) : new Date(),
      },
      include: {
        student: { select: { id: true, fullName: true } },
        teacher: { select: { id: true, fullName: true } },
        subject: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(grade, { status: 201 });
  } catch (error) {
    console.error("Baho qo'shishda xatolik:", error);
    return NextResponse.json(
      { error: "Baho qo'shishda xatolik yuz berdi" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Ruxsat berilmagan" }, { status: 403 });
    }
    const body = await request.json();
    const { id, value, topic, note, gradeType } = body;
    if (!id) return NextResponse.json({ error: "id kiritilmadi" }, { status: 400 });

    const existing = await prisma.grade.findUnique({ where: { id: Number(id) } });
    if (!existing) return NextResponse.json({ error: "Baho topilmadi" }, { status: 404 });
    if (existing.teacherId !== Number(session.user.id)) {
      return NextResponse.json({ error: "Faqat o'zingiz qo'ygan bahoni o'zgartira olasiz" }, { status: 403 });
    }
    const updated = await prisma.grade.update({
      where: { id: Number(id) },
      data: {
        ...(value !== undefined ? { value: Number(value) } : {}),
        ...(topic !== undefined ? { topic } : {}),
        ...(note !== undefined ? { note } : {}),
        ...(gradeType !== undefined ? { gradeType } : {}),
      },
      include: {
        student: { select: { id: true, fullName: true } },
        teacher: { select: { id: true, fullName: true } },
        subject: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Bahoni yangilashda xatolik:", error);
    return NextResponse.json({ error: "Bahoni yangilashda xatolik" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Ruxsat berilmagan" }, { status: 403 });
    }
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id kiritilmadi" }, { status: 400 });

    const existing = await prisma.grade.findUnique({ where: { id: Number(id) } });
    if (!existing) return NextResponse.json({ ok: true });
    if (existing.teacherId !== Number(session.user.id)) {
      return NextResponse.json({ error: "Faqat o'zingiz qo'ygan bahoni o'chira olasiz" }, { status: 403 });
    }
    await prisma.grade.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Bahoni o'chirishda xatolik:", error);
    return NextResponse.json({ error: "Bahoni o'chirishda xatolik" }, { status: 500 });
  }
}
