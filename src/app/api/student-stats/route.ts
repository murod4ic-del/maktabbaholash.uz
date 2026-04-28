import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireSession();
    if (!ctx) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }
    const { session } = ctx;

    const { searchParams } = request.nextUrl;
    const studentIdParam = searchParams.get("studentId");
    if (!studentIdParam) {
      return NextResponse.json({ error: "studentId kiritilishi shart" }, { status: 400 });
    }
    const studentId = Number(studentIdParam);

    const role = session.user.role;
    if (role === "student" && Number(session.user.id) !== studentId) {
      return NextResponse.json({ error: "Ruxsat berilmagan" }, { status: 403 });
    }
    if (role === "parent") {
      const link = await prisma.parentStudent.findFirst({
        where: { parentId: Number(session.user.id), studentId },
      });
      if (!link) {
        return NextResponse.json({ error: "Ruxsat berilmagan" }, { status: 403 });
      }
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: { select: { id: true, name: true } },
        school: { select: { id: true, name: true } },
      },
    });
    if (!student) {
      return NextResponse.json({ error: "O'quvchi topilmadi" }, { status: 404 });
    }

    if (ctx.schoolId != null && student.schoolId !== ctx.schoolId) {
      return NextResponse.json({ error: "Bu o'quvchi sizning maktabingizga tegishli emas" }, { status: 403 });
    }
    if (role === "teacher") {
      const tsLink = await prisma.teacherSubject.findFirst({
        where: { teacherId: Number(session.user.id), classId: student.classId },
        select: { id: true },
      });
      if (!tsLink) {
        return NextResponse.json({ error: "Bu o'quvchi sizning sinflaringizga tegishli emas" }, { status: 403 });
      }
    }

    const grades = await prisma.grade.findMany({
      where: { studentId },
      include: {
        subject: { select: { id: true, name: true } },
        teacher: { select: { id: true, fullName: true } },
      },
      orderBy: { gradeDate: "desc" },
    });

    const subjects = await prisma.teacherSubject.findMany({
      where: { classId: student.classId },
      include: {
        subject: { select: { id: true, name: true } },
        teacher: { select: { id: true, fullName: true } },
      },
    });

    const subjectMap = new Map<
      number,
      {
        id: number;
        name: string;
        teacher: string;
        grades: typeof grades;
        average: number;
        gradesByQuarter: Record<number, number[]>;
        finalQuarter: Record<number, number | null>;
        finalYear: number | null;
        distribution: Record<number, number>;
      }
    >();

    for (const ts of subjects) {
      if (!subjectMap.has(ts.subject.id)) {
        subjectMap.set(ts.subject.id, {
          id: ts.subject.id,
          name: ts.subject.name,
          teacher: ts.teacher.fullName,
          grades: [],
          average: 0,
          gradesByQuarter: { 1: [], 2: [], 3: [], 4: [] },
          finalQuarter: { 1: null, 2: null, 3: null, 4: null },
          finalYear: null,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        });
      }
    }

    for (const g of grades) {
      let bucket = subjectMap.get(g.subject.id);
      if (!bucket) {
        bucket = {
          id: g.subject.id,
          name: g.subject.name,
          teacher: g.teacher.fullName,
          grades: [],
          average: 0,
          gradesByQuarter: { 1: [], 2: [], 3: [], 4: [] },
          finalQuarter: { 1: null, 2: null, 3: null, 4: null },
          finalYear: null,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
        subjectMap.set(g.subject.id, bucket);
      }
      bucket.grades.push(g);
      if (g.gradeType === "year") {
        bucket.finalYear = g.value;
      } else if (g.gradeType === "quarter") {
        const q = Number(g.quarter);
        if (q >= 1 && q <= 4) bucket.finalQuarter[q] = g.value;
      } else {
        const q = Number(g.quarter);
        if (q >= 1 && q <= 4) bucket.gradesByQuarter[q].push(g.value);
        if (g.value >= 1 && g.value <= 5) bucket.distribution[g.value]++;
      }
    }

    const subjectList = Array.from(subjectMap.values()).map((s) => {
      const everyday = s.grades.filter(
        (g) => g.gradeType !== "year" && g.gradeType !== "quarter"
      );
      const avg =
        everyday.length > 0
          ? everyday.reduce((sum, g) => sum + g.value, 0) / everyday.length
          : 0;
      s.average = Number(avg.toFixed(2));
      s.grades = s.grades.slice(0, 30);
      return s;
    });
    subjectList.sort((a, b) => a.name.localeCompare(b.name));

    const everydayAll = grades.filter(
      (g) => g.gradeType !== "year" && g.gradeType !== "quarter"
    );
    const overallAverage =
      everydayAll.length > 0
        ? Number(
            (
              everydayAll.reduce((sum, g) => sum + g.value, 0) /
              everydayAll.length
            ).toFixed(2)
          )
        : 0;

    const today = new Date();
    const monthAgo = new Date();
    monthAgo.setDate(today.getDate() - 30);
    const attendance = await prisma.attendanceLog.findMany({
      where: { studentId, date: { gte: monthAgo } },
      orderBy: { date: "desc" },
    });
    const totalDays = attendance.length;
    const lateDays = attendance.filter((a) => a.isLate).length;
    const presentDays = attendance.filter((a) => !!a.enterAt).length;

    const recent = grades.slice(0, 15).map((g) => ({
      id: g.id,
      value: g.value,
      gradeType: g.gradeType,
      quarter: g.quarter,
      topic: g.topic,
      gradeDate: g.gradeDate,
      subject: g.subject,
      teacher: g.teacher,
    }));

    const gradesPerWeek: Record<string, { week: string; count: number; sum: number }> = {};
    for (const g of grades.slice(0, 50)) {
      if (g.gradeType === "year" || g.gradeType === "quarter") continue;
      const d = new Date(g.gradeDate);
      const monday = new Date(d);
      const day = monday.getDay() || 7;
      monday.setDate(monday.getDate() - day + 1);
      const key = monday.toISOString().slice(0, 10);
      if (!gradesPerWeek[key]) gradesPerWeek[key] = { week: key, count: 0, sum: 0 };
      gradesPerWeek[key].count++;
      gradesPerWeek[key].sum += g.value;
    }
    const trend = Object.values(gradesPerWeek)
      .map((w) => ({ week: w.week, count: w.count, avg: Number((w.sum / w.count).toFixed(2)) }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-8);

    let activityScore = 0;
    activityScore += Math.min(40, Math.round(overallAverage * 8));
    activityScore += Math.min(
      30,
      Math.round((everydayAll.length / Math.max(1, subjectList.length)) * 3)
    );
    if (totalDays > 0) {
      const onTime = (presentDays - lateDays) / totalDays;
      activityScore += Math.round(onTime * 30);
    }
    if (activityScore > 100) activityScore = 100;
    if (activityScore < 0) activityScore = 0;

    return NextResponse.json({
      student: {
        id: student.id,
        fullName: student.fullName,
        class: student.class,
        school: student.school,
        photoUrl: student.photoUrl,
        login: student.login,
      },
      subjects: subjectList,
      recent,
      trend,
      attendance: {
        totalDays,
        presentDays,
        lateDays,
        absentDays: Math.max(0, totalDays - presentDays),
        recent: attendance.slice(0, 10),
      },
      stats: {
        gradeCount: everydayAll.length,
        overallAverage,
        subjectCount: subjectList.length,
        activityScore,
      },
    });
  } catch (error) {
    console.error("O'quvchi statistikasini olishda xatolik:", error);
    return NextResponse.json(
      { error: "O'quvchi statistikasini olishda xatolik" },
      { status: 500 }
    );
  }
}
