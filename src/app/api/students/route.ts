import { NextRequest, NextResponse } from "next/server";
import {
  applySchoolFilter,
  assertClassInScope,
  requireSession,
} from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireSession();
    if (!ctx) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const classIdParam = searchParams.get("classId");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (classIdParam) {
      const classId = Number(classIdParam);
      if (!(await assertClassInScope(classId, ctx))) {
        return NextResponse.json({ error: "Sinf topilmadi yoki ruxsat yo'q" }, { status: 404 });
      }
      where.classId = classId;
    }
    if (search) {
      where.fullName = { contains: search };
    }

    const finalWhere = applySchoolFilter(where, ctx);

    const students = await prisma.student.findMany({
      where: finalWhere,
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
