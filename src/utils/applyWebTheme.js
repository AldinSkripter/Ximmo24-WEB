const THEME_PROPERTIES = {
  system_color: "--primary-color",
  category_background: "--primary-category-background",
  sell_web_color: "--primary-sell",
  rent_web_color: "--primary-rent",
  sell_web_background_color: "--primary-sell-bg",
  rent_web_background_color: "--primary-rent-bg",
};
const isSafeCssColor = (value) => {
  if (typeof value !== "string" || !value.trim()) return false;
  if (typeof window === "undefined" || !window.CSS?.supports) return true;
  return window.CSS.supports("color", value.trim());
};

export const applyWebTheme = (settings) => {
  if (typeof document === "undefined" || !settings) return;

  const root = document.documentElement;
  Object.entries(THEME_PROPERTIES).forEach(([setting, property]) => {
    const value = settings[setting];
    if (isSafeCssColor(value)) root.style.setProperty(property, value.trim());
  });

  const themeColor = settings.system_color?.trim();
  if (isSafeCssColor(themeColor)) {
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = themeColor;
  }
};
