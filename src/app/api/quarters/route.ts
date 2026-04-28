import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

function currentSchoolYear(): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return month >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const teacherId = searchParams.get("teacherId");
    const subjectId = searchParams.get("subjectId");
    const classId = searchParams.get("classId");
    const schoolYear = searchParams.get("schoolYear") || currentSchoolYear();

    const where: Record<string, unknown> = { schoolYear };
    if (teacherId) where.teacherId = Number(teacherId);
    if (subjectId !== null && subjectId !== "") {
      where.subjectId = subjectId === "null" ? null : Number(subjectId);
    }
    if (classId !== null && classId !== "") {
      where.classId = classId === "null" ? null : Number(classId);
    }

    const items = await prisma.quarterConfig.findMany({
      where,
      orderBy: [{ quarter: "asc" }],
    });

    return NextResponse.json({ items, schoolYear });
  } catch (error) {
    console.error("Choraklarni olishda xatolik:", error);
    return NextResponse.json({ error: "Choraklarni olishda xatolik" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "teacher" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Ruxsat berilmagan" }, { status: 403 });
    }

    const body = await request.json();
    const { teacherId, subjectId, classId, quarter, startDate, endDate, schoolYear, isPublished } =
      body;

    if (!teacherId || !quarter || !startDate || !endDate) {
      return NextResponse.json(
        { error: "O'qituvchi, chorak, boshlanish va tugash sanasi shart" },
        { status: 400 }
      );
    }

    if (session.user.role === "teacher" && Number(session.user.id) !== Number(teacherId)) {
      return NextResponse.json(
        { error: "Faqat o'zingizning choraklaringizni saqlay olasiz" },
        { status: 403 }
      );
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: Number(teacherId) },
    });
    if (!teacher) {
      return NextResponse.json({ error: "O'qituvchi topilmadi" }, { status: 404 });
    }

    const sy = schoolYear || currentSchoolYear();
    const subId = subjectId ? Number(subjectId) : null;
    const clsId = classId ? Number(classId) : null;

    const data = {
      schoolId: teacher.schoolId,
      teacherId: Number(teacherId),
      subjectId: subId,
      classId: clsId,
      quarter: Number(quarter),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      schoolYear: sy,
      isPublished: isPublished !== false,
    };

    const item = await prisma.quarterConfig.upsert({
      where: {
        teacherId_subjectId_classId_quarter_schoolYear: {
          teacherId: data.teacherId,
          subjectId: subId as number,
          classId: clsId as number,
          quarter: data.quarter,
          schoolYear: sy,
        },
      } as never,
      update: data,
      create: data,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Chorakni saqlashda xatolik:", error);
    return NextResponse.json({ error: "Chorakni saqlashda xatolik" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "teacher" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Ruxsat berilmagan" }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id kiritilishi shart" }, { status: 400 });
    }

    const item = await prisma.quarterConfig.findUnique({
      where: { id: Number(id) },
    });
    if (!item) return NextResponse.json({ ok: true });

    if (
      session.user.role === "teacher" &&
      Number(session.user.id) !== item.teacherId
    ) {
      return NextResponse.json({ error: "Ruxsat berilmagan" }, { status: 403 });
    }

    await prisma.quarterConfig.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Chorakni o'chirishda xatolik:", error);
    return NextResponse.json({ error: "Chorakni o'chirishda xatolik" }, { status: 500 });
  }
}
