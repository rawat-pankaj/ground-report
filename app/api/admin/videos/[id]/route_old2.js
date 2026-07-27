import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

function normalizeLanguage(input) {
  if (!input) return null;
  const v = input.trim().toLowerCase();
  if (v === "hi" || v === "hindi" || v === "हिंदी") return "hi";
  if (v === "en" || v === "english") return "en";
  return input.trim();
}

function normalizeBeatTags(input) {
  if (!input) return null;
  const cleaned = input
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  return cleaned.length ? [...new Set(cleaned)].join(", ") : null;
}

const VALID_VIDEO_STATUSES = ["published", "hidden"];

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const data = {};

  if (body.status !== undefined) {
    if (!VALID_VIDEO_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_VIDEO_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }
    data.status = body.status;
  }

  if (body.language !== undefined) data.language = normalizeLanguage(body.language);
  if (body.region !== undefined) data.region = body.region;
  if (body.beatTags !== undefined) data.beatTags = normalizeBeatTags(body.beatTags);

  if (body.featured !== undefined) {
    if (body.featured) {
      await prisma.video.updateMany({
        where: { featured: true },
        data: { featured: false },
      });
    }
    data.featured = body.featured;
  }

  if (body.categoryIds !== undefined) {
    data.categories = {
      deleteMany: {},
      create: body.categoryIds.map((categoryId) => ({ categoryId })),
    };
  }

  const video = await prisma.video.update({
    where: { id },
    data,
    include: { categories: { include: { category: true } } },
  });
  return NextResponse.json({ video });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  await prisma.video.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}