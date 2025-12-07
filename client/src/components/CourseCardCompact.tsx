import * as React from 'react';
import type { Course } from '@/services/courseService';
import { deleteCourse } from '@/services/courseService';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface CourseCardCompactProps {
  course: Course;
  onEdit?: (course: Course) => void;
  onPreview?: (course: Course) => void;
  onDelete?: (course: Course) => void;
}

const CourseCardCompact: React.FC<CourseCardCompactProps> = ({
  course,
  onEdit,
  onPreview,
  onDelete,
}) => {
  const navigate = useNavigate();

  const handleEdit = () => {
    if (typeof onEdit === 'function') {
      onEdit(course);
      return;
    }
    navigate(`/courses/${course.id}/edit`);
  };

  const handlePreview = () => {
    if (typeof onPreview === 'function') {
      onPreview(course);
      return;
    }
    navigate(`/courses/${course.id}`);
  };

  const handleDelete = async () => {
    // 1. Ask for confirmation
    const result = await Swal.fire({
      title: `Delete ${course.title}?`,
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      confirmButtonColor: '#d33',
    });

    // 2. If confirmed, perform the action
    if (result.isConfirmed) {
      try {
        // Optional: Show a loading state while deleting
        Swal.showLoading();

        await deleteCourse(course.id);

        // 3. Show success message
        await Swal.fire('Deleted!', 'The course has been deleted.', 'success');

        // Call onDelete callback if provided
        if (typeof onDelete === 'function') {
          onDelete(course);
        }
      } catch (err: any) {
        // 4. Handle error
        const message = err?.response?.data?.message || 'Failed to delete';
        await Swal.fire('Error', message, 'error');
      }
    }
  };

  return (
    <div className="flex items-center gap-4 overflow-hidden rounded-md border">
      <img src={course.thumbnail} alt={course.title} className="h-20 w-32 shrink-0 object-cover" />
      <div className="min-w-0 flex-1 p-4">
        <h3 className="truncate text-lg font-medium">{course.title}</h3>
        <p className="text-muted-foreground text-sm">{course.category}</p>
      </div>
      <div className="flex items-center gap-2 pr-4">
        <Button type="button" size="sm" variant="outline" onClick={handleEdit}>
          Edit
        </Button>
        <Button
          type="button"
          size="sm"
          variant="default"
          onClick={handlePreview}
          className="preview-btn"
        >
          Preview
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          onClick={handleDelete}
          aria-label={`Delete ${course.title}`}
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

export default CourseCardCompact;
