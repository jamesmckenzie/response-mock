import Express from 'express';
import * as bodyParser from 'body-parser';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import requestMatcher from './matcher';

export default class Server {
  static start(port) {
    const app = new Express();

    return new Promise((resolve, reject) => {
      const server = app.listen(port, err => {
        if (err) {
          reject(err);
        } else {
          resolve(new Server(app, server));
        }
      });
    });
  }

  constructor(app, server) {
    this.app = app;
    this.server = server;

    this.endpoints = [];
    app.use(cookieParser());
    app.use(
      cors({
        origin: (origin, callback) => callback(null, true),
        credentials: true,
      })
    );
    app.options('*', cors());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.get('/endpoints', this.getEndpoints.bind(this));
    app.post('/endpoints', this.addEndpoint.bind(this));
    app.delete('/endpoints', this.deleteEndpoint.bind(this));
    app.all('/*', this.handleRequest.bind(this));
  }

  getEndpoints(req, res) {
    res.send(this.endpoints);
  }

  addEndpoint(req, res) {
    const endpoint = req.body;
    this.endpoints.unshift(endpoint);

    res.status(200).send(this.endpoints);
  }

  deleteEndpoint(req, res) {
    const endpoint = req.body;

    const reqToMatch = {
      originalUrl: endpoint.path,
      method: endpoint.method,
      cookies: endpoint.cookie,
    };

    this.endpoints = this.endpoints.filter(x => !requestMatcher(reqToMatch)(x));

    res.status(200).send(this.endpoints);
  }

  handleRequest(req, res) {
    const endpoint = this.endpoints.find(requestMatcher(req));

    if (endpoint) {
      res.status(endpoint.response.status);
      res.send(endpoint.response.content);
    } else {
      res.status(404).send('No endpoints configured for this request');
    }
  }

  stop() {
    this.server.close();
  }
}
