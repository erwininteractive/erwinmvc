import type { ZodError, ZodSchema } from "zod";

export type ValidationStrategyType = "redirect" | "json";

/**
 * Zod validation middleware
 * @param schema - Zod schema to validate against
 * @param strategy - 'redirect' (web) or 'json' (API)
 */
export function validate<T>(
  schema: ZodSchema<T>,
  strategy: ValidationStrategyType = "redirect"
) {
  return async (req: any, res: any, next: any) => {
    const result = await schema.safeParseAsync(req.body);

    if (!result.success) {
      const errors = getFieldErrors(result.error);
      const oldInput = req.body;

      if (strategy === "json") {
        return res.status(422).json({ errors, oldInput });
      }

      // Redirect with errors and old input for web forms
      req.flash("errors", errors);
      req.flash("oldInput", oldInput);
      
      // Get referrer URL or use default
      const redirectUrl = req.headers.referer || req.headers.referrer || "/";
      return res.redirect(redirectUrl);
    }

    req.validatedBody = result.data;
    next();
  };
}

/**
 * Extract field errors from Zod ZodError
 */
export function getFieldErrors(error: ZodError): Array<{ field: string; message: string }> {
  return (error as any).errors.map((err: any) => ({
    field: err.path.join("."),
    message: err.message,
  }));
}

/**
 * Preserves form input when validation fails
 */
export function getOldInput(req: any): any {
  return req.flash("oldInput")[0] || {};
}

/**
 * Get validation errors for display
 */
export function getErrors(req: any): Array<{ field: string; message: string }> {
  return req.flash("errors") || [];
}

/**
 * Check if a field has errors
 */
export function hasFieldError(field: string, errors: any): boolean {
  return errors.some((err: any) => err.field === field);
}

/**
 * Get error message for a specific field
 */
export function getFieldError(field: string, errors: any): string | undefined {
  const error = errors.find((err: any) => err.field === field);
  return error?.message;
}
