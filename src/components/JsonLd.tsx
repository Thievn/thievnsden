export function JsonLd() {
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Thievn's Den",
    alternateName: ["Thievns Den", "The Den"],
    url: "https://thievnsden.com",
    description:
      "Personal site by Thievn for dark humor, honest writing, AI art, gaming, and experimental tools like Face The Den.",
    inLanguage: "en-US",
    publisher: {
      "@type": "Person",
      name: "Thievn",
      url: "https://thievnsden.com/about",
      sameAs: ["https://x.com/Thievn"],
    },
  };

  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Thievn",
    url: "https://thievnsden.com",
    sameAs: ["https://x.com/Thievn"],
    description:
      "Creator of Thievn's Den — dark humor, AI-generated art, gaming takes, and unfiltered writing.",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }}
      />
    </>
  );
}
