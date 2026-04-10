const getPublicAssetsBaseUrl = () => {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  return apiBaseUrl.replace(/\/api\/?$/, "");
};

export const resolvePublicImageUrl = (value?: string) => {
  const raw = (value || "").trim();
  if (!raw) return undefined;

  const publicBase = getPublicAssetsBaseUrl();

  if (raw.startsWith("/uploads/")) {
    return `${publicBase}${raw}`;
  }

  try {
    const parsed = new URL(raw);

    if (parsed.pathname.startsWith("/uploads/")) {
      const isInternalDockerHost = parsed.hostname === "norte-gaming-api";
      const isFrontendHostByMistake =
        (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") &&
        (parsed.port === "3000" || parsed.port === "4000");
      const isLocalApiHost =
        (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") &&
        parsed.port === "4000";

      if (isInternalDockerHost || isFrontendHostByMistake || isLocalApiHost) {
        return `${publicBase}${parsed.pathname}`;
      }
    }

    return parsed.toString();
  } catch {
    return raw;
  }
};