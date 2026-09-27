import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageContainer } from '@/components/layout/Page';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <PageContainer className="py-24 sm:py-32">
      <div className="max-w-xl">
        <p className="num text-sm font-medium text-muted-foreground">404</p>
        <h1 className="mt-3 text-[2.4rem] leading-tight">{t('states.notFound')}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{t('states.notFoundDetail')}</p>
        <div className="mt-10 flex flex-wrap gap-3 border-t border-border pt-8">
          <Button asChild>
            <Link to="/">{t('states.goHome')}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/explore">
              {t('nav.explore')} <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
