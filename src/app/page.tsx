import { CrewCode } from "@/components/CrewCode";
import { DenStory } from "@/components/DenStory";
import { HoodedFigure } from "@/components/HoodedFigure";
import { Seal } from "@/components/Seal";
import { SiteFooter } from "@/components/SiteFooter";
import { VaultDoor } from "@/components/VaultDoor";

const EMBERS = [
  { left: "8%", delay: "0s", duration: "16s", drift: "18px", size: "2px" },
  { left: "18%", delay: "3s", duration: "13s", drift: "-12px", size: "3px" },
  { left: "27%", delay: "7s", duration: "18s", drift: "10px", size: "2px" },
  { left: "39%", delay: "1.5s", duration: "15s", drift: "-16px", size: "2px" },
  { left: "48%", delay: "5s", duration: "12s", drift: "8px", size: "3px" },
  { left: "57%", delay: "9s", duration: "17s", drift: "-8px", size: "2px" },
  { left: "66%", delay: "2s", duration: "14s", drift: "14px", size: "2px" },
  { left: "74%", delay: "6s", duration: "19s", drift: "-18px", size: "3px" },
  { left: "83%", delay: "4s", duration: "15s", drift: "6px", size: "2px" },
  { left: "91%", delay: "8s", duration: "13s", drift: "-10px", size: "2px" },
];

export default function HomePage() {
  return (
    <>
      <a className="skip" href="#the-den">
        Skip to content
      </a>
      <header className="hero">
        <div className="atmosphere" aria-hidden="true">
          <div className="candle" />
          <div className="fog fog-a" />
          <div className="fog fog-b" />
          <div className="fog fog-c" />
          {EMBERS.map((ember) => (
            <span
              key={ember.left}
              className="ember"
              style={{
                left: ember.left,
                animationDelay: ember.delay,
                animationDuration: ember.duration,
                ["--drift" as string]: ember.drift,
                width: ember.size,
                height: ember.size,
              }}
            />
          ))}
        </div>

        <nav className="topnav" aria-label="Site">
          <a className="brand-mini" href="#top">
            Thievn&apos;s Den
          </a>
          <ul>
            <li>
              <a href="#the-den">Den</a>
            </li>
            <li>
              <a href="#notes">Notes</a>
            </li>
            <li>
              <a href="#the-vault">Sign in</a>
            </li>
          </ul>
        </nav>

        <div className="hero-layout" id="top">
          <div className="hero-copy">
            <Seal />
            <p className="lede">A quiet little corner.</p>
            <a className="descend" href="#the-vault">
              Sign in
            </a>
          </div>
          <HoodedFigure />
        </div>
      </header>

      <main>
        <DenStory />
        <CrewCode />
        <VaultDoor />
      </main>
      <SiteFooter />
    </>
  );
}
