import { Stage } from '../../../.agents/skills/stageshow/kit/stage'
import type { Act } from '../../../.agents/skills/stageshow/kit/act'
import { Count } from '../../../.agents/skills/stageshow/kit/motion/Count'
import { useSiteTheme } from '../site-theme'
import './loan.css'

// Loan EMI page hero: the calculator's own card. Drag the amount up and the
// EMI climbs; stretch the tenure and it falls while the interest share grows.
// Figures at 10.5% reducing balance, matching the calculator (₹10L, 5y = ₹21,494).

const AMOUNTS = [500000, 1000000]
const YEARS = [3, 4, 5]
// [amountIndex][yearIndex] -> [emi, interest]
const T: Record<string, [number, number]> = {
  '0-0': [16251, 85044], '1-0': [32502, 170088], '1-1': [25603, 228962], '1-2': [21494, 289634],
}
type S = { a: number; y: number; af: number; yf: number; glide: boolean }
const START: S = { a: 0, y: 0, af: 0, yf: 0, glide: true }
const lakh = (n: number) => `₹${(n / 100000).toLocaleString('en-IN')} lakh`
const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`

// Slider geometry in stage px
const TRACK = { x: 50, w: 340 }
const knob = (frac: number) => TRACK.x + TRACK.w * frac

const frac = (x: number) => Math.min(1, Math.max(0, (x - TRACK.x) / TRACK.w))

const script = async (a: Act<S>) => {
  await a.wait(900)
  a.mark('amount')
  await a.move('amt-knob')
  a.put({ glide: false })
  const ar = a.rect('amt-knob')
  await a.drag({ x: knob(1), y: ar.y + ar.height / 2 }, (at) => {
    const f = frac(at.x)
    a.put({ af: f, a: f > 0.5 ? 1 : 0 })
  }, { duration: 1000 })
  a.put({ af: 1, a: 1 })
  await a.wait(1400)
  a.mark('tenure')
  await a.move('yr-knob')
  const yr = a.rect('yr-knob')
  await a.drag({ x: knob(1), y: yr.y + yr.height / 2 }, (at) => {
    const f = frac(at.x)
    a.put({ yf: f, y: f > 0.75 ? 2 : f > 0.25 ? 1 : 0 })
  }, { duration: 1300 })
  a.put({ yf: 1, y: 2 })
  await a.wait(2800)
  a.mark('reset')
  await a.click('reset')
  a.put({ ...START })
  await a.wait(1000)
}

export default function LoanEmi() {
  const theme = useSiteTheme()
  return (
    <Stage<S>
      theme={theme}
      width={440}
      height={440}
      compact={{ below: 440, width: 358, height: 400 }}
      initial={START}
      poster={{ a: 1, y: 2, af: 1, yf: 1, glide: true }}
      script={script}
      cursor={{ at: { x: 360, y: 400 } }}
      className="le"
    >
      {(s) => {
        const [emi, interest] = T[`${s.a}-${s.y}`]
        const principal = AMOUNTS[s.a]
        const share = interest / (interest + principal)
        const C = 2 * Math.PI * 34
        return (
          <div className="le-card" data-glide={s.glide || undefined}>
            <div className="le-out">
              <div className="le-out__text">
                <span className="le-k">Monthly EMI</span>
                <Count className="le-emi" value={emi} format={inr} />
                <span className="le-sub">Interest <Count value={interest} format={inr} /></span>
              </div>
              <svg className="le-donut" viewBox="0 0 80 80" width="96" height="96" aria-hidden>
                <circle cx="40" cy="40" r="34" className="le-donut__p" />
                <circle cx="40" cy="40" r="34" className="le-donut__i" style={{ strokeDasharray: `${C * share} ${C}` }} />
              </svg>
            </div>
            <Slider label="Loan amount" value={lakh(principal)} frac={s.af} target="amt" />
            <Slider label="Interest rate" value="10.5%" frac={0.42} />
            <Slider label="Tenure" value={`${YEARS[s.y]} years`} frac={s.yf} target="yr" />
            <div className="le-foot">
              <span className="le-reset" data-target="reset">Reset</span>
            </div>
          </div>
        )
      }}
    </Stage>
  )
}

function Slider({ label, value, frac, target }: { label: string; value: string; frac: number; target?: string }) {
  return (
    <div className="le-slider">
      <div className="le-slider__head"><span>{label}</span><span className="le-slider__v">{value}</span></div>
      <div className="le-track">
        <span className="le-fill" style={{ width: `${frac * 100}%` }} />
        <span className="le-knob" style={{ left: `${frac * 100}%` }} data-target={target ? `${target}-knob` : undefined} data-cursor={target ? 'grab' : undefined} />
      </div>
    </div>
  )
}
