import { Button, Text } from "@react-email/components";

import { EmailLayout, styles } from "./components/layout";

type ResetPasswordEmailProps = {
  userName?: string | null;
  resetLink: string;
};

export function ResetPasswordEmail({
  userName,
  resetLink,
}: ResetPasswordEmailProps) {
  return (
    <EmailLayout
      preview="Reset your TutorOS password"
      heading="Reset your password"
    >
      <Text style={styles.text}>
        {userName?.trim() ? `Hi ${userName.trim()}, ` : ""}we got a request to
        reset your TutorOS password. Choose a new one using the button below.
      </Text>
      <Button style={styles.button} href={resetLink}>
        Choose a new password
      </Button>
      <Text style={{ ...styles.muted, marginTop: "24px" }}>
        Or paste this link into your browser: {resetLink}
      </Text>
      <Text style={styles.muted}>
        If you didn&apos;t ask for this, nothing has changed — you can ignore
        this email.
      </Text>
    </EmailLayout>
  );
}

export default ResetPasswordEmail;
