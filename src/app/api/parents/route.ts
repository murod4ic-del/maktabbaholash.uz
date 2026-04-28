import { NextRequest, NextResponse } from "next/server";
import {
  applySchoolFilter,
  assertStudentInScope,
  requireSession,
} from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const ctx = await requireSession();
    if (!ctx) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }
    const where = applySchoolFilter({}, ctx);
    const parents = await prisma.parent.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        login: true,
        phone: true,
        schoolId: true,
        createdAt: true,
        parentStudents: {
          include: {
            student: { select: { id: true, fullName: true, classId: true } },
          },
        },
      },
      orderBy: { fullName: "asc" },
    });
    return NextResponse.json(parents);
  } catch (error) {
    console.error("Ota-onalarni olishda xatolik:", error);
    return NextResponse.json({ error: "Ota-onalarni olishda xatolik" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireSession();
    if (!ctx || !ctx.isAdmin) {
      return NextResponse.json(
        { error: "Faqat admin ota-ona qo'sha oladi" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { fullName, login, password, phone, studentIds, schoolId } = body as {
      fullName: string;
      login: string;
      password: string;
      phone?: string;
      studentIds?: number[];
      schoolId?: number;
    };

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

    const existing = await prisma.parent.findFirst({
      where: { login, schoolId: target },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Bu login shu maktabda allaqachon mavjud" },
        { status: 409 }
      );
    }

    if (studentIds && studentIds.length > 0) {
      for (const sid of studentIds) {
        if (!(await assertStudentInScope(Number(sid), ctx))) {
          return NextResponse.json(
            { error: `O'quvchi #${sid} bu maktabga tegishli emas` },
            { status: 400 }
          );
        }
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const parent = await prisma.parent.create({
      data: {
        fullName,
        login,
        passwordHash,
        phone: phone || "",
        schoolId: target,
        parentStudents:
          studentIds && studentIds.length > 0
            ? {
                create: studentIds.map((sid: number) => ({ studentId: Number(sid) })),
              }
            : undefined,
      },
      select: {
        id: true,
        fullName: true,
        login: true,
        phone: true,
        schoolId: true,
        createdAt: true,
        parentStudents: {
          include: { student: { select: { id: true, fullName: true } } },
        },
      },
    });

    return NextResponse.json(parent, { status: 201 });
  } catch (error) {
    console.error("Ota-ona qo'shishda xatolik:", error);
    return NextResponse.json({ error: "Ota-ona qo'shishda xatolik" }, { status: 500 });
  }
}
