import { mountArcTabs } from "./arc-tabs-mount";
import { mountHeroAccordions } from "./heroui-accordion/accordion-mount";

// Loaded on every page: the uiarc tabs and the HeroUI accordions share one copy of React.
mountArcTabs();
mountHeroAccordions();
