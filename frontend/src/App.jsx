import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Search from './pages/Search'
import LanguageSelection from './pages/LanguageSelection'
import LyricsPlayer from './pages/LyricsPlayer'
import LessonComplete from './pages/LessonComplete'
import MyWords from './pages/MyWords'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/search" element={<Search />} />
        <Route path="/language-selection" element={<LanguageSelection />} />
        <Route path="/lyrics" element={<LyricsPlayer />} />
        <Route path="/lesson-complete" element={<LessonComplete />} />
        <Route path="/my-words" element={<MyWords />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App