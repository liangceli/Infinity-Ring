import {chapters,components,conceptText} from './content.mjs';
import {stateAt,clamp,chapterProgress,ramp,mix} from './motion.mjs';

const $=selector=>document.querySelector(selector),$$=selector=>[...document.querySelectorAll(selector)];
const root=document.documentElement,body=document.body;
history.scrollRestoration='manual';
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(label,attrs='',cls='text-link')=>`<button type="button" class="${cls}" ${attrs}>${label}</button>`;
const waveform=()=>`<span class="activation-pulse" aria-hidden="true">${[12,21,35,17,28,39,21,13,26,17,8].map(h=>`<i style="--height:${h}px"></i>`).join('')}</span>`;
function extras(c){switch(c.kind){
 case'hero':return `<div class="chapter-actions">${button('Explore the ring <span aria-hidden="true">↓</span>','data-jump="1"')}${button('Read the concept','data-open="concept"','subtle-link')}</div><div class="concept-badge">A future wearable concept</div>`;
 case'touch':return `<div class="activation" id="activation">${button('<span class="status-dot"></span><span class="activation-text">Preview activation</span>','id="activate" aria-pressed="false"','activation-button')}${waveform()}</div><p class="privacy-state" id="activation-state">Touch begins the proposed voice session.</p>`;
 case'light':return `<div class="control-panel"><div class="range-row"><label for="target-size">Target size <output id="size-value">55%</output></label><input id="target-size" type="range" min="15" max="100" value="55" aria-describedby="light-control-note"></div><div class="range-row"><label for="target-brightness">Target brightness <output id="brightness-value">70%</output></label><input id="target-brightness" type="range" min="10" max="100" value="70" aria-describedby="light-control-note"></div></div><p id="light-control-note" class="chapter-note">Interactive illustration of two separate controls.</p>`;
 case'voice':return `<div class="voice-exchange"><small>AN EVERYDAY QUESTION</small><p id="voice-question">“Remind me to bring my notebook.”</p><p class="reply" id="voice-reply">An idea captured, without reaching for a screen.</p>${button('Another possibility ↗','id="voice-next"','subtle-link')}</div>`;
 case'focus':return `<div class="interaction-steps"><span><b>01</b> Point</span><span><b>02</b> Circle</span><span><b>03</b> Ask</span></div>`;
 case'reading':return `<div class="use-tabs" aria-label="Example use cases">${['Read','Translate','Explore'].map((t,i)=>button(t,`data-use="${i}" aria-pressed="${i===0}"`,'')).join('')}</div><p class="use-explanation" id="use-explanation">Ask about a selected passage, while staying with the page.</p>`;
 case'night':return `<div class="night-mode">Diffuse illumination. Separate from target selection.</div>`;
 case'privacy':return `<div class="privacy-controls" aria-label="Preview proposed session states">${['Idle','Voice','Vision','End session'].map((t,i)=>button(t,`data-privacy="${i}" aria-pressed="${i===0}"`,'')).join('')}</div><p class="privacy-state" id="privacy-state">Idle · no active session in this illustration.</p>`;
 case'end':return `<div class="chapter-actions">${button('Read the concept <span aria-hidden="true">↗</span>','data-open="concept"')}<a class="text-link" href="assets/concept-overview.txt" download="Infinity-Ring-Concept.txt">Download overview <span aria-hidden="true">↓</span></a></div><p class="end-note">Concept visualization. Not yet a validated hardware product.<br>Form, optics and wearability remain in development.</p>${button('Back to the beginning ↑','data-jump="0"','subtle-link')}`;
 default:return'';
}}
function sceneExtras(c){switch(c.kind){
 case'hero':return `<div class="object-caption"><b>R3 / IRIS</b> GRAPHITE · GREEN LIGHT</div>`;
 case'anatomy':return `<div class="extras anatomy-index">${components.map((x,i)=>button(`<span class="part-n">0${i+1}</span>${x.name}<span class="plus" aria-hidden="true">+</span>`,`data-component="${x.id}"`,'part-link')).join('')}</div><p class="architecture-note">Functional layers, brought apart for exploration.<br>This is a concept architecture, not a manufacturing assembly.</p>`;
 case'light':return `<figure class="static-projection"><img src="assets/r3-projection/off.webp" alt="Infinity Ring projecting a target onto a work surface"><img class="static-lit" src="assets/r3-projection/013.webp" alt="" style="opacity:.7"></figure><div class="scene-marker">TURN TO FOCUS / PROJECTED LIGHT</div>`;
 case'voice':return `<div class="signal-path" aria-label="Ring to gateway to cloud"><span>RING</span><span>GATEWAY</span><span>CLOUD AI</span></div>`;
 case'wear':return `<div class="scene-marker">MOMENT 01 / EVERYDAY WEAR</div>`;
 case'focus':return `<div class="scene-marker">MOMENT 02 / THE DETAIL THAT MATTERS</div>`;
 case'reading':return `<div class="scene-marker">MOMENT 03 / A LITTLE UNDERSTANDING</div>`;
 case'night':return `<div class="scene-marker">MOMENT 04 / AFTER DARK</div>`;
 case'privacy':return `<div class="privacy-legend"><span class="status-dot"></span><span id="privacy-indicator">ILLUSTRATION · IDLE</span></div>`;
 case'system':return `<div class="extras system-map">${[['01','Ring','Sensing, deliberate input, imaging, light and feedback.'],['02','Gateway','Connectivity, permissions, session state and transfer.'],['03','Cloud AI','Speech, image understanding, context and responses.']].map(([n,t,d])=>`<div class="system-node"><span class="node-no">${n}</span><h3>${t}</h3><p>${d}</p></div>`).join('')}</div><div class="development-disclosure"><span><i></i> Candidate components</span><span><i></i> Custom integration</span><span><i></i> Optical research</span></div><p class="chapter-note">No dimensions, endurance or performance specifications are claimed.</p>`;
 default:return'';
}}

$('#chapters').innerHTML=chapters.map((c,i)=>`<section id="${c.id}" class="chapter" data-kind="${c.kind}" ${c.photo?`data-photo="${c.photo}" style="--still:url('assets/iris-${c.photo}.png')"`:''} aria-labelledby="title-${i}"><div class="chapter-copy"><p class="eyebrow">${c.label}</p><${i===0?'h1':'h2'} id="title-${i}">${c.title.map(t=>`<span>${escapeHTML(t)}</span>`).join('')}</${i===0?'h1':'h2'}><p class="body-copy">${c.body}</p>${extras(c)}${!['hero','end','anatomy','system','light'].includes(c.kind)?`<p class="chapter-note">${c.note}</p>`:''}</div>${sceneExtras(c)}</section>`).join('');
$('#chapter-menu').innerHTML=chapters.map((c,i)=>`<a href="#${c.id}" data-jump="${i}"><span>${String(i+1).padStart(2,'0')}</span>${c.title.join(' ')}</a>`).join('');
const sections=$$('.chapter');
const sceneImages=$$('.scenes img');
const controls={size:.55,brightness:.7,activated:false,privacy:0};
let world,worldFailed=false,enhanced=false,desiredMotion=true,progress=0,target=0,last=performance.now(),active=-1,capture=false,playing=true,observer,previousFocus;
const reduceQuery=matchMedia('(prefers-reduced-motion: reduce)');
const motionLayoutFits=()=>innerHeight>=580||(innerWidth>1000&&innerHeight>=540);
function scrollRange(){return Math.max(1,document.documentElement.scrollHeight-innerHeight);}
function closeMenu(){ $('#chapter-menu').hidden=true;$('#chapters-trigger').setAttribute('aria-expanded','false');}
function updateActive(index,announce=false){
 if(active===index&&$('#chapter-number').textContent===String(index+1).padStart(2,'0'))return;
 active=index;$('#chapter-number').textContent=String(index+1).padStart(2,'0');
 $$('#chapter-menu a').forEach((a,i)=>a.setAttribute('aria-current',String(i===index)));
 if(announce)$('#announcer').textContent=chapters[index].title.join(' ');
}
export function renderFrame(value,time=0){
 const state=stateAt(value);progress=state.p;
 if(enhanced){
  sections.forEach((section,i)=>{
   const selected=i===state.chapter;
   if(!selected&&section.contains(document.activeElement))$('#main').focus({preventScroll:true});
   section.classList.toggle('is-active',selected);section.inert=!selected;section.setAttribute('aria-hidden',String(!selected));
   if(selected){section.style.opacity=state.textOpacity;section.style.transform=`translate3d(0,${state.textY}px,0)`;}
  });
  sceneImages.forEach(img=>{const amount=state.photos[img.dataset.photo];img.style.opacity=amount;img.style.transform=`scale(${1.035-.035*amount})`;});
  root.style.setProperty('--photo',state.photo);
  const weight=i=>(state.segment===i?1-state.blend:0)+(Math.min(state.segment+1,11)===i?state.blend:0);
  const illustratedSize=controls.sizeTouched?controls.size:mix(.95,.55,ramp(3/11,3.24/11,state.p));
  if(state.chapter===3&&!controls.sizeTouched){$('#target-size').value=String(Math.round(illustratedSize*100));$('#size-value').textContent=`${Math.round(illustratedSize*100)}%`;}
  const modelControls={size:illustratedSize,brightness:controls.brightness,reduced:reduceQuery.matches,status:state.green,turn:(controls.size-.55)*2.3*weight(3),iris:state.iris+(controls.size-.83)*weight(3)};
  if(controls.activated)modelControls.status+=(1-state.green)*weight(1);
  const privacySignal=controls.privacy===1?.55:controls.privacy===2?1:.05;
  modelControls.status+=(privacySignal-state.green)*weight(9);
  world?.render(state,modelControls,time);
 }
 root.style.setProperty('--progress',state.p);updateActive(state.chapter);
 return state;
}

async function ensureWorld(){
 if(world)return true;if(worldFailed)return false;
 try{const {createWorld}=await import('./rendered-world.mjs');world=await createWorld($('#ring-canvas'));return true;}
 catch(error){worldFailed=true;console.warn('The 3D experience is unavailable; the complete reading view remains available.',error);return false;}
}
async function setMode(motion){
 desiredMotion=motion;
 const index=Math.max(0,active);enhanced=motion&&motionLayoutFits()&&await ensureWorld();
 body.classList.toggle('enhanced',enhanced);$('#motion-mode span').textContent=enhanced?'on':'off';$('#motion-mode').setAttribute('aria-pressed',String(enhanced));$('#motion-mode').title=enhanced?'Switch to a static reading experience':'Enable the animated experience';
 observer?.disconnect();
 if(enhanced){
  target=chapterProgress(index);progress=target;scrollTo({top:target*scrollRange(),behavior:'instant'});renderFrame(progress,performance.now()/1000);
 }else{
  $('.static-lit').src=`assets/r3-projection/${String(Math.round(Number($('#target-size').value)*.24)).padStart(3,'0')}.webp`;
  $('.static-lit').style.opacity=controls.brightness;
  sections.forEach(s=>{s.inert=false;s.removeAttribute('aria-hidden');s.style.opacity='1';s.style.transform='none';});
  observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){const i=sections.indexOf(e.target);updateActive(i);root.style.setProperty('--progress',chapterProgress(i));}},{rootMargin:'-40% 0px -40% 0px',threshold:0});
  sections.forEach(s=>observer.observe(s));sections[index].scrollIntoView({behavior:'instant',block:'start'});
 }
}
function jump(index){
 index=clamp(Number(index),0,chapters.length-1);capture=false;closeMenu();
 history.replaceState(null,'',`#${chapters[index].id}`);
 if(enhanced)scrollTo({top:chapterProgress(index)*scrollRange(),behavior:reduceQuery.matches?'instant':'smooth'});
 else sections[index].scrollIntoView({behavior:reduceQuery.matches?'instant':'smooth',block:'start'});
 $('#announcer').textContent=chapters[index].title.join(' ');
}
addEventListener('hashchange',()=>{const index=chapters.findIndex(c=>`#${c.id}`===location.hash);if(index>=0)jump(index);});
function openDetails(id){
 const isConcept=id==='concept',part=components.find(p=>p.id===id);if(!isConcept&&!part)return;
 previousFocus=document.activeElement;
 $('#dialog-tag').textContent=isConcept?'INFINITY RING / CONCEPT NOTES':part.tag;
 $('#dialog-title').textContent=isConcept?'A considered idea. An open future.':part.name;
 if(isConcept){
  const blocks=conceptText.split(/\r?\n\r?\n/).slice(1);
  $('#dialog-body').innerHTML=blocks.map(t=>t===t.toUpperCase()?`<h3>${escapeHTML(t)}</h3>`:`<p>${escapeHTML(t).replaceAll('\n','<br>')}</p>`).join('')+'<a class="dialog-download" href="assets/concept-overview.txt" download="Infinity-Ring-Concept.txt">Download this overview ↓</a>';
 }else $('#dialog-body').innerHTML=`<img class="render-detail" src="assets/r3-details/${part.id}.webp" alt="Rendered ${escapeHTML(part.name)} from the Infinity Ring R3 assembly"><p>${escapeHTML(part.text)}</p>`;
 $('#dialog-status').textContent=isConcept?'R3 / Iris · Future product concept':part.status;
 body.classList.add('modal-open');$('#detail-dialog').showModal();
}
function closeDetails(){$('#detail-dialog').close();}
$('#detail-dialog').addEventListener('close',()=>{body.classList.remove('modal-open');previousFocus?.focus({preventScroll:true});});
$('.close-dialog').addEventListener('click',closeDetails);
$('#detail-dialog').addEventListener('click',event=>{if(event.target===$('#detail-dialog')){const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDetails();}});
document.addEventListener('click',event=>{
 const jumpButton=event.target.closest('[data-jump]');if(jumpButton){event.preventDefault();jump(jumpButton.dataset.jump);return;}
 const detail=event.target.closest('[data-open],[data-component]');if(detail){openDetails(detail.dataset.open||detail.dataset.component);return;}
 if(!event.target.closest('#chapter-menu,#chapters-trigger'))closeMenu();
});
$('#chapters-trigger').addEventListener('click',()=>{const open=$('#chapter-menu').hidden;$('#chapter-menu').hidden=!open;$('#chapters-trigger').setAttribute('aria-expanded',String(open));if(open)$('#chapter-menu a[aria-current=true]')?.focus();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('#chapter-menu').hidden){closeMenu();$('#chapters-trigger').focus();}});
$('#motion-mode').addEventListener('click',()=>setMode(!enhanced));
$('#activate').addEventListener('click',()=>{controls.activated=!controls.activated;$('#activation').classList.toggle('is-on',controls.activated);$('#activate').setAttribute('aria-pressed',String(controls.activated));$('.activation-text').textContent=controls.activated?'End preview':'Preview activation';$('#activation-state').textContent=controls.activated?'Illustration · voice session active. Camera off.':'Touch begins the proposed voice session.';});
$('#target-size').addEventListener('input',event=>{controls.sizeTouched=true;controls.size=Number(event.target.value)/100;$('#size-value').textContent=`${event.target.value}%`;$('.static-lit').src=`assets/r3-projection/${String(Math.round(controls.size*24)).padStart(3,'0')}.webp`;});
$('#target-brightness').addEventListener('input',event=>{controls.brightness=Number(event.target.value)/100;$('#brightness-value').textContent=`${event.target.value}%`;$('.static-lit').style.opacity=controls.brightness;});
let questionIndex=0;
const voiceExamples=[['“Remind me to bring my notebook.”','An idea captured, without reaching for a screen.'],['“Help me think through this idea.”','A conversational interface, imagined for a moment of focus.'],['“What should I pay attention to here?”','A question connected to the context you choose to share.']];
$('#voice-next').addEventListener('click',()=>{questionIndex=(questionIndex+1)%voiceExamples.length;[$('#voice-question').textContent,$('#voice-reply').textContent]=voiceExamples[questionIndex];});
const useTexts=['Ask about a selected passage, while staying with the page.','Explore the meaning of unfamiliar words in their context.','Follow a small detail into a deeper question.'];
$$('[data-use]').forEach(b=>b.addEventListener('click',()=>{$$('[data-use]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('#use-explanation').textContent=useTexts[Number(b.dataset.use)];}));
const privacyTexts=['Idle · no active session in this illustration.','Voice · deliberate activation. Camera off.','Vision · camera mode requested explicitly.','Ended · capture and light are off in this illustration.'];
$$('[data-privacy]').forEach(b=>b.addEventListener('click',()=>{controls.privacy=Number(b.dataset.privacy);$$('[data-privacy]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('#privacy-state').textContent=privacyTexts[controls.privacy];$('#privacy-indicator').textContent=`ILLUSTRATION · ${['IDLE','VOICE','VISION','ENDED'][controls.privacy]}`;$('.privacy-legend').classList.toggle('is-on',controls.privacy===1||controls.privacy===2);}));
addEventListener('scroll',()=>{if(!capture)target=clamp(scrollY/scrollRange());},{passive:true});
addEventListener('resize',()=>{const preserved=progress;world?.resize();if(desiredMotion&&!worldFailed&&motionLayoutFits()!==enhanced){setMode(true);return;}if(enhanced){target=preserved;scrollTo({top:target*scrollRange(),behavior:'instant'});renderFrame(target,performance.now()/1000);}},{passive:true});
$('#ring-canvas').addEventListener('webglcontextlost',event=>{event.preventDefault();worldFailed=true;world=undefined;setMode(false);$('#announcer').textContent='Switched to the complete reading view because 3D rendering is unavailable.';});
reduceQuery.addEventListener('change',event=>{if(event.matches)setMode(false);});
document.addEventListener('visibilitychange',()=>{playing=!document.hidden;last=performance.now();});
function tick(now){const dt=Math.min((now-last)/1000,.08);last=now;if(playing&&enhanced&&!capture){progress+=(target-progress)*(1-Math.exp(-dt*10));if(Math.abs(target-progress)<.000001)progress=target;renderFrame(progress,now/1000);}requestAnimationFrame(tick);}
// A future film adapter can drive these exact website components deterministically.
export function setCaptureFrame(p,time){capture=true;return renderFrame(p,time);}
export function releaseCapture(){capture=false;target=clamp(scrollY/scrollRange());}
const hashIndex=chapters.findIndex(c=>`#${c.id}`===location.hash);if(hashIndex>=0)active=hashIndex;
await setMode(!reduceQuery.matches);
if(hashIndex>=0&&enhanced){target=chapterProgress(hashIndex);scrollTo({top:target*scrollRange(),behavior:'instant'});renderFrame(target,performance.now()/1000);}
requestAnimationFrame(tick);
document.fonts.ready.then(()=>world?.resize());
