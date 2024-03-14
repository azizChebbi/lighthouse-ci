import {h} from 'preact';
import {LhrComparisonScores} from './lhr-comparison-scores';
import {route} from 'preact-router';
import clsx from 'clsx';
import './build-url-list.css';

/** @param {{compareRuns: Array<LHCI.ServerCommand.Run>, baseRuns: Array<LHCI.ServerCommand.Run>, activeUrl: string}} props */
export const BuildUrlList = props => {
  const {compareRuns, baseRuns, activeUrl} = props;
  const compareUrlsSet = new Set(compareRuns.map(run => run.url));
  // Getting the urls that exists in the both runs.
  const intersectingUrls = baseRuns.map(run => run.url).filter(url => compareUrlsSet.has(url));

  /** @param {string} url @param {Array<LHCI.ServerCommand.Run>} runs */
  const getReport = (url, runs) => {
    const run = runs.find(r => r.url === url);
    const lhr = run && JSON.parse(run.lhr);
    return lhr;
  };

  return (
    <div className={clsx('build-url-list')}>
      {intersectingUrls.map(url => (
        <div
          key={url}
          className={clsx('build-url-list__item', {
            'build-url-list__item--active': url === activeUrl,
          })}
          onClick={() => {
            const to = new URL(window.location.href);
            to.searchParams.set('baseUrl', url);
            to.searchParams.set('compareUrl', url);
            route(`${to.pathname}${to.search}`);
          }}
        >
          <p className={clsx('build-url-list__item__label')}>{url.split('#')[1]}</p>
          <LhrComparisonScores
            lhr={getReport(url, compareRuns)}
            baseLhr={getReport(url, baseRuns)}
          />
        </div>
      ))}
    </div>
  );
};
