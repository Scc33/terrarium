/** Copy for the labour desk's occupational-market reports. */

import type { EventDef } from './catalogue'
import type { EventId } from './ids'

export const OCCUPATIONAL_LABOUR_EVENT_CATALOGUE = {
  trained_workers_underused: {
    kind: 'rumor',
    desk: 'labour',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'Training finds no fitting work',
        body: 'Qualified workers are taking whatever positions they can get while the work for which they trained remains scarce. The applicant queue is growing faster than the posts meant for it.',
      },
    ],
  },
  city_jobs_lag_transition: {
    kind: 'rumor',
    desk: 'labour',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'The city has not caught up',
        body: 'Families leaving the land find the hiring lines in town as long as ever, even as the national picture improves. Lodging houses are full of people who made the journey before the work arrived.',
      },
    ],
  },
  skilled_posts_unfilled: {
    kind: 'rumor',
    desk: 'labour',
    tone: 'neutral',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'The trades cannot find their people',
        body: 'Employers say specialised posts remain open while workers without the right training wait elsewhere. Poaching between firms has become the usual way to staff a workshop.',
      },
    ],
  },
} satisfies Partial<Record<EventId, EventDef>>
