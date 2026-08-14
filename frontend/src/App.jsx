import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Search from './pages/Search'
import LanguageSelection from './pages/LanguageSelection'
import LyricsPlayer from './pages/LyricsPlayer'
import Quiz from './pages/Quiz'
import LessonComplete from './pages/LessonComplete'
import MyWords from './pages/MyWords'
import RequireAuth from './components/RequireAuth'
import { ThemeProvider } from './theme'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/search" element={<RequireAuth><Search /></RequireAuth>} />
          <Route path="/language-selection" element={<RequireAuth><LanguageSelection /></RequireAuth>} />
          <Route path="/lyrics" element={<RequireAuth><LyricsPlayer /></RequireAuth>} />
          <Route path="/quiz" element={<RequireAuth><Quiz /></RequireAuth>} />
          <Route path="/lesson-complete" element={<RequireAuth><LessonComplete /></RequireAuth>} />
          <Route path="/my-words" element={<RequireAuth><MyWords /></RequireAuth>} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
