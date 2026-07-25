import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { EmptyState } from "./empty-state";

// Notes are not modelled in the schema yet — always the empty state.
export function NotesTab() {
  return (
    <Card>
      <CardContent>
        <EmptyState
          icon={FileText}
          title="No notes uploaded"
          description="Uploading study material for a batch is coming soon."
          actionLabel="Coming soon"
          disabled
        />
      </CardContent>
    </Card>
  );
}
