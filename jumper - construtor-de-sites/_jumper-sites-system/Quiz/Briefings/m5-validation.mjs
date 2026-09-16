// Shared server intake contract. Approval belongs to the internal construction flow.
export function validateM5Intake(payload) {
  if (payload?.project_scope?.model !== 'M5') return [];
  const errors = [];
  const scope = payload.project_scope;
  const r = scope.reformulation;
  if (!r || typeof r !== 'object' || Array.isArray(r)) return ['Informe os dados da reformulação M5.'];
  try {
    const url = new URL(r.existing_site_url);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw Error();
  } catch { errors.push('Informe a URL http/https do site atual, sem credenciais.'); }
  for (const field of ['reason']) {
    if (typeof r[field] !== 'string' || !r[field].trim()) errors.push("Conte o que gostaria de melhorar no site atual.");
  }
  if (scope.model_confirmation !== true) errors.push('Confirme o modelo M5.');
  return errors;
}
