import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

const VALID_STATUSES = ["pending", "approved", "rejected"];

export async function PATCH(request, { params }) {
  const { id } = await params;
  const { status } = await request.json();

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const nomination = await prisma.nomination.update({
    where: { id },
    data: { status, reviewedAt: new Date() },
  });
  return NextResponse.json({ nomination });
}