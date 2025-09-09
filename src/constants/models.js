export const ALLOWED_MODELS = [
  'gpt-5',
  'gpt-5-chat-latest',
  'gpt-5-mini',
  'gpt-5-nano',
  'gpt-4o',
  'gpt-4o-mini',
  'o3-deep-research-2025-06-26',
  'o4-mini-deep-research-2025-06-26'
];

export function normalizeModel(m) {
  const x = String(m || '').trim().toLowerCase();
  const alias = {
    'gpt5': 'gpt-5',
    'gpt-5.0': 'gpt-5',
    'gpt-5-turbo': 'gpt-5',
    'gpt-4-turbo': 'gpt-4o',
    'gpt-3.5-turbo': 'gpt-4o-mini',
    'o3-research': 'o3-deep-research-2025-06-26',
    'o4-research': 'o4-mini-deep-research-2025-06-26',
    'o3-deep-research': 'o3-deep-research-2025-06-26',
    'o4-mini-deep-research': 'o4-mini-deep-research-2025-06-26'
  };
  return alias[x] || m;
}
