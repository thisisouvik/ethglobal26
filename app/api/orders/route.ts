import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { WALLET_ADDRESS } from "@/lib/config";
import { COURSES } from "@/lib/courses-data";
import { ensureOrderIntent } from "@/lib/stablegate/orders";
import { stablegate } from "@/lib/stablegate/client";
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

    // Verify course exists in Neon DB or catalog
    let dbCourse = await prisma.course.findFirst({
      where: {
        OR: [{ id: courseId }, { slug: courseId }],
      },
    });

    const catalogCourse = COURSES.find((c) => c.id === courseId || c.slug === courseId);
    if (!dbCourse && !catalogCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Upsert course in Neon DB if not present
    if (!dbCourse && catalogCourse) {
      dbCourse = await prisma.course.upsert({
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
    }

    // Use authoritative price from DB / catalog
    const verifiedPrice = dbCourse ? Number(dbCourse.priceUsdt) : catalogCourse!.priceUsdt;
    const finalCourseId = dbCourse ? dbCourse.id : catalogCourse!.id;
    const finalCourseName = dbCourse ? dbCourse.title : (catalogCourse?.title || courseName);

    const order = await prisma.order.create({
      data: {
        name,
        email,
        courseId: finalCourseId,
        courseName: finalCourseName,
        priceUsdt: verifiedPrice,
        paymentAddr: WALLET_ADDRESS,
        status: "PENDING",
        downloadUrl: process.env.PRODUCT_DOWNLOAD_URL || "#",
      },
    });

    // Create the StableGate payment intent (idempotent, server-to-server).
    // If the gateway is unreachable the order still exists; the pay page
    // retries intent creation via POST /api/orders/[id]/intent.
    let checkoutUrl: string | null = null;
    let gatewayError: string | null = null;
    if (stablegate.configured) {
      const result = await ensureOrderIntent(order);
      checkoutUrl = result.checkoutUrl ?? null;
      gatewayError = result.ok ? null : (result.error ?? "Intent creation failed");
    }

    return NextResponse.json({
      id: order.id,
      paymentAddr: order.paymentAddr,
      priceUsdt: Number(order.priceUsdt),
      status: order.status,
      gateway: checkoutUrl ? "stablegate" : null,
      checkoutUrl,
      ...(gatewayError ? { gatewayError } : {}),
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
