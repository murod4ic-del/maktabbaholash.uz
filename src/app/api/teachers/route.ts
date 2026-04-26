import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const schoolId = searchParams.get("schoolId");

    const where: Record<string, unknown> = {};
    if (schoolId) where.schoolId = Number(schoolId);

    const teachers = await prisma.teacher.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        login: true,
        phone: true,
        schoolId: true,
        createdAt: true,
        school: { select: { id: true, name: true } },
      },
      orderBy: { fullName: "asc" },
    });

    return NextResponse.json(teachers);
  } catch (error) {
    console.error("O'qituvchilarni olishda xatolik:", error);
    return NextResponse.json(
      { error: "O'qituvchilarni olishda xatolik yuz berdi" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Ruxsat berilmagan. Faqat admin o'qituvchi qo'sha oladi" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { fullName, login, password, phone, schoolId } = body;

    if (!fullName || !login || !password || !schoolId) {
      return NextResponse.json(
        { error: "Ism, login, parol va maktab kiritilishi shart" },
        { status: 400 }
      );
    }

    const existing = await prisma.teacher.findUnique({ where: { login } });
    if (existing) {
      return NextResponse.json(
        { error: "Bu login allaqachon mavjud" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const teacher = await prisma.teacher.create({
      data: {
        fullName,
        login,
        passwordHash,
        phone: phone || "",
        schoolId: Number(schoolId),
      },
      select: {
        id: true,
        fullName: true,
        login: true,
        phone: true,
        schoolId: true,
        createdAt: true,
        school: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(teacher, { status: 201 });
  } catch (error) {
    console.error("O'qituvchi qo'shishda xatolik:", error);
    return NextResponse.json(
      { error: "O'qituvchi qo'shishda xatolik yuz berdi" },
      { status: 500 }
    );
  }
}
