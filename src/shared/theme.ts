import type { Theme } from './appTypes'

export function getInitialTheme(): Theme {
  const savedTheme = window.localStorage.getItem('dia2dic-theme')

  if (savedTheme === 'dark' || savedTheme === 'light') {
    return savedTheme
  }

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}
