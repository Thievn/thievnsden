import { Suspense } from "react";
import "../playground.css";
import "./heat-check.css";
import { HeatCheckApp } from "@/components/heat-check/HeatCheckApp";

export default function HeatCheckPage() {
  return (
    <Suspense fallback={<div className="hc-app px-4 py-24 text-center text-sm text-neutral-500">Opening…</div>}>
      <HeatCheckApp />
    </Suspense>
  );
}
