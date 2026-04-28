import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

async function resolveSchoolId(schoolCode: string | undefined): Promise<number | null> {
  const code = (schoolCode || "").trim();
  if (!code) return null;
  const school = await prisma.school.findUnique({ where: { code } });
  return school?.id ?? null;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        login: { label: "Login", type: "text" },
        password: { label: "Parol", type: "password" },
        role: { label: "Rol", type: "text" },
        schoolCode: { label: "Maktab kodi", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password || !credentials?.role) {
          throw new Error("Login, parol va rol kiritilishi shart");
        }

        const { login, password, role, schoolCode } = credentials;

        if (role === "admin") {
          const admin = await prisma.admin.findUnique({ where: { login } });
          if (!admin) throw new Error("Admin topilmadi");
          const valid = await bcrypt.compare(password, admin.passwordHash);
          if (!valid) throw new Error("Parol noto'g'ri");
          return {
            id: String(admin.id),
            login: admin.login,
            role: "admin" as const,
            fullName: admin.fullName,
            schoolId: admin.schoolId ?? undefined,
          };
        }

        const schoolId = await resolveSchoolId(schoolCode);
        if (!schoolId) {
          throw new Error("Maktab kodi noto'g'ri yoki kiritilmagan");
        }

        if (role === "teacher") {
          const teacher = await prisma.teacher.findFirst({
            where: { login, schoolId },
          });
          if (!teacher) throw new Error("Bu maktabda bunday o'qituvchi topilmadi");
          const valid = await bcrypt.compare(password, teacher.passwordHash);
          if (!valid) throw new Error("Parol noto'g'ri");
          return {
            id: String(teacher.id),
            login: teacher.login,
            role: "teacher" as const,
            fullName: teacher.fullName,
            schoolId: teacher.schoolId,
            isPrimary: teacher.isPrimary,
          };
        }

        if (role === "parent") {
          const parent = await prisma.parent.findFirst({
            where: { login, schoolId },
          });
          if (!parent) throw new Error("Bu maktabda bunday ota-ona topilmadi");
          const valid = await bcrypt.compare(password, parent.passwordHash);
          if (!valid) throw new Error("Parol noto'g'ri");
          return {
            id: String(parent.id),
            login: parent.login,
            role: "parent" as const,
            fullName: parent.fullName,
            schoolId: parent.schoolId ?? undefined,
          };
        }

        if (role === "student") {
          const student = await prisma.student.findFirst({
            where: { login, schoolId },
          });
          if (!student) throw new Error("Bu maktabda bunday o'quvchi topilmadi");
          if (!student.passwordHash) throw new Error("O'quvchiga parol berilmagan");
          const valid = await bcrypt.compare(password, student.passwordHash);
          if (!valid) throw new Error("Parol noto'g'ri");
          return {
            id: String(student.id),
            login: student.login!,
            role: "student" as const,
            fullName: student.fullName,
            schoolId: student.schoolId,
            classId: student.classId,
          };
        }

        throw new Error("Noto'g'ri rol");
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.login = user.login;
        token.role = user.role;
        token.fullName = user.fullName;
        token.schoolId = user.schoolId;
        token.classId = user.classId;
        token.isPrimary = user.isPrimary;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id,
        login: token.login,
        role: token.role,
        fullName: token.fullName,
        schoolId: token.schoolId,
        classId: token.classId,
        isPrimary: token.isPrimary,
      };
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
