"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddNewStudentPopup } from "./add-new-student-popup";
import { JoinedStudentsTable } from "./joined-student-table";
import { PendingStudentsTable } from "./pending-student-table";

export const OwnerStudentsData = () => {
  return (
    <>
      <AddNewStudentPopup />
      <Tabs defaultValue="joined">
        <TabsList>
          <TabsTrigger value="joined">Joined</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
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
      </Tabs>
    </>
  );
};
