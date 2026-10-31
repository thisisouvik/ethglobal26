import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { WALLET_ADDRESS } from "@/lib/config";
import { COURSES } from "@/lib/courses-data";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(2, "Name too short"),
  email: z.string().email("Invalid email"),
  courseId: z.string().min(1, "courseId required"),
  courseName: z.string().min(1),
  priceUsdt: z.number().positive(),
});

// POST /api/orders — create order for a course
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, courseId, courseName, priceUsdt } = parsed.data;

    // Verify course exists in our catalog
    const catalogCourse = COURSES.find((c) => c.id === courseId);
    if (!catalogCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Use catalog price (never trust client-submitted price for real money)
    const verifiedPrice = catalogCourse.priceUsdt;

    // Upsert course in DB if needed (for relational integrity)
    await prisma.course.upsert({
      where: { slug: catalogCourse.slug },
      update: {},
      create: {
        id: catalogCourse.id,
        slug: catalogCourse.slug,
        title: catalogCourse.title,
        subtitle: catalogCourse.subtitle,
        description: catalogCourse.description,
        priceUsdt: catalogCourse.priceUsdt,
        image: catalogCourse.image,
        category: catalogCourse.category,
        tags: catalogCourse.tags,
        instructor: catalogCourse.instructor,
        duration: catalogCourse.duration,
        lessons: catalogCourse.lessons,
        level: catalogCourse.level,
        featured: catalogCourse.featured,
        rating: catalogCourse.rating,
        reviewCount: catalogCourse.reviewCount,
      },
    });

    const order = await prisma.order.create({
      data: {
        name,
        email,
        courseId: catalogCourse.id,
        courseName,
        priceUsdt: verifiedPrice,
        paymentAddr: WALLET_ADDRESS,
        status: "PENDING",
        downloadUrl: process.env.PRODUCT_DOWNLOAD_URL || "#",
      },
    });

    return NextResponse.json({
      id: order.id,
      paymentAddr: order.paymentAddr,
      priceUsdt: Number(order.priceUsdt),
      status: order.status,
    });
  } catch (err) {
    console.error("[POST /api/orders]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/orders — list (admin only)
export async function GET(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  if (token !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      createdAt: true,
      name: true,
      email: true,
      courseName: true,
      status: true,
      priceUsdt: true,
      paymentTxHash: true,
    },
  });

  return NextResponse.json(
    orders.map((o) => ({ ...o, priceUsdt: Number(o.priceUsdt) }))
  );
}
