"use client";

import { AddNewStudentPopup } from "@/components/add-new-student-popup";
import { ArchievedStudentsTable } from "@/components/archieved-students-table";
import { JoinedStudentsTable } from "@/components/joined-student-data-table";
import { PendingStudentsTable } from "@/components/pending-student-data-table";
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
          <JoinedStudentsTable />
        </TabsContent>
        <TabsContent value="pending">
          <PendingStudentsTable />
        </TabsContent>
        <TabsContent value="archieved">
          <ArchievedStudentsTable />
        </TabsContent>
      </Tabs>
    </>
  );
};
