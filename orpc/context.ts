// import { auth } from "@clerk/nextjs/server";
import { db } from "@/prisma/db";

export async function createContext() {
  //   const { userId } = await auth();

  return {
    db,
    // userId,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
