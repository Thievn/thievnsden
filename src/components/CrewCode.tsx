const NOTES = [
  "This page is public.",
  "Sign in to go further.",
  "Your session stays in this browser.",
  "Sign out when you're done.",
];

const NUMERALS = ["I", "II", "III", "IV"];

export function CrewCode() {
  return (
    <section className="code-section" id="notes">
      <div className="code-intro">
        <p className="eyebrow">A few notes</p>
        <h2>Notes</h2>
      </div>
      <ol className="code-list">
        {NOTES.map((note, index) => (
          <li key={NUMERALS[index]}>
            <span className="numeral">{NUMERALS[index]}</span>
            <p>{note}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
