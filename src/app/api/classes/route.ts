import { NextRequest, NextResponse } from "next/server";
import { applySchoolFilter, requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireSession();
    if (!ctx) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }
    const where = applySchoolFilter({}, ctx);
    const classes = await prisma.class.findMany({
      where,
      include: {
        school: { select: { id: true, name: true } },
        _count: { select: { students: true } },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(classes);
  } catch (error) {
    console.error("Sinflarni olishda xatolik:", error);
    return NextResponse.json({ error: "Sinflarni olishda xatolik" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireSession();
    if (!ctx || !ctx.isAdmin) {
      return NextResponse.json({ error: "Faqat admin sinf qo'sha oladi" }, { status: 403 });
    }
    const body = await request.json();
    const { name, schoolId } = body;
    let target = Number(schoolId);
    if (!ctx.isSuperAdmin) {
      if (ctx.schoolId == null) {
        return NextResponse.json({ error: "Maktab aniqlanmadi" }, { status: 400 });
      }
      target = ctx.schoolId;
    }
    if (!name || !target) {
      return NextResponse.json({ error: "Sinf nomi va maktab shart" }, { status: 400 });
    }
    const newClass = await prisma.class.create({
      data: { name, schoolId: target },
      include: { school: { select: { id: true, name: true } } },
    });
    return NextResponse.json(newClass, { status: 201 });
  } catch (error) {
    console.error("Sinf qo'shishda xatolik:", error);
    return NextResponse.json({ error: "Sinf qo'shishda xatolik" }, { status: 500 });
  }
}
