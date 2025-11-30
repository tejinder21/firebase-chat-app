
// Hakee kissafaktan catfact.ninja-palvelusta
const fetchCatFact = async () => {
  try {
    const res = await fetch('https://catfact.ninja/fact');

    if (!res.ok) {
      return 'Could not load a cat fact right now.';
    }

    const json = await res.json();

    if (json?.fact) {
      return json.fact;
    }

    return 'Could not load a cat fact right now.';
  } catch (e) {
    console.warn('Failed to fetch cat fact:', e);
    return 'Failed to load a cat fact.';
  }
};

// Hakee inspiroivan lainauksen zenquotes.io:sta
const fetchQuote = async () => {
  try {
    const res = await fetch('https://zenquotes.io/api/random');

    if (!res.ok) {
      return 'Could not load a quote right now.';
    }

    const json = await res.json();
    const item = Array.isArray(json) ? json[0] : null;

    if (item?.q && item?.a) {
      return `${item.q} — ${item.a}`;
    }

    return 'Could not load a quote right now.';
  } catch (e) {
    console.warn('Failed to fetch quote:', e);
    return 'Failed to load a quote.';
  }
};

/**
 * Käsittelee slash-komennot chatissa.
 * Palauttaa:
 *  - string → jos komento tunnistettiin ja halutaan korvata viestiteksti
 *  - null   → jos ei ollut komento, käytetään käyttäjän omaa tekstiä
 */
export const runSlashCommand = async (input) => {
  const trimmed = input.trim();

  if (trimmed === '/catfact') {
    return await fetchCatFact();
  }

  if (trimmed === '/quote') {
    return await fetchQuote();
  }

  // ei tunnistettu komentoa → ei muuteta viestiä
  return null;
};
