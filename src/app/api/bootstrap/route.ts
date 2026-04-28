import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

const DEFAULT_TEACHER_LOGIN = "demo";
const DEFAULT_TEACHER_PASSWORD = "Demo1234";
const DEFAULT_ADMIN_PASSWORD = "admin123";
const SUPER_ADMIN_LOGIN = "admin";
const SUPER_ADMIN_PASSWORD = "admin123";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const schoolCode = (searchParams.get("school") || "demo").trim().toLowerCase();
    const schoolName =
      searchParams.get("name") ||
      (schoolCode === "demo" ? "Demo maktab" : `Maktab ${schoolCode}`);

    let school = await prisma.school.findUnique({
      where: { code: schoolCode },
    });
    if (!school) {
      school = await prisma.school.create({
        data: { name: schoolName, code: schoolCode },
      });
    }

    let superAdmin = await prisma.admin.findUnique({
      where: { login: SUPER_ADMIN_LOGIN },
    });
    if (!superAdmin) {
      superAdmin = await prisma.admin.create({
        data: {
          login: SUPER_ADMIN_LOGIN,
          passwordHash: bcrypt.hashSync(SUPER_ADMIN_PASSWORD, 10),
          fullName: "Super Administrator",
          schoolId: null,
        },
      });
    }

    const schoolAdminLogin = `admin-${schoolCode}`;
    let schoolAdmin = await prisma.admin.findUnique({
      where: { login: schoolAdminLogin },
    });
    if (!schoolAdmin) {
      schoolAdmin = await prisma.admin.create({
        data: {
          login: schoolAdminLogin,
          passwordHash: bcrypt.hashSync(DEFAULT_ADMIN_PASSWORD, 10),
          fullName: `${schoolName} admin`,
          schoolId: school.id,
        },
      });
    }

    const baseClasses = ["1-A", "2-A", "5-A", "9-A"];
    for (const name of baseClasses) {
      const exists = await prisma.class.findFirst({
        where: { name, schoolId: school.id },
      });
      if (!exists) {
        await prisma.class.create({
          data: { name, schoolId: school.id },
        });
      }
    }

    const baseSubjects = [
      "Matematika",
      "Ona tili",
      "Ingliz tili",
      "Tarix",
      "Informatika",
    ];
    for (const name of baseSubjects) {
      const exists = await prisma.subject.findFirst({
        where: { name, schoolId: school.id },
      });
      if (!exists) {
        await prisma.subject.create({
          data: { name, schoolId: school.id },
        });
      }
    }

    let teacher = await prisma.teacher.findFirst({
      where: { login: DEFAULT_TEACHER_LOGIN, schoolId: school.id },
    });
    if (!teacher) {
      teacher = await prisma.teacher.create({
        data: {
          fullName: "Demo O'qituvchi",
          login: DEFAULT_TEACHER_LOGIN,
          passwordHash: bcrypt.hashSync(DEFAULT_TEACHER_PASSWORD, 10),
          phone: "+998900000000",
          schoolId: school.id,
          isPrimary: false,
        },
      });
    } else {
      teacher = await prisma.teacher.update({
        where: { id: teacher.id },
        data: { passwordHash: bcrypt.hashSync(DEFAULT_TEACHER_PASSWORD, 10) },
      });
    }

    const subjects = await prisma.subject.findMany({
      where: { schoolId: school.id },
    });
    const classes = await prisma.class.findMany({
      where: { schoolId: school.id },
    });
    for (const subject of subjects) {
      for (const cls of classes) {
        const link = await prisma.teacherSubject.findFirst({
          where: {
            teacherId: teacher.id,
            subjectId: subject.id,
            classId: cls.id,
          },
        });
        if (!link) {
          await prisma.teacherSubject.create({
            data: {
              teacherId: teacher.id,
              subjectId: subject.id,
              classId: cls.id,
            },
          });
        }
      }
    }

    const demoStudents = [
      { fullName: "Aliyev Akmal", className: "5-A" },
      { fullName: "Karimova Madina", className: "5-A" },
      { fullName: "Sobirov Bekzod", className: "5-A" },
      { fullName: "Yusupova Sevinch", className: "5-A" },
      { fullName: "Rahimov Sanjar", className: "9-A" },
      { fullName: "Ismoilova Lola", className: "9-A" },
    ];
    let demoStudentCount = 0;
    for (const ds of demoStudents) {
      const cls = classes.find((c) => c.name === ds.className);
      if (!cls) continue;
      const exists = await prisma.student.findFirst({
        where: { fullName: ds.fullName, classId: cls.id },
      });
      if (!exists) {
        await prisma.student.create({
          data: {
            fullName: ds.fullName,
            classId: cls.id,
            schoolId: school.id,
          },
        });
        demoStudentCount++;
      }
    }

    const allDemoStudents = await prisma.student.findMany({
      where: { schoolId: school.id, classId: { in: classes.map((c) => c.id) } },
    });
    const gradeCount = await prisma.grade.count({
      where: { teacherId: teacher.id },
    });
    let createdGrades = 0;
    if (gradeCount === 0 && allDemoStudents.length > 0) {
      const gradeValues = [5, 4, 5, 3, 4, 5, 4, 4, 3, 5];
      for (const stu of allDemoStudents.slice(0, 6)) {
        for (const sub of subjects.slice(0, 3)) {
          for (let i = 0; i < 3; i++) {
            const v = gradeValues[(stu.id + sub.id + i) % gradeValues.length];
            const daysAgo = i * 4 + ((stu.id + sub.id) % 5);
            await prisma.grade.create({
              data: {
                studentId: stu.id,
                teacherId: teacher.id,
                subjectId: sub.id,
                classId: stu.classId,
                gradeType: "daily",
                topic: i === 0 ? "Mavzuni o'zlashtirish" : "",
                value: v,
                quarter: 1,
                gradeDate: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
              },
            });
            createdGrades++;
          }
        }
      }
    }

    const year = new Date().getFullYear();
    const sy = `${year}-${year + 1}`;
    const quarterDates = [
      { q: 1, start: `${year}-09-02`, end: `${year}-10-31` },
      { q: 2, start: `${year}-11-08`, end: `${year}-12-28` },
      { q: 3, start: `${year + 1}-01-09`, end: `${year + 1}-03-21` },
      { q: 4, start: `${year + 1}-04-01`, end: `${year + 1}-05-30` },
    ];
    for (const qd of quarterDates) {
      const exists = await prisma.quarterConfig.findFirst({
        where: {
          teacherId: teacher.id,
          subjectId: null,
          classId: null,
          quarter: qd.q,
          schoolYear: sy,
        },
      });
      if (!exists) {
        await prisma.quarterConfig.create({
          data: {
            schoolId: school.id,
            teacherId: teacher.id,
            subjectId: null,
            classId: null,
            quarter: qd.q,
            startDate: new Date(qd.start),
            endDate: new Date(qd.end),
            schoolYear: sy,
          },
        });
      }
    }

    return NextResponse.json({
      ok: true,
      message: `${school.name} uchun demo hisoblar tayyor.`,
      school: { id: school.id, name: school.name, code: school.code },
      credentials: {
        teacher: {
          login: DEFAULT_TEACHER_LOGIN,
          password: DEFAULT_TEACHER_PASSWORD,
          schoolCode: school.code,
          loginUrl: `/login?role=teacher&school=${school.code}&login=${DEFAULT_TEACHER_LOGIN}`,
        },
        schoolAdmin: {
          login: schoolAdminLogin,
          password: DEFAULT_ADMIN_PASSWORD,
          loginUrl: `/login?role=admin&login=${schoolAdminLogin}`,
        },
        superAdmin: {
          login: SUPER_ADMIN_LOGIN,
          password: SUPER_ADMIN_PASSWORD,
          note: "Faqat birinchi bootstrap chaqirilganda yaratiladi. Barcha maktablarni ko'radi.",
          loginUrl: `/login?role=admin&login=${SUPER_ADMIN_LOGIN}`,
        },
      },
      counts: {
        classes: classes.length,
        subjects: subjects.length,
        teacherSubjects: subjects.length * classes.length,
        demoStudentsCreated: demoStudentCount,
        gradesCreated: createdGrades,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Bootstrap xatolik";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
