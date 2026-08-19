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
    }, 1300);
  };

  const reset = () => {
    setImage(null);
    setRoast(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <div className="mb-8 sm:mb-12 text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-neutral-50 mb-2">
          Playground
        </h1>
        <p className="text-neutral-500 text-sm sm:text-base">
          Fun little tools. Starting with a classic.
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5 sm:p-8 glow-accent">
        <div className="flex items-center gap-3 sm:gap-4 mb-6">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-red-950/60 to-purple-950/50 border border-purple-900/30 flex items-center justify-center text-sm font-semibold text-red-300">
            R
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-medium text-neutral-100">Roast Me</h2>
            <p className="text-xs sm:text-sm text-neutral-500">
              Upload a selfie. Receive a dark, cynical roast.
            </p>
          </div>
        </div>

        {!image ? (
          <div
            onClick={() => fileRef.current?.click()}
            className="border border-dashed border-neutral-700 hover:border-neutral-500 rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 hover:bg-neutral-900/30 active:scale-[0.99]"
          >
            <p className="text-neutral-400 mb-1 text-sm sm:text-base">Tap to upload a photo</p>
            <p className="text-xs text-neutral-600">JPG or PNG • stays in your browser</p>
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
            <div className="relative aspect-square max-w-[240px] sm:max-w-[280px] mx-auto rounded-xl overflow-hidden border border-neutral-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt="Your upload"
                className="w-full h-full object-cover"
              />
            </div>

            {roast ? (
              <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-red-950/20 to-purple-950/15 border border-purple-900/20">
                <p className="text-neutral-200 leading-relaxed italic text-sm sm:text-[15px]">
                  “{roast}”
                </p>
              </div>
            ) : (
              <button
                onClick={generateRoast}
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-b from-red-700 via-red-800 to-purple-900 hover:from-red-600 hover:via-red-700 hover:to-purple-800 disabled:opacity-50 text-white font-medium transition-all active:scale-[0.98]"
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
          Mock roast for now. Photos never leave your device.
        </p>
      </div>
    </div>
  );
}
