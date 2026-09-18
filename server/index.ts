import path from 'node:path'
import express from 'express'
import app from './app'

const PORT = Number(process.env.PORT) || 3001

app.use(express.static(path.resolve('dist')))

app.use((req, res, next) => {
  if (
    req.method === 'GET' &&
    !req.path.startsWith('/api/')
  ) {
    return res.sendFile(
      path.resolve('dist/index.html'),
    )
  }

  next()
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(
    `TRACE V2 API running on http://localhost:${PORT}`,
  )
})
