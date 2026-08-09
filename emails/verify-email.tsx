import { Button, Text } from "@react-email/components";

import { EmailLayout, styles } from "./components/layout";

type VerifyEmailProps = {
  userName?: string | null;
  verifyLink: string;
};

export function VerifyEmail({ userName, verifyLink }: VerifyEmailProps) {
  return (
    <EmailLayout
      preview="Confirm your email address"
      heading="Confirm your email"
    >
      <Text style={styles.text}>
        {userName?.trim() ? `Hi ${userName.trim()}, ` : ""}confirm this address
        so we can reach you about your workspace.
      </Text>
      <Button style={styles.button} href={verifyLink}>
        Confirm email
      </Button>
      <Text style={{ ...styles.muted, marginTop: "24px" }}>
        Or paste this link into your browser: {verifyLink}
      </Text>
    </EmailLayout>
  );
}

export default VerifyEmail;
