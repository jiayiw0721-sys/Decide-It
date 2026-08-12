import { MapView } from "@/components/Map";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ChoiceOption } from "@shared/decision";
import { removePreparedCandidate, togglePreparedCandidate as togglePreparedListCandidate } from "@shared/preparedCandidates";
import { Check, Loader2, MapPin, Plus, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type SearchPlace = {
  id?: string | null;
  displayName?: string | null;
  formattedAddress?: string | null;
  location?: google.maps.LatLng | null;
  primaryTypeDisplayName?: string | null;
};

type PlaceFinderProps = {
  onUseCandidates: (candidates: ChoiceOption[]) => void;
};

function toCandidate(place: SearchPlace): ChoiceOption {
  const label = place.displayName ?? "未命名地点";
  const address = place.formattedAddress ?? place.primaryTypeDisplayName ?? "";
  return { id: place.id ?? `${label}-${address}`, label, preference: "neutral" };
}

export function PlaceFinder({ onUseCandidates }: PlaceFinderProps) {
  const { language } = useLanguage();
  const english = language === "en";
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const mapClickListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<SearchPlace[]>([]);
  const [preparedCandidates, setPreparedCandidates] = useState<ChoiceOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [resolvingMapPoint, setResolvingMapPoint] = useState(false);
  const [clickedPlace, setClickedPlace] = useState<SearchPlace | null>(null);

  const togglePreparedCandidate = useCallback((place: SearchPlace) => {
    const candidate = toCandidate(place);
    setPreparedCandidates((current) => {
      const alreadyPrepared = current.some((item) => item.id === candidate.id);
      if (!alreadyPrepared && current.length >= 8) {
        toast.message(english ? "Your short list can hold up to 8 places." : "预备名单最多保留 8 个地点。", { icon: <Plus className="h-4 w-4" /> });
        return current;
      }
      return togglePreparedListCandidate(current, candidate);
    });
  }, []);

  const removeCandidate = (id: string) => setPreparedCandidates((current) => removePreparedCandidate(current, id));

  const resolveMapPoint = useCallback(async (event: google.maps.MapMouseEvent) => {
    if (!event.latLng || !window.google?.maps) return;
    setResolvingMapPoint(true);
    setClickedPlace(null);
    try {
      const poiEvent = event as google.maps.MapMouseEvent & { placeId?: string; stop?: () => void };
      if (poiEvent.placeId) {
        poiEvent.stop?.();
        const { Place } = await window.google.maps.importLibrary("places") as google.maps.PlacesLibrary;
        const place = new Place({ id: poiEvent.placeId });
        await place.fetchFields({ fields: ["id", "displayName", "formattedAddress", "location", "primaryTypeDisplayName"] });
        setClickedPlace({ id: place.id, displayName: place.displayName, formattedAddress: place.formattedAddress, location: place.location, primaryTypeDisplayName: place.primaryTypeDisplayName });
        return;
      }

      const { Geocoder } = await window.google.maps.importLibrary("geocoding") as google.maps.GeocodingLibrary;
      const geocoder = new Geocoder();
      const response = await geocoder.geocode({ location: event.latLng, language: english ? "en" : "zh-CN" });
      const result = response.results[0];
      const coordinates = `${event.latLng.lat().toFixed(5)}, ${event.latLng.lng().toFixed(5)}`;
      setClickedPlace({ id: result?.place_id ?? `point-${coordinates}`, displayName: result?.formatted_address ?? (english ? "Pinned map location" : "地图选定位置"), formattedAddress: result?.formatted_address ?? coordinates, location: event.latLng });
    } catch {
      toast.error(english ? "We could not identify this map point. Please try another spot." : "暂时无法识别这个地图位置，请换一个地点试试。 ");
    } finally {
      setResolvingMapPoint(false);
    }
  }, [english]);

  useEffect(() => {
    if (!map) return;
    mapClickListenerRef.current?.remove();
    mapClickListenerRef.current = map.addListener("click", resolveMapPoint);
    return () => {
      mapClickListenerRef.current?.remove();
      mapClickListenerRef.current = null;
    };
  }, [map, resolveMapPoint]);

  const addClickedPlace = () => {
    if (!clickedPlace) return;
    const candidate = toCandidate(clickedPlace);
    const alreadyPrepared = preparedCandidates.some((item) => item.id === candidate.id);
    togglePreparedCandidate(clickedPlace);
    toast.success(alreadyPrepared ? (english ? "Removed from your short list" : "已从预备名单移除") : (english ? "Added to your short list" : "已加入预备名单"));
    setClickedPlace(null);
  };

  const searchPlaces = async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      toast.message(english ? "Enter a city and the type of place you want." : "请写下城市和想去的地点类型。", { icon: <MapPin className="h-4 w-4" /> });
      return;
    }
    if (!window.google?.maps?.importLibrary) {
      toast.error(english ? "The map is still loading. Please wait a moment." : "地图仍在加载，请稍等一下。");
      return;
    }
    setSearching(true);
    try {
      const { Place } = await window.google.maps.importLibrary("places") as google.maps.PlacesLibrary;
      const result = await Place.searchByText({
        textQuery: trimmedQuery,
        fields: ["id", "displayName", "formattedAddress", "location", "primaryTypeDisplayName"],
        maxResultCount: 8,
        language: english ? "en" : "zh-CN",
      });
      setPlaces(result.places ?? []);
      const firstPlace = result.places?.[0];
      if (firstPlace?.location && mapRef.current) {
        mapRef.current.panTo(firstPlace.location);
        mapRef.current.setZoom(13);
      }
      if (!result.places?.length) toast.message(english ? "No close matches found. Try a more specific search." : "没有找到完全匹配的地点，换一个更具体的关键词试试。");
    } catch {
      toast.error(english ? "Place search is unavailable right now. Please try again later." : "地点搜索暂时不可用，请稍后再试。");
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (!map || places.length === 0 || !window.google?.maps) return;
    let cancelled = false;

    const renderMarkers = async () => {
      const { AdvancedMarkerElement, PinElement } = await window.google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
      if (cancelled) return;
      markersRef.current.forEach((marker) => { marker.map = null; });
      markersRef.current = places.flatMap((place, index) => {
        if (!place.location) return [];
        const candidate = toCandidate(place);
        const selected = preparedCandidates.some((item) => item.id === candidate.id);
        const pin = new PinElement({
          background: selected ? "#6955b3" : "#293145",
          glyphColor: "#ffffff",
          glyph: String(index + 1),
        });
        pin.element.style.cursor = "pointer";
        pin.element.setAttribute("role", "button");
        pin.element.setAttribute("aria-label", `${selected ? (english ? "Remove" : "移除") : (english ? "Add" : "加入")} ${candidate.label}`);
        pin.element.addEventListener("click", (event) => {
          event.stopPropagation();
          togglePreparedCandidate(place);
          toast.success(selected ? (english ? "Removed from your short list" : "已从预备名单移除") : (english ? "Added to your short list" : "已加入预备名单"));
        });
        const marker = new AdvancedMarkerElement({
          map,
          position: place.location,
          title: `${selected ? (english ? "On your short list: " : "已加入预备名单：") : (english ? "Click to add: " : "点击加入预备名单：")}${candidate.label}`,
          content: pin.element,
          gmpClickable: true,
        });
        return [marker];
      });
    };

    void renderMarkers().catch(() => undefined);
    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => { marker.map = null; });
      markersRef.current = [];
    };
  }, [map, places, preparedCandidates, togglePreparedCandidate]);

  const usePreparedCandidates = () => {
    if (preparedCandidates.length < 2) {
      toast.message(english ? "Add one more place before deciding." : "再加入一个地点，就可以开始决定了。", { icon: <Plus className="h-4 w-4" /> });
      return;
    }
    onUseCandidates(preparedCandidates);
  };

  return (
    <section className="mt-5">
      <div className="rounded-[24px] border border-[#ebe7df] bg-white/85 p-4 shadow-[0_10px_24px_rgba(52,58,78,0.045)]">
        <label className="text-xs font-bold text-[#697284]" htmlFor="place-query">{english ? "Search real places" : "搜索具体地点"}</label>
        <div className="mt-2 flex gap-2">
          <input id="place-query" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void searchPlaces()} placeholder={english ? "e.g. coffee shops near Central Park" : "例如：上海静安寺附近咖啡馆"} className="min-w-0 flex-1 rounded-xl bg-[#f7f5f1] px-3 py-3 text-sm text-[#40495c] outline-none placeholder:text-[#aeb3bb]" />
          <button onClick={() => void searchPlaces()} className="grid h-11 w-11 place-items-center rounded-xl bg-[#6955b3] text-white transition active:scale-95" aria-label={english ? "Search places" : "搜索地点"}>{searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}</button>
        </div>
        <p className="mt-2 text-[11px] leading-4 text-[#979da8]">{english ? "Tap a map pin or result to add it to your short list; tap again to remove it." : "点击地图标记或搜索结果都可加入预备名单；再次点击即可取消。"}</p>
      </div>

      <div className="relative mt-4 overflow-hidden rounded-[24px] border border-[#ebe7df]">
        <MapView className="h-[190px]" initialCenter={{ lat: 31.2304, lng: 121.4737 }} initialZoom={11} onMapReady={(readyMap) => { mapRef.current = readyMap; setMap(readyMap); }} />
        <div className="pointer-events-none absolute inset-x-2 top-2 z-10"><span className="inline-flex rounded-full bg-[#293145]/88 px-2.5 py-1.5 text-[10px] font-bold text-white shadow-sm">{english ? "Tap any landmark or point on the map" : "点击地图上的任意地标或位置"}</span></div>
        {(resolvingMapPoint || clickedPlace) && <div className="absolute inset-x-2 bottom-2 z-20 rounded-[16px] bg-white/96 p-3 shadow-[0_8px_18px_rgba(38,44,60,0.2)] backdrop-blur">{resolvingMapPoint ? <div className="flex items-center gap-2 text-xs font-semibold text-[#60697a]"><Loader2 className="h-4 w-4 animate-spin text-[#6955b3]" />{english ? "Identifying this map location…" : "正在识别这个地图位置…"}</div> : clickedPlace && <div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-xs font-bold text-[#465064]">{clickedPlace.displayName}</p><p className="mt-0.5 truncate text-[10px] text-[#9299a5]">{clickedPlace.formattedAddress}</p></div><div className="flex shrink-0 gap-1.5"><button onClick={() => setClickedPlace(null)} className="rounded-xl bg-[#f1efeb] px-2.5 py-2 text-[11px] font-bold text-[#777f8c]">{english ? "Dismiss" : "取消"}</button><button onClick={addClickedPlace} className="rounded-xl bg-[#6955b3] px-2.5 py-2 text-[11px] font-bold text-white"><Plus className="mr-1 inline h-3 w-3" />{english ? "Add" : "加入"}</button></div></div>}</div>}
        {places.length > 0 && <div className="absolute inset-x-2 bottom-2 z-10 flex gap-1.5 overflow-x-auto rounded-[14px] bg-white/94 p-1.5 shadow-[0_7px_16px_rgba(38,44,60,0.16)] backdrop-blur"><span className="shrink-0 px-1.5 py-2 text-[10px] font-bold text-[#6d7481]">{english ? "Map results" : "地图结果"}</span>{places.slice(0, 5).map((place) => { const candidate = toCandidate(place); const selected = preparedCandidates.some((item) => item.id === candidate.id); return <button key={`map-action-${candidate.id}`} onClick={() => togglePreparedCandidate(place)} className={`shrink-0 rounded-xl px-2.5 py-2 text-[11px] font-bold transition active:scale-95 ${selected ? "bg-[#6955b3] text-white" : "bg-[#f1effa] text-[#6754ae]"}`}>{selected ? <Check className="mr-1 inline h-3 w-3" /> : <Plus className="mr-1 inline h-3 w-3" />}{candidate.label}</button>; })}</div>}
      </div>

      <div className="mt-5 rounded-[22px] border border-[#e6e1d8] bg-[#f8f7f3] p-4">
        <div className="flex items-center justify-between"><h2 className="font-serif text-[19px] font-semibold tracking-[-0.03em] text-[#465064]">{english ? "Short list" : "预备名单"}</h2><span className="text-xs font-semibold text-[#6c59b1]">{preparedCandidates.length} / 8</span></div>
        {preparedCandidates.length === 0 ? <p className="mt-2 text-xs leading-5 text-[#949ba7]">{english ? "Tap a map pin or result to add it; you can keep collecting places across searches." : "点击地图标记或下方地点即可加入；可以跨多次搜索慢慢凑齐。"}</p> : <div className="mt-3 flex flex-wrap gap-2">{preparedCandidates.map((candidate) => <span key={candidate.id} className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#eae5fb] py-1.5 pl-3 pr-1.5 text-xs font-semibold text-[#6653aa]"><span className="max-w-[175px] truncate">{candidate.label}</span><button onClick={() => removeCandidate(candidate.id)} className="grid h-5 w-5 place-items-center rounded-full bg-white/70 transition hover:bg-white" aria-label={`${english ? "Remove" : "移除"} ${candidate.label}`}><X className="h-3 w-3" /></button></span>)}</div>}
        <button onClick={usePreparedCandidates} className={`mt-4 flex w-full items-center justify-center gap-2 rounded-[17px] py-3.5 text-sm font-bold transition active:scale-[0.98] ${preparedCandidates.length >= 2 ? "bg-[#293145] text-white shadow-[0_12px_22px_rgba(41,49,69,0.16)]" : "bg-[#e7e4df] text-[#9ba0a9]"}`}><Plus className="h-4 w-4" />{english ? "Use short list for voting or random choice" : "用预备名单开始投票或随机"}</button>
      </div>

      {places.length > 0 && <div className="mt-5"><div className="flex items-center justify-between"><h2 className="font-serif text-xl font-semibold tracking-[-0.03em]">{english ? "Current search results" : "本次搜索结果"}</h2><span className="text-xs text-[#8e95a1]">{english ? "Tap to add or remove" : "点击即可加入或取消"}</span></div><div className="mt-3 space-y-2">{places.map((place) => { const candidate = toCandidate(place); const selected = preparedCandidates.some((item) => item.id === candidate.id); return <button key={candidate.id} onClick={() => togglePreparedCandidate(place)} className={`flex w-full items-center gap-3 rounded-[18px] border p-3 text-left transition active:scale-[0.99] ${selected ? "border-[#b8ace8] bg-[#f2efff]" : "border-[#ebe7df] bg-white"}`}><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${selected ? "bg-[#6955b3] text-white" : "bg-[#f3f0eb] text-[#9aa0aa]"}`}>{selected ? <Check className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold text-[#465064]">{candidate.label}</span><span className="mt-0.5 block truncate text-xs text-[#949ba7]">{place.formattedAddress ?? place.primaryTypeDisplayName ?? (english ? "Place details loading" : "地点信息加载中")}</span></span></button>; })}</div></div>}
    </section>
  );
}
