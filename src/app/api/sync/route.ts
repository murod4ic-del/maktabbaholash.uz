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
  photoUrl?: string;
  externalId?: string;
}

interface SyncAttendance {
  externalId?: string;
  fullName?: string;
  className?: string;
  date: string;
  enterAt?: string;
  exitAt?: string;
  isLate?: boolean;
  note?: string;
}

interface SyncPayload {
  syncKey: string;
  schoolCode: string;
  classes: string[];
  subjects: string[];
  teachers: SyncTeacher[];
  students: SyncStudent[];
  attendance?: SyncAttendance[];
}

const CYRILLIC_MAP: Record<string, string> = {
  "\u0430": "a", "\u0431": "b", "\u0432": "v", "\u0433": "g", "\u0434": "d",
  "\u0435": "e", "\u0451": "yo", "\u0436": "j", "\u0437": "z", "\u0438": "i",
  "\u0439": "y", "\u043a": "k", "\u043b": "l", "\u043c": "m", "\u043d": "n",
  "\u043e": "o", "\u043f": "p", "\u0440": "r", "\u0441": "s", "\u0442": "t",
  "\u0443": "u", "\u0444": "f", "\u0445": "x", "\u0446": "ts", "\u0447": "ch",
  "\u0448": "sh", "\u0449": "sh", "\u044a": "", "\u044b": "i", "\u044c": "",
  "\u044d": "e", "\u044e": "yu", "\u044f": "ya",
  "\u045e": "o\u02bb", "\u049b": "q", "\u0493": "g\u02bb", "\u04b3": "h",
};

function transliterate(text: string): string {
  return text
    .toLowerCase()
    .split("")
    .map((ch) => CYRILLIC_MAP[ch] ?? ch)
    .join("");
}

function generateLogin(fullName: string): string {
  const parts = transliterate(fullName.trim())
    .replace(/[^a-z0-9\s.]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]}.${parts[parts.length - 1]}`.slice(0, 30);
  }
  return parts[0]?.slice(0, 20) || `user_${Date.now()}`;
}

function generatePassword(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let digits = "";
  for (let i = 0; i < 7; i++) digits += Math.floor(Math.random() * 10);
  const letter = letters[Math.floor(Math.random() * letters.length)];
  return digits + letter;
}

function isPrimaryClass(className: string): boolean {
  const match = className.match(/^(\d+)/);
  if (!match) return false;
  return Number(match[1]) <= 4;
}

export async function POST(request: NextRequest) {
  try {
    const body: SyncPayload = await request.json();
    const { syncKey, schoolCode, classes, subjects, teachers, students, attendance } = body;

    const expectedKey = process.env.API_SYNC_KEY;
    if (expectedKey && syncKey !== expectedKey) {
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

    const studentResults: Array<{
      fullName: string;
      className: string;
      login: string;
      password: string | null;
      isNew: boolean;
    }> = [];

    for (const s of students || []) {
      const classId = classMap[s.className];
      if (!classId) continue;

      const existing = await prisma.student.findFirst({
        where: { fullName: s.fullName, classId, schoolId: school.id },
      });
      if (existing) {
        if (!existing.login) {
          const login = generateLogin(s.fullName);
          const plainPw = generatePassword();
          const pwHash = await bcrypt.hash(plainPw, 10);
          let uniqueLogin = login;
          let sfx = 1;
          while (await prisma.student.findFirst({ where: { login: uniqueLogin } })) {
            uniqueLogin = `${login}${sfx}`;
            sfx++;
          }
          await prisma.student.update({
            where: { id: existing.id },
            data: {
              login: uniqueLogin,
              passwordHash: pwHash,
              ...(s.photoUrl ? { photoUrl: s.photoUrl } : {}),
              ...(s.externalId ? { externalId: s.externalId } : {}),
            },
          });
          studentResults.push({
            fullName: s.fullName, className: s.className,
            login: uniqueLogin, password: plainPw, isNew: false,
          });
        } else {
          if (s.photoUrl || s.externalId) {
            await prisma.student.update({
              where: { id: existing.id },
              data: {
                ...(s.photoUrl ? { photoUrl: s.photoUrl } : {}),
                ...(s.externalId ? { externalId: s.externalId } : {}),
              },
            });
          }
          studentResults.push({
            fullName: s.fullName, className: s.className,
            login: existing.login, password: null, isNew: false,
          });
        }
      } else {
        const login = generateLogin(s.fullName);
        const plainPw = generatePassword();
        const pwHash = await bcrypt.hash(plainPw, 10);
        let uniqueLogin = login;
        let sfx = 1;
        while (await prisma.student.findFirst({ where: { login: uniqueLogin } })) {
          uniqueLogin = `${login}${sfx}`;
          sfx++;
        }
        await prisma.student.create({
          data: {
            fullName: s.fullName,
            login: uniqueLogin,
            passwordHash: pwHash,
            classId,
            schoolId: school.id,
            photoUrl: s.photoUrl || null,
            externalId: s.externalId || null,
          },
        });
        studentResults.push({
          fullName: s.fullName, className: s.className,
          login: uniqueLogin, password: plainPw, isNew: true,
        });
      }
    }

    let attendanceCount = 0;
    if (Array.isArray(attendance) && attendance.length > 0) {
      for (const a of attendance) {
        let student = null as Awaited<ReturnType<typeof prisma.student.findFirst>>;
        if (a.externalId) {
          student = await prisma.student.findFirst({
            where: { externalId: a.externalId, schoolId: school.id },
          });
        }
        if (!student && a.fullName) {
          const where: Record<string, unknown> = {
            fullName: a.fullName,
            schoolId: school.id,
          };
          if (a.className && classMap[a.className]) where.classId = classMap[a.className];
          student = await prisma.student.findFirst({ where });
        }
        if (!student) continue;
        const date = new Date(a.date);
        if (isNaN(date.getTime())) continue;
        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        await prisma.attendanceLog.upsert({
          where: {
            studentId_date: { studentId: student.id, date: dateOnly },
          },
          update: {
            enterAt: a.enterAt ? new Date(a.enterAt) : null,
            exitAt: a.exitAt ? new Date(a.exitAt) : null,
            isLate: !!a.isLate,
            note: a.note || "",
          },
          create: {
            studentId: student.id,
            date: dateOnly,
            enterAt: a.enterAt ? new Date(a.enterAt) : null,
            exitAt: a.exitAt ? new Date(a.exitAt) : null,
            isLate: !!a.isLate,
            note: a.note || "",
          },
        });
        attendanceCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Sinxronizatsiya muvaffaqiyatli",
      stats: {
        classes: Object.keys(classMap).length,
        subjects: Object.keys(subjectMap).length,
        teachers: teacherResults.length,
        students: studentResults.length,
        attendance: attendanceCount,
      },
      teachers: teacherResults,
      students: studentResults,
    });
  } catch (error) {
    console.error("Sinxronizatsiya xatolik:", error);
    return NextResponse.json(
      { error: "Sinxronizatsiyada xatolik yuz berdi" },
      { status: 500 }
    );
  }
}
