require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const axios   = require('axios')
const { Log } = require('../logging_middleware')

const app = express()
app.use(cors())
app.use(express.json())

const AUTH_TOKEN = process.env.AUTH_TOKEN
const NOTIF_URL  = 'http://20.207.122.201/evaluation-service/notifications'
const LOG_URL    = 'http://20.207.122.201/evaluation-service/logs'

// ── POST /log — frontend log proxy ────────────────────────────────────────────
app.post('/log', async (req, res) => {
  try {
    const { stack, level, package: pkg, message } = req.body
    await axios.post(
      LOG_URL,
      { stack, level, package: pkg, message },
      { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AUTH_TOKEN}` } }
    )
    res.status(201).json({ ok: true })
  } catch (err) {
    res.status(500).json({ message: 'Log forwarding failed' })
  }
})

// Priority weights — Placement > Result > Event
const WEIGHTS = { Placement: 3, Result: 2, Event: 1 }

// ── GET /priority-inbox?limit=10 ──────────────────────────────────────────────
// Returns top N notifications sorted by type weight (Placement > Result > Event)
// then by recency (newest first) for ties
app.get('/priority-inbox', async (req, res) => {
  await Log('backend', 'info', 'route', 'GET /priority-inbox called')

  const n = parseInt(req.query.limit) || 10

  try {
    const response = await axios.get(NOTIF_URL, {
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
    })

    const notifications = response.data.notifications || []
    await Log('backend', 'info', 'service', `Fetched ${notifications.length} total notifications`)

    // Sort by weight DESC, then by Timestamp DESC (recency) for ties
    const sorted = [...notifications].sort((a, b) => {
      const weightDiff = (WEIGHTS[b.Type] || 0) - (WEIGHTS[a.Type] || 0)
      if (weightDiff !== 0) return weightDiff
      return new Date(b.Timestamp) - new Date(a.Timestamp)
    })

    const topN = sorted.slice(0, n)
    await Log('backend', 'info', 'handler', `Returning top ${n} priority notifications`)

    res.status(200).json({
      count: topN.length,
      limit: n,
      notifications: topN,
    })
  } catch (err) {
    await Log('backend', 'error', 'handler', `Priority inbox failed: ${err.message}`)
    res.status(500).json({ message: 'Failed to fetch notifications' })
  }
})

// ── GET /notifications ────────────────────────────────────────────────────────
// Proxy to evaluation server, forwards query params: limit, page, notification_type
app.get('/notifications', async (req, res) => {
  await Log('backend', 'info', 'route', 'GET /notifications called')

  const { limit, page, notification_type } = req.query
  const params = {}
  if (limit)             params.limit             = limit
  if (page)              params.page              = page
  if (notification_type) params.notification_type = notification_type

  try {
    const response = await axios.get(NOTIF_URL, {
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      params,
    })

    await Log('backend', 'info', 'service', `Notifications fetched: ${JSON.stringify(params)}`)
    res.status(200).json(response.data)
  } catch (err) {
    await Log('backend', 'error', 'handler', `Notifications fetch failed: ${err.message}`)
    res.status(500).json({ message: 'Failed to fetch notifications' })
  }
})

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok' }))

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(5000, async () => {
  await Log('backend', 'info', 'config', 'Notification backend started on port 5000')
  console.log('✅ Backend running on http://localhost:5000')
  console.log('   GET /priority-inbox?limit=10')
  console.log('   GET /notifications?limit=20&notification_type=Placement')
})
