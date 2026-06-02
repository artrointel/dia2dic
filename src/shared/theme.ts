import type { Theme } from './appTypes'

const THEME_STORAGE_KEY = 'dia2dic-theme'

export function getInitialTheme(): Theme {
  return getSavedTheme() ?? getSystemTheme()
}

export function getSavedTheme(): Theme | null {
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)

  if (savedTheme === 'dark' || savedTheme === 'light') {
    return savedTheme
  }

  return null
}

export function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function saveTheme(theme: Theme) {
  window.localStorage.setItem(THEME_STORAGE_KEY, theme)
}
