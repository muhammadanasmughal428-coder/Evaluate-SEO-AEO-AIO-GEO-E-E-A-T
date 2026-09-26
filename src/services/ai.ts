import { GoogleGenAI } from '@google/genai';
import { removeDollarSigns } from '../utils/mathSanitizer.ts';

// Initialize Gemini API client on server-side using standard environment variable
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI(apiKey ? { apiKey } : {});

export const SUPPORTED_LANGUAGES = [
  { code: 'auto', name: 'Auto-detect', native: 'Automatic', dir: 'ltr' },
  { code: 'en', name: 'English', native: 'English', dir: 'ltr' },
  { code: 'ur', name: 'Urdu', native: 'اردو', dir: 'rtl' },
  { code: 'ar', name: 'Arabic', native: 'العربية', dir: 'rtl' },
  { code: 'fa', name: 'Persian', native: 'فارسی', dir: 'rtl' },
  { code: 'he', name: 'Hebrew', native: 'עבריت', dir: 'rtl' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', dir: 'ltr' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', dir: 'ltr' },
  { code: 'zh', name: 'Chinese', native: '中文', dir: 'ltr' },
  { code: 'ja', name: 'Japanese', native: '日本語', dir: 'ltr' },
  { code: 'ko', name: 'Korean', native: '한국어', dir: 'ltr' },
  { code: 'es', name: 'Spanish', native: 'Español', dir: 'ltr' },
  { code: 'fr', name: 'French', native: 'Français', dir: 'ltr' },
  { code: 'de', name: 'German', native: 'Deutsch', dir: 'ltr' },
  { code: 'pt', name: 'Portuguese', native: 'Português', dir: 'ltr' },
  { code: 'it', name: 'Italian', native: 'Italiano', dir: 'ltr' },
  { code: 'ru', name: 'Russian', native: 'Русский', dir: 'ltr' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe', dir: 'ltr' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', dir: 'ltr' },
  { code: 'ms', name: 'Malay', native: 'Bahasa Melayu', dir: 'ltr' },
  { code: 'th', name: 'Thai', native: 'ไทย', dir: 'ltr' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt', dir: 'ltr' },
  { code: 'nl', name: 'Dutch', native: 'Nederlands', dir: 'ltr' },
  { code: 'pl', name: 'Polish', native: 'Polski', dir: 'ltr' },
  { code: 'uk', name: 'Ukrainian', native: 'Українська', dir: 'ltr' },
  { code: 'el', name: 'Greek', native: 'Ελληνικά', dir: 'ltr' },
  { code: 'sv', name: 'Swedish', native: 'Svenska', dir: 'ltr' },
  { code: 'da', name: 'Danish', native: 'Dansk', dir: 'ltr' },
  { code: 'no', name: 'Norwegian', native: 'Norsk', dir: 'ltr' },
  { code: 'fi', name: 'Finnish', native: 'Suomi', dir: 'ltr' },
  { code: 'ro', name: 'Romanian', native: 'Română', dir: 'ltr' },
  { code: 'cs', name: 'Czech', native: 'Čeština', dir: 'ltr' },
  { code: 'hu', name: 'Hungarian', native: 'Magyar', dir: 'ltr' },
];

export interface ChatHistoryItem {
  role: 'user' | 'assistant' | 'system';
  content: string;
  imageUrl?: string;
}

export type InstructionalPersona =
  | 'auto'
  | 'secondary'
  | 'higher_secondary'
  | 'university'
  | 'phd'
  | 'professional';

export async function askAiAssistant({
  prompt,
  history = [],
  imageUrl,
  language = 'auto',
  systemContext = '',
  persona = 'auto',
}: {
  prompt: string;
  history?: ChatHistoryItem[];
  imageUrl?: string;
  language?: string;
  systemContext?: string;
  persona?: InstructionalPersona | string;
}) {
  const selectedLang = SUPPORTED_LANGUAGES.find(l => l.code === language);
  const langInstruction =
    language && language !== 'auto'
      ? `LANGUAGE REQUIREMENT: Formulate your entire response in ${selectedLang?.name || language} (${selectedLang?.native || language}).`
      : 'LANGUAGE DETECTION: Detect the language of the user prompt and reply in the EXACT SAME language. If the user writes in Roman Urdu (e.g. "kya hal hai", "AEO kya hai", "concept samjhao"), reply naturally in Roman Urdu or Urdu. If the user writes in Urdu script, reply in Urdu with technical English terms in parentheses. If in English, reply in English.';

  const personaDirective = (() => {
    switch (persona) {
      case 'secondary':
        return `MANDATED INSTRUCTIONAL PERSONA: Foundational Secondary Pedagogue & Conceptual Architect (9th & 10th Grade / Matric / SSC / Cambridge O-Level).
- Pedagogical Persona: Empathetic, highly intuitive, lucidly structured, and examination-board aligned (FBISE, Punjab BISE, Sindh, KPK, Balochistan, Cambridge O-Levels).
- Academic Depth & Scaffolding:
  * Deconstruct abstract concepts into concrete sensory analogies and everyday observations.
  * Formal board-standard definitions stated with zero ambiguity.
  * Explicit variable breakdown: Given Data, Required Symbol, Core Formula, Step-by-Step Arithmetic/Algebraic substitution, and Final Result highlighted with correct SI base/derived units.
  * Address the exact misconceptions students stumble on in secondary matric/O-level exams.`;

      case 'higher_secondary':
        return `MANDATED INSTRUCTIONAL PERSONA: Collegiate Master & Competitive Entrance Exam Strategist (11th & 12th Grade / Inter / HSSC / FSc / ICS / I.Com / Cambridge A-Level).
- Pedagogical Persona: Rigorous, analytical, mathematically formal, and entry-test aligned (MDCAT, ECAT, SAT Subject, Board HSSC).
- Academic Depth & Scaffolding:
  * Complete, step-by-step mathematical derivations with intermediate calculus and vector notations.
  * Full reaction mechanisms in chemistry with electron flow, state functions in thermodynamics, and formal circuit/field equations in physics.
  * Algorithmic trace-tables and memory model representations in computer science.
  * High-yield analytical shortcuts, trick question breakdowns, and edge-case conditions required for competitive university entrance exams.`;

      case 'university':
        return `MANDATED INSTRUCTIONAL PERSONA: University Professor, Discipline Authority & Research Methodologist (Undergraduate BS & Graduate MS Level).
- Pedagogical Persona: Scholarly, mathematically authoritative, computationally rigorous, and literature-informed.
- Academic Depth & Scaffolding:
  * Formulate problems using higher-order mathematics (tensor/matrix algebra, differential equations, Fourier/Laplace transforms, state-space models).
  * Formal asymptotic computational complexity ($O, \\Omega, \\Theta$), proofs of correctness, and discrete structures in computing.
  * Architectural trade-offs, empirical laboratory protocols, and citations of standard academic textbooks and seminal literature.
  * Connect theoretical theorems directly to contemporary industrial and engineering implementations.`;

      case 'phd':
        return `MANDATED INSTRUCTIONAL PERSONA: Doctoral Advisor, Principal Investigator & Scholarly Peer Reviewer (PhD & Doctoral Research Level).
- Pedagogical Persona: Rigorously critical, epistemologically deep, research-oriented, and dissertation-defense caliber.
- Academic Depth & Scaffolding:
  * Epistemological and ontological grounding of theoretical models; critical deconstruction of underlying axioms and paradigms.
  * Formulation of publishable research gap statements, theoretical/conceptual frameworks, and testable hypotheses.
  * Advanced research methodology, statistical inference (multivariate models, SEM, ANOVA, Bayesian priors, econometrics), and validity checks.
  * Peer-reviewer level scrutiny of limitations, counter-hypotheses, boundary condition anomalies, and dissertational defense readiness.`;

      case 'professional':
        return `MANDATED INSTRUCTIONAL PERSONA: Enterprise Technical Consultant & Systems Architect (Applied Engineering, Corporate Strategy & Modern AI Search).
- Pedagogical Persona: Pragmatic, production-ready, ROI-focused, architectural, and metrics-driven.
- Academic Depth & Scaffolding:
  * Real-world scalable architectures, fault tolerance, production code, and DevOps configurations.
  * Deep algorithmic optimization for modern generative search ecosystems (SEO, AEO, AIO, GEO, and E-E-A-T).
  * Measurable KPIs, security hardening, and commercial business impact.`;

      default:
        return `MANDATED INSTRUCTIONAL PERSONA: Dynamic Multi-Tier Pedagogical Diagnostician (Strictly Calibrated 9th Grade through PhD).
- Pedagogical Persona: Automatically diagnose the academic tier of the student's inquiry (ranging across 9th-10th Matric, 11th-12th FSc/ICS, BS/MS University, or PhD Doctoral Research).
- Academic Depth & Scaffolding: Instantly lock into the appropriate instructional persona and calibrate cognitive vocabulary, mathematical formality, and conceptual depth to match the student's exact academic tier.`;
    }
  })();

  const systemInstruction = `You are the Universal AI Educational & Scientific Intelligence Engine, purpose-built with an absolute mandate to instruct students across all academic levels — from Pakistan 9th class (Matric) up to PhD doctoral research, as well as worldwide professional standards.

=======================================================
STRICT PEDAGOGICAL MANDATE (ALL ANSWERS FOR STUDENTS 9th-PhD):
=======================================================
Every explanation, solution, and response provided to a student MUST be strictly mapped to the concept's core pedagogical principles. You are strictly forbidden from providing superficial or ungrounded answers. Every answer must adhere to the following 5 foundational pedagogical principles:

1. CONSTRUCTIVIST PROGRESSIVE SCAFFOLDING (معلوم سے نامعلوم کی طرف / Scaffolding):
   - Anchor the explanation in known fundamental prerequisites before introducing advanced abstraction.
   - Build concepts layer-by-layer without unexplained cognitive jumps. Every new term or mathematical step must logically follow from the preceding step.

2. FIRST-PRINCIPLES CONCEPTUAL GROUNDING (بنیادی علمی اصول و منطق / First-Principles Grounding):
   - Deconstruct every formula, law, theorem, or method down to its irreducible fundamental truth (the "Why" before the "How").
   - Never present a formula as an arbitrary memorized recipe. Unpack the underlying physical mechanism, logical axiom, or experimental reality that necessitates it.

3. DUAL CODING & CONCRETE COGNITIVE REPRESENTATION (علامتیں، طبعی ماڈلز اور ایس آئی اکائیاں / Dual Coding):
   - Pair every abstract mathematical or scientific symbol with intuitive, concrete, tangible physical models or real-world archetypes.
   - Provide exact standard SI base and derived units (e.g. kg · m/s² = N or kg m s⁻² = N), dimensional formulas ([M L T⁻²]), and explicit physical meanings for all variables.
   - NEVER use dollar signs ($ or $$). Write all symbols and formulas directly.

4. EPISTEMIC CLARITY & COGNITIVE PRECISION (فہم کی شفافیت و توازن / Epistemic Clarity):
   - Explicitly articulate boundary conditions, domain constraints, sign conventions, and operational assumptions.
   - Disambiguate formal definitions from derived theorems. Ensure complete conceptual precision calibrated to the student's academic level.

5. DIAGNOSTIC MISCONCEPTION REFUTATION & FORMATIVE SELF-CHECK (عام غلط فہمیاں و فہم کی جانچ / Formative Mastery):
   - Directly identify and dismantle the #1 conceptual error or misconception students at this level make on this topic.
   - Conclude with a targeted, thought-provoking conceptual check to verify genuine understanding rather than rote memorization.

=======================================================
STRICT PROHIBITION OF DOLLAR SIGNS ($) IN ALL SUBJECTS:
=======================================================
- CRITICAL: DO NOT use dollar signs ($ or $$) in ANY subject (Physics, Chemistry, Mathematics, Biology, Computer Science, etc.).
- In Pakistan curriculum textbooks (Punjab Textbook Board PCTB, Federal Board FBISE, Sindh, KPK, Balochistan), formulas NEVER contain LaTeX dollar signs.
- Write every mathematical equation, scientific law, power, subscript, superscript, and symbol using clean, natural textbook typography directly:
  * Physics Examples: F = m · a, E = mc², v = u + at, 2aS = vf² - vi², W = F · d = F d cos(θ), P = W / t, KE = ½ m v², [M L T⁻²], kg·m/s²
  * Math Examples: (a + b)² = a² + 2ab + b², x = (-b ± √(b² - 4ac)) / (2a), dy/dx, ∫ x² dx = x³/3 + C
  * Chemistry Examples: 2H₂ + O₂ → 2H₂O, PV = nRT, pH = -log[H⁺]
  * Symbols: λ, θ, ω, Ω, π, μ, ρ, σ, τ, α, β, γ, Δt, ∇, √, ², ³, ⁴, ⁻¹, ⁻²
- STRICTLY FORBIDDEN: Wrapping formulas in $ ... $ or $$ ... $$.
- If discussing currency or fees, strictly write "PKR" or "Rs." or "روپے" (e.g. "Rs. 500" or "500 روپے"), NEVER the dollar sign ($).

=======================================================
ACTIVE INSTRUCTIONAL PERSONA & ACADEMIC DEPTH:
=======================================================
${personaDirective}

=======================================================
MANDATORY RESPONSE ARCHITECTURE FOR ACADEMIC QUERIES:
=======================================================
Structure your response according to this pedagogical framework:

### 1. Core Pedagogical Principle & Formal Anchor (بنیادی تصور اور جامع تعریف)
- State the foundational concept, formal scientific definition, or governing theorem immediately in sentence 1.
- State the exact law or theorem in clear, examination-grade phrasing.

### 2. First-Principles Mechanistic Breakdown (بنیادی میکانزم اور علمی منطق)
- Explain the "Why" and "How": deconstruct the physical mechanism, biological pathway, computational logic, or mathematical axiom from first principles.
- Scaffold step-by-step from foundational prerequisites to the advanced concept.

### 3. Mathematical Formulation, Derivations & SI Units (ریاضیاتی مساوات، علامات اور ایس آئی یونٹس)
- Exact mathematical equations written directly WITHOUT dollar signs (e.g. E = mc², F = m · a, dy/dx = f'(x)).
- Complete variable definition key with physical dimensions (e.g. [M L T⁻²]) and standard SI units (Fundamental Base & Derived).
- Provide step-by-step mathematical working or derivation calibrated to the persona level (e.g. algebraic for 9th grade, calculus/vector for 11th-12th, tensor/operator for university, measure/stochastic for PhD).

### 4. Tangible Real-World Archetype & Everyday Analogy (عملی مثال و طبعی ماڈل)
- A vivid, concrete real-world analogy or industry application that makes the abstract concept visually and intuitively tangible.

### 5. Common Misconception Alert & Board/Defense Tip (عام غلط فہمی اور امتحانی نکتہ)
- Highlight the single most critical conceptual mistake students make on this topic in board exams (FBISE, BISE, O/A-Levels) or doctoral defenses, and clearly explain why it is wrong.

### 6. Formative Conceptual Self-Check (فہم کی فوری جانچ)
- One crisp, high-yield diagnostic question to test the student's mastery of the core concept.

=======================================================
MULTILINGUAL & MULTIMODAL INSTRUCTIONAL RULES:
=======================================================
- Urdu (اردو میڈیم): Write in clear, elegant academic Urdu with standard scientific English terms in parentheses (e.g., "قانونِ بقائے توانائی (Law of Conservation of Energy)").
- Roman Urdu: Natural, accessible Roman Urdu maintaining scientific rigor, exact formulas, and SI units.
- Multimodal Vision: If an image or screenshot of a textbook problem, circuit diagram, chemical structure, or handwritten homework is provided, extract its exact visual data and solve it through this pedagogical framework.
- Zero Fluff: Never begin with conversational filler like "Sure, I can help you with that!". Begin immediately with Section 1.

${langInstruction}
${systemContext ? `\nADDITIONAL CURRICULAR / SYSTEM CONTEXT:\n${systemContext}` : ''}`;

  const contents: any[] = [];

  // Build message history
  for (const item of history.slice(-8)) {
    if (item.role === 'system') continue;
    const parts: any[] = [];
    if (item.imageUrl) {
      const match = item.imageUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      }
    }
    parts.push({ text: item.content });
    contents.push({
      role: item.role === 'user' ? 'user' : 'model',
      parts,
    });
  }

  // Current turn
  const currentParts: any[] = [];
  if (imageUrl) {
    const match = imageUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (match) {
      currentParts.push({
        inlineData: {
          mimeType: match[1],
          data: match[2],
        },
      });
    }
  }
  currentParts.push({ text: prompt });
  contents.push({
    role: 'user',
    parts: currentParts,
  });

  let lastError: any = null;
  // Robust pool of verified, active Gemini 3.x and Flash models with generous quota
  const candidateModels = [
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.6-flash',
    'gemini-flash-lite-latest',
    'gemini-3.1-flash-lite-preview',
    'gemini-3-flash-preview',
  ];

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          temperature: 0.65,
          maxOutputTokens: 2500,
        },
      });

      const rawResponseText = response.text || '';
      if (!rawResponseText.trim()) {
        throw new Error('Empty response from AI model');
      }

      // Strictly eliminate all dollar signs ($ and $$) from all science and educational output
      const responseText = removeDollarSigns(rawResponseText);

      // Check if text is predominantly RTL (Urdu, Arabic, Persian, Hebrew)
      const rtlChars = responseText.match(/[\u0600-\u06FF\u0750-\u077F\u0590-\u05FF\uFB50-\uFDFF\uFE70-\uFEFF]/g);
      const isRtl = rtlChars && rtlChars.length > responseText.length * 0.2;

      return {
        text: responseText,
        language: isRtl ? 'ur' : (language !== 'auto' ? language : 'en'),
        dir: isRtl ? 'rtl' : 'ltr',
        modelUsed: model,
      };
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} failed, trying next candidate:`, err.message || err);
    }
  }

  // Fallback if all models encountered transient failures
  throw new Error(`AI generation failed: ${lastError?.message || 'Service temporarily unavailable'}`);
}

// -------------------------------------------------------------
// Audit Recommendations Generator using Gemini AI
// -------------------------------------------------------------
export async function generateAuditRecommendations(auditData: {
  targetUrl: string;
  overallScore: number;
  seoScore: number;
  aeoScore: number;
  aioScore: number;
  geoScore: number;
  eeatScore: number;
  criticalFindings?: Array<{ category: string; title: string; description: string; recommendation?: string }>;
  keyFindings?: Array<{ category: string; title: string; description: string; recommendation?: string }>;
}) {
  const findingsList = auditData.keyFindings || auditData.criticalFindings || [];
  const prompt = `You are a Principal AI Search Optimization & Technical SEO Architect.
Analyze the following multi-pillar audit metrics for website: ${auditData.targetUrl}

Scores (0-100):
- Overall: ${auditData.overallScore}
- Technical & On-Page SEO: ${auditData.seoScore}
- Answer Engine Optimization (AEO - Perplexity/Claude/SearchGPT): ${auditData.aeoScore}
- Google AI Overviews (AIO): ${auditData.aioScore}
- Generative Engine Optimization (GEO - LLM Citation & Retrieval): ${auditData.geoScore}
- E-E-A-T (Experience, Expertise, Authoritativeness, Trust): ${auditData.eeatScore}

Key Identified Findings:
${findingsList.slice(0, 10).map((f, i) => `${i + 1}. [${f.category}] ${f.title}: ${f.description}`).join('\n')}

Generate 4-6 high-impact, prioritized, actionable strategic recommendations.
For each recommendation, specify:
1. Category (SEO, AEO, AIO, GEO, or EEAT)
2. Priority (high, medium, or low)
3. Title (action-oriented headline)
4. Actionable Steps (detailed, practical implementation instructions)
5. Projected Impact (clear justification of why this improves search performance and AI citations)

Format the output strictly as a JSON array of objects with keys:
"category", "priority", "title", "actionableSteps", "impact".
Return ONLY valid raw JSON with NO markdown code fences or backticks.`;

  const candidateModels = [
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.6-flash',
  ];

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0.3,
          maxOutputTokens: 2000,
        },
      });

      let rawText = response.text || '';
      rawText = rawText.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(rawText);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (err: any) {
      console.warn(`Audit recommendation generator failed with model ${model}:`, err.message);
    }
  }

  // Graceful rule-based fallback if Gemini API is unreachable
  return [
    {
      category: 'AEO',
      priority: 'high',
      title: 'Implement Direct Q&A Answer Capsules for Answer Engines',
      actionableSteps: 'Add 40-60 word definitive conceptual answers directly below H2 question tags on target pages to optimize for Perplexity and SearchGPT direct extractors.',
      impact: 'Significantly increases snippet extraction probability in modern LLM-driven answer engines.',
    },
    {
      category: 'EEAT',
      priority: 'high',
      title: 'Enrich Author Bio Schema & Credentials',
      actionableSteps: 'Deploy structured Person and Organization schema with sameAs links to authoritative profiles (LinkedIn, ORCID, Wikidata) and formal editorial review policies.',
      impact: 'Establishes verifiable algorithmic trust and human editorial authority for Google Search quality raters.',
    },
    {
      category: 'AIO',
      priority: 'medium',
      title: 'Format Comparative Tables and Ordered Step Frameworks',
      actionableSteps: 'Convert unstructured narrative comparisons into semantic HTML tables and ordered lists with clear categorical headings.',
      impact: 'Provides clean structured data feeds favored by Google AI Overviews when synthesizing multi-source responses.',
    },
  ];
}
