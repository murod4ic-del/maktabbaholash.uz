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
