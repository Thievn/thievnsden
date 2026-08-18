"use client";

import { useState, useRef } from "react";

const mockRoasts = [
  "You look like the kind of person who argues with the GPS and still gets lost.",
  "That expression says 'I've accepted my fate and it involves group chats.'",
  "Main character energy, but the story is a slow-burn tragedy with no payoff.",
  "You have the face of someone who says 'I'm fine' and means the opposite.",
  "If chaos had a customer service representative, it would look exactly like this.",
  "You look like you peak at 2am and regret it by 9am.",
  "There's a quiet desperation in those eyes that says 'I still have tabs open from 2023.'",
];

export default function PlaygroundPage() {
  const [image, setImage] = useState<string | null>(null);
  const [roast, setRoast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImage(url);
    setRoast(null);
  };

  const generateRoast = () => {
    if (!image) return;
    setLoading(true);
    setTimeout(() => {
      const random = mockRoasts[Math.floor(Math.random() * mockRoasts.length)];
      setRoast(random);
      setLoading(false);
    }, 1200);
  };

  const reset = () => {
    setImage(null);
    setRoast(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-semibold text-neutral-100 mb-3">
          Playground
        </h1>
        <p className="text-neutral-400">
          Fun little tools. Starting with a classic.
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-[#141414] p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-red-950/60 border border-red-900/40 flex items-center justify-center text-red-400 text-sm font-medium">
            R
          </div>
          <div>
            <h2 className="text-lg font-medium text-neutral-100">Roast Me</h2>
            <p className="text-sm text-neutral-500">
              Upload a selfie. Receive a dark, cynical roast. No mercy.
            </p>
          </div>
        </div>

        {!image ? (
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-neutral-700 hover:border-neutral-600 rounded-xl p-10 text-center cursor-pointer transition-colors"
          >
            <p className="text-neutral-400 mb-1">Click to upload a photo</p>
            <p className="text-xs text-neutral-600">JPG, PNG • stays in your browser</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="relative aspect-square max-w-xs mx-auto rounded-xl overflow-hidden border border-neutral-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt="Your upload"
                className="w-full h-full object-cover"
              />
            </div>

            {roast ? (
              <div className="p-5 rounded-xl bg-red-950/20 border border-red-900/30">
                <p className="text-neutral-200 leading-relaxed italic">
                  “{roast}”
                </p>
              </div>
            ) : (
              <button
                onClick={generateRoast}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-red-800 hover:bg-red-700 disabled:opacity-60 text-white font-medium transition-colors"
              >
                {loading ? "Consulting the void..." : "Roast me"}
              </button>
            )}

            <button
              onClick={reset}
              className="w-full py-2 text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              Try another photo
            </button>
          </div>
        )}

        <p className="mt-6 text-xs text-neutral-600 text-center">
          This is a mock roast for now. Real AI roasting can be wired later.
          Photos never leave your device in this version.
        </p>
      </div>

      <p className="mt-10 text-center text-sm text-neutral-600">
        More tools will appear here over time.
      </p>
    </div>
  );
}
