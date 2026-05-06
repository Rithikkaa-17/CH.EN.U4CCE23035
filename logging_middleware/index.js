const axios = require('axios')

const URL = 'http://20.207.122.201/evaluation-service/logs'

/**
 * Log middleware — sends structured logs to the evaluation server.
 * @param {string} stack   - 'frontend' or 'backend'
 * @param {string} level   - 'info' | 'error' | 'warn'
 * @param {string} pkg     - package/module name (e.g. 'route', 'service')
 * @param {string} message - log message
 */
async function Log(stack, level, pkg, message) {
  const TOKEN = process.env.AUTH_TOKEN
  try {
    await axios.post(
      URL,
      { stack, level, package: pkg, message },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TOKEN}`,
        },
      }
    )
  } catch (err) {
    console.error('Log failed:', err.message)
  }
}

module.exports = { Log }
