import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await auth.protect();

  console.log(user);

  if (
    user.has({
      role: "org:admin",
    })
  ) {
    redirect("/owner/dashboard");
  } else {
    redirect("/student/dashboard");
  }
}
