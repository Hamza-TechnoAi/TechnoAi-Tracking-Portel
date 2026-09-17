require('dotenv').config();

const express = require('express');
const cors = require('cors');
const configureDB = require('./app/config/db');
const router = require('./app/routes/common.routes');

const app = express();
const PORT = process.env.PORT || 5050;

configureDB().then(() => {
  require('./app/services/notificationService/poNotification.service').startOverdueChecks();
});

// Reflect request Origin (needed for Vercel + free-tier wakeups)
app.use(
  cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  }),
);
app.options('/{*splat}', cors({ origin: true }));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/', (req, res) => {
  res.send('TechnoAi Tracking API');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'technoai-tracking-api' });
});

app.use('/api', router);

app.listen(PORT, () => {
  console.log(`TechnoAi tracking API running on port ${PORT}`);
});
