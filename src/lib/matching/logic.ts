import { prisma } from "../prisma";

/**
 * Teacher-Student Matching Logic:
 * One person is teacher, one is student.
 * Teacher must be fluent in the language the student wants to know (targetLanguage)
 * Teacher must also be fluent in the language the student is already fluent in (studentFluentLanguage).
 */
export async function findTeacherMatches(userId: string, targetLanguage: string) {
  const student = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!student || !student.fluentLanguages) return [];

  const studentFluentLangs = student.fluentLanguages.split(",").map((s: string) => s.trim());

  // Find users who are fluent in targetLanguage AND fluent in AT LEAST ONE of student's fluent languages
  const potentialTeachers = await prisma.user.findMany({
    where: {
      id: { not: userId },
      fluentLanguages: {
        contains: targetLanguage,
      },
    },
  });

  return potentialTeachers.filter(teacher => {
    if (!teacher.fluentLanguages) return false;
    const teacherFluentLangs = teacher.fluentLanguages.split(",").map((s: string) => s.trim());
    
    // Check if teacher is fluent in the target language
    const teachesTarget = teacherFluentLangs.includes(targetLanguage);
    
    // Check if teacher is fluent in at least one of student's fluent languages
    const speaksStudentLang = studentFluentLangs.some(lang => teacherFluentLangs.includes(lang));
    
    return teachesTarget && speaksStudentLang;
  });
}

/**
 * Peer-to-Peer Talk Matching Logic:
 * Minimum 1 fluent language in common.
 * Minimum 2 languages in common (can be fluent or learning).
 * Can have "both wanting to learn languages in common and only 1 fluent language".
 */
export async function findPeerMatches(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) return [];

  const userFluent = (user.fluentLanguages || "").split(",").map((s: string) => s.trim()).filter(Boolean);
  const userLearning = (user.learningLanguages || "").split(",").map((s: string) => s.trim()).filter(Boolean);
  const userAll = [...userFluent, ...userLearning];

  const allOtherUsers = await prisma.user.findMany({
    where: { id: { not: userId } },
  });

  return allOtherUsers.filter(other => {
    const otherFluent = (other.fluentLanguages || "").split(",").map((s: string) => s.trim()).filter(Boolean);
    const otherLearning = (other.learningLanguages || "").split(",").map((s: string) => s.trim()).filter(Boolean);
    const otherAll = [...otherFluent, ...otherLearning];

    // 1. Minimum 1 fluent language in common
    const commonFluent = userFluent.filter(lang => otherFluent.includes(lang));
    if (commonFluent.length < 1) return false;

    // 2. Minimum 2 languages in common (fluent or learning)
    const commonAll = userAll.filter(lang => otherAll.includes(lang));
    if (commonAll.length < 2) return false;

    return true;
  });
}
