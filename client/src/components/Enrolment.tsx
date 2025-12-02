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

interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  is_premium: boolean;
  status: string;
  instructor: string;
}

interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  course: Course;
  status: string;
  created_at?: string;
}

// API Functions
const fetchEnrollments = async () => {
  const response = await api.get<Enrollment[]>('/api/enrollments');
  return response.data;
};

const unenrollCourse = async (enrollmentId: string) => {
  await api.delete(`/api/enrollments/${enrollmentId}`);
  return enrollmentId;
};

export default function Enrolment() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { register, watch } = useForm<{ search: string }>();
  const searchTerm = watch('search', '');

  const {
    data: enrollments,
    isLoading,
    error,
  } = useQuery({
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
        showConfirmButton: false,
      });
    },
    onError: (error: any) => {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to unenroll.',
      });
    },
  });

  const handleUnenroll = (enrollmentId: string, courseTitle: string) => {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to unenroll from "${courseTitle}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, unenroll me!',
    }).then((result) => {
      if (result.isConfirmed) {
        unenrollMutation.mutate(enrollmentId);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <FaSpinner className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h2 className="text-destructive text-2xl font-bold">Error loading enrollments</h2>
        <p className="text-muted-foreground">Could not fetch your enrollments.</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const filteredEnrollments = Array.isArray(enrollments)
    ? enrollments.filter(
        (enrollment) =>
          enrollment.course?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          enrollment.course?.instructor?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <RequireRole roles="STUDENT">
      <div className="bg-background flex min-h-screen flex-col">
        <HeaderComponent />
        <div className="container mx-auto grow px-4 py-8">
          <div className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
            <h1 className="text-3xl font-bold">My Enrollments</h1>

            <div className="relative w-full md:w-72">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <FaSearch className="text-muted-foreground h-4 w-4" />
              </div>
              <Input
                type="text"
                placeholder="Search courses..."
                className="pl-10"
                {...register('search')}
              />
            </div>
          </div>

          {filteredEnrollments && filteredEnrollments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 py-12 text-center">
              <FaBookOpen className="mx-auto mb-4 h-12 w-12 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-900">
                {searchTerm ? 'No matching courses found' : 'No enrollments found'}
              </h3>
              <p className="mb-6 text-slate-500">
                {searchTerm
                  ? 'Try adjusting your search terms.'
                  : "You haven't enrolled in any courses yet."}
              </p>
              {!searchTerm && <Button onClick={() => navigate('/')}>Browse Courses</Button>}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredEnrollments?.map((enrollment) => (
                <Card
                  key={enrollment.id}
                  className="flex h-full flex-col transition-shadow hover:shadow-md"
                >
                  <CardHeader>
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <Badge
                        variant={enrollment.course.is_premium ? 'default' : 'secondary'}
                        className={
                          enrollment.course.is_premium
                            ? 'bg-yellow-600 hover:bg-yellow-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }
                      >
                        {enrollment.course.is_premium ? 'Premium' : 'Free'}
                      </Badge>
                      <Badge variant="outline">{enrollment.course.level}</Badge>
                    </div>
                    <CardTitle className="line-clamp-2 text-xl" title={enrollment.course.title}>
                      {enrollment.course.title}
                    </CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-2">
                      <FaChalkboardTeacher className="h-4 w-4" />
                      {enrollment.course.instructor || 'Unknown Instructor'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grow">
                    <p className="text-muted-foreground line-clamp-3 text-sm">
                      {enrollment.course.description}
                    </p>
                    <div className="text-muted-foreground mt-4 text-xs">
                      Status:{' '}
                      <span className="text-foreground font-medium capitalize">
                        {enrollment.status}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between gap-3 border-t pt-4">
                    <Button
                      variant="outline"
                      className="flex-1 cursor-pointer"
                      onClick={() => navigate(`/courses/${enrollment.course.id}`)}
                    >
                      View Course
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleUnenroll(enrollment.id, enrollment.course.title)}
                      title="Unenroll"
                      disabled={unenrollMutation.isPending}
                    >
                      {unenrollMutation.isPending ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaTrash />
                      )}
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
