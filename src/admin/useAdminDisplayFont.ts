import { useEffect } from "react";

const FONT_LINK_ID = "admin-display-font";
const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap";

/**
 * Loads the display font used for headings/brand in the admin dashboard only.
 * The widget (embedded in third-party pages via iframe) deliberately never loads
 * this — it stays on the system font stack to avoid an extra network request on
 * someone else's site (see index.css comment above `.widget`).
 */
export function useAdminDisplayFont(): void {
  useEffect(() => {
    if (document.getElementById(FONT_LINK_ID)) return;

    const link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }, []);
}
