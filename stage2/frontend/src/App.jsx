import { useState, useEffect } from 'react'

// Logger - sends logs to backend which forwards to evaluation server
async function Log(level, pkg, message) {
  try {
    await fetch('/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stack: 'frontend', level, package: pkg, message }),
    })
  } catch (err) {
    console.error('Log failed:', err.message)
  }
}

// Single notification card
function NotificationCard({ notification, isRead, onRead, rank }) {
  const typeBadgeColor = {
    Placement: { background: '#1d4ed8', color: '#fff' },
    Result: { background: '#15803d', color: '#fff' },
    Event: { background: '#a16207', color: '#fff' },
  }

  const cardStyle = {
    border: '1px solid #ddd',
    borderRadius: '6px',
    padding: '12px 14px',
    marginBottom: '10px',
    cursor: 'pointer',
    backgroundColor: isRead ? '#f9f9f9' : '#fff',
    opacity: isRead ? 0.7 : 1,
  }

  const badgeStyle = {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: 'bold',
    padding: '2px 8px',
    borderRadius: '4px',
    marginRight: '6px',
    ...(typeBadgeColor[notification.Type] || { background: '#888', color: '#fff' }),
  }

  return (
    <div style={cardStyle} onClick={() => onRead(notification.ID)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div>
          {rank && (
            <span style={{ fontSize: '12px', color: '#888', marginRight: '8px' }}>#{rank}</span>
          )}
          <span style={badgeStyle}>{notification.Type}</span>
          {!isRead && (
            <span style={{ fontSize: '11px', color: '#2563eb' }}>● new</span>
          )}
        </div>
        <span style={{ fontSize: '11px', color: '#999' }}>{notification.Timestamp}</span>
      </div>
      <p style={{ margin: 0, fontSize: '14px', color: '#111', fontWeight: isRead ? 'normal' : 'bold' }}>
        {notification.Message}
      </p>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState('all')   // 'all' or 'priority'
  const [notifications, setNotifications] = useState([])
  const [priorityList, setPriorityList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filterType, setFilterType] = useState('')
  const [limit, setLimit] = useState(10)
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('readIds') || '[]')
    } catch {
      return []
    }
  })

  function markRead(id) {
    if (readIds.includes(id)) return
    const updated = [...readIds, id]
    setReadIds(updated)
    localStorage.setItem('readIds', JSON.stringify(updated))
    Log('info', 'component', `Notification ${id} marked as read`)
  }

  async function fetchAll() {
    setLoading(true)
    setError('')
    await Log('info', 'page', `Fetching notifications, filter: ${filterType || 'none'}`)
    try {
      let url = `/notifications?limit=50`
      if (filterType) url += `&notification_type=${filterType}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setNotifications(data.notifications || [])
      await Log('info', 'api', `Got ${(data.notifications || []).length} notifications`)
    } catch (err) {
      setError('Could not connect to backend. Make sure server is running on port 5000.')
      await Log('error', 'api', `fetchAll failed: ${err.message}`)
    }
    setLoading(false)
  }

  async function fetchPriority() {
    setLoading(true)
    setError('')
    await Log('info', 'page', `Fetching priority inbox, limit: ${limit}`)
    try {
      const res = await fetch(`/priority-inbox?limit=${limit}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setPriorityList(data.notifications || [])
      await Log('info', 'api', `Priority inbox got ${(data.notifications || []).length} items`)
    } catch (err) {
      setError('Could not connect to backend. Make sure server is running on port 5000.')
      await Log('error', 'api', `fetchPriority failed: ${err.message}`)
    }
    setLoading(false)
  }

  useEffect(() => {
    Log('info', 'page', 'App mounted')
    if (page === 'all') fetchAll()
    if (page === 'priority') fetchPriority()
  }, [page, filterType, limit]) // eslint-disable-line

  const unreadCount = notifications.filter(n => !readIds.includes(n.ID)).length

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#1a56a0', color: '#fff', padding: '16px 20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Campus Notifications</h2>
        <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.85 }}>
          {page === 'all'
            ? `${notifications.length} total — ${unreadCount} unread`
            : `Priority Inbox — Top ${limit}`}
        </p>
      </div>

      {/* Navigation buttons */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <button
          onClick={() => setPage('all')}
          style={{
            padding: '8px 18px',
            backgroundColor: page === 'all' ? '#1a56a0' : '#e5e7eb',
            color: page === 'all' ? '#fff' : '#333',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '13px',
          }}
        >
          All Notifications {unreadCount > 0 && `(${unreadCount} new)`}
        </button>
        <button
          onClick={() => setPage('priority')}
          style={{
            padding: '8px 18px',
            backgroundColor: page === 'priority' ? '#1a56a0' : '#e5e7eb',
            color: page === 'priority' ? '#fff' : '#333',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '13px',
          }}
        >
          Priority Inbox
        </button>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        {page === 'all' && (
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px' }}
          >
            <option value="">All Types</option>
            <option value="Placement">Placement</option>
            <option value="Result">Result</option>
            <option value="Event">Event</option>
          </select>
        )}
        {page === 'priority' && (
          <select
            value={limit}
            onChange={e => setLimit(Number(e.target.value))}
            style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px' }}
          >
            <option value={10}>Top 10</option>
            <option value={15}>Top 15</option>
            <option value={20}>Top 20</option>
          </select>
        )}
        <button
          onClick={() => page === 'all' ? fetchAll() : fetchPriority()}
          style={{
            padding: '6px 14px',
            backgroundColor: '#1a56a0',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          Refresh
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: '6px', marginBottom: '14px', fontSize: '13px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <p style={{ textAlign: 'center', color: '#888' }}>Loading...</p>
      )}

      {/* All notifications list */}
      {!loading && page === 'all' && (
        notifications.length === 0
          ? <p style={{ textAlign: 'center', color: '#aaa' }}>No notifications found.</p>
          : notifications.map(n => (
            <NotificationCard
              key={n.ID}
              notification={n}
              isRead={readIds.includes(n.ID)}
              onRead={markRead}
            />
          ))
      )}

      {/* Priority inbox list */}
      {!loading && page === 'priority' && (
        priorityList.length === 0
          ? <p style={{ textAlign: 'center', color: '#aaa' }}>No notifications found.</p>
          : priorityList.map((n, i) => (
            <NotificationCard
              key={n.ID}
              notification={n}
              isRead={readIds.includes(n.ID)}
              onRead={markRead}
              rank={i + 1}
            />
          ))
      )}
    </div>
  )
}
