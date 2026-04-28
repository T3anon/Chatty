import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
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

  const messages = await prisma.message.findMany({
    where: { chatId },
    orderBy: { createdAt: "asc" },
  });

  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: { status: true }
  });

  return NextResponse.json({ messages, status: chat?.status || "ACTIVE" });
}

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
  const { content } = await req.json();

  if (!content) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  // Verify participant
  const participant = await prisma.chatParticipant.findUnique({
    where: {
      userId_chatId: { userId, chatId },
    },
  });

  if (!participant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const message = await prisma.message.create({
    data: {
      chatId,
      senderId: userId,
      content,
    },
  });

  return NextResponse.json(message);
}
