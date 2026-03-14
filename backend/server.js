require('dotenv').config()
const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')

const app = express()
app.use(cors())
app.use(express.json())

connectDB()

app.get('/', (req, res) => {
  res.send('Backend is running...')
})

app.use('/api/auth', require('./routes/auth'))
app.use('/api/products', require('./routes/products'))
app.use('/api/sandbox', require('./routes/sandbox'))
app.use('/api/dashboard', require('./routes/dashboard'))
app.use('/api/predict', require('./routes/predict'))
app.use('/api/history', require('./routes/history'))

const PORT = process.env.port || 8000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})