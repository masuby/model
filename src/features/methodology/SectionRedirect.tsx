/**
 * /methodology/<section>: an earlier layout gave each section of the Methodology its own page. The
 * document is one page again, so such a link (a bookmark, a printed reference) opens the document at
 * that section.
 */
import { Navigate, useParams } from 'react-router-dom';

export default function SectionRedirect() {
  const { section = '' } = useParams<{ section: string }>();
  return <Navigate to={{ pathname: '/methodology', hash: section ? `#${section}` : '' }} replace />;
}
