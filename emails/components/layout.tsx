import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

/**
 * Shared shell for every transactional email. Inline styles only — email
 * clients ignore Tailwind and most of them ignore <style> blocks too.
 */
export const styles = {
  body: {
    backgroundColor: "#fafafa",
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    color: "#18181b",
    margin: 0,
    padding: "32px 0",
  },
  container: {
    backgroundColor: "#ffffff",
    border: "1px solid #e4e4e7",
    borderRadius: "8px",
    margin: "0 auto",
    maxWidth: "480px",
    padding: "32px",
  },
  heading: {
    fontSize: "20px",
    fontWeight: 600,
    lineHeight: "28px",
    margin: "0 0 16px",
  },
  text: {
    fontSize: "14px",
    lineHeight: "22px",
    margin: "0 0 16px",
  },
  button: {
    backgroundColor: "#18181b",
    borderRadius: "6px",
    color: "#fafafa",
    display: "inline-block",
    fontSize: "14px",
    fontWeight: 500,
    padding: "10px 20px",
    textDecoration: "none",
  },
  hr: {
    border: "none",
    borderTop: "1px solid #e4e4e7",
    margin: "24px 0",
  },
  muted: {
    color: "#71717a",
    fontSize: "12px",
    lineHeight: "18px",
    margin: "0 0 8px",
    wordBreak: "break-all" as const,
  },
} as const;

export function EmailLayout({
  preview,
  heading,
  children,
}: {
  preview: string;
  heading: string;
  children: ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={{ ...styles.muted, fontWeight: 600, letterSpacing: 1 }}>
            TUTOROS
          </Text>
          <Heading style={styles.heading}>{heading}</Heading>
          <Section>{children}</Section>
          <Hr style={styles.hr} />
          <Text style={styles.muted}>
            You received this email because someone used this address on TutorOS.
            If that wasn&apos;t you, you can safely ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
