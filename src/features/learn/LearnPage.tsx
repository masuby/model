/**
 * Learn - a seven-lesson course on the INFORM methodology applied to Tanzania.
 *   /learn             course overview (progress, lessons, continue)
 *   /learn/:lessonId   a lesson (reading column, live-data widget, quiz)
 *   /learn/complete    completion screen + printable certificate
 * Progress is persisted per browser in `usePrefs().learnProgress` (no account needed).
 * No animation library: only CSS state transitions (docs/DESIGN_LANGUAGE.md §6).
 */
import { Navigate, useParams } from 'react-router-dom';
import { CompletionView } from './components/CompletionView';
import { CourseOverview } from './components/CourseOverview';
import { LessonView } from './components/LessonView';
import { COMPLETE_SLUG, isLessonId } from './course';

export default function LearnPage() {
  const { lessonId } = useParams();
  if (!lessonId) return <CourseOverview />;
  if (lessonId === COMPLETE_SLUG) return <CompletionView />;
  if (isLessonId(lessonId)) return <LessonView key={lessonId} id={lessonId} />;
  return <Navigate to="/learn" replace />;
}
