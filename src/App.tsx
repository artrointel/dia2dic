import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppHeader } from './components/AppHeader'
import { ScrollToTopButton } from './components/ScrollToTopButton'
import { routePages } from './navigation/navigation'
import { CategoryPage } from './pages/CategoryPage'
import { CraftingPage } from './pages/CraftingPage'
import { EquipmentUpgradesPage } from './pages/EquipmentUpgradesPage'
import { FrameBreakpointsPage } from './pages/FrameBreakpointsPage'
import { HomePage } from './pages/HomePage'
import { LevelingPage } from './pages/LevelingPage'
import { MiscRecipesPage } from './pages/MiscRecipesPage'
import { NormalItemsPage } from './pages/NormalItemsPage'
import { RunesPage } from './pages/RunesPage'
import { RunewordsPage } from './pages/RunewordsPage'
import { SetItemsPage } from './pages/SetItemsPage'
import { SocketRecipesPage } from './pages/SocketRecipesPage'
import { UniqueItemsPage } from './pages/UniqueItemsPage'
import { getInitialTheme, getSavedTheme, getSystemTheme, saveTheme } from './shared/theme'
import type { Theme } from './shared/appTypes'
import './styles/tableCrosshair.css'
import './App.css'

function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const [hasSavedTheme, setHasSavedTheme] = useState(() => getSavedTheme() !== null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
  }, [theme])

  useEffect(() => {
    if (hasSavedTheme) {
      return undefined
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)')
    const updateSystemTheme = () => setTheme(getSystemTheme())

    mediaQuery.addEventListener('change', updateSystemTheme)

    return () => mediaQuery.removeEventListener('change', updateSystemTheme)
  }, [hasSavedTheme])

  const toggleTheme = () => {
    setTheme((current) => {
      const nextTheme = current === 'dark' ? 'light' : 'dark'

      saveTheme(nextTheme)

      return nextTheme
    })
    setHasSavedTheme(true)
  }

  return (
    <div className="app-shell">
      <AppHeader theme={theme} onToggleTheme={toggleTheme} />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cube/runewords" element={<RunewordsPage />} />
          <Route path="/cube/equipment-upgrades" element={<EquipmentUpgradesPage />} />
          <Route path="/cube/socket-recipes" element={<SocketRecipesPage />} />
          <Route path="/cube/crafting" element={<CraftingPage />} />
          <Route path="/cube/recipes" element={<MiscRecipesPage />} />
          <Route path="/items/normal" element={<NormalItemsPage />} />
          <Route path="/items/sets" element={<SetItemsPage />} />
          <Route path="/items/uniques" element={<UniqueItemsPage />} />
          <Route path="/items/runes" element={<RunesPage />} />
          <Route path="/leveling" element={<LevelingPage />} />
          <Route path="/character/leveling" element={<LevelingPage />} />
          <Route path="/character/breakpoints" element={<FrameBreakpointsPage />} />

          {routePages.map((page) => (
            <Route path={page.path} element={<CategoryPage {...page} />} key={page.path} />
          ))}
        </Routes>
      </main>
      <ScrollToTopButton />
    </div>
  )
}

export default App
