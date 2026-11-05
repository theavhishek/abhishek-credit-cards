import { Stage } from '../../../.agents/skills/stageshow/kit/stage'
import type { Act } from '../../../.agents/skills/stageshow/kit/act'
import { Phone } from '../../../.agents/skills/stageshow/kit/phone'
import { Bar } from '../../../.agents/skills/stageshow/kit/window'
import { Check } from '../../../.agents/skills/stageshow/kit/parts/Check'
import { Spinner } from '../../../.agents/skills/stageshow/kit/parts/Spinner'
import { Swap } from '../../../.agents/skills/stageshow/kit/motion/Swap'
import icici from './icic.svg'
import './upi-pay.css'

// The UPI ID page's hero: what happens after the tool. A UPI app on a phone,
// the card's UPI ID pasted in, the bank resolves as the payee, the amount goes
// in, Pay, and the bill is paid. Loops on a visible cause: Done.
//
// Real strings: Pay to UPI ID, the UPI ID, ICICI Bank, the amount, Pay/Paid,
// Done. Everything else is a bar.

const VPA = 'ccpay.98765432101234@icici'
const AMOUNTS = ['', '1', '12', '124', '1,245', '12,450']

type Phase = 'idle' | 'paying' | 'paid'
type S = { field: boolean; vpa: boolean; payee: boolean; amt: number; phase: Phase }
const START: S = { field: false, vpa: false, payee: false, amt: 0, phase: 'idle' }
const REST = { x: 330, y: 380 }

const script = async (a: Act<S>) => {
  await a.wait(900)
  a.mark('paste')
  await a.click('field')
  a.put({ field: true })
  await a.wait(350)
  a.put({ vpa: true })
  await a.wait(700)
  a.put({ payee: true })
  await a.wait(1100)
  a.mark('amount')
  await a.click('amount')
  for (let i = 1; i < AMOUNTS.length; i++) {
    await a.wait(170)
    a.put({ amt: i })
  }
  await a.wait(800)
  a.mark('pay')
  await a.click('pay')
  a.put({ phase: 'paying', field: false })
  await a.wait(1100)
  a.put({ phase: 'paid' })
  await a.wait(2600)
  a.mark('done')
  await a.click('pay')
  a.put({ ...START })
  await a.move(REST)
  await a.wait(600)
}

export default function UpiPay() {
  return (
    <Stage<S>
      width={440}
      height={440}
      compact={{ below: 440, width: 358, height: 400 }}
      initial={START}
      poster={{ field: false, vpa: true, payee: true, amt: AMOUNTS.length - 1, phase: 'paid' }}
      script={script}
      cursor={{ at: REST, style: 'touch' }}
      className="ssu"
    >
      {(s, _rect, layout) => {
        const amount = AMOUNTS[s.amt]
        return (
          <Phone width={layout === 'compact' ? 270 : 290} className="ssu-phone" data-phase={s.phase}>
            <div className="ssu-app">
              <header className="ssu-head">
                <span className="ssu-back" aria-hidden />
                <span className="ssu-title">Pay to UPI ID</span>
              </header>

              <div className="ssu-field" data-target="field" data-on={s.field || undefined}>
                <span className="ssu-label">UPI ID</span>
                <span className="ssu-vpa" data-shown={s.vpa || undefined}>
                  {s.vpa ? VPA : <Bar w={190} h={10} r={5} tone={3} />}
                </span>
              </div>

              <div className="ssu-payee" data-shown={s.payee || undefined}>
                <span className="ssu-logo"><img src={icici} alt="" width={30} height={30} /></span>
                <span className="ssu-payee__text">
                  <span className="ssu-payee__name">ICICI Bank</span>
                  <Bar w={112} h={8} r={4} tone={3} />
                </span>
                <Check on={s.payee} size={20} className="ssu-ok" />
              </div>

              <div className="ssu-amount" data-target="amount" data-empty={!amount || undefined}>
                <span className="ssu-rupee">₹</span>
                <span className="ssu-figure">{amount || '0'}</span>
              </div>
              <div className="ssu-note"><Bar w={140} h={8} r={4} tone={3} /></div>

              <button type="button" className="ssu-pay" data-target="pay" data-phase={s.phase} data-ready={(s.payee && !!amount) || undefined} tabIndex={-1}>
                <Swap id={s.phase}>
                  {s.phase === 'idle' && <span>Pay ₹{amount || '0'}</span>}
                  {s.phase === 'paying' && <span className="ssu-pay__row"><Spinner size={18} /> Paying</span>}
                  {s.phase === 'paid' && <span className="ssu-pay__row"><Check on size={18} /> Paid</span>}
                </Swap>
              </button>

              <div className="ssu-keys" aria-hidden>
                {Array.from({ length: 12 }, (_, i) => <span key={i} className="ssu-key" />)}
              </div>
            </div>
          </Phone>
        )
      }}
    </Stage>
  )
}
