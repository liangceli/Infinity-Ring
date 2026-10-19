from pathlib import Path
from datetime import datetime,timezone
import json
root=Path(__file__).resolve().parent.parent
p=root/'.creative-flow/state.json';s=json.loads(p.read_text(encoding='utf-8'))
now=datetime.now(timezone.utc).isoformat()
decisions=[
 ('visual_revision','非常粗糙啊 和我们的概念图不一样；每个零件得做到栩栩如生 真实的必须；使用场景没有打出灯光 调灯圈 等冲击性强的场景','Replace rejected simplified model with consistent R3 assembly and real rendered component details; strengthen projected-light and illumination interactions.'),
 ('software_authorization','允许申请下载 Blender 便携版（推荐）','Official portable Blender in workspace; software authorization only, not approval of final design or site.'),
]
for kind,evidence,scope in decisions:
 if not any(x.get('kind')==kind and x.get('evidence')==evidence for x in s['decisions']):s['decisions'].append({'at':now,'kind':kind,'evidence':evidence,'scope':scope})
s['phase']='build';s['updated_at']=now
s['artifacts']['render_v2']={'root':str(root/'render-v2'),'master_blend':str(root/'render-v2/infinity-r3-master.blend'),'renderer':'Blender 4.5.14 LTS / Cycles / RTX 3050 OptiX','validation':str(root/'render-v2/model-validation.json'),'asset_status':'rendering/integration in progress; do not claim complete sequence until manifest and static checks pass','concept_boards_are':'ImageGen art direction; separate from authored Blender geometry'}
s['artifacts']['site_preview']={'url':'http://127.0.0.1:4191/','path':str(root/'site'),'status':'verified in actual in-app browser: hero, wheel input, desktop anatomy and mobile anatomy; remaining QA pending'}
s['deployment'].update({'project_id':'prj_eSQZHpLwlZ6wwAk3Gm6fHaGKgVDg','domain':'infinite-ringing.vercel.app','url':'https://infinite-ringing.vercel.app/','status':'existing project found and linked; revised assets not yet deployed','blocking_reason':None})
s['next_action']='Finish and inspect all native 3D renders, verify website controls and mobile layout, run package checks, update existing infinite-ringing Vercel project for website review. Full film waits for website acceptance.'
s['unresolved']=[x for x in s['unresolved'] if '浏览器自动审批' not in x and '本机HTTP' not in x]
s['unresolved'].append('Original simple model was rejected. Native v2 model is authored concept visualization; geometry and optical performance remain unvalidated for manufacturing.')
p.write_text(json.dumps(s,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Checkpoint updated; site acceptance remains unset.')
