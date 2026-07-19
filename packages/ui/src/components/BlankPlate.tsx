/**
 * An unmeasured indicator is a blank brass plate — a feature, not an empty
 * state to apologize for. It names the instrument and what would make it
 * exist; no "coming soon" softness.
 */

import type { IndicatorId } from '@terrarium/observation'

const PLATE_TEXT: Record<IndicatorId, { label: string; needs: string }> = {
  gdp_growth: { label: 'GDP GROWTH', needs: 'NATIONAL ACCOUNTS' },
  inflation: { label: 'INFLATION', needs: 'PRICE COLLECTION' },
  price_food: { label: 'FOOD PRICES', needs: 'PRICE BUREAU' },
  price_fuel: { label: 'FUEL PRICES', needs: 'PRICE BUREAU' },
  unemployment: { label: 'UNEMPLOYMENT', needs: 'LABOUR FORCE SURVEY' },
  payrolls: { label: 'PAYROLLS', needs: 'ESTABLISHMENT SURVEY' },
  capital_stock: { label: 'CAPITAL STOCK', needs: 'CENSUS OF INDUSTRY' },
  conf_consumer: { label: 'CONSUMER CONFIDENCE', needs: 'SENTIMENT SURVEYS' },
  conf_business: { label: 'BUSINESS CONFIDENCE', needs: 'SENTIMENT SURVEYS' },
  approval: { label: 'APPROVAL POLL', needs: 'FIELD POLLING' },
  gini: { label: 'INCOME INEQUALITY', needs: 'HOUSEHOLD SURVEY' },
  birth_rate: { label: 'BIRTH RATE', needs: 'CIVIL REGISTRATION' },
  death_rate: { label: 'DEATH RATE', needs: 'CIVIL REGISTRATION' },
}

export function BlankPlate({ indicator }: { indicator: IndicatorId }) {
  const t = PLATE_TEXT[indicator]
  return (
    <div className="flex h-full min-h-40 flex-col items-center justify-center border-2 border-dossier-brass bg-gradient-to-b from-[#c2a06b] to-dossier-brass">
      <div className="border border-dossier-ink/40 px-4 py-3 text-center">
        <div className="font-mono text-xs font-medium tracking-[0.25em] text-dossier-ink">
          {t.label}
        </div>
        <div className="mt-2 font-mono text-[10px] tracking-[0.15em] text-dossier-ink/70">
          INSTRUMENT NOT FITTED
        </div>
        <div className="mt-1 font-mono text-[10px] tracking-[0.15em] text-dossier-ink/70">
          REQUIRES: {t.needs}
        </div>
      </div>
    </div>
  )
}
