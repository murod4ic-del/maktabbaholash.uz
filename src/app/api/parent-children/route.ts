import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "parent") {
      return NextResponse.json(
        { error: "Ruxsat berilmagan" },
        { status: 403 }
      );
    }

    const parentId = Number(session.user.id);

    const parentStudents = await prisma.parentStudent.findMany({
      where: { parentId },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            class: { select: { id: true, name: true } },
          },
        },
      },
    });

    const items = parentStudents.map((ps) => ({
      id: ps.student.id,
      fullName: ps.student.fullName,
      class: ps.student.class,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Farzandlarni olishda xatolik:", error);
    return NextResponse.json(
      { error: "Farzandlarni olishda xatolik yuz berdi" },
      { status: 500 }
    );
  }
}
