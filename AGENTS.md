# Repository Guidelines

## Project Structure & Module Organization

- `README.md`, `README-zh.md`: the canonical “awesome list” content (most PRs touch these).
- `command-line-apps.md`, `editor-plugin.md` (+ `*-zh.md`): additional curated lists.
- `build/ast.mjs`: parses Markdown and generates data artifacts.
- `dist/`: generated site output and JSON data (ignored by git; rebuilt in CI/deploy).
- `src/`: Next.js App Router + PayloadCMS app (pages in `src/app/`, UI in `src/components/`, utilities in `src/lib/`, CMS config in `src/payload.config.ts`).
- `public/`: static assets served by Next.js.

## Build, Test, and Development Commands

- Install deps: `npm install` (if you hit cache `EPERM`, use `npm --cache ./.npm-cache install`).
- Optional env setup: `cp .env.example .env` (Payload/SQLite settings live here; never commit `.env`).
- Generate JSON data from Markdown: `npm run build:data` (writes `dist/awesome-mac.json` and `dist/awesome-mac.zh.json`).
- Build static docs site: `npm run build` (runs `idoc`, writes `dist/`).
- Local dev (web app): `npm run dev` (runs `build:data` first, then `next dev`).
- Production build/run (web app): `npm run build:web` then `npm run start:web`.

## Coding Style & Naming Conventions

- TypeScript is `strict`; keep types explicit and avoid `any`.
- Match existing formatting: 2-space indentation, double quotes, and named exports where practical.
- React/Next components use `PascalCase` filenames (e.g., `src/components/AppCard.tsx`).
- Prefer path aliases: `@/*` for `src/*` and `@payload-config` for Payload config.

## Testing Guidelines

- No dedicated test runner in this repo. Validate changes by running `npm run build:data` and (for app changes) `npm run build:web`.

## Commit & Pull Request Guidelines

- Commits are typically imperative and short (e.g., `Add <Thing> (#1234)`, `fix: <summary>`).
- For list additions, follow `CONTRIBUTING.md`: title case, alphabetical order within a section, and one logical addition per PR/issue.
- Use the GitHub PR template and include links/screenshots when the diff affects the UI or list structure.
