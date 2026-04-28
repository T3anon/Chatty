import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { action } = await req.json();

  if (action === "join") {
    console.log(`User ${userId} joining queue`);
    
    // Check if user is already in a match (to avoid re-queueing if they already found one)
    const activeMatch = await prisma.chatParticipant.findFirst({
        where: { 
          userId: userId,
          chat: { status: "ACTIVE" }
        },
        orderBy: { chat: { createdAt: 'desc' } },
        include: { chat: true }
    });
    
    // Check if they have a chat created in the last 15 seconds
    if (activeMatch && (new Date().getTime() - new Date(activeMatch.chat.createdAt).getTime() < 15000)) {
         return NextResponse.json({ 
           matched: true, 
           chatId: activeMatch.chatId,
           queueCount: await prisma.user.count({ where: { isQueued: true } })
         });
    }

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
    // 1. Get current user's languages
    const currentUser = await tx.user.findUnique({
      where: { id: userId },
      select: { fluentLanguages: true, learningLanguages: true }
    });

    if (!currentUser?.fluentLanguages || !currentUser?.learningLanguages) {
      // If they haven't set up languages, we can't match them based on these rules
      // Put them in queue anyway, but they might not find matches easily
      await tx.user.update({
        where: { id: userId },
        data: { isQueued: true, queuedAt: new Date() },
      });
      return { matched: false };
    }

    const currentFluent = currentUser.fluentLanguages.split(',').map(s => s.trim().toLowerCase());
    const currentLearning = currentUser.learningLanguages.split(',').map(s => s.trim().toLowerCase());

    // 2. Try to find someone else already in queue first who matches the language criteria
    const potentialMatches = await tx.user.findMany({
      where: {
        isQueued: true,
        id: { not: userId },
      },
      orderBy: {
        queuedAt: "asc",
      },
      select: {
        id: true,
        fluentLanguages: true,
        learningLanguages: true,
      }
    });

    let match = null;
    for (const p of potentialMatches) {
      if (!p.fluentLanguages || !p.learningLanguages) continue;

      const pFluent = p.fluentLanguages.split(',').map(s => s.trim().toLowerCase());
      const pLearning = p.learningLanguages.split(',').map(s => s.trim().toLowerCase());

      // Check if they share at least one fluent language
      const commonFluent = currentFluent.filter(l => pFluent.includes(l));
      if (commonFluent.length === 0) continue;

      // Check if they share at least one learning language
      const commonLearning = currentLearning.filter(l => pLearning.includes(l));
      if (commonLearning.length === 0) continue;

      // Found a match!
      match = p;
      break;
    }

    if (match) {
        // Create a 1-on-1 chat
        const chat = await tx.chat.create({
          data: {
            type: "ONE_ON_ONE",
            participants: {
              create: [
                { userId: userId },
                { userId: match.id },
              ],
            },
          },
        });

        // Mark matched user as not queued
        await tx.user.update({
          where: { id: match.id },
          data: { isQueued: false, queuedAt: null },
        });

        // Ensure current user is NOT marked as queued (just in case)
        await tx.user.update({
          where: { id: userId },
          data: { isQueued: false, queuedAt: null },
        });

        return { matched: true, chatId: chat.id };
      }

      // 2. If no match, put current user in queue
      await tx.user.update({
        where: { id: userId },
        data: { isQueued: true, queuedAt: new Date() },
      });

      return { matched: false };
    });

    const queueCount = await prisma.user.count({ where: { isQueued: true } });

    if (result.matched) {
      console.log(`Matched! Chat ${result.chatId} created for ${userId}`);
    }

    return NextResponse.json({ ...result, queueCount });
  } else if (action === "leave") {
    console.log(`User ${userId} leaving queue`);
    await prisma.user.update({
      where: { id: userId },
      data: { isQueued: false, queuedAt: null },
    });
    const queueCount = await prisma.user.count({ where: { isQueued: true } });
    return NextResponse.json({ success: true, queueCount });
  } else if (action === "status") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isQueued: true, queuedAt: true },
    });

    const queueCount = await prisma.user.count({ where: { isQueued: true } });

    console.log(`Status check for ${userId}: isQueued=${user?.isQueued}, totalQueue=${queueCount}`);

    // Check if user is part of a newly created active chat
    const latestChat = await prisma.chatParticipant.findFirst({
        where: { 
          userId: userId,
          chat: { status: "ACTIVE" }
        },
        orderBy: { chat: { createdAt: 'desc' } },
        include: { chat: true }
    });

    if (latestChat) {
         const chatAge = new Date().getTime() - new Date(latestChat.chat.createdAt).getTime();
         const joinedAt = user?.queuedAt ? new Date(user.queuedAt).getTime() : 0;
         const chatCreatedAt = new Date(latestChat.chat.createdAt).getTime();
         
         // If chat was created AFTER they joined the queue (or very recently)
         if ((chatCreatedAt > joinedAt - 5000 || !user?.isQueued) && chatAge < 60000) {
            console.log(`Matched detected in status! Chat: ${latestChat.chatId}`);
            
            if (user?.isQueued) {
                await prisma.user.update({
                    where: { id: userId },
                    data: { isQueued: false, queuedAt: null }
                });
            }
            
            return NextResponse.json({ isQueued: false, matched: true, chatId: latestChat.chatId, queueCount });
         }
    }

    return NextResponse.json({ isQueued: user?.isQueued || false, queueCount });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
