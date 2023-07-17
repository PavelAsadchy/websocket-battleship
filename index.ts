import { httpServer } from './src/http_server';
import addWebsocket from './src/http_server/websocket';

const HTTP_PORT = 3000;

addWebsocket();

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);
