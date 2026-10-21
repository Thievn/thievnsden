export function DenStory() {
  return (
    <section className="story" id="the-den">
      <div className="story-copy">
        <p className="eyebrow">
          <span className="verd-dot" aria-hidden="true" />
          The room under the noise
        </p>
        <h2>The Den</h2>
        <div className="prose">
          <p>
            There is a room under the noise. The ceiling is low, the map has lost its corners to an
            old fire, and the parts that remain are enough.
          </p>
          <p>
            People who find this place do not come to be seen. They set something down, warm their
            hands, and leave before the street can remember their outline.
          </p>
          <p>The fire is kept small. A larger one would paint the shutters. We prefer the shutters dark.</p>
        </div>
      </div>
      <div className="map-card" aria-hidden="true">
        <svg className="map-lines" viewBox="0 0 360 460" preserveAspectRatio="xMidYMid slice">
          <path d="M-10 80 C 60 60, 90 120, 150 100 S 250 40, 380 90" />
          <path d="M-10 150 C 70 130, 120 190, 190 170 S 280 120, 380 160" />
          <path d="M-20 230 C 50 250, 140 190, 210 240 S 300 300, 390 250" />
          <path d="M-10 310 C 80 280, 130 340, 220 320 S 300 280, 380 330" />
          <path d="M20 390 C 90 360, 160 410, 240 380 S 320 360, 370 400" />
          <circle cx="214" cy="238" r="3" />
          <path d="M214 220 v-16 M214 256 v16 M196 238 h-16 M232 238 h16" />
        </svg>
        <div className="compass">
          <span>N</span>
          <svg viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="22" />
            <path d="M32 12 L36 32 L32 28 L28 32 Z" />
            <path d="M32 52 L28 32 L32 36 L36 32 Z" />
          </svg>
        </div>
        <p className="map-caption">Corners burned. The rest is enough.</p>
      </div>
    </section>
  );
}
