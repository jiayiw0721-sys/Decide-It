# Decide It

> A mobile-first bilingual decision assistant for everyday choices.

**Decide It** helps people spend less time overthinking small decisions. Choose what to eat, watch, where to go, or what to do first with focused filters, curated options, and fair or preference-weighted randomization.

The experience is designed for quick, low-pressure decisions on mobile while remaining comfortable to use on larger screens.

## Highlights

| Area | What it offers |
| --- | --- |
| Everyday decisions | Four guided starting points: **What to eat**, **What to watch**, **Where to go**, and **What to do first**. |
| Smart filtering | Combine mood, context, budget, time, atmosphere, travel, genre, and regional-cuisine filters before deciding. |
| Food discovery | Explore a varied food library with Sichuan & Chongqing, Cantonese, Jiangnan, Northwest, Northeast, and Yunnan specialties. |
| Fresh alternatives | Use **“None of these? Refresh this group”** to receive a different candidate group without changing the selected filters. |
| Decision modes | Use fair random selection or gently weight the current preferences: *Want it*, *Either*, and *Not now*. |
| Real-world options | Search places on an interactive map, select map landmarks directly, and build a short list before deciding. |
| Entertainment picks | Search live movie and TV candidates through TMDb. |
| Bilingual UI | Switch between Simplified Chinese and English; the setting is stored locally. |
| Private local history | Keep the latest ten accepted decisions on the current device without requiring sign-in. |

## Technology

| Layer | Tools |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, Framer Motion |
| Application API | Express, tRPC, TanStack Query, Zod |
| Data layer | Drizzle ORM, MySQL-compatible database support |
| Integrations | Google Maps through a managed proxy, TMDb |
| Quality | Vitest, TypeScript type checking |

## Getting Started

### Prerequisites

- Node.js 22 or later
- pnpm 10 or later

### Install and run

```bash
git clone <your-repository-url>
cd team-decision-center
pnpm install
pnpm dev
```

The development server starts on port `3000` by default. Open `http://localhost:3000` in your browser.

### Useful commands

```bash
# Run type checking
pnpm check

# Run the full test suite
pnpm test

# Create a production build
pnpm build

# Start the production server after building
pnpm start
```

## Configuration

Do not commit secrets or production data. Environment values are intentionally excluded from version control.

| Variable | Purpose | Required for |
| --- | --- | --- |
| `TMDB_API_TOKEN` | Server-side access to TMDb movie and TV search | Live media discovery |
| `DATABASE_URL` | MySQL-compatible database connection | Optional server-side persistence and development tooling |
| `BUILT_IN_FORGE_API_URL` | Managed platform service endpoint | Maps, storage, and built-in services in the managed environment |
| `BUILT_IN_FORGE_API_KEY` | Managed platform service credential | Maps, storage, and built-in services in the managed environment |
| `VITE_FRONTEND_FORGE_API_URL` | Browser-facing managed service endpoint | Interactive map loading |
| `VITE_FRONTEND_FORGE_API_KEY` | Browser-facing managed service credential | Interactive map loading |

When working outside the managed environment, configure the appropriate provider credentials through your deployment platform's secret manager. Never place API tokens, database passwords, user exports, or private keys in source files.

## How It Works

1. Select a decision template or start with a custom question.
2. Optionally apply filters that describe the current context.
3. Review the generated candidate group, edit it manually, or refresh it for a different group.
4. Mark each option as *Want it*, *Either*, or *Not now*.
5. Choose a fair random or preference-weighted decision.
6. Save the result to the local on-device history if it is useful to revisit later.

For real places, open map discovery, search or select landmarks directly from the map, then add at least two places to a short list. For media, search TMDb results and send selected titles back to the same decision flow.

## Project Structure

```text
client/              React application and reusable UI components
server/              Express, tRPC procedures, integrations, and data access
drizzle/             Database schema and migration configuration
shared/              Shared decision logic, filters, localization, and types
docs/                Project documentation, including GitHub export guidance
```

## Repository Notes

This repository intentionally contains only application source, configuration, tests, documentation, and required database migration history. Internal QA notes, template snapshots, and one-off integration notes are not part of the published project.

Files in `drizzle/` use generated migration identifiers such as `0004_lying_wilson_fisk.sql`. The words in these file names are automatic uniqueness labels, not conversation content or user data. Do not rename or delete migrations that have already been applied; their file hashes are recorded by the migration system to keep deployments consistent.

## Privacy and Data Handling

The core decision flow works without sign-in. Accepted decisions are stored in the browser's local storage on the current device and are not uploaded to GitHub with the project source.

The repository excludes environment files, database files, logs, private keys, service-account credentials, and platform-local configuration. Before publishing your own deployment, read [the GitHub export guide](docs/GITHUB_EXPORT.md) and keep every production secret in your hosting provider's secret manager.

## Testing

The project uses Vitest for decision logic, candidate filtering, localization, local-history limits, place preparation, and media integrations. Run the suite with:

```bash
pnpm test
```

## Acknowledgements

- [Google Maps Platform](https://mapsplatform.google.com/) for map and place experiences.
- [TMDb](https://www.themoviedb.org/) for movie and television metadata.

This product uses the TMDb API but is not endorsed or certified by TMDb.

## License

This project is released under the [MIT License](LICENSE).
