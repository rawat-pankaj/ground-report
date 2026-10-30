import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "../../../../../lib/prisma";
import { readJson, badBody, isNotFound } from "../../../../../lib/http";

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
const MAX_NOTE_LENGTH = 1000;
const MAX_PLACE_LENGTH = 100;

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await readJson(request);
  if (!body || typeof body !== "object") return badBody();
  const data = {};

  // Check the video exists before touching anything: setting `featured` below
  // un-features every other video first, and a missing id must not do that.
  const existing = await prisma.video.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

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
  if (body.beatTags !== undefined) data.beatTags = normalizeBeatTags(body.beatTags);

  // Free-text fields shown on the public video page. Empty/whitespace -> null.
  // Length-capped server-side so the admin UI limit isn't the only guard.
  for (const [field, max] of [["curatorNote", MAX_NOTE_LENGTH], ["place", MAX_PLACE_LENGTH]]) {
    if (body[field] === undefined) continue;
    if (body[field] !== null && typeof body[field] !== "string") {
      return NextResponse.json({ error: `${field} must be text` }, { status: 400 });
    }
    const value = (body[field] || "").trim();
    if (value.length > max) {
      return NextResponse.json({ error: `${field} must be ${max} characters or fewer` }, { status: 400 });
    }
    data[field] = value || null;
  }

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
    if (!Array.isArray(body.categoryIds) || !body.categoryIds.every((c) => typeof c === "string")) {
      return NextResponse.json({ error: "categoryIds must be a list of ids" }, { status: 400 });
    }
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
  revalidateTag("videos");
  return NextResponse.json({ video });
}

export async function DELETE(request, { params }) {
  const { id } = await params;

  const existing = await prisma.video.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  try {
    await prisma.video.delete({ where: { id } });
  } catch (err) {
    // Deleted by someone else between the check above and here.
    if (isNotFound(err)) return NextResponse.json({ error: "Video not found" }, { status: 404 });
    throw err;
  }
  revalidateTag("videos");
  return NextResponse.json({ ok: true });
}