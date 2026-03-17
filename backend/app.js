require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const errorHandler = require('./middleware/error.middleware');
const logger     = require('./utils/logger');

const app = express();

app.use(helmet());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev', { stream: { write: (m) => logger.http(m.trim()) } }));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Routes — no auth required
app.use('/api/workflows',  require('./routes/workflow.routes'));
app.use('/api/executions', require('./routes/execution.routes'));
app.use('/api/rules',      require('./routes/rule.routes'));

// 404
app.use((req, res) => res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` }));

app.use(errorHandler);

module.exports = app;
