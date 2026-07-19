import app from './src/app.js';
import attachWebsocketServer from './src/ws.js';
import config from './src/config.js';
import express from 'express';

const server = app.listen(config.port, () => {
  console.log(`Spotly backend listening on http://localhost:${config.port}`);
});

app.use(
    "/uploads",
    express.static("uploads")
);

attachWebsocketServer(server);
