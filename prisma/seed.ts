import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  let school = await prisma.school.findFirst();
  if (!school) {
    school = await prisma.school.create({
      data: { name: "1-sonli maktab", code: "maktab-1" },
    });
    console.log("Maktab yaratildi:", school.name);
  }

  const classNames = ["1-A", "1-B", "2-A", "2-B", "3-A", "3-B", "4-A", "5-A", "6-A", "7-A", "8-A", "9-A", "10-A", "11-A"];
  for (const name of classNames) {
    const exists = await prisma.class.findFirst({ where: { name, schoolId: school.id } });
    if (!exists) {
      await prisma.class.create({ data: { name, schoolId: school.id } });
    }
  }
  console.log("Sinflar yaratildi");

  const subjectNames = ["Matematika", "Ona tili", "Adabiyot", "Ingliz tili", "Tarix", "Geografiya", "Biologiya", "Fizika", "Kimyo", "Informatika", "Jismoniy tarbiya", "Musiqa", "Tasviriy san'at"];
  for (const name of subjectNames) {
    const exists = await prisma.subject.findFirst({ where: { name, schoolId: school.id } });
    if (!exists) {
      await prisma.subject.create({ data: { name, schoolId: school.id } });
    }
  }
  console.log("Fanlar yaratildi");

  const teacherExists = await prisma.teacher.findFirst();
  if (!teacherExists) {
    await prisma.teacher.create({
      data: {
        fullName: "Karimov Jasur",
        login: "jasur",
        passwordHash: bcrypt.hashSync("123456", 10),
        phone: "+998901234567",
        schoolId: school.id,
      },
    });
    console.log("Test o'qituvchi yaratildi: login=jasur, parol=123456");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => { await prisma.$disconnect(); });
