const express = require('express')
const app = express()
const port = 3000

app.use('/api/customers', require('./api/routes/customers'))

// Test-only: reset backend state to seed data
app.post('/api/test/reset', (req, res) => {
  require('./api/data/customerData').resetData()
  res.status(200).json({ message: 'Data reset' })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})