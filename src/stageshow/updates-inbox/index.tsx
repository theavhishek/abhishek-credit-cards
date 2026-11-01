import { Stage } from '../../../.agents/skills/stageshow/kit/stage'
import type { Act } from '../../../.agents/skills/stageshow/kit/act'
import { Window, Bar } from '../../../.agents/skills/stageshow/kit/window'
import { useSiteTheme } from '../site-theme'
// The site's own app icon, served from the site root
const logo = '/apple-touch-icon.png'
import './inbox.css'

// /updates hero: the "Get updates by email" promise. A mail app; the update
// email from avhishek.in lands on top of the inbox, opens, and three real
// /updates items arrive in it with their site badges. Back closes it: the loop.

const ITEMS = [
  { cat: 'devaluation', label: 'Devaluation', title: 'SBI Card’s new transport and fuel fees from 1 December 2026' },
  { cat: 'spend-offer', label: 'Spend-based offer', title: 'ICICI Bank Visa KING Offer 2026: spend ₹2 lakh' },
  { cat: 'launch', label: 'Card launch', title: 'Slice Business Credit Card launches in December 2026' },
]
type S = { arrived: boolean; open: boolean; shown: number }
const START: S = { arrived: false, open: false, shown: 0 }

const script = async (a: Act<S>) => {
  await a.wait(800)
  a.put({ arrived: true })
  await a.wait(1100)
  a.mark('open')
  await a.click('mail')
  a.put({ open: true })
  await a.wait(500)
  for (let i = 1; i <= ITEMS.length; i++) {
    a.put({ shown: i })
    await a.wait(450)
  }
  await a.wait(2800)
  a.mark('back')
  await a.click('back')
  a.put({ open: false, shown: 0 })
  await a.wait(700)
  a.put({ arrived: false })
  await a.wait(700)
}

function Row({ w }: { w: [number, number] }) {
  return (
    <div className="ib-row">
      <span className="ib-dotless" />
      <span className="ib-row__text"><Bar w={w[0]} h={8} r={4} tone={4} /><Bar w={w[1]} h={7} r={4} tone={2} /></span>
      <Bar w={28} h={7} r={4} tone={2} />
    </div>
  )
}

export default function UpdatesInbox() {
  const theme = useSiteTheme()
  return (
    <Stage<S>
      theme={theme}
      width={440}
      height={440}
      compact={{ below: 440, width: 358, height: 440 }}
      initial={START}
      poster={{ arrived: true, open: true, shown: 3 }}
      script={script}
      cursor={{ at: { x: 400, y: 400 } }}
      className="ib"
    >
      {(s) => (
        <Window url={<Bar w={110} h={8} r={4} tone={3} />} className="ib-window">
          <div className="ib-app">
            <div className="ib-list" data-back={s.open || undefined}>
              <div className="ib-head">Inbox</div>
              <div className="ib-new" data-target="mail" data-shown={s.arrived || undefined}>
                <div className="ib-new__inner">
                  <img className="ib-logo" src={logo} alt="" width={28} height={28} />
                  <span className="ib-row__text">
                    <span className="ib-from">Abhishek · avhishek.in</span>
                    <span className="ib-subject">New on /updates: 3 changes to know</span>
                  </span>
                  <span className="ib-time">now</span>
                </div>
              </div>
              <Row w={[120, 190]} />
              <Row w={[96, 170]} />
              <Row w={[132, 150]} />
              <Row w={[104, 180]} />
              <Row w={[88, 160]} />
            </div>

            <div className="ib-mail" data-open={s.open || undefined}>
              <div className="ib-mail__bar">
                <span className="ib-back" data-target="back" aria-hidden />
                <Bar w={60} h={7} r={4} tone={2} />
              </div>
              <div className="ib-mail__subject">New on /updates: 3 changes to know</div>
              <div className="ib-mail__from">
                <img className="ib-logo" src={logo} alt="" width={28} height={28} />
                <span className="ib-from">Abhishek · avhishek.in</span>
              </div>
              <div className="ib-items">
                {ITEMS.map((it, i) => (
                  <div key={i} className="ib-item" data-shown={s.shown > i || undefined}>
                    <span className="ib-badge" data-cat={it.cat}>{it.label}</span>
                    <span className="ib-item__title">{it.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Window>
      )}
    </Stage>
  )
}
