import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        fluentLanguages: true,
        learningLanguages: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, username, fluentLanguages, learningLanguages } = await req.json();

  if (!username || !fluentLanguages || !learningLanguages) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Server-side validation for comma separation
  const validateLanguages = (str: string) => {
    if (!str || !str.trim()) return false;
    const words = str.trim().split(/\s+/);
    if (words.length > 1 && !str.includes(",")) {
      return false;
    }
    return true;
  };

  if (!validateLanguages(fluentLanguages)) {
    return NextResponse.json({ error: "Fluent languages must be comma-separated" }, { status: 400 });
  }

  if (!validateLanguages(learningLanguages)) {
    return NextResponse.json({ error: "Learning languages must be comma-separated" }, { status: 400 });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email! },
      data: {
        name,
        username,
        fluentLanguages,
        learningLanguages,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
