const express = require('express')
const next = require('next')
const url = require('url')
const cluster = require('cluster')
const numCPUs = require('os').cpus().length

const dev = process.env.NODE_ENV !== 'production'
const port = process.env.PORT || 3000

if (!dev && cluster.isMaster) {
  console.log(`Node cluster master ${process.pid} is running`)
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork()
  }
  cluster.on('exit', (worker, code, signal) => {
    console.error(
      `Node cluster worker ${worker.process.pid} exited: code ${code}, signal ${signal}`
    )
  })
} else {
  const nextApp = next({ dir: '.', dev })
  const nextHandler = nextApp.getRequestHandler()

  nextApp.prepare().then(() => {
    const server = express()
    if (!dev) {
      // Enforce SSL & HSTS in production
      server.use(function (req, res, next) {
        let proto = req.headers['x-forwarded-proto']
        if (proto === 'https') {
          res.set({
            'Strict-Transport-Security': 'max-age=31557600', // one-year
          })
          return next()
        }
        res.redirect('https://' + req.headers.host + req.url)
      })
    }

    // Default catch-all renders Next app
    server.get('*', (req, res) => {
      res.set({
        'Cache-Control': 'public, max-age=3600',
      })
      const parsedUrl = url.parse(req.url, true)
      nextHandler(req, res, parsedUrl)
    })

    server.listen(port, (err) => {
      if (err) throw err
      console.log(`Listening on http://localhost:${port}`)
    })
  })
}
