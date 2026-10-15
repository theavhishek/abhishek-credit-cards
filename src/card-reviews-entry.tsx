import { createRoot } from "react-dom/client";
import { BlogGrid } from "./card-reviews/blog-grid";
import { blogCategories } from "./card-reviews/blog-grid-data";
import "./card-reviews/review-shell.css";

const root = document.querySelector("#card-reviews-root");

if (root) {
  createRoot(root).render(
    <BlogGrid
      title="Card reviews"
      description="Independent notes on rewards, fees and the fine print that decides whether a card deserves space in your wallet."
      categories={blogCategories}
      pageSize={6}
      showFeatured
      getHref={(post) => "/card-reviews/" + post.id}
    />,
  );
}
