import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { supabase } from './clients.js'
import Layout from './routes/Layout.jsx'
import Home from './components/Home'
import CreatePost from './components/CreatePost'
import PostDetail from './components/PostDetail'
import EditPost from './components/EditPost'
import Login from './components/Login'
import Signup from './components/Signup'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showLogin, setShowLogin] = useState(true)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('travelAppTheme') || 'light'
  })

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setUser(session.user)
          localStorage.setItem('travelAppUser', JSON.stringify({
            id: session.user.id,
            email: session.user.email,
            username: session.user.user_metadata?.username || session.user.email
          }))
        }
      } catch (error) {
        console.error('Error checking session:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user)
        localStorage.setItem('travelAppUser', JSON.stringify({
          id: session.user.id,
          email: session.user.email,
          username: session.user.user_metadata?.username || session.user.email
        }))
      } else {
        setUser(null)
        localStorage.removeItem('travelAppUser')
      }
    })

    // Set theme
    document.body.className = theme

    return () => {
      subscription.unsubscribe()
    }
  }, [theme])

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      localStorage.removeItem('travelAppUser')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('travelAppTheme', newTheme)
    document.body.className = newTheme
  }

  const getUserId = () => {
    const storedUser = localStorage.getItem('travelAppUser')
    if (storedUser) {
      const userData = JSON.parse(storedUser)
      return userData.username || userData.email || userData.id
    }
    return user?.user_metadata?.username || user?.email || user?.id || 'anonymous'
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Show authentication if no user
  if (!user) {
    return (
      <div className={`app ${theme}`}>
        {showLogin ? (
          <Login 
            onLogin={handleLogin} 
            switchToSignup={() => setShowLogin(false)} 
          />
        ) : (
          <Signup 
            onSignup={handleLogin} 
            switchToLogin={() => setShowLogin(true)} 
          />
        )}
      </div>
    )
  }

  // Show main app if authenticated
  return (
    <div className={`app ${theme}`}>
      <Router>
        <div className="theme-toggle">
          <button onClick={toggleTheme}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <span className="user-info">
            <span className="user-email">👤 {getUserId()}</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </span>
        </div>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="create" element={<CreatePost userId={getUserId()} />} />
            <Route path="post/:id" element={<PostDetail userId={getUserId()} />} />
            <Route path="edit/:id" element={<EditPost />} />
          </Route>
        </Routes>
      </Router>
    </div>
  )
}

export default App
