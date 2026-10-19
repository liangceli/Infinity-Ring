# Infinity Ring — R3 / Iris

Current website uses Blender/Cycles-rendered sequences on a scroll-driven canvas, local fonts and concept lifestyle imagery. The earlier Three.js model is retained in source as historical implementation material; the current app loads `rendered-world.mjs`.

Run `node server.mjs` from this folder, or `npm run dev` from the repository root. `npm test` and `npm run check` verify motion, rendering recovery, imports and assets. Full QA evidence is in `../docs/site-qa-v2.md`.

Published review URL: https://infinite-ringing.vercel.app/. Current deployment identity is retained in the ignored `.vercel/project.json`; no credentials were copied. Build and prepare scripts use repository-relative locations.

The motion toggle provides a reading mode. Projection size and brightness controls also work there. Component details and the concept download are functional. No microphone, camera, analytics or checkout is used.

`src/app.mjs` exports `setCaptureFrame(progress,time)` and `releaseCapture()` for the future film adapter. Site visual acceptance is pending; no final film exists.

Three.js is preserved under MIT (`vendor/LICENSE`). Inter Tight uses SIL OFL (`assets/fonts/LICENSE`). Product and usage scenes are concept visuals, not physical hardware evidence.
