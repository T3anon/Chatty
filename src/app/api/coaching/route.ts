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
  const { action, role, languages } = await req.json();

  if (action === "join") {
    if (!role || !languages) {
      return NextResponse.json({ error: "Role and languages are required" }, { status: 400 });
    }

    console.log(`User ${userId} joining coaching queue as ${role} for ${languages}`);
    
    // Check for active coaching match
    const activeMatch = await prisma.chatParticipant.findFirst({
        where: { 
          userId: userId,
          chat: { 
            status: "ACTIVE",
            type: "COACHING"
          }
        },
        orderBy: { chat: { createdAt: 'desc' } },
        include: { chat: true }
    });
    
    if (activeMatch && (new Date().getTime() - new Date(activeMatch.chat.createdAt).getTime() < 15000)) {
         console.log(`User ${userId} already has an active coaching match ${activeMatch.chatId}`);
         return NextResponse.json({ 
           matched: true, 
           chatId: activeMatch.chatId,
           queueCount: await prisma.user.count({ where: { isCoachingQueued: true } })
         });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Get current user's profile info
      const currentUser = await tx.user.findUnique({
        where: { id: userId },
        select: { fluentLanguages: true, learningLanguages: true }
      });

      if (!currentUser?.fluentLanguages || !currentUser?.learningLanguages) {
        return { error: "Profile incomplete" };
      }

      const currentFluent = currentUser.fluentLanguages.split(',').map(s => s.trim().toLowerCase());
      const selectedLangs = languages.split(',').map((s: string) => s.trim().toLowerCase());

      // 2. Try to find a match
      // If current is TEACHER, look for STUDENT
      // If current is STUDENT, look for TEACHER
      const targetRole = role === "TEACHER" ? "STUDENT" : "TEACHER";

      const potentialMatches = await tx.user.findMany({
        where: {
          isCoachingQueued: true,
          coachingRole: targetRole,
          id: { not: userId },
        },
        orderBy: { coachingQueuedAt: "asc" },
        select: {
          id: true,
          fluentLanguages: true,
          learningLanguages: true,
          coachingLanguages: true,
        }
      });

      let match = null;
      for (const p of potentialMatches) {
        if (!p.fluentLanguages || !p.learningLanguages || !p.coachingLanguages) continue;

        const pFluent = p.fluentLanguages.split(',').map(s => s.trim().toLowerCase());
        const pCoaching = p.coachingLanguages.split(',').map(s => s.trim().toLowerCase());

        // Rule: Must share at least one fluent language
        const commonFluent = currentFluent.filter(l => pFluent.includes(l));
        if (commonFluent.length === 0) continue;

        // Rule:
        // If current is TEACHER:
        // Teacher (currentFluent) must have at least one of Student's (pCoaching) target languages.
        // AND Student (selectedLangs) must match what they put in their dropdown to at least one of the fluent languages with the teacher.
        // Wait, the user said:
        // "the teacher and student must share at minimum one known language" -> commonFluent
        // "the teacher must have at minimum one of the language(s) that the student put in their dropdown"
        // "the student must match what they put in their drop down to at least one of the fluent languages with the teacher"
        
        // Let's re-parse:
        // Student's dropdown (SL)
        // Teacher's fluent (TF)
        // Match if: TF intersects SL
        
        if (role === "TEACHER") {
          // TF = currentFluent, SL = pCoaching
          const teacherHasStudentTarget = currentFluent.filter(l => pCoaching.includes(l));
          if (teacherHasStudentTarget.length === 0) continue;
          
          // "student must match what they put in their drop down to at least one of the fluent languages with the teacher"
          // This seems redundant with TF intersects SL. 
          // pCoaching (SL) intersects TF (currentFluent).
        } else {
          // TF = pFluent, SL = selectedLangs
          const teacherHasStudentTarget = pFluent.filter(l => selectedLangs.includes(l));
          if (teacherHasStudentTarget.length === 0) continue;
        }

        match = p;
        break;
      }

      if (match) {
        const chat = await tx.chat.create({
          data: {
            type: "COACHING",
            participants: {
              create: [
                { userId: userId, role: role },
                { userId: match.id, role: targetRole },
              ],
            },
          },
        });

        await tx.user.update({
          where: { id: match.id },
          data: { isCoachingQueued: false, coachingQueuedAt: null, coachingRole: null, coachingLanguages: null },
        });

        await tx.user.update({
          where: { id: userId },
          data: { isCoachingQueued: false, coachingQueuedAt: null, coachingRole: null, coachingLanguages: null },
        });

        return { matched: true, chatId: chat.id };
      }

      // 3. No match, join queue
      await tx.user.update({
        where: { id: userId },
        data: { 
          isCoachingQueued: true, 
          coachingQueuedAt: new Date(),
          coachingRole: role,
          coachingLanguages: languages
        },
      });

      return { matched: false };
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const queueCount = await prisma.user.count({ where: { isCoachingQueued: true } });
    return NextResponse.json({ ...result, queueCount });

  } else if (action === "leave") {
    await prisma.user.update({
      where: { id: userId },
      data: { isCoachingQueued: false, coachingQueuedAt: null, coachingRole: null, coachingLanguages: null },
    });
    const queueCount = await prisma.user.count({ where: { isCoachingQueued: true } });
    return NextResponse.json({ success: true, queueCount });

  } else if (action === "status") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isCoachingQueued: true, coachingQueuedAt: true },
    });

    const queueCount = await prisma.user.count({ where: { isCoachingQueued: true } });

    const latestChat = await prisma.chatParticipant.findFirst({
        where: { 
          userId: userId,
          chat: { 
            status: "ACTIVE",
            type: "COACHING"
          }
        },
        orderBy: { chat: { createdAt: 'desc' } },
        include: { chat: true }
    });

    if (latestChat) {
         const chatAge = new Date().getTime() - new Date(latestChat.chat.createdAt).getTime();
         const joinedAt = user?.coachingQueuedAt ? new Date(user.coachingQueuedAt).getTime() : 0;
         const chatCreatedAt = new Date(latestChat.chat.createdAt).getTime();
         
         // If chat was created AFTER they joined the queue (or very recently)
         if ((chatCreatedAt > joinedAt - 2000 || !user?.isCoachingQueued) && chatAge < 60000) {
            console.log(`Matched detected in coaching status! Chat: ${latestChat.chatId}`);
            if (user?.isCoachingQueued) {
                await prisma.user.update({
                    where: { id: userId },
                    data: { isCoachingQueued: false, coachingQueuedAt: null, coachingRole: null, coachingLanguages: null }
                });
            }
            return NextResponse.json({ isQueued: false, matched: true, chatId: latestChat.chatId, queueCount });
         }
    }

    return NextResponse.json({ isQueued: user?.isCoachingQueued || false, queueCount });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
