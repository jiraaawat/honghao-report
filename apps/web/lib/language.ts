export const LANGUAGE_STYLES: Record<string, string> = {
  EN: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
  JP: 'border-red-500/50 bg-red-500/10 text-red-400',
  FR: 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400',
  CN: 'border-orange-700/50 bg-orange-700/10 text-orange-600',
  TH: 'border-lime-600/50 bg-lime-600/10 text-lime-500',
  KR: 'border-purple-500/50 bg-purple-500/10 text-purple-400',
}

export function getLanguageStyle(language?: string | null): string {
  return LANGUAGE_STYLES[language || 'EN'] || LANGUAGE_STYLES.EN
}
