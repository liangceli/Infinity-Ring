import {clamp,mix} from './motion.mjs';

export function renderedFrameAt(state){
 if(state.segment<3)return mix([0,20,65][state.segment],[20,65,120][state.segment],state.blend);
 const keys=[0,20,65,0,14,0,0,0,0,8,16,0];
 return mix(keys[state.segment],keys[Math.min(11,state.segment+1)],state.blend);
}
export function renderedLayout(state,width,height){
 const anatomy=(state.segment===2?1-state.blend:0)+(state.segment+1===2?state.blend:0);
 const mobile=width/height<.85;
 return {x:width*(mobile?.5:mix(.72,.53,anatomy)),y:height*(mobile?mix(.31,.49,anatomy):mix(.52,.55,anatomy)),size:height*(mobile?mix(.70,.63,anatomy):mix(1.22,.93,anatomy))};
}
export function projectionFrame(size){return clamp(size)*24;}

