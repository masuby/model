import { Compass } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-28 text-center">
      <span className="font-display text-7xl font-extrabold text-primary/20">404</span>
      <h1 className="mt-2 text-3xl font-bold">{t('states.notFound')}</h1>
      <p className="mt-3 text-muted-foreground">{t('states.notFoundDetail')}</p>
      <div className="mt-8 flex gap-3">
        <Button asChild>
          <Link to="/">{t('states.goHome')}</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/explore">
            <Compass /> {t('nav.explore')}
          </Link>
        </Button>
      </div>
    </div>
  );
}
