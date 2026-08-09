import { Button, Text } from "@react-email/components";

import { EmailLayout, styles } from "./components/layout";

type OrganizationInvitationEmailProps = {
  organizationName: string;
  invitedByName?: string | null;
  invitedByEmail: string;
  inviteLink: string;
};

export function OrganizationInvitationEmail({
  organizationName,
  invitedByName,
  invitedByEmail,
  inviteLink,
}: OrganizationInvitationEmailProps) {
  const inviter = invitedByName?.trim() || invitedByEmail;

  return (
    <EmailLayout
      preview={`Join ${organizationName} on TutorOS`}
      heading={`Join ${organizationName}`}
    >
      <Text style={styles.text}>
        {inviter} invited you to join <strong>{organizationName}</strong> on
        TutorOS, where you&apos;ll be able to see your batches, attendance,
        exam results and fees.
      </Text>
      <Button style={styles.button} href={inviteLink}>
        Accept invitation
      </Button>
      <Text style={{ ...styles.muted, marginTop: "24px" }}>
        Or paste this link into your browser: {inviteLink}
      </Text>
      <Text style={styles.muted}>This invitation expires in 7 days.</Text>
    </EmailLayout>
  );
}

export default OrganizationInvitationEmail;
