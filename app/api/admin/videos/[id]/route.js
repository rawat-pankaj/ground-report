import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

function normalizeLanguage(input) {
  if (!input) return null;
  const v = input.trim().toLowerCase();
  if (v === "hi" || v === "hindi" || v === "हिंदी") return "hi";
  if (v === "en" || v === "english") return "en";
  return input.trim();
}

export async function PATCH(request, { params }) {
  const body = await request.json();
  const data = {};
  if (body.status) data.status = body.status;
  if (body.language !== undefined) data.language = normalizeLanguage(body.language);
  if (body.region !== undefined) data.region = body.region;
  if (body.beatTags !== undefined) data.beatTags = body.beatTags;

  const video = await prisma.video.update({ where: { id: params.id }, data });
  return NextResponse.json({ video });
}

export async function DELETE(request, { params }) {
  await prisma.video.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
