# External Candidate Integration Notes

Google Maps can supply concrete place candidates directly in the browser through the preconfigured Maps proxy. The official Maps JavaScript API supports `Place.searchByText` with a text query, a location bias, a result limit, and a restricted list of returned fields; the app should request only a candidate name, formatted address, location, Maps URI, and primary type. The existing project map component already loads the Places library through the proxy, so no user API key is required for place lookup.

No built-in movie/television data API was returned by the available data-source search, and no suitable enabled media connector is available in the current task. The UI should therefore reserve a content-provider adapter boundary for a future TMDb or user-selected provider, rather than fabricate titles or present a nonfunctional real-data claim.
