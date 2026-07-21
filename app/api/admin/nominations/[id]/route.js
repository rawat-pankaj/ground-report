import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const { status } = await request.json();
  const nomination = await prisma.nomination.update({
    where: { id },
    data: { status, reviewedAt: new Date() },
  });
  return NextResponse.json({ nomination });
}