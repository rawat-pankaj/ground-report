import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { readJson, badBody, isNotFound } from "../../../../../lib/http";

const VALID_STATUSES = ["pending", "approved", "rejected"];

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await readJson(request);
  if (!body || typeof body !== "object") return badBody();
  const { status } = body;

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const nomination = await prisma.nomination.update({
      where: { id },
      data: { status, reviewedAt: new Date() },
    });
    return NextResponse.json({ nomination });
  } catch (err) {
    if (isNotFound(err)) return NextResponse.json({ error: "Nomination not found" }, { status: 404 });
    throw err;
  }
}