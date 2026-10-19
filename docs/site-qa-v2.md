# R3 native-render website QA

Verified 2026-10-19T06:02:51.642713+00:00. Source fingerprint: `cd38943baab20b7f2bc1da13bece1123c3631e0b8b7c68ab5bb520d054939d0c`.

## Render assets
- Blender 4.5.14 LTS / Cycles / OptiX. Official portable archive SHA-256 was verified before extraction.
- Six component groups from one authored scene; 502 mesh instances. Reassembly uses the same instances; measured matrix endpoint error is zero.
- 121 transparent product frames, 25 projected-target frames, off and separate diffuse-light renders, six component macro images. Full render logs end successfully.
- Projection uses a Cycles light shader and scene surfaces; size changes share camera and geometry. Browser brightness composites lit/unlit renders for an illustrative control, not a calibrated optical simulation.
- Main product is native CGI; warm lifestyle pictures remain generated concept scenes. Neither represents a tested physical product.

## Automated checks
- `node --test tests/*.test.mjs`: 9 passed, 0 failed.
- `node scripts/check.mjs`: 14 modules parse, imports/assets present, 12 chapters, 6 components, 2,201 motion samples valid.
- Final reviewer found three P2 issues. Fixed same-size canvas resize repaint, stopped-scroll retry after failed image requests, and reading-mode projection feedback. Regression tests reproduce the first two conditions; reading mode was tested in the actual browser.
- Publishing uses a 179-file static allowlist. Environment files, credentials, Blender sources and local docs are excluded.

## Actual browser observations
- Desktop viewport 1265×720: native hero, six-layer exploded view, six-part selector, electronic-layer dialog, projected target at 15%/100% size and 10%/100% brightness, and separate illumination.
- Actual wheel input and reverse input reached intermediate poses; a stopped scene remains visible. Deterministic motion checks cover forward/reverse equivalence.
- Mobile override 390×844 (375 CSS content width): anatomy and detail layout checked earlier; final light and illumination frames fit above the copy. Removed dark overlays that obscured mobile light output. Temporary viewport override reset.
- Motion-off reading mode: target scene remains visible and both sliders update it. All chapter content remains available.
- Fixed deep-link startup/numbering and progress preservation on resizing. An immediate hash jump during an in-progress browser viewport reset was cancelled by that reset; ordinary navigation once resizing settled worked. No claim of exhaustive device testing.
- Final production URL loaded successfully. Hero and anatomy use new native renders; no console errors returned on production check.

## Evidence
- `qa-v2/live-hero.jpg`
- `qa-v2/live-anatomy.jpg`
- `qa-v2/desktop-electronics.jpg`
- `qa-v2/desktop-projection.jpg`
- `qa-v2/desktop-illumination.jpg`
- `qa-v2/mobile-projection.jpg`
- `qa-v2/mobile-illumination.jpg`
- `qa-v2/reading-projection.jpg`

## Deployment / review boundary
Production: https://infinite-ringing.vercel.app/
Deployment: dpl_EtYFmRMbgqo9QwpPLyHP1AaQWjTD
User authorized publishing earlier. Published for website review; approval of the revised site is pending. No final film has been rendered.
