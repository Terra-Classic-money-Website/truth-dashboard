# React + TypeScript + Vite

## Validator activity on Agora

The Governance navigation includes `/#/governance/agora`. It measures public discussion on `agora.terra-classic.io` using an offline snapshot of the current bonded, non-jailed `columbus-5` validator set. The current capture covers all 246 public directory entries/profiles and all 172 topics discoverable through the public latest list; 170 community topics remain after excluding system and site-feedback topics.

Source responses and fetch timestamps are retained in `research/agora/public-evidence.json`. Reviewed account links are in `research/agora/account-matches.json`, keyed by validator operator address. Owner-supplied associations, public affiliation evidence, and unverified name candidates retain distinct provenance. No account match means unknown identity, not proven inactivity or absence of an account.

To collect a fresh capture and rebuild the measurement snapshot, run `npm run collect:agora` followed by `npm run build:agora`. Collection respects the forum's rate limits and retains per-request caches; `npm run collect:agora -- --resume` resumes an interrupted capture. A new collection archives the previous cache. Only a completed capture replaces the retained evidence. Review account links when the bonded population changes. There is no scheduled refresh or deployment added by this page.

Run `npm run test:agora`, `npm run lint`, and `npm run build` to verify changes. Tests reconcile source coverage and bonded stake, independent window totals, shared-account deduplication, unknown versus zero activity, system notices, author follow-ups, former validators, and time boundaries.

Rolling windows are exact 30/90/365-day intervals ending at the capture. Monthly charts use UTC calendar buckets and mark partial months. Topic response rates apply to topics created in the selected window, counting visible responses up to capture. Replies come from individual human posts, not Discourse's `reply_count`, which tracks explicit reply-to relationships. Other-account responses exclude the topic author's account; this does not prove independent people or beneficial owners. Forum totals count shared-account messages once, while represented validators retain their individual count and current stake. Directory reading statistics cover the forum lifetime and can lag post captures. Older Agora and Commonwealth activity, private/deleted/unlisted content, historical validator membership, votes, and uptime are outside scope.

The CSV export follows the validator table's search/status/sort state and selected window/confidence mode. The full measurement snapshot can also be downloaded from the methodology section.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
