export type BlogAuthor = { name: string; avatar?: string; role?: string };

export type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: number;
  author: BlogAuthor;
  image?: { src: string; alt: string };
  body?: string[];
  featured?: boolean;
};

export const blogCategories = ["Cashback", "Launched", "Pre-launch"];

export const blogPosts: BlogPost[] = [
  {
    id: "slice-business-credit-card",
    featured: false,
    category: "Pre-launch",
    date: "2026-10-13",
    readTime: 4,
    author: {
      name: "Abhishek Meena",
      role: "Independent card reviewer",
      avatar: "/assets/abhishek-face.jpg",
    },
    title: "Slice Business Credit Card",
    excerpt: "Launching in December 2026: lifetime free, up to 2% cashback and zero forex markup for sole proprietors. What’s confirmed, and what isn’t yet.",
    image: {
      src: "/assets/reviews/slice-business-credit-card.jpg",
      alt: "Slice Business credit cards on Visa and RuPay",
    },
  },
  {
    id: "eternal-sbi-card",
    featured: false,
    category: "Launched",
    date: "2026-10-15",
    readTime: 5,
    author: {
      name: "Abhishek Meena",
      role: "Independent card reviewer",
      avatar: "/assets/abhishek-face.jpg",
    },
    title: "Eternal SBI Credit Card",
    excerpt: "Launched 15 October: Zomato and District 10% off, Blinkit 5–10%, ₹2,000 monthly discount cap and ₹499 fee. Early access is rolling out.",
    image: {
      src: "/assets/reviews/eternal-sbi-card.jpg",
      alt: "Eternal SBI Card, black card design",
    },
  },
  {
    id: "hsbc-live-plus",
    featured: true,
    category: "Cashback",
    date: "2026-10-12",
    readTime: 6,
    author: {
      name: "Abhishek Meena",
      role: "Independent card reviewer",
      avatar: "/assets/abhishek-face.jpg",
    },
    title: "HSBC Live+ Credit Card",
    excerpt: "A detailed 2026 review of its 10% everyday cashback, ₹1,200 shared cap, MCC exclusions, fees and lounge privileges.",
    image: {
      src: "/assets/reviews/hsbc-live-plus.jpg",
      alt: "HSBC Live+ Visa Infinite credit card",
    },
    body: [
      "A strong lifestyle cashback card for people who consistently spend on dining, food delivery and groceries—but the accelerated return has a monthly ceiling.",
      "Accelerated cashback: 10%, capped at ₹1,200 per month. Base cashback: 1.5% on most other eligible spends.",
      "Annual fee: ₹999. The fee is waived above ₹2 lakh in yearly spending.",
      "Why it works: the accelerated categories can recover the annual fee when food and grocery spending is already part of your monthly routine.",
      "Watch the cap: once the ₹1,200 monthly accelerated-cashback limit is exhausted, the headline return no longer tells the full story.",
      "Quick verdict: keep it for accelerated lifestyle categories and pair it with another card for exclusions and spending beyond the cap.",
    ],
  },
];
