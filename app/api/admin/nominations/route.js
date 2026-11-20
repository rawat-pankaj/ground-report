import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const nominations = await prisma.nomination.findMany({
    orderBy: { submittedAt: "desc" },
  });
  return NextResponse.json({ nominations });
}
