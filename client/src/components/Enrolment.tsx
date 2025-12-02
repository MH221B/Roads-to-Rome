import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/axiosClient';
import RequireRole from './RequireRole';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { FaSpinner, FaTrash, FaBookOpen, FaChalkboardTeacher, FaSearch } from 'react-icons/fa';
import Swal from 'sweetalert2';
import HeaderComponent from './HeaderComponent';

// Types based on EERD and typical API response
interface Instructor {
  id: string;
  name: string;
  email: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  is_premium: boolean;
  status: string;
  instructor: Instructor;
}

interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  course: Course;
  status: string;
  created_at?: string;
}

const MOCK_ENROLLMENTS: Enrollment[] = [
  {
    id: "enr_1",
    student_id: "user_123",
    course_id: "1",
    status: "active",
    created_at: "2023-01-15T10:00:00Z",
    course: {
      id: "1",
      title: "Complete React Developer in 2025",
      description: "Learn React, Redux, Hooks, GraphQL, and more!",
      level: "Intermediate",
      is_premium: true,
      status: "published",
      instructor: {
        id: "inst_1",
        name: "Andrei Neagoie",
        email: "andrei@example.com"
      }
    }
  },
  {
    id: "enr_2",
    student_id: "user_123",
    course_id: "2",
    status: "completed",
    created_at: "2023-02-20T14:30:00Z",
    course: {
      id: "2",
      title: "Python for Data Science and Machine Learning",
      description: "Master Python for Data Science and Machine Learning with this comprehensive course.",
      level: "Beginner",
      is_premium: false,
      status: "published",
      instructor: {
        id: "inst_2",
        name: "Jose Portilla",
        email: "jose@example.com"
      }
    }
  },
  {
    id: "enr_3",
    student_id: "user_123",
    course_id: "3",
    status: "active",
    created_at: "2023-03-10T09:15:00Z",
    course: {
      id: "3",
      title: "The Web Developer Bootcamp 2025",
      description: "The only course you need to learn web development - HTML, CSS, JS, Node, and more!",
      level: "Beginner",
      is_premium: true,
      status: "published",
      instructor: {
        id: "inst_3",
        name: "Colt Steele",
        email: "colt@example.com"
      }
    }
  }
];

// API Functions
const fetchEnrollments = async () => {
  // const response = await api.get<Enrollment[]>('/api/enrollments');
  // return response.data;
  return new Promise<Enrollment[]>((resolve) => {
    setTimeout(() => {
      resolve(MOCK_ENROLLMENTS);
    }, 800);
  });
};

const unenrollCourse = async (enrollmentId: string) => {
  const response = await api.delete(`/api/enrollments/${enrollmentId}`);
  return response.data;
};

export default function Enrolment() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { register, watch } = useForm<{ search: string }>();
  const searchTerm = watch("search", "");

  const { data: enrollments, isLoading, error } = useQuery({
    queryKey: ['enrollments'],
    queryFn: fetchEnrollments,
  });

  const unenrollMutation = useMutation({
    mutationFn: unenrollCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      Swal.fire({
        icon: 'success',
        title: 'Unenrolled',
        text: 'You have successfully unenrolled from the course.',
        timer: 1500,
        showConfirmButton: false
      });
    },
    onError: (error: any) => {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to unenroll.',
      });
    }
  });

  const handleUnenroll = (enrollmentId: string, courseTitle: string) => {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to unenroll from "${courseTitle}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, unenroll me!'
    }).then((result) => {
      if (result.isConfirmed) {
        unenrollMutation.mutate(enrollmentId);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FaSpinner className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h2 className="text-2xl font-bold text-destructive">Error loading enrollments</h2>
        <p className="text-muted-foreground">Could not fetch your enrollments.</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const filteredEnrollments = Array.isArray(enrollments) ? enrollments.filter(enrollment => 
    enrollment.course?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.course?.instructor?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <RequireRole roles="STUDENT">
      <div className="min-h-screen bg-background flex flex-col">
        <HeaderComponent />
        <div className="container mx-auto px-4 py-8 grow">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold">My Enrollments</h1>
          
          <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              type="text"
              placeholder="Search courses..."
              className="pl-10"
              {...register("search")}
            />
          </div>
        </div>
        
        {filteredEnrollments && filteredEnrollments.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
            <FaBookOpen className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">
              {searchTerm ? "No matching courses found" : "No enrollments found"}
            </h3>
            <p className="text-slate-500 mb-6">
              {searchTerm ? "Try adjusting your search terms." : "You haven't enrolled in any courses yet."}
            </p>
            {!searchTerm && <Button onClick={() => navigate('/')}>Browse Courses</Button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEnrollments?.map((enrollment) => (
              <Card key={enrollment.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <Badge variant={enrollment.course.is_premium ? "default" : "secondary"} className={enrollment.course.is_premium ? "bg-yellow-600 hover:bg-yellow-700" : "bg-green-600 hover:bg-green-700 text-white"}>
                      {enrollment.course.is_premium ? "Premium" : "Free"}
                    </Badge>
                    <Badge variant="outline">{enrollment.course.level}</Badge>
                  </div>
                  <CardTitle className="line-clamp-2 text-xl" title={enrollment.course.title}>
                    {enrollment.course.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <FaChalkboardTeacher className="h-4 w-4" />
                    {enrollment.course.instructor?.name || 'Unknown Instructor'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grow">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {enrollment.course.description}
                  </p>
                  <div className="mt-4 text-xs text-muted-foreground">
                    Status: <span className="capitalize font-medium text-foreground">{enrollment.status}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between gap-3 pt-4 border-t">
                  <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => navigate(`/courses/${enrollment.course.id}`)}>
                    View Course
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={() => handleUnenroll(enrollment.id, enrollment.course.title)}
                    title="Unenroll"
                    disabled={unenrollMutation.isPending}
                  >
                    {unenrollMutation.isPending ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        </div>
      </div>
    </RequireRole>
  );
}
