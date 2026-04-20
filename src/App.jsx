import { Routes, Route } from 'react-router-dom'
import { useLists } from './hooks/useLists'
import HomePage from './pages/HomePage'
import GuestListPage from './pages/GuestListPage'
import TablePlannerPage from './pages/TablePlannerPage'

export default function App() {
  const store = useLists()
  return (
    <Routes>
      <Route path="/" element={<HomePage store={store} />} />
      <Route path="/list/:id" element={<GuestListPage store={store} />} />
      <Route path="/list/:id/tables" element={<TablePlannerPage store={store} />} />
    </Routes>
  )
}
