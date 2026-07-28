import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CtaBand } from "@/components/landing/cta-band";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { RoleShowcase } from "@/components/landing/role-showcase";

export const metadata: Metadata = {
  title: {
    absolute: "TutorOS — Run your tuition institute, minus the chaos",
  },
  description:
    "Classes, batches, attendance, exams and UPI fee collection for Indian tuition and coaching institutes.",
  openGraph: {
    title: "TutorOS — Run your tuition institute, minus the chaos",
    description:
      "Classes, batches, attendance, exams and UPI fee collection for Indian tuition and coaching institutes.",
    type: "website",
  },
};

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="font-sans">
      <LandingHeader />
      <Hero />
      <FeatureGrid />
      <HowItWorks />
      <RoleShowcase />
      <CtaBand />
      <LandingFooter />
    </main>
  );
}
