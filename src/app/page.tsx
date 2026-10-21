import { CrewCode } from "@/components/CrewCode";
import { DenStory } from "@/components/DenStory";
import { SiteFooter } from "@/components/SiteFooter";
import { VaultDoor } from "@/components/VaultDoor";

export default function HomePage() {
  return (
    <>
      <a className="skip" href="#the-den">
        Skip to content
      </a>
      <header className="hero">
        <div className="atmosphere" aria-hidden="true">
          <div className="hero-wash" />
          <div className="hero-glow" />
          <div className="hero-grain" />
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
            <h1 className="wordmark">
              <span className="wordmark-line">Thievn&rsquo;s</span>
              <span className="wordmark-rule" aria-hidden="true" />
              <span className="wordmark-line wordmark-den">Den</span>
            </h1>
            <p className="lede">A quiet little corner.</p>
            <a className="descend" href="#the-vault">
              Sign in
            </a>
          </div>
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
