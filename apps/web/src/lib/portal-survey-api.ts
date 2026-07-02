export type PortalSurveyResult = { ok: true; survey: { id: string; rating: number; submittedAt: string } } | { ok: false; code: string; message: string };
export type PortalSurveyTerminalState = 'used' | 'expired' | 'error';

export async function submitPortalSurvey({ comment, fetchImpl = fetch, key, rating }: { comment?: string | null; fetchImpl?: typeof fetch; key: string; rating: number }): Promise<PortalSurveyResult> {
  try {
    const response = await fetchImpl('/api/portal/surveys', {
      body: JSON.stringify({ surveyToken: key, rating, comment: comment?.trim() || null }),
      headers: { Accept: 'application/json', 'content-type': 'application/json' },
      method: 'POST',
    });
    const payload = await response.json().catch(() => null) as { survey?: { id?: string; rating?: number; submittedAt?: string }; error?: { code?: string; message?: string } } | null;
    if (!response.ok || !payload?.survey || typeof payload.survey.id !== 'string' || typeof payload.survey.rating !== 'number' || typeof payload.survey.submittedAt !== 'string') {
      return { ok: false, code: payload?.error?.code ?? 'NETWORK_ERROR', message: payload?.error?.message ?? 'Survey could not be submitted.' };
    }
    return { ok: true, survey: { id: payload.survey.id, rating: payload.survey.rating, submittedAt: payload.survey.submittedAt } };
  } catch {
    return { ok: false, code: 'NETWORK_ERROR', message: 'Survey could not be submitted.' };
  }
}

export function terminalSurveyState(code: string): PortalSurveyTerminalState {
  if (code === 'SURVEY_TOKEN_USED') return 'used';
  if (code === 'SURVEY_TOKEN_EXPIRED') return 'expired';
  return 'error';
}
