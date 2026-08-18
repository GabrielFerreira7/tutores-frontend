import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement scrollIntoView; WidgetPage calls it to keep the chat scrolled down.
if (!window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = () => {};
}
