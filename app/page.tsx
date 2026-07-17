import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await auth.protect();

  if (
    user.has({
      role: "org:admin",
    })
  ) {
    redirect("/owner/dashboard");
  } else {
    redirect("/student/home");
  }
}
