import { createRoot } from 'react-dom/client'
import UpiPay from './upi-pay/index'
import NoCostEmi from './nocost-emi/index'
import LoanEmi from './loan-emi/index'
import UpdatesInbox from './updates-inbox/index'
// Mounts a Stageshow hero demo into any [data-stageshow] slot that is showing
const demos: Record<string, () => JSX.Element> = { 'upi-pay': UpiPay, 'nocost-emi': NoCostEmi, 'loan-emi': LoanEmi, 'updates-inbox': UpdatesInbox }
document.querySelectorAll<HTMLElement>('[data-stageshow]').forEach((el) => {
  const Demo = demos[el.dataset.stageshow || '']
  if (Demo && getComputedStyle(el).display !== 'none') createRoot(el).render(<Demo />)
})
