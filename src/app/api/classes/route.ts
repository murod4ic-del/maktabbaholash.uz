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

    const classes = await prisma.class.findMany({
      where,
      include: {
        school: { select: { id: true, name: true } },
        _count: { select: { students: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(classes);
  } catch (error) {
    console.error("Sinflarni olishda xatolik:", error);
    return NextResponse.json(
      { error: "Sinflarni olishda xatolik yuz berdi" },
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
        { error: "Sinf nomi va maktab kiritilishi shart" },
        { status: 400 }
      );
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        schoolId: Number(schoolId),
      },
      include: {
        school: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(newClass, { status: 201 });
  } catch (error) {
    console.error("Sinf qo'shishda xatolik:", error);
    return NextResponse.json(
      { error: "Sinf qo'shishda xatolik yuz berdi" },
      { status: 500 }
    );
  }
}
