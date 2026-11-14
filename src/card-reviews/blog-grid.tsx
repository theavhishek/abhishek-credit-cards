"use client";
/* eslint-disable @next/next/no-img-element -- plain images keep the block portable outside Next.js. */

import { useEffect, useId, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { motionTokens } from "../../lib/motion-tokens";
import { blogCategories, blogPosts } from "./blog-grid-data";
import type { BlogPost } from "./blog-grid-data";
import styles from "./blog-grid.module.css";
import { TilesLayout } from "./review-tiles";

export type { BlogAuthor, BlogPost } from "./blog-grid-data";

export interface BlogGridProps {
  /** Small orange label above the title, as on the /updates hero. */
  eyebrow?: string;
  title?: string;
  description?: string;
  posts?: BlogPost[];
  /** Category filter labels, in order. "All" is added in front. */
  categories?: string[];
  /** Active category, or "All" (controlled). */
  category?: string;
  defaultCategory?: string;
  onCategoryChange?: (category: string) => void;
  /** Link for each post. When set, tiles link to it and the in-place reader is off. */
  getHref?: (post: BlogPost) => string;
  /** Called when a post opens, from a link or the in-place reader. */
  onPostOpen?: (post: BlogPost) => void;
  className?: string;
}

const smooth = motionTokens.spring.smooth;
const morph = motionTokens.spring.morph;
const standard = [...motionTokens.ease.standard] as [number, number, number, number];
const dateFormat = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
const formatDate = (iso: string) => dateFormat.format(new Date(`${iso}T00:00:00Z`));

function useControllable<T>(value: T | undefined, initial: T, onChange?: (next: T) => void) {
  const [inner, setInner] = useState(initial);
  const current = value !== undefined ? value : inner;
  const set = (next: T) => { if (value === undefined) setInner(next); onChange?.(next); };
  return [current, set] as const;
}

function Meta({ post }: { post: BlogPost }) {
  return <p className={styles.meta}><span>{post.category}</span></p>;
}

function Byline({ post }: { post: BlogPost }) {
  return <div className={styles.byline}>
    {post.author.avatar ? <img className={styles.avatar} src={post.author.avatar} alt="" width={36} height={36} loading="lazy" /> : <span className={styles.avatar} aria-hidden="true" />}
    <span className={styles.bylineCopy}>
      <strong className={styles.authorName}>{post.author.name}</strong>
      <span className={styles.bylineMeta}><time dateTime={post.date}>{formatDate(post.date)}</time><span aria-hidden="true">·</span><span>{post.readTime} min read</span></span>
    </span>
  </div>;
}

export function BlogGrid({
  eyebrow,
  title = "Journal",
  description = "Product news, design notes and engineering deep dives from the team.",
  posts = blogPosts,
  categories = blogCategories,
  category: categoryProp,
  defaultCategory = "All",
  onCategoryChange,
  getHref,
  onPostOpen,
  className,
}: BlogGridProps) {
  const reduced = useReducedMotion();
  const uid = useId();
  const rootRef = useRef<HTMLElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const [category, setCategoryState] = useControllable(categoryProp, defaultCategory, onCategoryChange);
  const [reading, setReading] = useState<BlogPost | null>(null);
  const [returning, setReturning] = useState<string | null>(null);
  const lastOpened = useRef<string | null>(null);

  useEffect(() => {
    if (!reading) return;
    requestAnimationFrame(() => backRef.current?.focus({ preventScroll: true }));
  }, [reading]);

  const sorted = [...posts].sort((a, b) => b.date.localeCompare(a.date));
  const filtered = category === "All" ? sorted : sorted.filter(post => post.category === category);

  function scrollToTop() {
    const node = rootRef.current;
    node?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }
  function setCategory(next: string) {
    if (next === category) return;
    setReturning(null);
    setCategoryState(next);
  }
  function open(post: BlogPost, event: MouseEvent) {
    onPostOpen?.(post);
    if (getHref) return;
    event.preventDefault();
    lastOpened.current = post.id;
    setReading(post);
    scrollToTop();
  }
  function close() {
    setReturning(lastOpened.current);
    setReading(null);
    requestAnimationFrame(() => {
      const card = rootRef.current?.querySelector<HTMLElement>(`[data-post="${lastOpened.current}"]`);
      card?.focus({ preventScroll: true });
      card?.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
    });
  }

  const titleWords = title.split(" ");
  const titleLast = titleWords.pop();
  const titleLead = titleWords.join(" ");
  const enterFade = (on: boolean) => ({ initial: on ? { opacity: 0 } : false as const, animate: { opacity: 1 }, transition: { duration: motionTokens.duration.standard, ease: standard } });

  const back = returning !== null;
  const tabs = ["All", ...categories];

  return <section ref={rootRef} className={[styles.root, className].filter(Boolean).join(" ")} aria-label={title}>
    <LayoutGroup id={uid}>
      <div className={styles.inner}>
        <AnimatePresence mode="popLayout" initial={false}>
          {reading ? <motion.article key="reader" className={styles.reader} exit={{ opacity: 0, transition: { duration: motionTokens.duration.exit, ease: standard } }} aria-labelledby={`${uid}-reader-title`}>
            <motion.button ref={backRef} type="button" className={styles.back} onClick={close} {...enterFade(true)}><ArrowLeft aria-hidden="true" />All reviews</motion.button>
            <motion.header className={styles.readerHead} {...enterFade(true)}>
              <Meta post={reading} />
              <h2 id={`${uid}-reader-title`} className={styles.readerTitle}>{reading.title}</h2>
              <Byline post={reading} />
            </motion.header>
            {reading.image && <motion.div layoutId={reduced ? undefined : `${uid}-image-${reading.id}`} transition={morph} className={styles.readerImage} {...(reduced ? enterFade(true) : {})}>
              <img className={styles.image} src={reading.image.src} alt={reading.image.alt} referrerPolicy="no-referrer" />
            </motion.div>}
            <motion.div className={styles.readerBody} initial={{ opacity: 0, y: reduced ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...smooth, delay: reduced ? 0 : .12 }}>
              <p className={styles.lead}>{reading.excerpt}</p>
              {(reading.body ?? []).map(paragraph => <p key={paragraph}>{paragraph}</p>)}
              <p><a href="https://www.hsbc.bank.in/credit-cards/products/live-plus/" target="_blank" rel="noopener noreferrer">View the official product page</a></p>
            </motion.div>
          </motion.article> : <motion.div key="index" className={styles.index} exit={{ opacity: 0, transition: { duration: motionTokens.duration.exit, ease: standard } }}>
            <motion.header className={styles.header} {...enterFade(back)}>
              {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
              <h1 className={styles.title}>{titleLead && <>{titleLead} </>}<span className={`${styles.foil} sp-title-foil`}>{titleLast}.</span></h1>
              {description && <p className={styles.description}>{description}</p>}
            </motion.header>

            <motion.div className={styles.filters} role="group" aria-label="Filter by category" {...enterFade(back)}>
              {tabs.map(tab => <button key={tab} type="button" className={styles.filter} aria-pressed={tab === category} onClick={() => setCategory(tab)}>
                {tab === category && <motion.span layoutId={`${uid}-filter`} className={styles.filterHighlight} transition={reduced ? { duration: 0 } : morph} />}
                <span>{tab}</span>
              </button>)}
            </motion.div>

            <motion.div key={category} initial={reduced || !back && category === defaultCategory ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={smooth}>
              {filtered.length === 0 ? <p className={styles.empty}>No reviews in {category} yet.</p>
                : <TilesLayout posts={filtered} href={post => getHref?.(post) ?? `#${post.id}`} onOpen={open} />}
            </motion.div>
          </motion.div>}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  </section>;
}

export function BlogGridBlock() {
  return <BlogGrid />;
}
