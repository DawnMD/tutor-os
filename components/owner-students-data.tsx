"use client";

import { AddNewStudentPopup } from "@/components/add-new-student-popup";
import { ArchievedStudentsTable } from "@/components/archieved-students-table";
import { JoinedStudentsTable } from "@/components/joined-student-data-table";
import { PendingStudentsTable } from "@/components/pending-student-data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const OwnerStudentsData = () => {
  return (
    <>
      <AddNewStudentPopup />
      <Tabs defaultValue="joined">
        <TabsList>
          <TabsTrigger value="joined">Joined</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="archieved">Archieved</TabsTrigger>
        </TabsList>
        <TabsContent value="joined">
          <Card>
            <CardHeader>
              <CardTitle>Joined Students</CardTitle>
            </CardHeader>
            <CardContent>
              <JoinedStudentsTable />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Students</CardTitle>
            </CardHeader>
            <CardContent>
              <PendingStudentsTable />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="archieved">
          <Card>
            <CardHeader>
              <CardTitle>Archieved Students</CardTitle>
            </CardHeader>
            <CardContent>
              <ArchievedStudentsTable />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
};
