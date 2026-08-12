export type MediaKind = "movie" | "tv";

export type MediaCandidate = {
  id: string;
  title: string;
  kind: MediaKind;
  year: string | null;
  overview: string;
  posterUrl: string | null;
};

type TmdbItem = {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  poster_path?: string | null;
};

export async function browseMedia(kind: MediaKind, query?: string): Promise<MediaCandidate[]> {
  const token = process.env.TMDB_API_TOKEN;
  if (!token) throw new Error("TMDb token is not configured");
  const params = new URLSearchParams({ language: "zh-CN", page: "1", include_adult: "false" });
  const endpoint = query?.trim()
    ? `https://api.themoviedb.org/3/search/${kind}?${new URLSearchParams({ ...Object.fromEntries(params), query: query.trim() })}`
    : `https://api.themoviedb.org/3/trending/${kind}/week?${params}`;
  const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
  if (!response.ok) throw new Error("TMDb request failed");
  const payload = await response.json() as { results?: TmdbItem[] };
  return (payload.results ?? []).slice(0, 12).flatMap((item) => {
    const title = item.title ?? item.name;
    if (!title) return [];
    const releaseDate = item.release_date ?? item.first_air_date ?? null;
    return [{
      id: `${kind}-${item.id}`,
      title,
      kind,
      year: releaseDate?.slice(0, 4) ?? null,
      overview: item.overview ?? "暂无简介",
      posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : null,
    }];
  });
}
