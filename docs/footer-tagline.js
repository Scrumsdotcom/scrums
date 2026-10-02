/* Adds the brand tagline beneath the footer logo.
 *
 * docs.json's `footer` key only accepts `socials` and `links`, so there is no
 * supported way to declare this copy. Mintlify includes any .js in the content
 * directory on every page, so it is injected here as real text rather than via
 * CSS `content:` — the latter is neither selectable nor reliably read aloud.
 *
 * Styling lives in style.css (.footer-tagline). */

(function () {
  var TITLE = "Software Engineering. Sorted.™";
  var SUBTITLE =
    "Instantly deploy AI agents, talent, teams, tools, infrastructure, and delivery operations.";

  function inject() {
    var footer = document.getElementById("footer");
    if (!footer) return;
    if (footer.querySelector(".footer-tagline")) return;

    // The logo lives in an anchor wrapping img.nav-logo.
    var logoImg = footer.querySelector("img.nav-logo");
    if (!logoImg) return;
    var anchor = logoImg.closest("a");
    if (!anchor || !anchor.parentNode) return;

    var block = document.createElement("div");
    block.className = "footer-tagline";

    var title = document.createElement("p");
    title.className = "footer-tagline-title";
    title.textContent = TITLE;

    var sub = document.createElement("p");
    sub.className = "footer-tagline-sub";
    sub.textContent = SUBTITLE;

    block.appendChild(title);
    block.appendChild(sub);

    // Insert as a sibling after the logo anchor. Deliberately does not reparent
    // the anchor: moving a node React owns can make later reconciliation throw.
    anchor.parentNode.insertBefore(block, anchor.nextSibling);
    anchor.parentNode.classList.add("footer-brand-col");

    // Tag the row too, so style.css can reach it without CSS :has().
    if (anchor.parentNode.parentNode) {
      anchor.parentNode.parentNode.classList.add("footer-brand-row");
    }
  }

  function schedule() {
    window.requestAnimationFrame(inject);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", schedule);
  } else {
    schedule();
  }

  // The footer re-mounts on client-side navigation, dropping the injected node.
  var observer = new MutationObserver(schedule);
  observer.observe(document.body, { childList: true, subtree: true });
})();
