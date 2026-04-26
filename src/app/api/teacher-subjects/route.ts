import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const teacherId = searchParams.get("teacherId");

    const where: Record<string, unknown> = {};
    if (teacherId) where.teacherId = Number(teacherId);

    const teacherSubjects = await prisma.teacherSubject.findMany({
      where,
      include: {
        teacher: { select: { id: true, fullName: true } },
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Avtorizatsiyadan o'tilmagan" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { teacherId, subjectId, classId } = body;

    if (!teacherId || !subjectId || !classId) {
      return NextResponse.json(
        { error: "O'qituvchi, fan va sinf kiritilishi shart" },
        { status: 400 }
      );
    }

    const existing = await prisma.teacherSubject.findUnique({
      where: {
        teacherId_subjectId_classId: {
          teacherId: Number(teacherId),
          subjectId: Number(subjectId),
          classId: Number(classId),
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Bu o'qituvchi-fan-sinf bog'lanishi allaqachon mavjud" },
        { status: 409 }
      );
    }

    const teacherSubject = await prisma.teacherSubject.create({
      data: {
        teacherId: Number(teacherId),
        subjectId: Number(subjectId),
        classId: Number(classId),
      },
      include: {
        teacher: { select: { id: true, fullName: true } },
        subject: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(teacherSubject, { status: 201 });
  } catch (error) {
    console.error("O'qituvchi-fan bog'lashda xatolik:", error);
    return NextResponse.json(
      { error: "O'qituvchi-fan bog'lashda xatolik yuz berdi" },
      { status: 500 }
    );
  }
}
