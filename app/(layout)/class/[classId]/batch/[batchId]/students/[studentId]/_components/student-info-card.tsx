import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Mail, Phone, ShieldUser, UserRound } from "lucide-react";
import { StudentDashboard } from "./utils";

interface StudentInfoCardProps {
  student: StudentDashboard;
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </span>
      <span className="text-right text-sm font-medium">
        {value || <span className="text-muted-foreground">—</span>}
      </span>
    </div>
  );
}

export function StudentInfoCard({ student }: StudentInfoCardProps) {
  const membership = student.batches[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Student Information</CardTitle>
      </CardHeader>
      <CardContent className="divide-y">
        <InfoRow icon={Mail} label="Email" value={student.email} />
        <InfoRow icon={Phone} label="Phone" value={student.phone} />
        <InfoRow
          icon={ShieldUser}
          label="Guardian"
          value={student.guardianName}
        />
        <InfoRow
          icon={Phone}
          label="Guardian Phone"
          value={student.guardianPhone}
        />
        <InfoRow
          icon={UserRound}
          label="Joined Batch"
          value={
            membership
              ? format(new Date(membership.joinedAt), "d MMM yyyy")
              : undefined
          }
        />
        <div className="flex items-center justify-between gap-4 py-2.5">
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <UserRound className="size-4" />
            Current Status
          </span>
          <Badge className="text-emerald-600 dark:text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
            Active
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
