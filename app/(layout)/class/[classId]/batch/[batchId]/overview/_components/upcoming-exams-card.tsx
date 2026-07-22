'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, BookOpen } from 'lucide-react';

interface UpcomingExamsCardProps {
  exams: any[];
}

export default function UpcomingExamsCard({ exams }: UpcomingExamsCardProps) {
  const today = new Date();
  const upcomingExams = exams
    .filter((exam: any) => new Date(exam.examDate) >= today)
    .slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Upcoming Exams</CardTitle>
            {upcomingExams.length > 0 && (
              <CardDescription>{upcomingExams.length} upcoming</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingExams.length > 0 ? (
          <>
            {upcomingExams.map((exam: any) => (
              <div
                key={exam.id}
                className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium text-sm truncate flex-1">{exam.title}</p>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {exam.totalMarks} marks
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(exam.examDate).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="text-center py-4">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No upcoming exams</p>
          </div>
        )}

        {/* CTA Button */}
        <Button variant="outline" className="w-full mt-2">
          <Plus className="w-4 h-4 mr-2" />
          Create Exam
        </Button>
      </CardContent>
    </Card>
  );
}
