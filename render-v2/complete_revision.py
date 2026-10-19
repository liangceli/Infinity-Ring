from pathlib import Path
from datetime import datetime, timezone
import json

root=Path(__file__).resolve().parent.parent
now=datetime.now(timezone.utc).isoformat()
state_path=root/'.creative-flow/state.json'
s=json.loads(state_path.read_text(encoding='utf-8'))
s['phase']='site_review'
s['updated_at']=now
s['deployment'].update(status='READY; production alias verified in actual browser',deployment_id='dpl_EtYFmRMbgqo9QwpPLyHP1AaQWjTD',deployed_at=now,immutable_url='https://infinite-ringing-5tl1k3blf-liliangce316-3096s-projects.vercel.app',blocking_reason=None)
s['artifacts']['render_v2']['asset_status']='Complete: 121 RGBA product frames, 25 projection-size frames, off and diffuse-illumination frames, six native component macros. Cycles renders visually inspected and integrated.'
s['artifacts']['site_preview'].update(url='https://infinite-ringing.vercel.app/',status='Published for review; real browser verified desktop, mobile, reading mode, range controls, parts, wheel and reverse scrolling.')
s['artifacts']['site_qa']={'path':str(root/'docs/site-qa-v2.md'),'status':'9/9 tests; static integrity checks; actual browser visual/interaction QA; production hero and anatomy verified with no console errors','motion_tests':9,'screenshots':str(root/'docs/qa-v2')}
s['artifacts']['vercel_static_zip_historical']=s['artifacts'].pop('vercel_static_zip',None)
s['related_tasks']['hardware_rd'].update(status='created; active research; initial user questions presented in separate chat',thread_id='01a152bf-f824-7a61-8371-a8dff9af37d4',host_id='local',reason=None,at=now)
s['next_action']='Await user review of published native R3 model, explosion/reassembly, projected-light controls and 38-second shot plan. If accepted, record site approval/freeze fingerprint and produce matching landscape/portrait films. Do not repeat direction selection.'
s['pending_questions']=['Website milestone: accept revised R3 visual quality and light interaction, or specify concrete refinements. Music can use proposed restrained electronic/mechanical direction; no track selected.']
s['unresolved']=['R3 is authored concept visualization, not manufacturing CAD or proven electronics/optical performance.','User has not yet accepted revised website or film plan; no finished Infinity Ring film exists.','Music track and usage rights not selected; proposed direction is restrained electronic ambience with mechanical/scroll cues.']
state_path.write_text(json.dumps(s,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

qa=f'''# R3 native-render website QA

Verified {now}. Source fingerprint: `{s['source']['fingerprint']}`.

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
'''
(root/'docs/site-qa-v2.md').write_text(qa,encoding='utf-8')
(root/'docs/deployment-status.md').write_text(f'''# Current deployment

{now}

- https://infinite-ringing.vercel.app/ is READY and verified in the actual browser.
- Existing project `infinite-ringing`, project ID `prj_eSQZHpLwlZ6wwAk3Gm6fHaGKgVDg`; no duplicate project.
- Deployment ID `dpl_EtYFmRMbgqo9QwpPLyHP1AaQWjTD`.
- Native-render revision: 179 allowlisted static files; current hashes in deployment-files.json.
- Prior static ZIP is historical and does not contain this revision. Current deployable output is site/.vercel/output.
- Website review remains pending. Deployment permission does not imply visual or film acceptance.
''',encoding='utf-8')
(root/'docs/progress.md').write_text(f'''# Current progress — Infinity Ring

Updated {now}.

A+C direction and R3/Iris exterior remain approved. The first simplified model was rejected and preserved as a historical release.

The revision is published at https://infinite-ringing.vercel.app/. Portable Blender is installed and verified. One consistent native assembly drives product reveal, six-layer explosion, reassembly and six component macros. Projected target size/brightness and separate diffuse illumination use native Cycles renders. Desktop, mobile, reading mode, range controls, detail dialogs and wheel/reverse states have been checked. Nine tests pass. See site-qa-v2.md and actual screenshots in qa-v2/.

Current milestone: website review. No site approval is recorded; no Infinity Ring video exists yet. Proposed film remains 38 seconds in landscape and portrait with cursor/wheel cues, prioritizing the new split/reassembly and light scenes. Next action is the user's acceptance or scoped visual refinement, then the same site is frozen for video capture.

The previously requested separate hardware research chat was successfully created: `01a152bf-f824-7a61-8371-a8dff9af37d4`. It is researching China-sourced DIY modules and asks the user about budget, tools and first-priority functions. Website geometry is not engineering evidence. Hardware research has not purchased or tested parts.
''',encoding='utf-8')
plan=root/'render-v2/PLAN.md'
plan.write_text(plan.read_text(encoding='utf-8').replace('- Rendering and visual inspection pending.','- Native modeling, all rendering, integration, actual browser inspection and existing-project Vercel deployment completed. Nine tests pass; three reviewer findings fixed. Site review pending; film not started.'),encoding='utf-8')
film=root/'docs/film-plan.md'
film.write_text(film.read_text(encoding='utf-8').replace('真实点击一次，绿光回应','真实点击一次，界面状态灯和语音波形回应').replace('当前浏览器审批服务容量错误尚未解决，因此不提前冻结站点、不登记虚构成片。','浏览器现已恢复，原生三维修订版已完成实际 QA 并上线。仍需用户验收网站后才冻结版本、渲染影片；当前没有成片。').replace('合回主要结构，近看虹膜，拖动真实 Target size 控件','同一模型合体，过渡到投光工作台，拖动真实 Target size 控件'),encoding='utf-8')
handoff=root/'hardware-handoff/研发任务书.md'
handoff.write_text(handoff.read_text(encoding='utf-8').replace('状态：用户已要求另开研发聊天，但创建工具因自动审批服务容量故障未执行。尚未创建新聊天、启动新聊天研究或采购零件。','状态更新：研发聊天已创建（01a152bf-f824-7a61-8371-a8dff9af37d4），已开始独立研究。未采购零件。下文保留原始交接要求；历史容量故障不再是当前阻塞。'),encoding='utf-8')
print(json.dumps({'phase':s['phase'],'url':s['deployment']['url'],'fingerprint':s['source']['fingerprint'],'site_approved':False},ensure_ascii=False))
