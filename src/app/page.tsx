import { Geist } from "next/font/google";
import { SignInForm } from "@/components/landing/SignIn";
import styles from "@/components/landing/landing.module.css";

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
});

const CARDS = [
  {
    title: "Quiet",
    body: "This page does not explain the rest.",
  },
  {
    title: "Private",
    body: "Made for one person.",
  },
  {
    title: "Simple",
    body: "Sign in, and you are through.",
  },
];

export default function HomePage() {
  return (
    <div className={`${geist.className} ${styles.gate}`} data-gate="">
      <a className={styles.skip} href="#main">
        Skip to content
      </a>
      <header className={styles.nav} id="top">
        <div className={styles.wrap}>
          <div className={styles.navRow}>
            <a className={styles.logo} href="#top">
              Thievn&rsquo;s Den
            </a>
            <a className={styles.navBtn} href="#sign-in">
              Sign in
            </a>
          </div>
        </div>
      </header>

      <main id="main">
        <section className={styles.hero}>
          <div className={styles.wrap}>
            <div className={styles.heroGrid}>
              <div className={styles.copy}>
                <h1>
                  Thievn&rsquo;s <em>Den</em>
                </h1>
                <p className={styles.lead}>A quiet little corner.</p>
                <a className={styles.cta} href="#sign-in">
                  Sign in
                </a>
              </div>
              <SignInForm />
            </div>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="front-title">
          <div className={styles.wrap}>
            <p className={styles.eyebrow}>Out here</p>
            <h2 id="front-title">Just the front.</h2>
            <div className={styles.cards}>
              {CARDS.map((card) => (
                <article className={styles.card} key={card.title}>
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.wrap}>
          <p className={styles.footName}>Thievn&rsquo;s Den</p>
          <p className={styles.footMeta}>&copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
