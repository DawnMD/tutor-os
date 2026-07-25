import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { EmptyState } from "./empty-state";

// Notes are not modelled in the schema yet, so this always renders the
// empty state that nudges the teacher toward uploading the first note.
export function NotesCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Notes</CardTitle>
      </CardHeader>
      <CardContent>
        <EmptyState
          icon={FileText}
          title="No notes uploaded"
          description="Sharing study material with a batch is coming soon."
          actionLabel="Coming soon"
          disabled
        />
      </CardContent>
    </Card>
  );
}
