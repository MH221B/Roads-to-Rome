import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FaPlayCircle, FaGripVertical, FaCheckCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/axiosClient';

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  video?: string;
  content: string;
  order?: number;
}

interface LessonItemProps {
  lesson: Lesson;
  isDragging: boolean;
  isInstructor: boolean;
  courseId: string;
}

function SortableLessonItem({ lesson, isDragging, isInstructor, courseId }: LessonItemProps) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: lesson.id,
    disabled: !isInstructor,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex cursor-pointer items-center justify-between p-4 transition-colors ${
        !isDragging ? 'hover:bg-slate-50' : ''
      } ${isDragging ? 'bg-slate-100' : ''}`}
      onClick={() => navigate(`/courses/${courseId}/lessons/${lesson.id}`)}
    >
      <div className="flex items-center gap-3">
        {isInstructor && (
          <div
            {...attributes}
            {...listeners}
            className="flex cursor-grab items-center active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
          >
            <FaGripVertical className="h-4 w-4 text-slate-400" />
          </div>
        )}
        <FaPlayCircle className="h-5 w-5 text-slate-400" />
        <span className="font-medium">{lesson.title}</span>
      </div>
    </div>
  );
}

interface LessonListDraggableProps {
  lessons: Lesson[];
  isInstructor: boolean;
  courseId: string;
  onOrderChange?: (updatedLessons: Lesson[]) => void;
}

export default function LessonListDraggable({
  lessons,
  isInstructor,
  courseId,
  onOrderChange,
}: LessonListDraggableProps) {
  const [items, setItems] = useState<Lesson[]>(lessons);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Update items when lessons prop changes (e.g., after refetch)
  React.useEffect(() => {
    setItems(lessons);
  }, [lessons]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);

      // Update order in the array
      const updatedItems = newItems.map((lesson, index) => ({
        ...lesson,
        order: index,
      }));

      const originalItems = [...items];

      // Optimistically update UI immediately
      setItems(updatedItems);
      if (onOrderChange) {
        onOrderChange(updatedItems);
      }

      // Fire API requests in the background without waiting
      // Only update the order field to avoid validation errors
      const updatePromises = updatedItems.map((lesson) =>
        api.put(`/api/courses/${courseId}/lessons/${lesson.id}`, {
          order: lesson.order,
        })
      );

      Promise.all(updatePromises)
        .then(() => {
          console.log('All lesson orders updated successfully');
          setUpdateSuccess(true);
          setTimeout(() => setUpdateSuccess(false), 500);
        })
        .catch((error: any) => {
          console.error('Failed to update lesson order:', error);
          if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
          } else if (error instanceof Error) {
            console.error('Error details:', error.message);
          }
          // Revert on error
          setItems(originalItems);
        });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="relative">
        {updateSuccess && (
          <div className="mb-3 flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-700">
            <FaCheckCircle className="h-4 w-4" />
            Lesson order updated successfully
          </div>
        )}
        <SortableContext items={items.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          <div className="divide-y">
            {items.map((lesson) => (
              <SortableLessonItem
                key={lesson.id}
                lesson={lesson}
                isDragging={activeId === lesson.id}
                isInstructor={isInstructor}
                courseId={courseId}
              />
            ))}
          </div>
        </SortableContext>
      </div>
    </DndContext>
  );
}
