export default function NotFound() {
  return (
    <main className="lost">
      <p className="eyebrow">No such room</p>
      <h1>This passage ends.</h1>
      <p>The door you tried is not on this side of the wall.</p>
      <a className="turn turn-link" href="/">
        Return to the door
      </a>
    </main>
  );
}
