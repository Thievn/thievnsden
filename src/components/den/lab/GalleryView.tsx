"use client";

import { useEffect, useMemo, useState } from "react";
import { postDen } from "./api";
import { Switcher } from "./bits";

type Picture = {
  id: string;
  prompt: string;
  style: string | null;
  model: string | null;
  seed: number | null;
  favorite: boolean;
  folder: string | null;
  url: string | null;
  kind: string;
  status: string;
};

export function GalleryView() {
  const [images, setImages] = useState<Picture[] | null>(null);
  const [err, setErr] = useState("");
  const [stars, setStars] = useState(false);
  const [tag, setTag] = useState("");
  const [open, setOpen] = useState<Picture | null>(null);

  async function load() {
    const payload = await postDen({ action: "state" });
    setImages((payload.images as Picture[]) || []);
  }
  useEffect(() => { load().catch((error) => setErr(error.message)); }, []);

  const shown = useMemo(() => {
    return (images || []).filter((item) => item.status === "done" && item.url && (!stars || item.favorite) && (!tag || (item.folder || "").toLowerCase().includes(tag.toLowerCase())));
  }, [images, stars, tag]);

  async function star(item: Picture) {
    const on = !item.favorite;
    setImages((current) => current?.map((row) => row.id === item.id ? { ...row, favorite: on } : row) || null);
    setOpen((current) => current?.id === item.id ? { ...current, favorite: on } : current);
    await postDen({ action: "favorite", id: item.id, on }).catch(() => undefined);
  }
  async function saveTags(item: Picture, value: string) {
    setImages((current) => current?.map((row) => row.id === item.id ? { ...row, folder: value } : row) || null);
    setOpen((current) => current && current.id === item.id ? { ...current, folder: value } : current);
    await postDen({ action: "folder", id: item.id, name: value }).catch((error) => setErr(error.message));
  }

  return (
    <main className="lab">
      <header className="top">
        <div>
          <p className="brand">Den Lab</p>
          <Switcher current="Gallery" />
        </div>
      </header>
      <div className="card row between">
        <label className="check"><input type="checkbox" checked={stars} onChange={(event) => setStars(event.target.checked)} /> Favorites</label>
        <input className="tagfind" placeholder="Filter tags" value={tag} onChange={(event) => setTag(event.target.value)} />
      </div>
      {err ? <p className="err">{err}</p> : null}
      {!images ? <p className="muted">Loading gallery…</p> : null}
      {images && !shown.length ? <p className="muted">No pictures yet. Generate one and it lands here.</p> : null}
      <div className="gallery">
        {shown.map((item) => (
          <button key={item.id} type="button" className="tile" onClick={() => setOpen(item)}>
            <img src={item.url || ""} alt="" />
            {item.favorite ? <span className="badge">★</span> : null}
          </button>
        ))}
      </div>
      {open ? (
        <div className="sheetwrap" onClick={() => setOpen(null)}>
          <div className="sheet" role="dialog" aria-label="Picture" onClick={(event) => event.stopPropagation()}>
            <div className="sheethead"><b>{open.style || open.kind}</b><button type="button" className="icon" onClick={() => setOpen(null)}>Close</button></div>
            <div className="sheetbody">
              <img className="out" src={open.url || ""} alt="" />
              <p className="muted small">{open.model}{open.seed != null ? ` · seed ${open.seed}` : ""}{open.folder ? ` · ${open.folder}` : ""}</p>
              <p>{open.prompt}</p>
              <label className="lbl">Tags</label>
              <input defaultValue={open.folder || ""} key={open.id} onBlur={(event) => saveTags(open, event.target.value.trim())} placeholder="night, red" />
            </div>
            <div className="sheetfoot row">
              <button type="button" className="btn" onClick={() => star(open)}>{open.favorite ? "Starred" : "Favorite"}</button>
              <button type="button" className="btn" onClick={() => {
                sessionStorage.setItem("den_lab_vary", JSON.stringify({ prompt: open.prompt, style: open.style }));
                location.href = "/attic";
              }}>Vary this</button>
              <button type="button" className="btn" onClick={() => {
                sessionStorage.setItem("lf_edit_in", JSON.stringify({ id: open.id, img: open.url, label: open.style || "Gallery" }));
                location.href = "/edit";
              }}>Edit</button>
              <a className="btn" href={open.url || ""} download>Download</a>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
