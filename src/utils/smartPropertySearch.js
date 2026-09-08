const normalize = (value = "") =>
  value
    .toLocaleLowerCase("de-DE")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss");

const parseMoney = (raw, suffix = "") => {
  const normalized = raw.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  if (!Number.isFinite(value)) return "";
  if (/mio|million/i.test(suffix)) return Math.round(value * 1_000_000);
  if (/k/i.test(suffix)) return Math.round(value * 1_000);
  return Math.round(value);
};

const CATEGORY_ALIASES = {
  house: ["haus", "hauser", "house", "einfamilienhaus", "mehrfamilienhaus", "villa", "bungalow", "reihenhaus"],
  apartment: ["wohnung", "wohnungen", "apartment", "apartments", "appartement", "penthouse", "maisonette"],
  land: ["grundstuck", "baugrundstuck", "grund", "land", "plot"],
  commercial: ["gewerbe", "gewerbeimmobilie", "commercial", "buro", "office", "laden", "halle"],
};

export const parseSmartPropertySearch = (query, categories = []) => {
  const original = query.trim();
  let working = normalize(original);
  const result = {
    property_type: "All",
    category_id: "",
    city: "",
    zip_code: "",
    min_price: "",
    max_price: "",
    keywords: "",
  };

  if (/\b(mieten|miete|mietwohnung|zur miete)\b/.test(working)) {
    result.property_type = "Rent";
    working = working.replace(/\b(mieten|miete|mietwohnung|zur miete)\b/g, " ");
  } else if (/\b(kaufen|kauf|verkaufen|verkauf|zum kauf)\b/.test(working)) {
    result.property_type = "Sell";
    working = working.replace(/\b(kaufen|kauf|verkaufen|verkauf|zum kauf)\b/g, " ");
  }

  const pricePattern = /\b(bis|max(?:imal)?|unter)\s*(?:zu\s*)?(\d[\d.\s]*(?:,\d+)?)\s*(mio\.?|million(?:en)?|k)?\s*€?/i;
  const priceMatch = working.match(pricePattern);
  if (priceMatch) {
    result.max_price = parseMoney(priceMatch[2], priceMatch[3]);
    working = working.replace(priceMatch[0], " ");
  }

  const minPricePattern = /\b(ab|mindestens)\s*(\d[\d.\s]*(?:,\d+)?)\s*(mio\.?|million(?:en)?|k)?\s*€?/i;
  const minPriceMatch = working.match(minPricePattern);
  if (minPriceMatch) {
    result.min_price = parseMoney(minPriceMatch[2], minPriceMatch[3]);
    working = working.replace(minPriceMatch[0], " ");
  }

  const zipMatch = working.match(/\b\d{5}\b/);
  if (zipMatch) {
    result.zip_code = zipMatch[0];
    working = working.replace(zipMatch[0], " ");
  }

  const normalizedCategories = categories.map((category) => ({
    ...category,
    searchNames: [
      category?.category,
      category?.translated_name,
      category?.slug_id,
    ].filter(Boolean).map(normalize),
  }));

  let matchedCategory = normalizedCategories.find((category) =>
    category.searchNames.some((name) => name && working.includes(name))
  );

  if (!matchedCategory) {
    for (const aliases of Object.values(CATEGORY_ALIASES)) {
      const alias = aliases.find((candidate) => new RegExp(`\\b${candidate}\\b`).test(working));
      if (!alias) continue;
      matchedCategory = normalizedCategories.find((category) =>
        category.searchNames.some((name) => aliases.some((candidate) => name.includes(candidate)))
      );
      if (matchedCategory) break;
    }
  }

  if (matchedCategory) {
    result.category_id = matchedCategory.id;
    const names = [...matchedCategory.searchNames, ...Object.values(CATEGORY_ALIASES).flat()]
      .sort((a, b) => b.length - a.length);
    names.forEach((name) => {
      working = working.replace(new RegExp(`\\b${name}\\b`, "g"), " ");
    });
  }

  working = working.replace(/\b(immobilie|immobilien|suche|gesucht|ich|eine|einen|ein|in|bei|nahe|umkreis)\b/g, " ");
  const remainder = working.replace(/[^a-z0-9äöü\-\s]/gi, " ").replace(/\s+/g, " ").trim();

  if (!result.zip_code && remainder && remainder.split(" ").length <= 3) {
    result.city = remainder.replace(/\b\w/g, (letter) => letter.toUpperCase());
  } else {
    result.keywords = remainder;
  }

  return result;
};
