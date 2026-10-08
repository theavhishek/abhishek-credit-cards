export const motionTokens = {
  duration: {
    instant: 0.12,
    fast: 0.18,
    standard: 0.28,
    exit: 0.2,
    considered: 0.48,
  },
  ease: {
    standard: [0.2, 0.75, 0.2, 1] as const,
  },
  spring: {
    smooth: { type: "spring" as const, stiffness: 310, damping: 34, mass: 0.8 },
    morph: { type: "spring" as const, stiffness: 360, damping: 36, mass: 0.82 },
  },
};
