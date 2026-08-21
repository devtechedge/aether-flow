const TOKEN = /\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g;

export function interpolateTemplate(
  tpl: string,
  vars: Record<string, unknown>
): string {
  if (!tpl) return '';
  return tpl.replace(TOKEN, (_match, key: string) => {
    const value = vars[key];
    if (value === undefined || value === null) return '';
    return String(value);
  });
}
