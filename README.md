# Infinity-Ring

Infinity Ring / R3 Iris — immersive concept-product website with a consistent Blender assembly, scroll-controlled exploded views and interactive projected light.

## Run

Requires Node.js 22 or newer. No dependency installation is needed for the current website.

```powershell
cd C:\Users\liangceli\Infinity-Ring
npm run dev
```

Open http://127.0.0.1:4191/. If the previous preview already uses that port, stop it or set `$env:PORT=4192` before running the command.

```powershell
npm test
npm run check
npm run build
```

## Files

- `site/`: website source, assets, tests, local server and deployment scripts.
- `render-v2/`: native Blender master scenes, modeling/render scripts and validation report.
- `docs/`: current QA evidence, deployment status and film plan.
- `.creative-flow/`: reusable workflow checkpoint; website acceptance remains pending.
- `direction/`, `research/`: concept references and selected R3 direction.
- `hardware-handoff/`: separate hardware-research brief.

Live review website: https://infinite-ringing.vercel.app/

The native product animation contains 121 frames. Projection has 25 size frames plus unlit/illumination states; six part macros come from the same authored assembly. The model is concept visualization, not validated manufacturing CAD. No completed Infinity Ring film exists yet.

## Rendering and deployment

Blender is needed only to regenerate product images, not to run the website. Use Blender 4.5 LTS with the scripts in `render-v2/`. The optional official portable downloader now targets this repository's `.tools/blender` directory. Existing runtime binaries were not duplicated into Git.

Run `npm run prepare:vercel` to prepare the static output inside `site/.vercel/output`. Run Vercel deployment commands from `site/` to use its existing project link. Deployment and Git push are separate actions; this relocation does not publish changes.

Environment credentials, render logs, caches, old release ZIPs and Blender backup files were excluded from the copy. The original project folder is retained. Current migration details: `docs/relocation.json`.
