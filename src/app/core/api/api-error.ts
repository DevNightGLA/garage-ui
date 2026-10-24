import { HttpErrorResponse } from '@angular/common/http';

/** Corps d'erreur de l'API (docs/api-contract.md, « Format des erreurs »). */
export interface ApiError {
  status: number;
  code: string;
  message: string;
  fieldErrors: Record<string, string>;
  details: string[];
}

export const CODE_RESEAU = 'RESEAU';
export const CODE_INCONNU = 'ERREUR_INCONNUE';

export function toApiError(err: unknown): ApiError {
  if (!(err instanceof HttpErrorResponse)) {
    return { status: 0, code: CODE_INCONNU, message: '', fieldErrors: {}, details: [] };
  }
  const body: Record<string, unknown> =
    typeof err.error === 'object' && err.error !== null ? (err.error as Record<string, unknown>) : {};
  const fieldErrors: Record<string, string> = {};
  if (typeof body['fieldErrors'] === 'object' && body['fieldErrors'] !== null) {
    for (const [champ, message] of Object.entries(body['fieldErrors'])) {
      if (typeof message === 'string') {
        fieldErrors[champ] = message;
      }
    }
  }
  const details = Array.isArray(body['details'])
    ? body['details'].filter((d): d is string => typeof d === 'string')
    : [];
  return {
    status: err.status,
    code: typeof body['code'] === 'string' ? body['code'] : err.status === 0 ? CODE_RESEAU : CODE_INCONNU,
    message: typeof body['message'] === 'string' ? body['message'] : '',
    fieldErrors,
    details,
  };
}
