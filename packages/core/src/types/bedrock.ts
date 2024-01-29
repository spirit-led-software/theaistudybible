export type StabilityModelInput = {
  text_prompts: {
    text: string;
    weight?: number;
  }[];
  height?: number;
  width?: number;
  cfg_scale?: number;
  clip_guidance_preset?: string;
  sampler?:
    | 'DDIM'
    | 'DDPM'
    | 'K_DPMPP_2M'
    | 'K_DPMPP_2S_ANCESTRAL'
    | 'K_DPM_2'
    | 'K_DPM_2_ANCESTRAL'
    | 'K_EULER'
    | 'K_EULER_ANCESTRAL'
    | 'K_HEUN K_LMS';
  samples?: number;
  seed?: number;
  steps?: number;
  style_preset?:
    | '3d-model'
    | 'analog-film'
    | 'anime'
    | 'cinematic'
    | 'comic-book'
    | 'digital-art'
    | 'enhance'
    | 'fantasy-art'
    | 'isometric'
    | 'line-art'
    | 'low-poly'
    | 'modeling-compound'
    | 'neon-punk'
    | 'origami'
    | 'photographic'
    | 'pixel-art'
    | 'tile-texture';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extras?: any;
};

export type StabilityModelOutput = {
  result: 'success' | 'failure';
  artifacts: {
    seed: number;
    base64: string;
    finishReason: 'SUCCESS' | 'ERROR' | 'CONTENT_FILTERED';
  }[];
};
