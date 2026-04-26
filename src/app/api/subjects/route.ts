import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const schoolId = searchParams.get("schoolId");

    const where: Record<string, unknown> = {};
    if (schoolId) where.schoolId = Number(schoolId);

    const subjects = await prisma.subject.findMany({
      where,
      include: {
        school: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(subjects);
  } catch (error) {
    console.error("Fanlarni olishda xatolik:", error);
    return NextResponse.json(
      { error: "Fanlarni olishda xatolik yuz berdi" },
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
    const { name, schoolId } = body;

    if (!name || !schoolId) {
      return NextResponse.json(
        { error: "Fan nomi va maktab kiritilishi shart" },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        schoolId: Number(schoolId),
      },
      include: {
        school: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(subject, { status: 201 });
  } catch (error) {
    console.error("Fan qo'shishda xatolik:", error);
    return NextResponse.json(
      { error: "Fan qo'shishda xatolik yuz berdi" },
      { status: 500 }
    );
  }
}
