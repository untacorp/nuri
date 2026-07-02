const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const config = require('./config');
const apiRoutes = require('./routes/api');
const watcherService = require('./services/watcherService');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

const server = app.listen(config.PORT, () => {
    console.log(`Backend server running natively on http://localhost:${config.PORT}`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    watcherService.addClient(ws);
    ws.on('close', () => {
        watcherService.removeClient(ws);
    });
});

watcherService.init();
