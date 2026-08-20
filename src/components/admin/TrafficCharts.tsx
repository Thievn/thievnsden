"use client";

import { useEffect, useState } from "react";

export function ViewsActivity({ data }: { data: { label: string; views: number }[] }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, [data]);

  const max = Math.max(...data.map((d) => d.views), 1);

  return (
    <div>
      <div className="flex items-end gap-1 h-36">
        {data.map((d) => (
          <div key={d.label} className="flex-1 flex flex-col items-center h-full justify-end">
            <div
              className="w-full max-w-[14px] mx-auto rounded-t bg-gradient-to-t from-red-700 to-purple-400 transition-all duration-700 ease-out"
              style={{ height: ready ? `${(d.views / max) * 100}%` : "0%" }}
              title={`${d.views} views`}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1 mt-2">
        {data.map((d, i) => (
          <div key={d.label} className="flex-1 text-center">
            {(i === 0 || i === data.length - 1 || i % 3 === 0) && (
              <span className="text-[9px] text-neutral-600">{d.label}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
