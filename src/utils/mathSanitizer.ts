/**
 * Universal Science & Educational Formula and Currency Sanitizer
 * 
 * Mandate:
 * In Pakistani curriculum (PCTB Punjab, Federal Board FBISE, Sindh, KPK)
 * and standard science textbooks (9th class up to PhD), scientific formulas
 * and academic derivations NEVER use raw LaTeX dollar delimiters ($ or $$)
 * or foreign currency symbols.
 * 
 * This module guarantees:
 * 1. ZERO dollar signs ($ or $$) or stray currency symbols in formulas and science explanations.
 * 2. LaTeX math expressions ($F = ma$, $$\Delta v = a \cdot t$$) are converted
 *    to clean, crystal-clear, standard textbook Unicode.
 * 3. Any financial / currency symbols ($, €, £, ¥, ₹, ₩, etc.) are converted to Pakistani Rupees (PKR / Rs.)
 *    or sanitized appropriately.
 * 4. Any stray dollar signs or unwanted currency artifacts are completely eradicated.
 */

/**
 * Converts LaTeX formula snippet into clean, readable textbook Unicode without '$' or currency signs
 */
export function cleanFormulaSnippet(snippet: string): string {
  if (!snippet) return '';

  let f = snippet.trim();

  // Remove LaTeX text wrappers
  f = f.replace(/\\text\{([^}]+)\}/g, '$1');
  f = f.replace(/\\mathrm\{([^}]+)\}/g, '$1');
  f = f.replace(/\\mathbf\{([^}]+)\}/g, '$1');
  f = f.replace(/\\mathit\{([^}]+)\}/g, '$1');
  f = f.replace(/\\boldsymbol\{([^}]+)\}/g, '$1');
  f = f.replace(/\\left\(/g, '(').replace(/\\right\)/g, ')');
  f = f.replace(/\\left\[/g, '[').replace(/\\right\]/g, ']');
  f = f.replace(/\\left\{/g, '{').replace(/\\right\}/g, '}');

  // Fractions: \frac{a}{b} -> (a / b)
  // Handle nested or simple braces
  for (let i = 0; i < 3; i++) {
    f = f.replace(/\\(?:d)?frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1 / $2)');
  }

  // Roots: \sqrt{x} -> √(x), \sqrt[3]{x} -> ∛(x)
  f = f.replace(/\\sqrt\[3\]\{([^}]+)\}/g, '∛($1)');
  f = f.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');

  // Greek Letters commonly used in Physics, Chemistry & Math
  f = f.replace(/\\lambda\b/g, 'λ');
  f = f.replace(/\\Lambda\b/g, 'Λ');
  f = f.replace(/\\theta\b/g, 'θ');
  f = f.replace(/\\Theta\b/g, 'Θ');
  f = f.replace(/\\omega\b/g, 'ω');
  f = f.replace(/\\Omega\b/g, 'Ω');
  f = f.replace(/\\pi\b/g, 'π');
  f = f.replace(/\\Pi\b/g, 'Π');
  f = f.replace(/\\mu\b/g, 'μ');
  f = f.replace(/\\rho\b/g, 'ρ');
  f = f.replace(/\\sigma\b/g, 'σ');
  f = f.replace(/\\Sigma\b/g, 'Σ');
  f = f.replace(/\\tau\b/g, 'τ');
  f = f.replace(/\\alpha\b/g, 'α');
  f = f.replace(/\\beta\b/g, 'β');
  f = f.replace(/\\gamma\b/g, 'γ');
  f = f.replace(/\\Gamma\b/g, 'Γ');
  f = f.replace(/\\Delta\b/g, 'Δ');
  f = f.replace(/\\delta\b/g, 'δ');
  f = f.replace(/\\epsilon\b/g, 'ε');
  f = f.replace(/\\varepsilon\b/g, 'ε');
  f = f.replace(/\\eta\b/g, 'η');
  f = f.replace(/\\phi\b/g, 'φ');
  f = f.replace(/\\Phi\b/g, 'Φ');
  f = f.replace(/\\psi\b/g, 'ψ');
  f = f.replace(/\\zeta\b/g, 'ζ');
  f = f.replace(/\\nu\b/g, 'ν');

  // Mathematical & Physical Operators
  f = f.replace(/\\cdot\b/g, ' · ');
  f = f.replace(/\\times\b/g, ' × ');
  f = f.replace(/\\div\b/g, ' ÷ ');
  f = f.replace(/\\pm\b/g, ' ± ');
  f = f.replace(/\\mp\b/g, ' ∓ ');
  f = f.replace(/\\leq\b/g, ' ≤ ');
  f = f.replace(/\\geq\b/g, ' ≥ ');
  f = f.replace(/\\neq\b/g, ' ≠ ');
  f = f.replace(/\\approx\b/g, ' ≈ ');
  f = f.replace(/\\sim\b/g, ' ~ ');
  f = f.replace(/\\equiv\b/g, ' ≡ ');
  f = f.replace(/\\propto\b/g, ' ∝ ');
  f = f.replace(/\\infty\b/g, '∞');
  f = f.replace(/\\int\b/g, '∫');
  f = f.replace(/\\partial\b/g, '∂');
  f = f.replace(/\\nabla\b/g, '∇');
  f = f.replace(/\\sum\b/g, 'Σ');
  f = f.replace(/\\prod\b/g, 'Π');
  f = f.replace(/\\rightarrow\b|\\to\b/g, ' → ');
  f = f.replace(/\\leftarrow\b/g, ' ← ');
  f = f.replace(/\\leftrightarrow\b/g, ' ↔ ');
  f = f.replace(/\\Rightarrow\b/g, ' ⇒ ');

  // Powers and Superscripts
  f = f.replace(/\^\{2\}/g, '²').replace(/\^2\b/g, '²');
  f = f.replace(/\^\{3\}/g, '³').replace(/\^3\b/g, '³');
  f = f.replace(/\^\{4\}/g, '⁴').replace(/\^4\b/g, '⁴');
  f = f.replace(/\^\{0\}/g, '⁰').replace(/\^0\b/g, '⁰');
  f = f.replace(/\^\{1\}/g, '¹').replace(/\^1\b/g, '¹');
  f = f.replace(/\^\{-1\}/g, '⁻¹').replace(/\^-1\b/g, '⁻¹');
  f = f.replace(/\^\{-2\}/g, '⁻²').replace(/\^-2\b/g, '⁻²');
  f = f.replace(/\^\{-3\}/g, '⁻³').replace(/\^-3\b/g, '⁻³');
  f = f.replace(/\^\{([0-9a-zA-Z+-]+)\}/g, '^($1)');

  // Subscripts: clean braces e.g. v_{f} -> vf or v_f
  f = f.replace(/_\{([0-9a-zA-Z+-]+)\}/g, '_$1');

  // Degree symbol: ^{\circ} or \circ
  f = f.replace(/\^\{\\circ\}|\\circ/g, '°');

  // Remove leftover backslashes on recognized terms
  f = f.replace(/\\([a-zA-Z]+)/g, '$1');

  // Clean extra spaces
  f = f.replace(/[ \t]{2,}/g, ' ');

  // Strictly remove any currency and dollar signs from formulas
  f = f.replace(/[\$€£¥₹₩₽¢¤]/g, '');

  return f;
}

/**
 * Universal text sanitizer:
 * Strips all dollar signs ($ and $$), detects and sanitizes currency symbols,
 * converts formulas to clean Unicode, and converts any financial amounts to PKR / Rs.
 */
export function removeDollarSigns(rawText: string): string {
  if (!rawText) return '';

  let text = String(rawText);

  // 1. Convert block math ($$ ... $$) to clean formula lines
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_match, formula) => {
    const cleaned = cleanFormulaSnippet(formula);
    return `\n${cleaned}\n`;
  });

  // 2. Convert inline math ($ ... $) to clean formula text
  // Only match single-line formulas to prevent greedy cross-paragraph captures
  text = text.replace(/\$([^\$\n]+?)\$/g, (_match, formula) => {
    return cleanFormulaSnippet(formula);
  });

  // 3. Handle currency: if there's $100 or $50 or $ 1,000, convert to PKR (پاکستانی روپے)
  text = text.replace(/\$\s?([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?)/g, 'Rs. $1 (PKR)');
  
  // Also detect other foreign currency symbols and localize cleanly to PKR / Rs.
  text = text.replace(/[€£¥₹₩₽¢]\s?([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?)/g, 'Rs. $1 (PKR)');

  // 4. In case of escaped dollar signs: \$ -> Rs. or removed
  text = text.replace(/\\\$/g, '');

  // 5. Final pass: strictly eliminate ANY remaining stray dollar signs ($) or currency symbols
  text = text.replace(/\$/g, '');
  text = text.replace(/[€£¥₹₩₽¢¤]/g, '');

  return text;
}

/**
 * Deep object/array sanitizer helper
 * Recursively walks through response objects/arrays and sanitizes any string fields
 */
export function sanitizeDeep<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === 'string') {
    return removeDollarSigns(value) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeDeep(item)) as unknown as T;
  }
  if (typeof value === 'object') {
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = sanitizeDeep(v);
    }
    return result as unknown as T;
  }
  return value;
}

