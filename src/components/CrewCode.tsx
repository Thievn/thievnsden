const RULES = [
  "Come in quietly. Leave the door as you found it.",
  "A name is earned at the table, and used nowhere else.",
  "What the smoke hears, the street does not.",
  "Take only what was set in front of you.",
  "If you carry something out, bring it back before dawn.",
  "When the watch changes, you change with it. Nobody waits in the doorway.",
];

const NUMERALS = ["I", "II", "III", "IV", "V", "VI"];

export function CrewCode() {
  return (
    <section className="code-section" id="the-code">
      <div className="code-intro">
        <p className="eyebrow">Spoken once</p>
        <h2>Crew&apos;s Code</h2>
        <p className="prose-lead">The crew is small. These are not suggestions.</p>
      </div>
      <ol className="code-list">
        {RULES.map((rule, index) => (
          <li key={NUMERALS[index]}>
            <span className="numeral">{NUMERALS[index]}</span>
            <p>{rule}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
