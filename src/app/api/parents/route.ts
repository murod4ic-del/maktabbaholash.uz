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
