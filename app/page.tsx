import { Test } from "@/app/test";
import { auth } from "@clerk/nextjs/server";

export default async function Home() {
  await auth.protect();
  return (
    <div>
      <Test />
    </div>
  );
}
