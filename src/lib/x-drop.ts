export const DROP_FEATURES = [
  {
    id: "ftd",
    label: "Face The Den",
    line: "Walk in looking pretty. Leave with notes.",
    path: "/playground/face-the-den",
    section: "Face The Den",
  },
  {
    id: "floor",
    label: "The Floor",
    line: "Ten rounds. Two costs. The room splits.",
    path: "/playground/would-you-rather",
    section: "The Floor",
  },
  {
    id: "afterimage",
    label: "Afterimage",
    line: "A lock screen from the den.",
    path: "/afterimage",
    section: "Afterimage",
  },
  {
    id: "highway",
    label: "Highway Hunter",
    line: "Night interstate. Soft wrecks.",
    path: "/playground/highway-hunter",
    section: "Highway Hunter",
  },
  {
    id: "nightgrab",
    label: "Night Grab",
    line: "Sixty seconds. Grab the bag.",
    path: "/playground/night-grab",
    section: "Night Grab",
  },
  {
    id: "den",
    label: "The Den",
    line: "Mature themes. Dark humor. Enter.",
    path: "/",
    section: "Thievn's Den",
  },
] as const;

export type DropFeatureId = (typeof DROP_FEATURES)[number]["id"];

export function dropFeature(id: string) {
  return DROP_FEATURES.find((f) => f.id === id) || DROP_FEATURES.find((f) => f.id === "den")!;
}
