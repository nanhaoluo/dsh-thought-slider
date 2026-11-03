# Test-only upstream component

`ComposerSlider.tsx` is copied unchanged from dsh-better-reasoning-effort 0.5.4,
commit `2d68b65cc641cd85e95384c859a2bc3de23d9e08`:
https://github.com/HaoyueQin/dsh-better-reasoning-effort/tree/2d68b65cc641cd85e95384c859a2bc3de23d9e08/src/client

`effort-memory.ts` contains only the two refusal helpers used by that component,
excerpted unchanged from the same commit. The upstream MIT license is included.
These sources are test fixtures, excluded from the published plugin. The React
component is bundled for browser integration tests with a simulated directory;
no DSH service or provider is contacted.
