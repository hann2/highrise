import tippy, { delegate, Placement } from "tippy.js";
import "tippy.js/dist/tippy.css";
import "tippy.js/animations/shift-away-subtle.css";

/**
 * Tooltips for everything in the editor with a `data-tip`: one Tippy
 * delegate on the page, so Preact can render and re-render the elements
 * freely. The text is read each time a tooltip shows, so it can change;
 * a `data-tip-title` goes above it in bold, and `data-tip-placement` puts
 * it elsewhere than above. Use these, not `title`.
 */
export function startTooltips(root: HTMLElement) {
  tippy.setDefaultProps({
    delay: [350, 0],
    duration: [150, 100],
    animation: "shift-away-subtle",
    theme: "editor",
    maxWidth: 300,
  });
  delegate(root, {
    target: "[data-tip]",
    content: "",
    onShow(instance) {
      const reference = instance.reference;
      const text = reference.getAttribute("data-tip");
      // Gone, or emptied since it was made
      if (!text || !reference.isConnected) {
        return false;
      }
      instance.setProps({
        placement:
          (reference.getAttribute("data-tip-placement") as Placement) ?? "top",
      });
      const content = document.createElement("div");
      const title = reference.getAttribute("data-tip-title");
      if (title) {
        const heading = document.createElement("div");
        heading.className = "tip__title";
        heading.textContent = title;
        content.append(heading);
      }
      const body = document.createElement("div");
      body.className = "tip__body";
      body.textContent = text;
      content.append(body);
      instance.setContent(content);
    },
  });
}

/** The props that give an element a tooltip, if there's anything to say */
export function tip(
  text: string | undefined,
  title?: string,
): Record<string, string> {
  if (!text) {
    return {};
  }
  return title
    ? { "data-tip": text, "data-tip-title": title }
    : { "data-tip": text };
}
