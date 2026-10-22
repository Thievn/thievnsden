"use client";

import { CreateView } from "./CreateView";
import { EditView } from "./EditView";
import { GalleryView } from "./GalleryView";

export type LabView = "create" | "gallery" | "edit";

export function LabApp({ view }: { view: LabView }) {
  if (view === "edit") return <EditView />;
  if (view === "gallery") return <GalleryView />;
  return <CreateView />;
}
