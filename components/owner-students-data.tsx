"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JoinedStudentsTable } from "./joined-student-table/table";

export const OwnerStudentsData = () => {
  return (
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
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              Manage your account preferences and options. Customize your
              experience to fit your needs.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Configure notifications, security, and themes.
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
