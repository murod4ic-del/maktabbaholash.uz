import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const parents = await prisma.parent.findMany({
      select: {
        id: true,
        fullName: true,
        login: true,
        phone: true,
        createdAt: true,
        parentStudents: {
          include: {
            student: { select: { id: true, fullName: true, classId: true } },
          },
        },
      },
      orderBy: { fullName: "asc" },
    });

    return NextResponse.json(parents);
  } catch (error) {
    console.error("Ota-onalarni olishda xatolik:", error);
    return NextResponse.json(
      { error: "Ota-onalarni olishda xatolik yuz berdi" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Ruxsat berilmagan. Faqat admin ota-ona qo'sha oladi" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { fullName, login, password, phone, studentIds } = body as {
      fullName: string;
      login: string;
      password: string;
      phone?: string;
      studentIds?: number[];
    };

    if (!fullName || !login || !password) {
      return NextResponse.json(
        { error: "Ism, login va parol kiritilishi shart" },
        { status: 400 }
      );
    }

    const existing = await prisma.parent.findUnique({ where: { login } });
    if (existing) {
      return NextResponse.json(
        { error: "Bu login allaqachon mavjud" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const parent = await prisma.parent.create({
      data: {
        fullName,
        login,
        passwordHash,
        phone: phone || "",
        parentStudents:
          studentIds && studentIds.length > 0
            ? {
                create: studentIds.map((sid: number) => ({
                  studentId: sid,
                })),
              }
            : undefined,
      },
      select: {
        id: true,
        fullName: true,
        login: true,
        phone: true,
        createdAt: true,
        parentStudents: {
          include: {
            student: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    return NextResponse.json(parent, { status: 201 });
  } catch (error) {
    console.error("Ota-ona qo'shishda xatolik:", error);
    return NextResponse.json(
      { error: "Ota-ona qo'shishda xatolik yuz berdi" },
      { status: 500 }
    );
  }
}
