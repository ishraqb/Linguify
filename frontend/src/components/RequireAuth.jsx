import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getMe } from '../services/api'

/**
 * Wraps signed-in pages so a missing Spotify session sends the user home
 * instead of showing empty "no songs yet" states.
 */
function RequireAuth({ children }) {
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let active = true
    getMe()
      .then(() => {
        if (active) setStatus('ok')
      })
      .catch(() => {
        if (active) setStatus('no')
      })
    return () => {
      active = false
    }
  }, [])

  if (status === 'loading') {
    return (
      <div className="page">
        <p className="page-text center-text">Checking your session…</p>
      </div>
    )
  }

  if (status === 'no') {
    return <Navigate to="/" replace />
  }

  return children
}

export default RequireAuth
