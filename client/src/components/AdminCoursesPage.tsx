import React from 'react';
import HeaderComponent from '@/components/HeaderComponent';
import AdminCourseList from '@/components/AdminCourseList';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const AdminCoursesPage: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <HeaderComponent />
      <main className="mx-auto w-full flex-1 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-8 text-3xl font-bold">Admin - Courses</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Course Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full">
                <Tabs defaultValue="pending">
                  <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="published">Published</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                  <TabsTrigger value="hidden">Hidden</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-4">
                  <AdminCourseList status="pending" />
                </TabsContent>

                <TabsContent value="published" className="mt-4">
                  <AdminCourseList status="published" />
                </TabsContent>

                <TabsContent value="rejected" className="mt-4">
                  <AdminCourseList status="rejected" />
                </TabsContent>

                <TabsContent value="hidden" className="mt-4">
                  <AdminCourseList status="hidden" />
                </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminCoursesPage;
export { AdminCoursesPage };
