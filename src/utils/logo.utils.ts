const BASE = import.meta.env.BASE_URL || "/"; // usually "/"

const norm = (id: string | number) =>
  String(id).toLowerCase().replace(/[^a-z0-9_-]/g, "");

export function logoUrl(
  type: "country" | "league" | "team",
  id: string | number
) {
  const ext = type === "country" ? "svg" : "png";
  return `${BASE}assets/logos/${type}/${norm(id)}.${ext}`;
}
