/* Card reviews index: boxed tiles, every review on one page, the newest spanning the full row.
   The author appears once, in the page tagline, so tiles carry only the date and read time. */
import type { MouseEvent } from "react";
import { ArrowRight } from "lucide-react";
import type { BlogPost } from "./blog-grid-data";
import styles from "./review-tiles.module.css";

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
const formatDate = (iso: string) => dateFormat.format(new Date(`${iso}T00:00:00Z`));
const toneOf = (category: string) => ({ Cashback: "cashback", Launched: "launched", "Pre-launch": "prelaunch", Guide: "guide" } as Record<string, string>)[category] ?? "guide";

function Badge({ post }: { post: BlogPost }) {
  return <span className={styles.badge} data-tone={toneOf(post.category)}>{post.category}</span>;
}

function Meta({ post }: { post: BlogPost }) {
  return <span className={styles.meta}><time dateTime={post.date}>{formatDate(post.date)}</time> · {post.readTime} min read</span>;
}

function Art({ post, sizes, eager = false, className }: { post: BlogPost; sizes: string; eager?: boolean; className?: string }) {
  if (!post.image) return null;
  return <span className={[styles.art, className].filter(Boolean).join(" ")}>
    <img src={post.image.src} srcSet={post.image.srcset} sizes={post.image.srcset ? sizes : undefined} alt={post.image.alt} loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : undefined} referrerPolicy="no-referrer" />
  </span>;
}

export function TilesLayout({ posts, href, onOpen }: { posts: BlogPost[]; href: (p: BlogPost) => string; onOpen?: (post: BlogPost, event: MouseEvent) => void }) {
  return <ul className={styles.tiles}>
    {posts.map((post, index) => <li key={post.id} className={index === 0 ? styles.tileWide : styles.tileItem}>
      <a className={styles.tile} href={href(post)} data-post={post.id} onClick={event => onOpen?.(post, event)}>
        <Art post={post} eager={index === 0} sizes={index === 0 ? "(min-width: 1024px) 560px, 92vw" : "(min-width: 1024px) 380px, 92vw"} />
        <span className={styles.tileBody}>
          <Badge post={post} />
          <h2 className={index === 0 ? styles.tileTitleWide : styles.tileTitle}>{post.title}</h2>
          <span className={styles.excerpt}>{post.excerpt}</span>
          <span className={styles.tileFoot}><Meta post={post} /><span className={styles.readArrow} aria-hidden="true"><ArrowRight /></span></span>
        </span>
      </a>
    </li>)}
  </ul>;
}
