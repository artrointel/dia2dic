import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppHeader } from './components/AppHeader'
import { routePages } from './navigation/navigation'
import { CategoryPage } from './pages/CategoryPage'
import { CraftingPage } from './pages/CraftingPage'
import { EquipmentUpgradesPage } from './pages/EquipmentUpgradesPage'
import { HomePage } from './pages/HomePage'
import { LevelingPage } from './pages/LevelingPage'
import { NormalItemsPage } from './pages/NormalItemsPage'
import { RunesPage } from './pages/RunesPage'
import { RunewordsPage } from './pages/RunewordsPage'
import { SetItemsPage } from './pages/SetItemsPage'
import { SocketRecipesPage } from './pages/SocketRecipesPage'
import { getInitialTheme } from './shared/theme'
import type { Theme } from './shared/appTypes'
import './App.css'

function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    window.localStorage.setItem('dia2dic-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
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
          <Route path="/items/normal" element={<NormalItemsPage />} />
          <Route path="/items/sets" element={<SetItemsPage />} />
          <Route path="/items/runes" element={<RunesPage />} />
          <Route path="/leveling" element={<LevelingPage />} />

          {routePages.map((page) => (
            <Route path={page.path} element={<CategoryPage {...page} />} key={page.path} />
          ))}
        </Routes>
      </main>
    </div>
  )
}

export default App
