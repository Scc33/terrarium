import type { PublishedState } from '@terrarium/observation'

const qtrLabel = (q: number) => `${1946 + Math.floor(q / 4)} · Q${(q % 4) + 1}`

export function Masthead({ pub }: { pub: PublishedState }) {
  return (
    <header style={{ textAlign: 'center', padding: '34px 20px 26px' }}>
      <div className="eyebrow">Ministry of National Economy</div>
      <div
        style={{
          width: 1,
          height: 40,
          background: 'rgba(2,24,43,0.25)',
          margin: '14px auto',
        }}
      />
      <h1
        style={{
          fontFamily: 'var(--script)',
          fontSize: 72,
          fontWeight: 400,
          lineHeight: 1.05,
        }}
      >
        {pub.country}
      </h1>
      <div
        style={{
          width: 40,
          height: 2,
          background: 'var(--alarm)',
          margin: '14px auto 16px',
        }}
      />
      <div className="label-caps" style={{ display: 'flex', justifyContent: 'center', gap: 34 }}>
        <span className="num">{qtrLabel(pub.tick)}</span>
        <span>
          Political capital <span className="num">{pub.politicalCapital.toFixed(0)}</span>
        </span>
        <span>
          {pub.inPower ? (
            <>
              Election in <span className="num">{pub.quartersToElection}</span> quarters
            </>
          ) : (
            <span style={{ color: 'var(--alarm)', opacity: 1 }}>Deposed</span>
          )}
        </span>
      </div>
    </header>
  )
}
