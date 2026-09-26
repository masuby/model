/**
 * Learn — a seven-lesson course on the INFORM methodology applied to Tanzania.
 *   /learn             course overview (progress, lesson path, continue)
 *   /learn/:lessonId   a lesson (reading column, live-data widget, quiz)
 *   /learn/complete    completion screen + printable certificate
 * Progress is persisted per browser in `usePrefs().learnProgress` (no account needed).
 */
import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { CompletionView } from './components/CompletionView';
import { CourseOverview } from './components/CourseOverview';
import { LessonView } from './components/LessonView';
import { COMPLETE_SLUG, isLessonId } from './course';

export default function LearnPage() {
  const { lessonId } = useParams();

  let body: ReactNode;
  if (!lessonId) body = <CourseOverview />;
  else if (lessonId === COMPLETE_SLUG) body = <CompletionView />;
  else if (isLessonId(lessonId)) body = <LessonView key={lessonId} id={lessonId} />;
  else return <Navigate to="/learn" replace />;

  // Honour the OS "reduce motion" setting for every motion animation on these pages.
  return <MotionConfig reducedMotion="user">{body}</MotionConfig>;
}
