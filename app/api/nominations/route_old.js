import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function POST(request) {
  const body = await request.json();
  const input = (body.input || "").trim();
  const type = body.type === "video" ? "video" : "channel";

  if (!input) {
    return NextResponse.json({ error: "A link or name is required" }, { status: 400 });
  }

  const nomination = await prisma.nomination.create({
    data: {
      type,
      input,
      reasonText: (body.reasonText || "").trim() || null,
      submitterContact: (body.submitterContact || "").trim() || null,
    },
  });

  return NextResponse.json({ nomination });
}
