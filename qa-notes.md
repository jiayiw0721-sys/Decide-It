# UI Verification Notes

The home screen was checked at a 390 × 844 mobile viewport and at a 1280 × 720 desktop viewport. The fixed bottom navigation remains visible, the four required templates retain their labels, and the desktop presentation preserves a focused mobile-app canvas without introducing horizontal overflow. The hierarchy, contrast, and primary action remain legible in both viewport sizes.

The template filter screen was checked at a 390 × 844 mobile viewport through `/?template=food`. The three food filter groups, their selectable chips, the candidate-count preview, and the primary continue action are all visible without horizontal overflow. The selected filter labels are carried into the editor state and rendered as chips above the candidate list before the random-decision action.

The filtered editor state was checked at a 390 × 844 mobile viewport through `/?template=food&filters=light,solo,easy&stage=editor`. The editor visibly retains 清爽轻盈、一个人、轻松一点 as selected chips and populates four compatible starter candidates before the decision controls.

The “去哪里” filter screen was checked at 390 × 844 and presents a dedicated map-based concrete-place discovery action alongside its existing filters. The media candidate screen was checked at the same viewport and presents distinct movie/television tabs, search, multi-select feedback, and a candidate handoff action. It shows a loading state during the initial remote fetch; a live integration test then confirmed that the configured TMDb source returns concrete trending movie candidates.

After replacing the Maps loader with a window-scoped singleton promise, the place-discovery page was reopened in a fresh browser navigation. The browser console reported no output, including no duplicate Google Maps JavaScript API inclusion error. The loader now retains the loaded script and reuses the same global API promise across component mounts and hot updates.

For repeated-open verification, the browser navigated from the home screen back into the place-discovery page after the final loader fix. The second entry also produced an empty browser console, confirming that the duplicate Google Maps JavaScript API error did not return across the page transition.

The updated location page was checked at a 390 × 844 mobile viewport. It clearly presents the persistent “预备名单” section, its 0–8 capacity indicator, explanatory copy that selections survive later searches, and a disabled handoff action until at least two places have been accumulated. The add/remove state logic is additionally covered by a dedicated unit test for multi-search accumulation and removal.

Map markers are now rendered from the same current-search result set as the location list. Each marker calls the shared prepared-candidate toggle operation, so clicking it adds the matching place to the preparation list, clicking it again removes the place, and removing the place from the list regenerates the marker in its unselected visual state. The dedicated place preparation test suite covers cross-search accumulation, explicit removal, and the repeated-toggle behavior used by a marker click.

The English mode was checked at a 390 × 844 mobile viewport for both place discovery and media discovery. The location screen shows English search, marker, and short-list instructions; the media screen shows English movie/series controls, search guidance, selection feedback, and handoff action. The language control remains visible in the header on both screens.

The marker interaction issue was traced to an incompatible event configuration: the advanced marker used a `gmp-click` event through the Maps MVC `addListener` API without enabling clickable marker behavior. The marker now explicitly sets `gmpClickable: true` and uses the stable MVC `click` listener to call the same prepared-candidate toggle function as the result list. A successful click also displays immediate add/remove feedback, making the interaction observable to the user.

The second interaction safeguard replaces the provider-level listener with a native click listener on the rendered pin element. In addition, every current map result is exposed as a compact add/remove action inside the map area itself. These map-area actions call the same state toggle used by result cards and the preparation list, so a mapped location remains selectable even if the map provider blocks a marker event on a particular device.

Direct map selection now listens to the map canvas itself. A clicked POI is resolved through its Places identifier; a generic clicked coordinate is reverse-geocoded. In both cases the UI presents a confirmation card with the identified name/address and explicit Add or Dismiss actions before touching the preparation list. Type checking and the full regression suite completed successfully after this change.

Initial-load validation showed that the map viewport could remain in the visible loading/failure state after a fresh page entry, while later re-entry succeeded. The loading path was therefore revised to use an explicit Google Maps callback in addition to the script load signal, retaining the container-readiness gate and retry UI.

After adding the expanded automatic retry window, a fresh first-entry capture remains in the explicit loading state while retry attempts continue, rather than presenting an unresponsive empty panel. The component retains a visible manual retry action only after its background retries are exhausted.

In a browser-path check, the application was opened on the home screen, allowed to preload Maps for five seconds, and then navigated to place discovery. The place page still entered the explicit loading state initially, confirming that preloading alone does not eliminate the first-entry delay and that the retry/loading feedback remains necessary.

After removing the module-scoped Maps preloader so it cannot compete with the page-level async script, a fresh 390 × 844 first-entry capture still showed the explicit loading state. The rendered page now has one script source only, and the remaining investigation is focused on the proxy script's first browser request/callback delivery rather than duplicate client injection.

In a continuous browser session, the first entry remained on the loading state for 24 seconds and then reached the visible error state after all four automatic retries. This confirms the issue is a failed proxy script request in the first-entry browser path, not merely a screenshot-timing artifact; the existing “重新加载地图” recovery control is reachable and clearly visible.

Browser performance entries for the initial Maps script and all four automatic retry requests each showed a roughly 246–257 ms duration with zero transferred and decoded bytes. The callback therefore cannot run: the proxy is rejecting or blocking each script response before any Google Maps JavaScript can be evaluated.

The root cause is now verified: direct cross-origin script requests do not carry the `Origin` header expected by the Manus Maps proxy. Fetching the bootstrap through CORS carries the browser origin and returns the authorized JavaScript. The application now retrieves that bootstrap once, executes it as an inline script, and relies on the official bootstrap to request its Google library chunks. In a clean browser session after server restart, the first entry rendered the Shanghai map and controls; after the React state update, the loading overlay was absent and the map was immediately interactive.
