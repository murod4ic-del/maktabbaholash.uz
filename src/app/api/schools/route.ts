import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const ctx = await requireSession();
    if (!ctx) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }
    if (ctx.isSuperAdmin) {
      const schools = await prisma.school.findMany({
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: {
              teachers: true,
              students: true,
              classes: true,
              subjects: true,
            },
          },
        },
      });
      return NextResponse.json(schools);
    }
    if (ctx.schoolId == null) {
      return NextResponse.json([], { status: 200 });
    }
    const school = await prisma.school.findUnique({
      where: { id: ctx.schoolId },
      include: {
        _count: {
          select: {
            teachers: true,
            students: true,
            classes: true,
            subjects: true,
          },
        },
      },
    });
    return NextResponse.json(school ? [school] : []);
  } catch (error) {
    console.error("Maktablarni olishda xatolik:", error);
    return NextResponse.json({ error: "Maktablarni olishda xatolik" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireSession();
    if (!ctx || !ctx.isSuperAdmin) {
      return NextResponse.json(
        { error: "Faqat super admin yangi maktab qo'sha oladi" },
        { status: 403 }
      );
    }
    const body = await request.json();
    const { name, code, address, phone } = body as {
      name: string;
      code: string;
      address?: string;
      phone?: string;
    };
    if (!name || !code) {
      return NextResponse.json({ error: "Nom va kod shart" }, { status: 400 });
    }
    const exists = await prisma.school.findUnique({ where: { code } });
    if (exists) {
      return NextResponse.json({ error: "Bu kod bilan maktab bor" }, { status: 409 });
    }
    const school = await prisma.school.create({
      data: {
        name,
        code: code.toLowerCase(),
        address: address || "",
        phone: phone || "",
      },
    });
    return NextResponse.json(school, { status: 201 });
  } catch (error) {
    console.error("Maktab qo'shishda xatolik:", error);
    return NextResponse.json({ error: "Maktab qo'shishda xatolik" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const ctx = await requireSession();
    if (!ctx || !ctx.isAdmin) {
      return NextResponse.json({ error: "Ruxsat berilmagan" }, { status: 403 });
    }
    const body = await request.json();
    const { id, name, address, phone } = body as {
      id: number;
      name?: string;
      address?: string;
      phone?: string;
    };
    if (!id) return NextResponse.json({ error: "id shart" }, { status: 400 });
    if (!ctx.isSuperAdmin && ctx.schoolId !== Number(id)) {
      return NextResponse.json({ error: "Faqat o'zingizning maktabingizni tahrir qila olasiz" }, { status: 403 });
    }
    const updated = await prisma.school.update({
      where: { id: Number(id) },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(phone !== undefined ? { phone } : {}),
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Maktabni yangilashda xatolik:", error);
    return NextResponse.json({ error: "Maktabni yangilashda xatolik" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const ctx = await requireSession();
    if (!ctx || !ctx.isSuperAdmin) {
      return NextResponse.json({ error: "Faqat super admin maktabni o'chira oladi" }, { status: 403 });
    }
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id shart" }, { status: 400 });
    await prisma.school.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Maktabni o'chirishda xatolik:", error);
    return NextResponse.json({ error: "Maktabni o'chirishda xatolik (bog'liq ma'lumotlar bormi?)" }, { status: 500 });
  }
}
