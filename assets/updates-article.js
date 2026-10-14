// Update article and archive pages: re-check offer statuses in India time
// (the HTML may be days old) and enable the copy-link button.
(() => {
  window.UpdatesCore?.refreshDom(document);

  document.querySelectorAll("[data-copy-url]").forEach((button) => {
    if (!navigator.clipboard) return;
    button.hidden = false;
    const label = button.querySelector("span");
    button.addEventListener("click", () => {
      navigator.clipboard.writeText(button.dataset.copyUrl).then(
        () => { label.textContent = "Link copied"; setTimeout(() => { label.textContent = "Copy link"; }, 2000); },
        () => { label.textContent = "Couldn’t copy"; }
      );
    });
  });
})();
