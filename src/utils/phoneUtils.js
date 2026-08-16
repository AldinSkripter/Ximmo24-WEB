// Countries where the national subscriber number (NSN) can exceed 10 digits,
// requiring react-phone-input-2's enableLongNumbers=true to avoid truncation.
const LONG_NUMBER_COUNTRIES = new Set([
    'de',  // Germany      +49  — NSN up to 12 digits
    'at',  // Austria      +43  — NSN up to 11 digits
    'it',  // Italy        +39  — NSN up to 11 digits
    'br',  // Brazil       +55  — mobile NSN = 11 digits
    'cn',  // China        +86  — mobile NSN = 11 digits
    'jp',  // Japan        +81  — NSN up to 11 digits
    'ar',  // Argentina    +54  — NSN up to 11 digits
    'id',  // Indonesia    +62  — NSN up to 12 digits
    'ng',  // Nigeria      +234 — dialCode 3 + NSN 10 = 13 total
    'bd',  // Bangladesh   +880 — dialCode 3 + NSN 10 = 13 total
    'pt',  // Portugal     +351 — NSN up to 11 digits (2 + 9 + trailing)
    'ci',  // Côte d'Ivoire +225 — dialCode 3 + NSN 10 = 13 total
]);

// Maximum total digits = dialCode digits + NSN max digits (ITU-T E.164 based).
// Unlisted countries default to 12 (2-digit dial + 10-digit NSN).
const COUNTRY_MAX_DIGITS = {
    // ── 1-digit dial code ─────────────────────────────────────────────────
    us: 11, ca: 11, ru: 11,

    // ── 2-digit dial code + standard 10-digit NSN ─────────────────────────
    gb: 12, fr: 12, es: 12, in: 12, au: 12,
    kr: 12, my: 12, th: 12, vn: 12, ph: 12,
    za: 12, eg: 12, ke: 12, gh: 12, tz: 12,
    tr: 12, sa: 12, ae: 12, pk: 12, ir: 12,
    nl: 12, be: 12, ch: 12, se: 12, no: 12, dk: 12,
    fi: 12, gr: 12, cz: 12, sk: 12, hu: 12,
    ro: 12, bg: 12, hr: 12, rs: 12, ua: 12, pl: 12,
    mx: 12, nz: 13,

    // ── 2-digit dial code + extended NSN ──────────────────────────────────
    de: 14,  // +49  NSN up to 12
    at: 13,  // +43  NSN up to 11
    it: 13,  // +39  NSN up to 11
    br: 13,  // +55  NSN = 11 (mobile)
    cn: 13,  // +86  NSN = 11
    jp: 13,  // +81  NSN up to 11
    ar: 13,  // +54  NSN up to 11
    id: 14,  // +62  NSN up to 12
    pt: 13,  // +351 NSN up to 11

    // ── 3-digit dial code + 10-digit NSN ──────────────────────────────────
    ng: 13,  // +234
    bd: 13,  // +880
    ci: 13,  // +225 Côte d'Ivoire
};

const DEFAULT_MAX_DIGITS = 12;
// Extra characters budget for spaces, dashes and parentheses shown by the
// component's formatting mask (e.g. "1 (555) 123-4567" has 5 non-digit chars).
const FORMATTING_BUFFER = 5;

/**
 * Returns the appropriate PhoneInput configuration for a given country.
 *
 * @param {string} countryCode - ISO 3166-1 alpha-2 code (lowercase), e.g. "us", "de".
 * @returns {{ enableLongNumbers: boolean, maxLength: number }}
 */
export const getPhoneInputConfig = (countryCode) => {
    const code = countryCode?.toLowerCase();
    const maxDigits = COUNTRY_MAX_DIGITS[code] ?? DEFAULT_MAX_DIGITS;
    return {
        enableLongNumbers: LONG_NUMBER_COUNTRIES.has(code),
        maxLength: maxDigits + FORMATTING_BUFFER,
    };
};
