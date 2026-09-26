import { Request, Response, NextFunction } from 'express';
import { removeDollarSigns, sanitizeDeep } from '../utils/mathSanitizer.ts';

/**
 * Science & Student Learning Data Sanitization Middleware
 * 
 * Automatically detects and strips/sanitizes currency symbols (e.g. '$', '€', '£', etc.)
 * and raw LaTeX delimiters from:
 * 1. Incoming request bodies (req.body)
 * 2. Incoming query parameters (req.query)
 * 3. Outgoing responses (res.json interceptor)
 * 
 * Ensures all generated content, retrieved formulas, and academic notes are 100%
 * free of currency signs and dollar delimiters.
 */
export const scienceSanitizerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 1. Sanitize incoming request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeDeep(req.body);
  }

  // 2. Sanitize incoming request query
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeDeep(req.query);
  }

  // 3. Intercept res.json to automatically sanitize outgoing formulas and generated content
  const originalJson = res.json.bind(res);

  res.json = function (body: any): Response {
    if (body !== null && body !== undefined) {
      const sanitizedBody = sanitizeDeep(body);
      return originalJson(sanitizedBody);
    }
    return originalJson(body);
  };

  next();
};

/**
 * Filter helper for client-side or programmatic usage:
 * Takes any formula or text, verifies if currency/dollar symbols exist,
 * and returns clean sanitized output.
 */
export function sanitizeScienceFormula(rawFormula: string): string {
  if (!rawFormula) return '';
  return removeDollarSigns(rawFormula);
}

/**
 * Checks if a string contains prohibited currency or dollar symbols
 */
export function containsProhibitedCurrencySymbols(text: string): boolean {
  if (!text) return false;
  return /[\$€£¥₹₩₽¢¤]/.test(text);
}
