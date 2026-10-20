import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { DonutChart } from "./arc/donut-chart/donut-chart";
import "./loan-emi/donut-theme.css";
import { mountArcTabs } from "./arc-tabs-mount";
import { mountHeroAccordions } from "./heroui-accordion/accordion-mount";

// assets/loan-emi.js publishes the latest principal and interest on window and fires this event on every recalculation.
type Split = { principal: number; interest: number };
declare global { interface Window { __loanEmiDonut?: Split } }
const EVENT = "loan-emi:donut";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

function LoanDonut() {
  const [split, setSplit] = useState<Split>(() => window.__loanEmiDonut ?? { principal: 0, interest: 0 });
  useEffect(() => {
    const onSplit = (event: Event) => setSplit((event as CustomEvent<Split>).detail);
    window.addEventListener(EVENT, onSplit);
    if (window.__loanEmiDonut) setSplit(window.__loanEmiDonut);
    return () => window.removeEventListener(EVENT, onSplit);
  }, []);
  return (
    <DonutChart
      className="ce-donut-arc"
      label="Principal and interest"
      totalLabel="Total"
      data={[
        { key: "principal", label: "Principal", value: split.principal, color: "var(--ce-principal)" },
        { key: "interest", label: "Interest", value: split.interest, color: "var(--ce-interest)" },
      ]}
      formatValue={value => inr.format(Math.round(value))}
      size={196}
      thickness={18}
      groupBelow={0}
      legendAction="select"
    />
  );
}

const root = document.querySelector("#loanDonutRoot");
if (root) createRoot(root).render(<LoanDonut />);

// This page also uses the uiarc tabs (schedule view) and the HeroUI accordions; sharing the bundle keeps React to one copy.
mountArcTabs();
mountHeroAccordions();
