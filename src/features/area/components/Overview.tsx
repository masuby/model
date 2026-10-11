/**
 * The key findings of an area, written as a short report paragraph - a serif lede and a ruled list -
 * rather than icon tiles in a card (the opening of the Analysis view).
 */
import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { classify } from '@/engine/risk/classes';
import { DATA_AS_OF, placeKey, topDrivers } from '@/engine/risk/model';
import { dataNotesFor, worstStatus } from '@/engine/risk/notes';
import { lackOfReliability } from '@/engine/risk/variants';
import { formatScore } from '@/lib/utils';
import { delta, placeListsFor, rankAmong, weakestDimension, type AreaView } from '../lib';
import { SubHeading } from './bits';

/** The key findings (rank, distance from the national value, weakest dimension, top driver, coverage): the opening of the Analysis view. */
export function KeyFindings({ view }: { view: AreaView }) {
  const { t } = useTranslation(['area', 'common', 'indicators']);
  const { unit, rank, national, model, coverage, region } = view;
  const b = <strong className="font-semibold text-foreground" />;
  const cls = classify(unit.risk);
  const clsLabel = cls ? t(`common:classes.${cls.key}`) : t('common:classes.noData');
  const weakest = React.useMemo(() => weakestDimension(unit), [unit]);
  const top = React.useMemo(() => topDrivers(unit, 1)[0], [unit]);
  const d = delta(unit.risk, national.risk);
  const peers = t(`peers.${unit.level}`);
  const reliability = React.useMemo(() => (unit.level === 'council' || unit.level === 'source' ? lackOfReliability(unit, model, DATA_AS_OF) : null), [unit, model]);

  const localRank = React.useMemo(() => {
    if (unit.level !== 'council' && unit.level !== 'source') return null;
    const list = unit.level === 'council' ? (model.councilsByRegion.get(placeKey(unit.region)) ?? []) : (placeListsFor(model, unit).find((l) => l.kind === 'sourceSiblings')?.units ?? []);
    return list.length > 1 ? rankAmong(unit, list) : null;
  }, [unit, model]);

  const lede =
    unit.level === 'national' ? (
      <Trans t={t} i18nKey="glance.nationalOverall" values={{ score: formatScore(unit.risk), cls: clsLabel }} components={{ b }} />
    ) : (
      <Trans
        t={t}
        i18nKey="glance.overall"
        values={{ score: formatScore(unit.risk), cls: clsLabel, rank: rank ? t('glance.rank', { count: rank.rank, ordinal: true, total: rank.total, peers }) : '' }}
        components={{ b }}
      />
    );

  const findings: Array<{ key: string; body: React.ReactNode }> = [];
  if (unit.level === 'national') {
    findings.push({
      key: 'above',
      body: <Trans t={t} i18nKey="glance.nationalAbove" values={{ n: model.councils.filter((c) => (c.risk ?? -1) > (unit.risk ?? 11)).length, total: model.councils.length }} components={{ b }} />,
    });
  } else {
    if (d != null)
      findings.push({
        key: 'national',
        body: (
          <Trans
            t={t}
            i18nKey={d > 0 ? 'glance.aboveNational' : d < 0 ? 'glance.belowNational' : 'glance.equalNational'}
            values={{ d: Math.abs(d).toFixed(1), national: formatScore(national.risk) }}
            components={{ b }}
          />
        ),
      });
    if (localRank && region)
      findings.push({
        key: 'local',
        body: (
          <Trans
            t={t}
            i18nKey="glance.localRank"
            values={{ rank: t('glance.rank', { count: localRank.rank, ordinal: true, total: localRank.total, peers }), region: unit.region }}
            components={{ b }}
          />
        ),
      });
  }
  if (weakest)
    findings.push({
      key: 'weakest',
      body: (
        <Trans
          t={t}
          i18nKey="glance.weakest"
          values={{ dim: t(`common:dimensions.${weakest.key}`), cls: t(`common:classes.${weakest.cls.key}`), score: formatScore(weakest.score) }}
          components={{ b }}
        />
      ),
    });
  if (top) {
    findings.push({ key: 'driver', body: <Trans t={t} i18nKey="glance.driver" values={{ indicator: t(`indicators:${top.key}`), score: formatScore(top.value) }} components={{ b }} /> });
    // A top driver whose workbook value is under query says so here, where the driver is named (the integrity recheck).
    const topNotes = dataNotesFor(unit, top.dim, top.key).filter((n) => n.status !== 'explained');
    if (topNotes.length)
      findings.push({
        key: 'driverNote',
        body: <Trans t={t} i18nKey="glance.driverNote" values={{ indicator: t(`indicators:${top.key}`), status: t(`common:dataNote.inline.${worstStatus(topNotes)}`) }} components={{ b }} />,
      });
  }
  findings.push({ key: 'coverage', body: <Trans t={t} i18nKey="glance.coverage" values={{ have: coverage.have, total: coverage.total }} components={{ b }} /> });
  // Lack of reliability after INFORM's index (MET-14): missing groups, age of the data, inherited or shared values. Councils and workbook units only.
  if (reliability) {
    const inherited = unit.inheritedFrom ? t('glance.inheritedNote', { parent: model.byId.get(unit.inheritedFrom)?.name ?? unit.inheritedFrom }) : reliability.inherited > 0 ? t('glance.sharedNote') : '';
    findings.push({
      key: 'reliability',
      body: <Trans t={t} i18nKey="glance.reliability" values={{ lack: formatScore(reliability.lack), age: reliability.ageYears.toFixed(1), inherited }} components={{ b }} />,
    });
  }

  return (
    <div className="max-w-3xl">
      <SubHeading title={t('glance.title')} />
      <p className="mt-5 font-display text-[1.35rem] leading-snug text-balance text-muted-foreground [&_strong]:font-semibold sm:text-[1.6rem]">{lede}</p>
      <ul className="mt-5 divide-y divide-border border-y border-border">
        {findings.map((f) => (
          <li key={f.key} className="py-3 leading-relaxed text-muted-foreground">
            {f.body}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The risk view's overview: where the area is. The findings sit in the Analysis view (UX-01); on a phone the map waits behind one line. */
