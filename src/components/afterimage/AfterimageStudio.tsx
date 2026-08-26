"use client";

import { ChipGrid, FieldHead, ShuffleBtn } from "@/components/afterimage/ChipGrid";
import { CatalogPick } from "@/components/afterimage/CatalogPick";
import {
  ACCESSORIES,
  AGES,
  ANIME_LOOKS,
  BODIES,
  CAMERAS,
  ETHNICITIES,
  EXPRESSIONS,
  EYES,
  HAIR_COLORS,
  HAIR_STYLES,
  HEATS,
  HEIGHTS,
  LIGHTS,
  LOOKS,
  MAKEUPS,
  PHONES,
  placeFitsWorld,
  placesForWorld,
  POSES,
  VIBES,
  WARDROBES,
  WEATHERS,
  WHOS,
  WORLDS,
} from "@/lib/afterimage";
import {
  shufflePanel,
  STUDIO_PANELS,
  type StudioDraft,
  type StudioPanel,
} from "@/lib/afterimage-presets";

export function AfterimageStudio({
  draft,
  panel,
  onPanel,
  onDraft,
}: {
  draft: StudioDraft;
  panel: StudioPanel;
  onPanel: (id: StudioPanel) => void;
  onDraft: (next: StudioDraft | ((prev: StudioDraft) => StudioDraft)) => void;
}) {
  const set = <K extends keyof StudioDraft>(key: K, value: StudioDraft[K]) => {
    onDraft((d) => {
      const next = { ...d, [key]: value };
      if (key === "world" && !placeFitsWorld(next.place, next.world)) next.place = "";
      return next;
    });
  };

  const scenePlaces = placesForWorld(draft.world);
  const animeLook = ANIME_LOOKS.has(draft.styleId);
  const active = STUDIO_PANELS.find((p) => p.id === panel) || STUDIO_PANELS[0];
  const panelIndex = STUDIO_PANELS.findIndex((p) => p.id === panel);
  const prevPanel = panelIndex > 0 ? STUDIO_PANELS[panelIndex - 1] : null;
  const nextPanel = panelIndex < STUDIO_PANELS.length - 1 ? STUDIO_PANELS[panelIndex + 1] : null;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x sticky top-16 z-20 bg-[#070707]/80 backdrop-blur-md py-2 lg:static lg:bg-transparent lg:backdrop-blur-none lg:py-0">
        {STUDIO_PANELS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPanel(p.id)}
            className={`snap-start shrink-0 px-3.5 py-2 rounded-full border text-[13px] transition-all ${
              panel === p.id
                ? "border-fuchsia-300/70 bg-fuchsia-950/60 text-white"
                : "border-white/10 bg-black/30 text-neutral-400 hover:text-white"
            }`}
            aria-current={panel === p.id ? "true" : undefined}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="rounded-[1.75rem] border border-fuchsia-500/20 bg-black/55 backdrop-blur-md p-4 sm:p-6 shadow-[0_0_80px_-24px_rgba(217,70,239,0.55)] min-h-[28rem]">
        <div className="flex items-start justify-between gap-3 mb-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-fuchsia-300/80">{active.kicker}</p>
            <h2 className="text-2xl font-semibold text-white mt-1">{active.label}</h2>
          </div>
          {panel !== "spice" ? (
            <ShuffleBtn
              label="Shuffle this"
              onClick={() => onDraft((d) => shufflePanel(d, panel))}
            />
          ) : null}
        </div>

        <div key={panel} className="ai-panel-in">
        {panel === "look" && (
          <div className="space-y-7">
            <ChipGrid
              label="Medium"
              hint="Tap a look. Photo is a real camera. Drawn is illustration."
              options={LOOKS}
              value={draft.styleId}
              onChange={(id) => set("styleId", id)}
              allowEmpty={false}
              variant="card"
            />
            <div>
              <FieldHead label="Phone shape" hint="Still a vertical lock screen." />
              <div className="flex gap-2">
                {PHONES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => set("phoneId", p.id)}
                    className={`flex-1 rounded-2xl border px-3 py-3 text-left ${
                      draft.phoneId === p.id
                        ? "border-fuchsia-300/70 bg-fuchsia-950/40 text-white"
                        : "border-white/10 text-neutral-400"
                    }`}
                  >
                    <span className="block text-[13px] font-medium text-neutral-100">{p.name}</span>
                    <span className="block text-[11px] text-neutral-500 mt-0.5">{p.brand}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {panel === "face" && (
          <div className="space-y-7">
            <ChipGrid label="Who" options={WHOS} value={draft.who} onChange={(id) => set("who", id)} allowEmpty={false} />
            <ChipGrid label="Age look" hint="Adults only." options={AGES} value={draft.age} onChange={(id) => set("age", id)} allowEmpty={false} />
            <ChipGrid label="Features" options={ETHNICITIES} value={draft.ethnicity} onChange={(id) => set("ethnicity", id)} />
            <ChipGrid label="Build" options={BODIES} value={draft.body} onChange={(id) => set("body", id)} />
            <ChipGrid label="Height" options={HEIGHTS} value={draft.height} onChange={(id) => set("height", id)} />
            <ChipGrid label="Eyes" options={EYES} value={draft.eyes} onChange={(id) => set("eyes", id)} variant="swatch" />
            <ChipGrid label="Makeup" options={MAKEUPS} value={draft.makeup} onChange={(id) => set("makeup", id)} />
          </div>
        )}

        {panel === "hair" && (
          <div className="space-y-7">
            <ChipGrid
              label="Color"
              hint="Pick a color, a cut, or both."
              options={HAIR_COLORS}
              value={draft.hairColor}
              onChange={(id) => set("hairColor", id)}
              variant="swatch"
            />
            <ChipGrid
              label="Cut"
              options={HAIR_STYLES}
              value={draft.hairStyle}
              onChange={(id) => set("hairStyle", id)}
            />
          </div>
        )}

        {panel === "fit" && (
          <div className="space-y-7">
            <ChipGrid
              label="Clothes"
              hint="Skip if you want the look to decide."
              options={WARDROBES}
              value={draft.clothes}
              onChange={(id) => set("clothes", id)}
              variant="chip"
            />
            <ChipGrid
              label="Held / worn"
              options={ACCESSORIES}
              value={draft.accessory}
              onChange={(id) => set("accessory", id)}
            />
          </div>
        )}

        {panel === "scene" && (
          <div className="space-y-7">
            <ChipGrid
              label="World"
              hint="Leave on Any unless you want a setting baked in."
              options={WORLDS}
              value={draft.world}
              onChange={(id) => set("world", id)}
              variant="card"
            />
            <ChipGrid
              label="Place"
              hint={draft.world ? "Places that fit this world." : "Any world."}
              options={scenePlaces}
              value={draft.place}
              onChange={(id) => set("place", id)}
            />
            <ChipGrid label="Light" options={LIGHTS} value={draft.lighting} onChange={(id) => set("lighting", id)} />
            <ChipGrid label="Weather" options={WEATHERS} value={draft.weather} onChange={(id) => set("weather", id)} />
          </div>
        )}

        {panel === "shot" && (
          <div className="space-y-7">
            <ChipGrid
              label="Heat"
              hint="The attitude of the picture, not a clothing slider."
              options={HEATS}
              value={draft.heat}
              onChange={(id) => set("heat", id)}
              allowEmpty={false}
              variant="heat"
            />
            <ChipGrid label="Vibe" options={VIBES} value={draft.vibe} onChange={(id) => set("vibe", id)} />
            <ChipGrid label="Pose" options={POSES} value={draft.pose} onChange={(id) => set("pose", id)} />
            <ChipGrid label="Face" options={EXPRESSIONS} value={draft.expression} onChange={(id) => set("expression", id)} />
            <ChipGrid label="Camera" options={CAMERAS} value={draft.camera} onChange={(id) => set("camera", id)} />
          </div>
        )}

        {panel === "spice" && (
          <div className="space-y-6">
            <p className="text-sm text-neutral-400 leading-relaxed max-w-xl">
              Everything else is optional. The taps already build the shot. Use these only if you want a specific person, action, or lens note.
            </p>
            {animeLook && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <FieldHead label="Series" hint="Only if you want that show’s design language." />
                  <CatalogPick
                    kind="series"
                    value={draft.series}
                    placeholder="Type a series"
                    onPick={(r) =>
                      onDraft((d) => ({ ...d, series: r.label, seriesSlug: r.slug }))
                    }
                  />
                </div>
                <div>
                  <FieldHead label="Character" hint="Loads after a series." />
                  <CatalogPick
                    kind="character"
                    parent={draft.seriesSlug}
                    value={draft.subject}
                    placeholder="Type a name"
                    onPick={(r) => set("subject", r.label)}
                  />
                </div>
              </div>
            )}
            <label className="block space-y-1.5">
              <FieldHead label="Who they are" hint="Face notes the chips don’t cover. Freckles, scar, smirk." />
              <input
                value={draft.subject}
                onChange={(e) => set("subject", e.target.value)}
                placeholder="Silver streak, beauty mark, tired eyes"
                className="w-full px-3 py-2.5 rounded-xl bg-[#0b0b0b] border border-white/10 text-sm"
              />
            </label>
            <label className="block space-y-1.5">
              <FieldHead label="What they’re doing" hint="Action only. Place lives in Scene." />
              <textarea
                value={draft.want}
                onChange={(e) => set("want", e.target.value)}
                rows={2}
                placeholder="Holding two daggers, rain on the coat"
                className="w-full px-3 py-2.5 rounded-xl bg-[#0b0b0b] border border-white/10 text-sm"
              />
            </label>
            <label className="block space-y-1.5">
              <FieldHead label="Art note" hint="Lens, grain, color. Not the person." />
              <input
                value={draft.styleSearch}
                onChange={(e) => set("styleSearch", e.target.value)}
                placeholder="35mm, wet streets, rim light"
                className="w-full px-3 py-2.5 rounded-xl bg-[#0b0b0b] border border-white/10 text-sm"
              />
            </label>
          </div>
        )}
        </div>
        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={!prevPanel}
            onClick={() => prevPanel && onPanel(prevPanel.id)}
            className="px-4 py-2 rounded-full border border-white/10 text-[13px] text-neutral-400 disabled:opacity-30 hover:text-white"
          >
            {prevPanel ? `← ${prevPanel.label}` : "Look"}
          </button>
          {nextPanel ? (
            <button
              type="button"
              onClick={() => onPanel(nextPanel.id)}
              className="px-4 py-2 rounded-full border border-fuchsia-400/40 bg-fuchsia-950/40 text-[13px] text-fuchsia-100"
            >
              {nextPanel.label} →
            </button>
          ) : (
            <p className="text-[13px] text-neutral-500">Ready whenever you are.</p>
          )}
        </div>
      </div>
    </div>
  );
}
