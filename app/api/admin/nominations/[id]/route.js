import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function PATCH(request, { params }) {
  const { status } = await request.json();
  const nomination = await prisma.nomination.update({
    where: { id: params.id },
    data: { status, reviewedAt: new Date() },
  });
  return NextResponse.json({ nomination });
}
