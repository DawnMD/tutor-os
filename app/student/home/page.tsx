import { auth } from "@clerk/nextjs/server";

export default async function StudentHome() {
  await auth.protect();
  return <div>Student Home</div>;
}
