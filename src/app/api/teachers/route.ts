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
