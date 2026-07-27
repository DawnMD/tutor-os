import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Accept invitation",
};

export default function AcceptInvitationPage() {
  return (
    <div className="bg-muted flex w-full flex-1 items-center justify-center p-6 md:p-10">
      <SignIn />
    </div>
  );
}
