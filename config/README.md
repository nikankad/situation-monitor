# Tooling configuration

Run commands from the repository root. The npm scripts select these configuration files:

| Configuration | Used by |
| --- | --- |
| `vite.ts` | `npm run dev`, `npm run build`, `npm run preview` |
| `vitest.config.ts` | `npm test`, `npm run test:unit` |
| `playwright.config.ts` | `npm run test:e2e` |
| `eslint.config.js` | `npm run lint` |
| `postcss.config.js` | Vite's CSS pipeline |
| `tailwind.config.js` | PostCSS's Tailwind plugin |

Vitest shares Vite's SvelteKit integration and CSS configuration. Playwright's
test directory is resolved relative to its config file, so it points back to
`tests/e2e/` at the repository root. Unit tests stay beside the source files they test.

To invoke a tool directly, supply its config path:

```sh
npx vite --config config/vite.ts
npx vitest run --config config/vitest.config.ts
npx playwright test --config config/playwright.config.ts
npx eslint --config config/eslint.config.js .
```

`src/lib/config/` contains dashboard data and feature definitions, rather than
development tooling. Root-level `svelte.config.js`, `tsconfig.json`, `.prettierrc`,
`.prettierignore`, and `vercel.json` remain in the locations used for automatic
discovery by their tools and editors.

The Vite file is named `vite.ts` so Svelte tooling does not treat `config/` as a separate application when scanning for conventional `vite.config.*` files.
