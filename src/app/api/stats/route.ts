import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const schoolId = searchParams.get("schoolId");

    const where = schoolId ? { schoolId: Number(schoolId) } : {};

    const [totalStudents, totalTeachers, totalParents, totalGrades, avgResult] =
      await Promise.all([
        prisma.student.count({ where }),
        prisma.teacher.count({ where }),
        prisma.parent.count(),
        prisma.grade.count({
          where: schoolId
            ? { student: { schoolId: Number(schoolId) } }
            : undefined,
        }),
        prisma.grade.aggregate({
          _avg: { value: true },
          where: schoolId
            ? { student: { schoolId: Number(schoolId) } }
            : undefined,
        }),
      ]);

    return NextResponse.json({
      totalStudents,
      totalTeachers,
      totalParents,
      totalGrades,
      averageGrade: avgResult._avg.value
        ? Math.round(avgResult._avg.value * 100) / 100
        : 0,
    });
  } catch (error) {
    console.error("Statistikani olishda xatolik:", error);
    return NextResponse.json(
      { error: "Statistikani olishda xatolik yuz berdi" },
      { status: 500 }
    );
  }
}
