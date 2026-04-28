import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { chatId } = await params;

  // Verify participant
  const participant = await prisma.chatParticipant.findUnique({
    where: {
      userId_chatId: { userId, chatId },
    },
  });

  if (!participant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Update chat status to ENDED
  await prisma.chat.update({
    where: { id: chatId },
    data: { status: "ENDED" },
  });

  return NextResponse.json({ success: true });
}
