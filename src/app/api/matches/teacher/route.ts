import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { findTeacherMatches } from "@/lib/matching/logic";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const targetLanguage = searchParams.get("language");

  if (!targetLanguage) {
    return NextResponse.json({ error: "Language is required" }, { status: 400 });
  }

  const matches = await findTeacherMatches((session.user as any).id, targetLanguage);
  return NextResponse.json(matches);
}
