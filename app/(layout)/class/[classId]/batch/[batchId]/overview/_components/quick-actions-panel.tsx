"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, CheckSquare, BookOpen, FileText, UserPlus } from "lucide-react";

interface QuickActionsPanelProps {
  batchId: string;
  classId: string;
}

export default function QuickActionsPanel({
  batchId,
  classId,
}: QuickActionsPanelProps) {
  const actions = [
    {
      icon: Play,
      label: "Start Session",
      description: "Begin today's class",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      icon: CheckSquare,
      label: "Mark Attendance",
      description: "Record student attendance",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      icon: BookOpen,
      label: "Create Exam",
      description: "Add new exam",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      icon: FileText,
      label: "Upload Notes",
      description: "Share study materials",
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950",
    },
    {
      icon: UserPlus,
      label: "Invite Student",
      description: "Add new student",
      color: "text-pink-600 dark:text-pink-400",
      bgColor: "bg-pink-50 dark:bg-pink-950",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => {
          const IconComponent = action.icon;
          return (
            <Button
              key={action.label}
              variant="outline"
              className="w-full h-auto justify-start p-3 hover:bg-muted"
            >
              <div className={`p-2 rounded mr-3 ${action.bgColor}`}>
                <IconComponent className={`w-4 h-4 ${action.color}`} />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">{action.label}</p>
                <p className="text-xs text-muted-foreground">
                  {action.description}
                </p>
              </div>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
