import { Stage } from '../../../.agents/skills/stageshow/kit/stage'
import type { Act } from '../../../.agents/skills/stageshow/kit/act'
import { Window, Bar } from '../../../.agents/skills/stageshow/kit/window'
import { Count } from '../../../.agents/skills/stageshow/kit/motion/Count'
import { useSiteTheme } from '../site-theme'
import './nocost.css'

// No-Cost EMI page hero: a checkout offering "No-Cost EMI, 0% interest";
// picking it brings up what it really costs. Figures are the calculator's own
// sample (₹60,000, 6 months, 16% rate, ₹199 fee): +₹721 over paying in full.

type S = { emi: boolean; card: boolean; rows: number; extra: number }
const START: S = { emi: false, card: false, rows: 0, extra: 0 }
const ROWS = [
  { label: 'GST on interest', value: '₹487', add: 487 },
  { label: 'Processing fee', value: '₹199', add: 199 },
  { label: 'GST on the fee', value: '₹36', add: 36 },
]
const inr = (n: number) => `+₹${n.toLocaleString('en-IN')}`

const script = async (a: Act<S>) => {
  await a.wait(900)
  a.mark('pick')
  await a.click('emi')
  a.put({ emi: true })
  await a.wait(600)
  a.put({ card: true })
  await a.wait(500)
  a.mark('rows')
  for (let i = 0; i < ROWS.length; i++) {
    a.put({ rows: i + 1 })
    await a.wait(550)
  }
  // The calculator's own total (it rounds each line for display)
  a.put({ extra: 721 })
  await a.wait(400)
  await a.wait(2600)
  a.mark('back')
  await a.click('full')
  a.put({ ...START })
  await a.wait(900)
}

export default function NoCostEmi() {
  const theme = useSiteTheme()
  return (
    <Stage<S>
      theme={theme}
      width={440}
      height={480}
      compact={{ below: 440, width: 358, height: 480 }}
      initial={START}
      poster={{ emi: true, card: true, rows: 3, extra: 721 }}
      script={script}
      cursor={{ at: { x: 400, y: 120 } }}
      className="nc"
    >
      {(s) => (
        <>
          <Window url={<Bar w={120} h={8} r={4} tone={3} />} className="nc-window">
            <div className="nc-body">
              <div className="nc-title">Checkout</div>
              <div className="nc-item">
                <span className="nc-thumb" />
                <span className="nc-item__text"><Bar w={120} h={9} r={4} tone={4} /><Bar w={70} h={7} r={4} tone={2} /></span>
                <span className="nc-price">₹60,000</span>
              </div>
              <div className="nc-label">Pay with</div>
              <div className="nc-opt" data-target="full" data-on={!s.emi || undefined}>
                <span className="nc-radio" />
                <span className="nc-opt__name">Full payment</span>
                <span className="nc-opt__amt">₹60,000</span>
              </div>
              <div className="nc-opt" data-target="emi" data-on={s.emi || undefined}>
                <span className="nc-radio" />
                <span className="nc-opt__name">No-Cost EMI <span className="nc-tag">0% interest</span></span>
                <span className="nc-opt__amt">6 × ₹10,000</span>
              </div>
              <div className="nc-opt nc-opt--dim"><span className="nc-radio" /><Bar w={90} h={8} r={4} tone={3} /></div>
            </div>
          </Window>

          <div className="nc-card" data-shown={s.card || undefined}>
            <div className="nc-card__title">What it really costs</div>
            {ROWS.map((r, i) => (
              <div key={i} className="nc-row" data-shown={s.rows > i || undefined}>
                <span>{r.label}</span><span className="nc-row__v">{r.value}</span>
              </div>
            ))}
            <div className="nc-total" data-shown={s.extra > 0 || undefined}>
              <span>More than paying in full</span>
              <Count className="nc-total__v" value={s.extra} format={inr} />
            </div>
          </div>
        </>
      )}
    </Stage>
  )
}
