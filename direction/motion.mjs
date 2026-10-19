export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const smooth = (a, b, p) => { const t = clamp((p - a) / (b - a)); return t * t * (3 - 2 * t); };
export const lerp = (a,b,t) => a + (b-a)*t;
export const phases = [
  {at:0,label:'01 / THE OBJECT',title:'Quiet by design.',copy:'一次触摸，打开一种新的交互可能。先认识完整的戒指，再走进它的内部。'},
  {at:.19,label:'02 / ANATOMY OF AN IDEA',title:'Every part.\nOne purpose.',copy:'外壳、转环、内衬与功能模块错峰展开。这里展示功能关系，具体装配仍需工程验证。'},
  {at:.46,label:'03 / GUIDED BY LIGHT',title:'A different\npoint of view.',copy:'状态提示与目标投射是不同的光学任务。镜头接近独立的光学与视觉功能组。'},
  {at:.64,label:'04 / BACK TOGETHER',title:'Made to\ncome together.',copy:'每个部件沿原有路径回位。继续滚动，产品与现实中的目标表面建立联系。'},
  {at:.81,label:'05 / POINT. CIRCLE. ASK.',title:'Choose what\nyou want to know.',copy:'绿色选区落在目标表面，并逐渐缩小到接口区域。这是未来交互的概念演示。'},
];
export function motionAt(value) {
  const p = clamp(value);
  const explode = smooth(.13,.40,p) * (1-smooth(.62,.78,p));
  const focus = smooth(.40,.52,p)*(1-smooth(.58,.69,p));
  const scene = smooth(.77,.97,p);
  return {p,explode,focus,scene,
    shell:1.55*smooth(.13,.33,p)*(1-smooth(.64,.77,p)),
    control:-1.15*smooth(.18,.37,p)*(1-smooth(.62,.75,p)),
    lining:-1.8*smooth(.22,.40,p)*(1-smooth(.65,.78,p)),
    radius:lerp(.98,.43,smooth(.86,1,p)),
    turn:smooth(.06,.88,p)*1.3,
    phase:phases.reduce((n,x,i)=>p>=x.at?i:n,0)};
}
