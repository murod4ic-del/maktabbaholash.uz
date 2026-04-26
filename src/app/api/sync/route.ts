import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

interface SyncTeacher {
  fullName: string;
  phone?: string;
  login?: string;
  password?: string;
  classNames: string[];
  subjectNames: string[];
}

interface SyncStudent {
  fullName: string;
  className: string;
}

interface SyncPayload {
  syncKey: string;
  schoolCode: string;
  classes: string[];
  subjects: string[];
  teachers: SyncTeacher[];
  students: SyncStudent[];
}

function generateLogin(fullName: string): string {
  return fullName
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, ".")
    .replace(/[^\x00-\x7F]/g, "")
    .slice(0, 20) || `teacher_${Date.now()}`;
}

function generatePassword(): string {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let pw = "";
  for (let i = 0; i < 8; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}

function isPrimaryClass(className: string): boolean {
  const match = className.match(/^(\d+)/);
  if (!match) return false;
  return Number(match[1]) <= 4;
}

export async function POST(request: NextRequest) {
  try {
    const body: SyncPayload = await request.json();
    const { syncKey, schoolCode, classes, subjects, teachers, students } = body;

    const expectedKey = process.env.API_SYNC_KEY;
    if (!expectedKey || syncKey !== expectedKey) {
      return NextResponse.json({ error: "Noto'g'ri sync kalit" }, { status: 401 });
    }

    if (!schoolCode) {
      return NextResponse.json({ error: "schoolCode kiritilishi shart" }, { status: 400 });
    }

    let school = await prisma.school.findUnique({ where: { code: schoolCode } });
    if (!school) {
      school = await prisma.school.create({
        data: { name: schoolCode, code: schoolCode },
      });
    }

    const classMap: Record<string, number> = {};
    for (const name of classes || []) {
      const existing = await prisma.class.findFirst({
        where: { name, schoolId: school.id },
      });
      if (existing) {
        classMap[name] = existing.id;
      } else {
        const created = await prisma.class.create({
          data: { name, schoolId: school.id },
        });
        classMap[name] = created.id;
      }
    }

    const subjectMap: Record<string, number> = {};
    for (const name of subjects || []) {
      const existing = await prisma.subject.findFirst({
        where: { name, schoolId: school.id },
      });
      if (existing) {
        subjectMap[name] = existing.id;
      } else {
        const created = await prisma.subject.create({
          data: { name, schoolId: school.id },
        });
        subjectMap[name] = created.id;
      }
    }

    const teacherResults: Array<{
      fullName: string;
      login: string;
      password: string | null;
      isNew: boolean;
    }> = [];

    for (const t of teachers || []) {
      let teacher = t.login
        ? await prisma.teacher.findUnique({ where: { login: t.login } })
        : await prisma.teacher.findFirst({
            where: { fullName: t.fullName, schoolId: school.id },
          });

      let plainPassword: string | null = null;

      if (teacher) {
        const primaryFlag = t.classNames.some(isPrimaryClass);
        await prisma.teacher.update({
          where: { id: teacher.id },
          data: {
            fullName: t.fullName,
            phone: t.phone || teacher.phone,
            isPrimary: primaryFlag,
          },
        });
        teacherResults.push({
          fullName: t.fullName,
          login: teacher.login,
          password: null,
          isNew: false,
        });
      } else {
        const login = t.login || generateLogin(t.fullName);
        plainPassword = t.password || generatePassword();
        const passwordHash = await bcrypt.hash(plainPassword, 10);
        const primaryFlag = t.classNames.some(isPrimaryClass);

        let uniqueLogin = login;
        let suffix = 1;
        while (await prisma.teacher.findUnique({ where: { login: uniqueLogin } })) {
          uniqueLogin = `${login}${suffix}`;
          suffix++;
        }

        teacher = await prisma.teacher.create({
          data: {
            fullName: t.fullName,
            login: uniqueLogin,
            passwordHash,
            phone: t.phone || "",
            isPrimary: primaryFlag,
            schoolId: school.id,
          },
        });

        teacherResults.push({
          fullName: t.fullName,
          login: uniqueLogin,
          password: plainPassword,
          isNew: true,
        });
      }

      for (const className of t.classNames) {
        const classId = classMap[className];
        if (!classId) continue;

        const subjectNames = t.classNames.some(isPrimaryClass)
          ? Object.keys(subjectMap)
          : t.subjectNames;

        for (const subjectName of subjectNames) {
          const subjectId = subjectMap[subjectName];
          if (!subjectId) continue;

          const existing = await prisma.teacherSubject.findFirst({
            where: { teacherId: teacher.id, subjectId, classId },
          });
          if (!existing) {
            await prisma.teacherSubject.create({
              data: { teacherId: teacher.id, subjectId, classId },
            });
          }
        }
      }
    }

    for (const s of students || []) {
      const classId = classMap[s.className];
      if (!classId) continue;

      const existing = await prisma.student.findFirst({
        where: { fullName: s.fullName, classId, schoolId: school.id },
      });
      if (!existing) {
        await prisma.student.create({
          data: {
            fullName: s.fullName,
            classId,
            schoolId: school.id,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Sinxronizatsiya muvaffaqiyatli",
      stats: {
        classes: Object.keys(classMap).length,
        subjects: Object.keys(subjectMap).length,
        teachers: teacherResults.length,
        students: (students || []).length,
      },
      teachers: teacherResults,
    });
  } catch (error) {
    console.error("Sinxronizatsiya xatolik:", error);
    return NextResponse.json(
      { error: "Sinxronizatsiyada xatolik yuz berdi" },
      { status: 500 }
    );
  }
}
