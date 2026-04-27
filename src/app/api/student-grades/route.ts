import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "student") {
      return NextResponse.json({ error: "Faqat o'quvchi kirishi mumkin" }, { status: 403 });
    }

    const studentId = Number(session.user.id);

    const grades = await prisma.grade.findMany({
      where: { studentId },
      include: {
        subject: { select: { id: true, name: true } },
        teacher: { select: { id: true, fullName: true } },
      },
      orderBy: { gradeDate: "desc" },
    });

    return NextResponse.json({ grades });
  } catch (error) {
    console.error("Student grades error:", error);
    return NextResponse.json({ error: "Xatolik yuz berdi" }, { status: 500 });
  }
}
