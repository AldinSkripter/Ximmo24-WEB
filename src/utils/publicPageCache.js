export const setPublicPageCache = (
  response,
  { maxAge = 60, staleWhileRevalidate = 300 } = {},
) => {
  if (!response) return;

  response.setHeader(
    "Cache-Control",
    `public, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
  );
};
