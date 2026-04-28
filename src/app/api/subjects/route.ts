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
    const subjects = await prisma.subject.findMany({
      where,
      include: { school: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(subjects);
  } catch (error) {
    console.error("Fanlarni olishda xatolik:", error);
    return NextResponse.json({ error: "Fanlarni olishda xatolik" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireSession();
    if (!ctx || !ctx.isAdmin) {
      return NextResponse.json({ error: "Faqat admin fan qo'sha oladi" }, { status: 403 });
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
      return NextResponse.json({ error: "Fan nomi va maktab shart" }, { status: 400 });
    }
    const subject = await prisma.subject.create({
      data: { name, schoolId: target },
      include: { school: { select: { id: true, name: true } } },
    });
    return NextResponse.json(subject, { status: 201 });
  } catch (error) {
    console.error("Fan qo'shishda xatolik:", error);
    return NextResponse.json({ error: "Fan qo'shishda xatolik" }, { status: 500 });
  }
}
