// @ts-nocheck
// Ported from /workspace/comfy-serverless/build_wf.py
const NEG="low quality, blurry, deformed, bad anatomy, extra fingers, watermark, text, child, minor, underage";
const ANEG="lowres, worst quality, bad quality, bad anatomy, bad hands, extra fingers, jpeg artifacts, signature, watermark, text, loli, child, minor";
export function zimage(prompt,{seed,steps=8,w=832,h=1216}){return{
"z1":{class_type:"UNETLoader",inputs:{unet_name:"z_image_turbo_bf16.safetensors",weight_dtype:"default"}},
"z1b":{class_type:"ModelSamplingAuraFlow",inputs:{model:["z1",0],shift:3.0}},
"z2":{class_type:"CLIPLoader",inputs:{clip_name:"qwen_3_4b_fp8_mixed.safetensors",type:"lumina2"}},
"z3":{class_type:"VAELoader",inputs:{vae_name:"ae.safetensors"}},
"z4":{class_type:"CLIPTextEncode",inputs:{text:prompt,clip:["z2",0]}},
"z5":{class_type:"ConditioningZeroOut",inputs:{conditioning:["z4",0]}},
"z6":{class_type:"EmptySD3LatentImage",inputs:{width:w,height:h,batch_size:1}},
"z7":{class_type:"KSampler",inputs:{model:["z1b",0],positive:["z4",0],negative:["z5",0],latent_image:["z6",0],seed,steps,cfg:1.0,sampler_name:"res_multistep",scheduler:"simple",denoise:1.0}},
"c8":{class_type:"VAEDecode",inputs:{samples:["z7",0],vae:["z3",0]}},
"c9":{class_type:"SaveImage",inputs:{images:["c8",0],filename_prefix:"zimage"}}};}
export function chroma(prompt,{seed,steps=26,w=832,h=1216}){return{
"c1":{class_type:"UNETLoader",inputs:{unet_name:"Chroma1-HD-fp8mixed.safetensors",weight_dtype:"default"}},
"c2":{class_type:"CLIPLoader",inputs:{clip_name:"t5xxl_fp8_e4m3fn_scaled.safetensors",type:"chroma"}},
"c3":{class_type:"VAELoader",inputs:{vae_name:"ae.safetensors"}},
"c4":{class_type:"CLIPTextEncode",inputs:{text:prompt,clip:["c2",0]}},
"c5":{class_type:"CLIPTextEncode",inputs:{text:NEG,clip:["c2",0]}},
"c6":{class_type:"EmptySD3LatentImage",inputs:{width:w,height:h,batch_size:1}},
"c7":{class_type:"KSampler",inputs:{model:["c1",0],positive:["c4",0],negative:["c5",0],latent_image:["c6",0],seed,steps,cfg:4.0,sampler_name:"euler",scheduler:"beta",denoise:1.0}},
"c8":{class_type:"VAEDecode",inputs:{samples:["c7",0],vae:["c3",0]}},
"c9":{class_type:"SaveImage",inputs:{images:["c8",0],filename_prefix:"chroma"}}};}
export function illustrious(prompt,{seed,steps=28,w=832,h=1216}){return{
"a1":{class_type:"CheckpointLoaderSimple",inputs:{ckpt_name:"Illustrious-XL-v2.0.safetensors"}},
"a4":{class_type:"CLIPTextEncode",inputs:{text:"masterpiece, best quality, very aesthetic, absurdres, "+prompt,clip:["a1",1]}},
"a5":{class_type:"CLIPTextEncode",inputs:{text:ANEG,clip:["a1",1]}},
"a6":{class_type:"EmptyLatentImage",inputs:{width:w,height:h,batch_size:1}},
"a7":{class_type:"KSampler",inputs:{model:["a1",0],positive:["a4",0],negative:["a5",0],latent_image:["a6",0],seed,steps,cfg:5.5,sampler_name:"euler_ancestral",scheduler:"normal",denoise:1.0}},
"c8":{class_type:"VAEDecode",inputs:{samples:["a7",0],vae:["a1",2]}},
"c9":{class_type:"SaveImage",inputs:{images:["c8",0],filename_prefix:"anime"}}};}
export const BUILDERS={zimage,chroma,illustrious};
export const EDIT="Head swap: replace the head and face of the woman in image 1 with the head and face of the woman from image 2. She must be clearly the same person as in image 2: identical face shape, eyes, eye color, eyebrows, nose, lips, freckles, makeup, piercings and hair color and style. Render her to match the style of image 1. Keep everything else in image 1 exactly unchanged: body, pose, clothing, background and lighting.";
// Qwen-Image-Edit-2511 face pass, chained on scene output node c8 (SaveImage c9 removed by caller)
export function qwen({scene=["c8",0],ref="ref.png",seed,steps=4,instr=EDIT}){return{
"q1":{class_type:"UNETLoader",inputs:{unet_name:"qwen_image_edit_2511_fp8mixed.safetensors",weight_dtype:"default"}},
"q2":{class_type:"LoraLoaderModelOnly",inputs:{model:["q1",0],lora_name:"Qwen-Image-Edit-2511-Lightning-4steps-V1.0-bf16.safetensors",strength_model:1.0}},
"q3":{class_type:"ModelSamplingAuraFlow",inputs:{model:["q2",0],shift:3.0}},
"q4":{class_type:"CFGNorm",inputs:{model:["q3",0],strength:1.0}},
"q5":{class_type:"CLIPLoader",inputs:{clip_name:"qwen_2.5_vl_7b_fp8_scaled.safetensors",type:"qwen_image"}},
"q6":{class_type:"VAELoader",inputs:{vae_name:"qwen_image_vae.safetensors"}},
"q_r":{class_type:"LoadImage",inputs:{image:ref}},
"q7":{class_type:"ImageScaleToTotalPixels",inputs:{image:scene,upscale_method:"lanczos",megapixels:1.0,resolution_steps:8}},
"q8":{class_type:"TextEncodeQwenImageEditPlus",inputs:{clip:["q5",0],vae:["q6",0],prompt:instr,image1:["q7",0],image2:["q_r",0]}},
"q9":{class_type:"TextEncodeQwenImageEditPlus",inputs:{clip:["q5",0],vae:["q6",0],prompt:"",image1:["q7",0],image2:["q_r",0]}},
"q10":{class_type:"FluxKontextMultiReferenceLatentMethod",inputs:{conditioning:["q8",0],reference_latents_method:"index_timestep_zero"}},
"q11":{class_type:"FluxKontextMultiReferenceLatentMethod",inputs:{conditioning:["q9",0],reference_latents_method:"index_timestep_zero"}},
"q12":{class_type:"VAEEncode",inputs:{pixels:["q7",0],vae:["q6",0]}},
"q13":{class_type:"KSampler",inputs:{model:["q4",0],positive:["q10",0],negative:["q11",0],latent_image:["q12",0],seed,steps,cfg:1.0,sampler_name:"euler",scheduler:"simple",denoise:1.0}},
"q14":{class_type:"VAEDecode",inputs:{samples:["q13",0],vae:["q6",0]}},
"q15":{class_type:"SaveImage",inputs:{images:["q14",0],filename_prefix:"qwenedit"}}};}
export const ZCN="Z-Image-Turbo-Fun-Controlnet-Union-2.1-2602-8steps.safetensors";
// Z-Image Turbo + Fun ControlNet Union 2.1 pose control. Skeleton must be uploaded as images[{name:"pose.png"}], sized w x h.
export function addPose(wf,{strength=0.8,name="pose.png"}){
  wf.p1={class_type:"ModelPatchLoader",inputs:{name:ZCN}};
  wf.p2={class_type:"LoadImage",inputs:{image:name}};
  wf.p3={class_type:"ZImageFunControlnet",inputs:{model:["z1b",0],model_patch:["p1",0],vae:["z3",0],strength,image:["p2",0]}};
  wf.z7.inputs.model=["p3",0];return wf;}
// Standalone Qwen-Image-Edit-2511 (Lightning 4-step) instruction edit — PIXEL-PERFECT variant (see comfy-serverless/PIXEL_PERFECT.md).
// images: subject.png (image1) + optional refs.png (outfit collage) + pose.png (skeleton) + mask.png (white = edit area).
// Native resolution (pad to /16, no rescale), reference latent = exact VAE latent of the working image (encoder gets no vae),
// PixelDriftFix homography realign, then LFPixelPerfectComposite pastes only the changed region onto the untouched original.
// Pose edits change geometry -> drift fix/auto-composite are skipped (mask still honoured).
// denoise<1 keeps more of the original. Must run as its own job (never chained with Z-Image/Chroma: RAM OOM).
export function qwenEdit({instr,seed,denoise=1,refs=false,pose=false,mask=false,maxMegapixels=1.6,pixelPerfect=true,loras=[]}:{instr:string;seed:number;denoise?:number;refs?:boolean;pose?:boolean;mask?:boolean;maxMegapixels?:number;pixelPerfect?:boolean;loras?:{file:string;strength:number}[]}){
  const extra=[];if(refs)extra.push("e_ref");if(pose)extra.push("e_pose");
  const enc=prompt=>{const i={clip:["q5",0],prompt,image1:["p1",1]};extra.forEach((n,k)=>{i["image"+(k+2)]=[n,0];});return i;};
  const pp=pixelPerfect&&!pose;
  const g:Record<string,any>={
"q1":{class_type:"UNETLoader",inputs:{unet_name:"qwen_image_edit_2511_fp8mixed.safetensors",weight_dtype:"default"}},
"q2":{class_type:"LoraLoaderModelOnly",inputs:{model:["q1",0],lora_name:"Qwen-Image-Edit-2511-Lightning-4steps-V1.0-bf16.safetensors",strength_model:1.0}},
"q3":{class_type:"ModelSamplingAuraFlow",inputs:{model:["q2",0],shift:3.0}},
"q4":{class_type:"CFGNorm",inputs:{model:["q3",0],strength:1.0}},
"q5":{class_type:"CLIPLoader",inputs:{clip_name:"qwen_2.5_vl_7b_fp8_scaled.safetensors",type:"qwen_image"}},
"q6":{class_type:"VAELoader",inputs:{vae_name:"qwen_image_vae.safetensors"}},
"e_src":{class_type:"LoadImage",inputs:{image:"subject.png"}},
"p1":{class_type:"LFPrepareEdit",inputs:{image:["e_src",0],multiple:16,max_megapixels:maxMegapixels}},
"q12":{class_type:"VAEEncode",inputs:{pixels:["p1",0],vae:["q6",0]}},
"q8":{class_type:"TextEncodeQwenImageEditPlus",inputs:enc(instr)},
"q9":{class_type:"TextEncodeQwenImageEditPlus",inputs:enc("")},
"r1":{class_type:"ReferenceLatent",inputs:{conditioning:["q8",0],latent:["q12",0]}},
"r2":{class_type:"ReferenceLatent",inputs:{conditioning:["q9",0],latent:["q12",0]}},
"q10":{class_type:"FluxKontextMultiReferenceLatentMethod",inputs:{conditioning:["r1",0],reference_latents_method:"index_timestep_zero"}},
"q11":{class_type:"FluxKontextMultiReferenceLatentMethod",inputs:{conditioning:["r2",0],reference_latents_method:"index_timestep_zero"}},
"q13":{class_type:"KSampler",inputs:{model:["q4",0],positive:["q10",0],negative:["q11",0],latent_image:["q12",0],seed,steps:4,cfg:1.0,sampler_name:"euler",scheduler:"simple",denoise}},
"q14":{class_type:"VAEDecode",inputs:{samples:["q13",0],vae:["q6",0]}},
"c1":{class_type:"ImageCrop",inputs:{image:["q14",0],width:["p1",2],height:["p1",3],x:0,y:0}},
"pc":{class_type:"LFPixelPerfectComposite",inputs:{original:["e_src",0],edited:["c1",0],work_w:0,work_h:0,mode:pp?(mask?"mask":"auto"):(mask?"mask":"off"),threshold:0.07,grow:12,feather:8,min_area:0.0015}},
"q15":{class_type:"SaveImage",inputs:{images:["pc",0],filename_prefix:"lfedit"}}};
  let tail="q2";(loras||[]).slice(0,3).forEach((l,k)=>{const n="lx"+(k+1);g[n]={class_type:"LoraLoaderModelOnly",inputs:{model:[tail,0],lora_name:l.file,strength_model:Math.max(0.5,Math.min(0.8,l.strength))}};tail=n;});
  g.q3.inputs.model=[tail,0];
  if(pp){g.df={class_type:"PixelDriftFix",inputs:{source_image:["p1",1],edited_image:["c1",0],method:"flat_4_points",max_mesh_points:400}};g.pc.inputs.edited=["df",0];}
  if(refs)g.e_ref={class_type:"LoadImage",inputs:{image:"refs.png"}};
  if(pose)g.e_pose={class_type:"LoadImage",inputs:{image:"pose.png"}};
  if(mask){g.m1={class_type:"LoadImage",inputs:{image:"mask.png"}};g.m2={class_type:"ImageToMask",inputs:{image:["m1",0],channel:"red"}};g.pc.inputs.mask=["m2",0];}
  return g;}
