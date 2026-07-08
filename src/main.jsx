import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import App from './App.jsx'
import Login from './Login.jsx'
import AppShell from './app/AppShell.jsx'
import Onboarding from './app/pages/Onboarding.jsx'
import Home from './app/pages/Home.jsx'
import Discover from './app/pages/Discover.jsx'
import Messages from './app/pages/Messages.jsx'
import Search from './app/pages/Search.jsx'
import Hub from './app/pages/Hub.jsx'
import Communities from './app/pages/Communities.jsx'
import Projects from './app/pages/Projects.jsx'
import Hiring from './app/pages/Hiring.jsx'
import Events from './app/pages/Events.jsx'
import Assistant from './app/pages/Assistant.jsx'
import Analytics from './app/pages/Analytics.jsx'
import Profile from './app/pages/Profile.jsx'
import Saved from './app/pages/Saved.jsx'
import Premium from './app/pages/Premium.jsx'
import Admin from './app/pages/Admin.jsx'
import './styles.css'
import './app/app.css'

/** Reset scroll when navigating between pages. */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
    document.querySelector('.app-page')?.scrollTo(0, 0)
  }, [pathname])
  return null
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Home />} />
          <Route path="discover" element={<Discover />} />
          <Route path="messages" element={<Messages />} />
          <Route path="messages/:id" element={<Messages />} />
          <Route path="search" element={<Search />} />
          <Route path="hub/:hubId" element={<Hub />} />
          <Route path="communities" element={<Communities />} />
          <Route path="projects" element={<Projects />} />
          <Route path="hiring" element={<Hiring />} />
          <Route path="events" element={<Events />} />
          <Route path="assistant" element={<Assistant />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="profile" element={<Profile />} />
          <Route path="saved" element={<Saved />} />
          <Route path="premium" element={<Premium />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
