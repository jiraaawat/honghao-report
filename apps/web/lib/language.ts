export const LANGUAGE_STYLES: Record<string, string> = {
  EN: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
  JP: 'border-red-500/50 bg-red-500/10 text-red-400',
  FR: 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400',
  CN: 'border-orange-500/50 bg-orange-500/10 text-orange-400',
  TH: 'border-green-500/50 bg-green-500/10 text-green-400',
  KR: 'border-purple-500/50 bg-purple-500/10 text-purple-400',
}

export function getLanguageStyle(language?: string | null): string {
  return LANGUAGE_STYLES[language || 'EN'] || LANGUAGE_STYLES.EN
}
