import { EyebrowLabel, Section } from "./section";

const STEPS: { number: string; title: string; description: string }[] = [
  {
    number: "01",
    title: "Create your institute",
    description:
      "Sign up and set up your institute in minutes. No credit card, no installation, no setup fees.",
  },
  {
    number: "02",
    title: "Add classes, batches and students",
    description:
      "Build out your classes and batches, set monthly fees, and invite students by email.",
  },
  {
    number: "03",
    title: "Run the day",
    description:
      "Take attendance, log sessions, record marks — and let fees settle over UPI while you teach.",
  },
];

export function HowItWorks() {
  return (
    <Section id="how-it-works" className="border-y border-border bg-muted/30">
      <div className="max-w-2xl">
        <EyebrowLabel>How it works</EyebrowLabel>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Up and running in three steps
        </h2>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.number} className="relative">
            <span className="font-heading text-5xl font-bold tracking-tight text-primary/30">
              {step.number}
            </span>
            <h3 className="mt-4 font-heading text-lg font-semibold tracking-wide uppercase">
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
