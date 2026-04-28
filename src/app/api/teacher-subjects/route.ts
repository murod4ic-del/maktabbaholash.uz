import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

function isPrimaryClass(className: string): boolean {
  const match = className.match(/^(\d+)/);
  if (!match) return false;
  return Number(match[1]) <= 4;
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireSession();
    if (!ctx) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }
    const { searchParams } = request.nextUrl;
    const teacherId = searchParams.get("teacherId");

    const where: Record<string, unknown> = {};
    if (teacherId) where.teacherId = Number(teacherId);
    if (!ctx.isSuperAdmin && ctx.schoolId != null) {
      where.teacher = { schoolId: ctx.schoolId };
    }

    if (ctx.session.user.role === "teacher") {
      where.teacherId = Number(ctx.session.user.id);
    }

    const teacherSubjects = await prisma.teacherSubject.findMany({
      where,
      include: {
        teacher: { select: { id: true, fullName: true, isPrimary: true } },
        subject: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(teacherSubjects);
  } catch (error) {
    console.error("O'qituvchi fanlarini olishda xatolik:", error);
    return NextResponse.json(
      { error: "O'qituvchi fanlarini olishda xatolik yuz berdi" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Avtorizatsiyadan o'tilmagan" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { teacherId, subjectId, classId, autoAssignAll } = body;

    if (!teacherId || !classId) {
      return NextResponse.json(
        { error: "O'qituvchi va sinf kiritilishi shart" },
        { status: 400 }
      );
    }

    const cls = await prisma.class.findUnique({ where: { id: Number(classId) } });
    if (!cls) {
      return NextResponse.json({ error: "Sinf topilmadi" }, { status: 404 });
    }

    const teacher = await prisma.teacher.findUnique({ where: { id: Number(teacherId) } });
    if (!teacher) {
      return NextResponse.json({ error: "O'qituvchi topilmadi" }, { status: 404 });
    }

    const shouldAutoAssign = autoAssignAll || isPrimaryClass(cls.name);

    if (shouldAutoAssign) {
      const allSubjects = await prisma.subject.findMany({
        where: { schoolId: cls.schoolId },
      });

      const primaryFlag = isPrimaryClass(cls.name);
      if (teacher.isPrimary !== primaryFlag) {
        await prisma.teacher.update({
          where: { id: teacher.id },
          data: { isPrimary: primaryFlag },
        });
      }

      const created = [];
      for (const sub of allSubjects) {
        const existing = await prisma.teacherSubject.findUnique({
          where: {
            teacherId_subjectId_classId: {
              teacherId: Number(teacherId),
              subjectId: sub.id,
              classId: Number(classId),
            },
          },
        });
        if (!existing) {
          const ts = await prisma.teacherSubject.create({
            data: {
              teacherId: Number(teacherId),
              subjectId: sub.id,
              classId: Number(classId),
            },
            include: {
              teacher: { select: { id: true, fullName: true, isPrimary: true } },
              subject: { select: { id: true, name: true } },
              class: { select: { id: true, name: true } },
            },
          });
          created.push(ts);
        }
      }

      return NextResponse.json(
        {
          message: `Boshlang'ich sinf: ${allSubjects.length} ta fandan ${created.length} tasi yangi biriktirildi`,
          created: created.length,
          total: allSubjects.length,
        },
        { status: 201 }
      );
    }

    if (!subjectId) {
      return NextResponse.json(
        { error: "Fan kiritilishi shart" },
        { status: 400 }
      );
    }

    const existing = await prisma.teacherSubject.findUnique({
      where: {
        teacherId_subjectId_classId: {
          teacherId: Number(teacherId),
          subjectId: Number(subjectId),
          classId: Number(classId),
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Bu o'qituvchi-fan-sinf bog'lanishi allaqachon mavjud" },
        { status: 409 }
      );
    }

    const teacherSubject = await prisma.teacherSubject.create({
      data: {
        teacherId: Number(teacherId),
        subjectId: Number(subjectId),
        classId: Number(classId),
      },
      include: {
        teacher: { select: { id: true, fullName: true, isPrimary: true } },
        subject: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(teacherSubject, { status: 201 });
  } catch (error) {
    console.error("O'qituvchi-fan bog'lashda xatolik:", error);
    return NextResponse.json(
      { error: "O'qituvchi-fan bog'lashda xatolik yuz berdi" },
      { status: 500 }
    );
  }
}
