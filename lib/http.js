import { NextResponse } from "next/server";

// request.json() throws on an empty or malformed body, which would surface as a
// 500 and a stack trace in the logs. Read it safely: parsed JSON, or null when the
// body cannot be parsed (null is also what a JSON `null` body gives, which no
// route accepts either).
export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function badBody() {
  return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
}

// Prisma's "record not found" error, thrown when updating or deleting an id that
// does not exist.
export function isNotFound(err) {
  return err?.code === "P2025";
}
