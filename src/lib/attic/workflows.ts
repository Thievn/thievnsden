import { composeNegative } from "./safety";

type Node = { class_type: string; inputs: Record<string, unknown> };
export type Graph = Record<string, Node>;

function envName(key: string, fallback: string): string {
  const value = process.env[key]?.trim();
  return value || fallback;
}

export function chromaGraph(
  prompt: string,
  negative: string,
  opts: { seed: number; steps: number; cfg: number; w: number; h: number },
): Graph {
  return {
    c1: {
      class_type: "UNETLoader",
      inputs: { unet_name: envName("STUDIO_CHROMA_UNET", "Chroma1-HD.safetensors"), weight_dtype: "default" },
    },
    c2: {
      class_type: "DualCLIPLoader",
      inputs: {
        clip_name1: envName("STUDIO_CHROMA_CLIP_1", "t5xxl_fp8_e4m3fn.safetensors"),
        clip_name2: envName("STUDIO_CHROMA_CLIP_2", "clip_l.safetensors"),
        type: envName("STUDIO_CHROMA_CLIP_TYPE", "flux"),
      },
    },
    c3: { class_type: "VAELoader", inputs: { vae_name: envName("STUDIO_CHROMA_VAE", "ae.safetensors") } },
    c4: { class_type: "CLIPTextEncode", inputs: { text: prompt, clip: ["c2", 0] } },
    c5: { class_type: "CLIPTextEncode", inputs: { text: composeNegative(negative), clip: ["c2", 0] } },
    c6: { class_type: "EmptySD3LatentImage", inputs: { width: opts.w, height: opts.h, batch_size: 1 } },
    c7: {
      class_type: "KSampler",
      inputs: {
        model: ["c1", 0],
        positive: ["c4", 0],
        negative: ["c5", 0],
        latent_image: ["c6", 0],
        seed: opts.seed,
        steps: opts.steps,
        cfg: opts.cfg,
        sampler_name: "euler",
        scheduler: "beta",
        denoise: 1,
      },
    },
    c8: { class_type: "VAEDecode", inputs: { samples: ["c7", 0], vae: ["c3", 0] } },
    c9: { class_type: "SaveImage", inputs: { images: ["c8", 0], filename_prefix: "attic" } },
  };
}

export function zimageGraph(
  prompt: string,
  negative: string,
  opts: { seed: number; steps: number; cfg: number; w: number; h: number },
): Graph {
  return {
    z1: {
      class_type: "UNETLoader",
      inputs: { unet_name: envName("STUDIO_ZIMAGE_UNET", "z_image_turbo_bf16.safetensors"), weight_dtype: "default" },
    },
    z1b: { class_type: "ModelSamplingAuraFlow", inputs: { model: ["z1", 0], shift: 3 } },
    z2: {
      class_type: "CLIPLoader",
      inputs: { clip_name: envName("STUDIO_ZIMAGE_CLIP", "qwen_3_4b_fp8_mixed.safetensors"), type: "lumina2" },
    },
    z3: { class_type: "VAELoader", inputs: { vae_name: envName("STUDIO_ZIMAGE_VAE", "ae.safetensors") } },
    z4: { class_type: "CLIPTextEncode", inputs: { text: prompt, clip: ["z2", 0] } },
    z5: { class_type: "CLIPTextEncode", inputs: { text: composeNegative(negative), clip: ["z2", 0] } },
    z6: { class_type: "EmptySD3LatentImage", inputs: { width: opts.w, height: opts.h, batch_size: 1 } },
    z7: {
      class_type: "KSampler",
      inputs: {
        model: ["z1b", 0],
        positive: ["z4", 0],
        negative: ["z5", 0],
        latent_image: ["z6", 0],
        seed: opts.seed,
        steps: opts.steps,
        cfg: opts.cfg,
        sampler_name: "res_multistep",
        scheduler: "simple",
        denoise: 1,
      },
    },
    c8: { class_type: "VAEDecode", inputs: { samples: ["z7", 0], vae: ["z3", 0] } },
    c9: { class_type: "SaveImage", inputs: { images: ["c8", 0], filename_prefix: "attic" } },
  };
}

export type EditImages = { outfit?: boolean; extra?: boolean; mask?: boolean; scale?: 2 | 4 };

/** Qwen-Image-Edit graph used by the studio worker. Mask white means "change this". */
export function qwenEditGraph(
  prompt: string,
  negative: string,
  opts: { seed: number; denoise: number; images: EditImages; lock?: boolean },
): Graph {
  const extra: string[] = [];
  if (opts.images.outfit) extra.push("outfit");
  if (opts.images.extra) extra.push("extra");
  const enc = (text: string) => {
    const inputs: Record<string, unknown> = { clip: ["q5", 0], prompt: text, image1: ["prep", 1] };
    extra.forEach((name, index) => {
      inputs[`image${index + 2}`] = [name, 0];
    });
    return inputs;
  };
  const mask = Boolean(opts.images.mask);
  const mode = opts.lock ? (mask ? "mask" : "auto") : mask ? "mask" : "off";
  const graph: Graph = {
    q1: {
      class_type: "UNETLoader",
      inputs: { unet_name: envName("STUDIO_QWEN_UNET", "qwen_image_edit_2511_fp8mixed.safetensors"), weight_dtype: "default" },
    },
    q2: {
      class_type: "LoraLoaderModelOnly",
      inputs: {
        model: ["q1", 0],
        lora_name: envName("STUDIO_QWEN_LORA", "Qwen-Image-Edit-2511-Lightning-4steps-V1.0-bf16.safetensors"),
        strength_model: 1,
      },
    },
    q3: { class_type: "ModelSamplingAuraFlow", inputs: { model: ["q2", 0], shift: 3 } },
    q4: { class_type: "CFGNorm", inputs: { model: ["q3", 0], strength: 1 } },
    q5: {
      class_type: "CLIPLoader",
      inputs: { clip_name: envName("STUDIO_QWEN_CLIP", "qwen_2.5_vl_7b_fp8_scaled.safetensors"), type: "qwen_image" },
    },
    q6: { class_type: "VAELoader", inputs: { vae_name: envName("STUDIO_QWEN_VAE", "qwen_image_vae.safetensors") } },
    subj: { class_type: "LoadImage", inputs: { image: "subject.png" } },
    prep: { class_type: "LFPrepareEdit", inputs: { image: ["subj", 0], multiple: 16, max_megapixels: 1.6 } },
    qLatent: { class_type: "VAEEncode", inputs: { pixels: ["prep", 0], vae: ["q6", 0] } },
    qPos: { class_type: "TextEncodeQwenImageEditPlus", inputs: enc(prompt) },
    qNeg: { class_type: "TextEncodeQwenImageEditPlus", inputs: enc(composeNegative(negative)) },
    rPos: { class_type: "ReferenceLatent", inputs: { conditioning: ["qPos", 0], latent: ["qLatent", 0] } },
    rNeg: { class_type: "ReferenceLatent", inputs: { conditioning: ["qNeg", 0], latent: ["qLatent", 0] } },
    mPos: {
      class_type: "FluxKontextMultiReferenceLatentMethod",
      inputs: { conditioning: ["rPos", 0], reference_latents_method: "index_timestep_zero" },
    },
    mNeg: {
      class_type: "FluxKontextMultiReferenceLatentMethod",
      inputs: { conditioning: ["rNeg", 0], reference_latents_method: "index_timestep_zero" },
    },
    q8: {
      class_type: "KSampler",
      inputs: {
        model: ["q4", 0],
        positive: ["mPos", 0],
        negative: ["mNeg", 0],
        latent_image: ["qLatent", 0],
        seed: opts.seed,
        steps: 4,
        cfg: 1,
        sampler_name: "euler",
        scheduler: "simple",
        denoise: Math.max(0.2, Math.min(1, opts.denoise)),
      },
    },
    q9: { class_type: "VAEDecode", inputs: { samples: ["q8", 0], vae: ["q6", 0] } },
    crop: { class_type: "ImageCrop", inputs: { image: ["q9", 0], width: ["prep", 2], height: ["prep", 3], x: 0, y: 0 } },
    comp: {
      class_type: "LFPixelPerfectComposite",
      inputs: {
        original: ["subj", 0],
        edited: ["crop", 0],
        work_w: 0,
        work_h: 0,
        mode,
        threshold: 0.07,
        grow: 12,
        feather: 8,
        min_area: 0.0015,
      },
    },
    q10: { class_type: "SaveImage", inputs: { images: ["comp", 0], filename_prefix: "attic_edit" } },
  };
  if (opts.images.scale === 2 || opts.images.scale === 4) {
    graph.big = {
      class_type: "ImageScaleBy",
      inputs: { image: ["subj", 0], upscale_method: "lanczos", scale_by: opts.images.scale },
    };
    graph.prep.inputs.image = ["big", 0];
    graph.comp.inputs.original = ["big", 0];
  }
  if (opts.images.outfit) graph.outfit = { class_type: "LoadImage", inputs: { image: "outfit.png" } };
  if (opts.images.extra) graph.extra = { class_type: "LoadImage", inputs: { image: "extra.png" } };
  if (mask) {
    graph.mask = { class_type: "LoadImage", inputs: { image: "mask.png" } };
    graph.maskM = { class_type: "ImageToMask", inputs: { image: ["mask", 0], channel: "red" } };
    graph.comp.inputs.mask = ["maskM", 0];
  }
  if (opts.lock) {
    graph.drift = {
      class_type: "PixelDriftFix",
      inputs: { source_image: ["prep", 1], edited_image: ["crop", 0], method: "flat_4_points", max_mesh_points: 400 },
    };
    graph.comp.inputs.edited = ["drift", 0];
  }
  return graph;
}
