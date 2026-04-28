import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const ctx = await requireSession();
    if (!ctx) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    const schoolId = ctx.schoolId ?? -1;
    const studentWhere = { schoolId };
    const teacherWhere = { schoolId };
    const parentWhere = { schoolId };
    const gradeWhere = { student: { schoolId } };

    const [totalStudents, totalTeachers, totalParents, totalGrades, avgResult] =
      await Promise.all([
        prisma.student.count({ where: studentWhere }),
        prisma.teacher.count({ where: teacherWhere }),
        prisma.parent.count({ where: parentWhere }),
        prisma.grade.count({ where: gradeWhere }),
        prisma.grade.aggregate({ _avg: { value: true }, where: gradeWhere }),
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
