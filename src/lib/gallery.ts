/** Shared gallery / judgment helpers — Phase 1 foundation */

export { getRarity, type Rarity, type RaritySlug } from "@/lib/rarity";

export type GalleryJudgment = {
  id: string;
  user_id: string | null;
  style: string;
  focus: string;
  filthy_mode: string | null;
  score: number;
  rarity: string;
  verdict: string;
  image_url: string | null;
  is_public: boolean;
  is_demo: boolean;
  likes: number;
  dislikes: number;
  created_at: string;
  username?: string;
};
