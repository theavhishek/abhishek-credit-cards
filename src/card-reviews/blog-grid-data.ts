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

export const blogCategories = ["Cashback"];

export const blogPosts: BlogPost[] = [
  {
    id: "hsbc-live-plus",
    featured: true,
    category: "Cashback",
    date: "2026-10-07",
    readTime: 5,
    author: {
      name: "Abhishek Meena",
      role: "Independent card reviewer",
      avatar: "/assets/abhishek-face.jpg",
    },
    title: "HSBC Live+ Credit Card",
    excerpt: "A high-return lifestyle card when dining, food delivery and grocery spends are large enough to use the monthly cashback cap.",
    image: {
      src: "https://www.hsbc.bank.in/content/dam/hsbc/in/images/16-9/21398-live-plus-visa-infinite-2000X1125.jpg/jcr:content/renditions/cq5dam.web.1680.1000.jpeg",
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
