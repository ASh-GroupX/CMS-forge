// Shared reader for the API's error envelope. The backend serializes validation
// failures as { error: { code, message, correlationId, fieldErrors: [{ field, ... }] } }
// (apps/api/src/core/http-kernel.ts). The board clients previously parsed a
// non-existent top-level `details`, so a 400's field list was always empty and the
// task board's status-note dialog never opened on a WAITING/DONE move. Centralise
// the correct shape here so every board client surfaces server field errors.

type FieldError = { field?: unknown };
type ErrorEnvelope = { error?: { fieldErrors?: FieldError[] } };

// Field names from a 400 error envelope, or [] on any non-matching/malformed body.
export async function fieldErrorsFrom(response: Response): Promise<string[]> {
  try {
    const body = (await response.json()) as ErrorEnvelope;
    const fieldErrors = body.error?.fieldErrors;
    if (!Array.isArray(fieldErrors)) return [];
    return fieldErrors
      .map((detail) => detail?.field)
      .filter((field): field is string => typeof field === 'string');
  } catch {
    return [];
  }
}
