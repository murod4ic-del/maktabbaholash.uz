import { NextResponse } from "next/server";
import { applySchoolFilter, requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET() {
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
