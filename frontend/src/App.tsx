import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store'
import { useSocket } from './hooks/useSocket'
import { useOfflineCache } from './hooks/useOfflineCache'
import BottomNav from './components/BottomNav'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Calendar from './pages/Calendar'
import MealPlan from './pages/MealPlan'
import GroceryList from './pages/GroceryList'
import Recipes from './pages/Recipes'

function AppShell() {
  useSocket()
  useOfflineCache()

  return (
    <div className="max-w-md mx-auto relative min-h-screen">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/meals" element={<MealPlan />} />
        <Route path="/grocery" element={<GroceryList />} />
        <Route path="/recipes" element={<Recipes />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  )
}

export default function App() {
  const token = useStore((s) => s.token)

  return (
    <BrowserRouter>
      {token ? <AppShell /> : <Login />}
    </BrowserRouter>
  )
}
