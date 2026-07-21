import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const nominations = await prisma.nomination.findMany({
    orderBy: { submittedAt: "desc" },
  });
  return NextResponse.json({ nominations });
}
