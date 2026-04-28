import { NextRequest, NextResponse } from "next/server";
import { applySchoolFilter, requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireSession();
    if (!ctx) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }
    const where = applySchoolFilter({}, ctx);
    const teachers = await prisma.teacher.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        login: true,
        phone: true,
        schoolId: true,
        isPrimary: true,
        createdAt: true,
        school: { select: { id: true, name: true } },
      },
      orderBy: { fullName: "asc" },
    });
    return NextResponse.json(teachers);
  } catch (error) {
    console.error("O'qituvchilarni olishda xatolik:", error);
    return NextResponse.json({ error: "O'qituvchilarni olishda xatolik" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireSession();
    if (!ctx || !ctx.isAdmin) {
      return NextResponse.json(
        { error: "Faqat admin o'qituvchi qo'sha oladi" },
        { status: 403 }
      );
    }
    const body = await request.json();
    const { fullName, login, password, phone, schoolId } = body;
    let target = Number(schoolId);
    if (!ctx.isSuperAdmin) {
      if (ctx.schoolId == null) {
        return NextResponse.json({ error: "Maktab aniqlanmadi" }, { status: 400 });
      }
      target = ctx.schoolId;
    }
    if (!fullName || !login || !password || !target) {
      return NextResponse.json(
        { error: "Ism, login, parol va maktab kiritilishi shart" },
        { status: 400 }
      );
    }

    const existing = await prisma.teacher.findFirst({
      where: { login, schoolId: target },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Bu login shu maktabda allaqachon mavjud" },
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
        schoolId: target,
      },
      select: {
        id: true,
        fullName: true,
        login: true,
        phone: true,
        schoolId: true,
        isPrimary: true,
        createdAt: true,
        school: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(teacher, { status: 201 });
  } catch (error) {
    console.error("O'qituvchi qo'shishda xatolik:", error);
    return NextResponse.json({ error: "O'qituvchi qo'shishda xatolik" }, { status: 500 });
  }
}
