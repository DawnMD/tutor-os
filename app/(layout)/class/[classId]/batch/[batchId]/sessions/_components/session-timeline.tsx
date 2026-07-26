"use client";

import { cn } from "@/lib/utils";
import { getSessionStatus, SESSION_STATUS_META, Session } from "./utils";
import { SessionCard } from "./session-card";

interface SessionTimelineProps {
  sessions: Session[];
  totalStudents: number;
  onView: (session: Session) => void;
  onEdit: (session: Session) => void;
  onDuplicate: (session: Session) => void;
}

export function SessionTimeline({
  sessions,
  totalStudents,
  onView,
  onEdit,
  onDuplicate,
}: SessionTimelineProps) {
  return (
    <div className="relative">
      {sessions.map((session, index) => {
        const isLast = index === sessions.length - 1;
        const statusMeta = SESSION_STATUS_META[getSessionStatus(session)];
        return (
          <div key={session.id} className="relative flex gap-4 sm:gap-5">
            {/* Timeline rail (hidden on mobile for a simplified stack) */}
            <div className="relative hidden flex-col items-center sm:flex">
              <span
                className={cn(
                  "mt-5 size-3 shrink-0 rounded-full ring-4 ring-background",
                  statusMeta.dot,
                )}
              />
              {!isLast && (
                <span className="mt-1 w-px flex-1 bg-border" />
              )}
            </div>

            <div className={cn("min-w-0 flex-1", isLast ? "pb-0" : "pb-5")}>
              <SessionCard
                session={session}
                totalStudents={totalStudents}
                onView={() => onView(session)}
                onEdit={() => onEdit(session)}
                onDuplicate={() => onDuplicate(session)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
