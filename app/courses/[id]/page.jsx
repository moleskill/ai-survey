import { notFound } from 'next/navigation';
import CoursePlayer from '@/components/CoursePlayer';
import { findCourse } from '@/lib/courses';

export const dynamic = 'force-static';

export default async function CoursePage({ params }) {
  const course = findCourse((await params).id);
  if (!course) notFound();
  return <CoursePlayer course={course} />;
}
