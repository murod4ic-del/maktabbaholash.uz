import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const classId = searchParams.get("classId");
    const schoolId = searchParams.get("schoolId");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (classId) where.classId = Number(classId);
    if (schoolId) where.schoolId = Number(schoolId);
    if (search) {
      where.fullName = { contains: search };
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        class: { select: { id: true, name: true } },
        school: { select: { id: true, name: true } },
      },
      orderBy: { fullName: "asc" },
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("O'quvchilarni olishda xatolik:", error);
    return NextResponse.json(
      { error: "O'quvchilarni olishda xatolik yuz berdi" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Ruxsat berilmagan. Faqat admin o'quvchi qo'sha oladi" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { fullName, classId, schoolId } = body;

    if (!fullName || !classId || !schoolId) {
      return NextResponse.json(
        { error: "Ism, sinf va maktab kiritilishi shart" },
        { status: 400 }
      );
    }

    const student = await prisma.student.create({
      data: {
        fullName,
        classId: Number(classId),
        schoolId: Number(schoolId),
      },
      include: {
        class: { select: { id: true, name: true } },
        school: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    console.error("O'quvchi qo'shishda xatolik:", error);
    return NextResponse.json(
      { error: "O'quvchi qo'shishda xatolik yuz berdi" },
      { status: 500 }
    );
  }
}
