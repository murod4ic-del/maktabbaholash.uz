import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
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
    const { studentId, teacherId, subjectId, classId, gradeType, topic, value, quarter, note, gradeDate } = body;

    if (!studentId || !teacherId || !subjectId || !classId || value === undefined || !quarter) {
      return NextResponse.json(
        { error: "Majburiy maydonlar to'ldirilmagan" },
        { status: 400 }
      );
    }

    const grade = await prisma.grade.create({
      data: {
        studentId: Number(studentId),
        teacherId: Number(teacherId),
        subjectId: Number(subjectId),
        classId: Number(classId),
        gradeType: gradeType || "daily",
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
