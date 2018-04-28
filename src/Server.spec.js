import request from 'supertest';
import Server from './Server';

describe('Server', () => {
  let server;
  beforeEach(async () => {
    server = await Server.start(4000);
  });

  afterEach(() => {
    server.stop();
  });

  it('should start with zero endpoints', () => {
    expect(server.endpoints).toEqual([]);
  });

  it('getEndpoints should return any existing endpoints', async () => {
    server.endpoints = ['endpoint1', 'endpoint2'];

    await request(server.app)
      .get('/endpoints')
      .expect(200, ['endpoint1', 'endpoint2']);
  });

  it('addEndpoints should add a new endpoint', async () => {
    server.endpoints = [
      {
        path: 'myMockEndpoint1',
        cookie: 'myCookie',
      },
    ];

    await request(server.app)
      .post('/endpoints')
      .send({ path: 'myMockEndpoint2', cookie: 'myCookie' });

    expect(server.endpoints).toEqual(
      expect.arrayContaining([{ path: 'myMockEndpoint2', cookie: 'myCookie' }])
    );
    expect(server.endpoints.length).toEqual(2);
  });

  describe('endpoint matching', () => {
    const endpoint1 = {
      method: 'GET',
      path: `/myTestEndpoint1`,
      response: {
        status: 200,
        content: 'endpoint1',
      },
    };

    const endpoint2 = {
      method: 'GET',
      path: `/myTestEndpoint2`,
      response: {
        status: 200,
        content: 'endpoint2',
      },
    };

    describe('without cookies', () => {
      it('should correctly handle a matching request', async () => {
        server.endpoints = [endpoint1, endpoint2];

        await request(server.app)
          .get('/myTestEndpoint1')
          .expect(200, 'endpoint1');
      });

      it('should correctly handle a non-matching request', async () => {
        server.endpoints = [endpoint1, endpoint2];

        await request(server.app)
          .get('/nonMatchingEndpoint')
          .expect(404);
      });

      it('deleteEndpoints should delete an endpoint with a matching path', async () => {
        server.endpoints = [endpoint1, endpoint2];

        await request(server.app)
          .delete('/endpoints')
          .send({ path: '/myTestEndpoint1', method: 'GET' });

        expect(server.endpoints).toEqual([endpoint2]);
      });

      it('deleteEndpoints should not delete any endpoint with a non-matching path', async () => {
        server.endpoints = [endpoint1, endpoint2];

        await request(server.app)
          .delete('/endpoints')
          .send({ path: '/nonMatchingEndpoint1', method: 'GET' });

        expect(server.endpoints).toEqual([endpoint1, endpoint2]);
      });
    });

    describe('with cookies', () => {
      const testCookie = {
        name: 'e2e',
        value: 'cookieValue',
        path: '/',
        domain: 'mydomain.com',
        expiry: Date.now() / 1000 + 365 * 24 * 3600,
        httpOnly: true,
      };

      const endpoint1WithCookie = {
        ...endpoint1,
        cookie: testCookie,
      };

      const endpoint2WithCookie = {
        ...endpoint2,
        cookie: testCookie,
      };

      it('should correctly handle a matching path with a matching cookie', async () => {
        server.endpoints = [endpoint1WithCookie, endpoint2WithCookie];

        await request(server.app)
          .get('/myTestEndpoint1')
          .set('Cookie', 'e2e=cookieValue;path=/;domain=mydomain.com')
          .expect(200);
      });

      it('should correctly handle a matching path with a non-matching cookie', async () => {
        server.endpoints = [endpoint1WithCookie, endpoint2WithCookie];

        await request(server.app)
          .get('/myTestEndpoint1')
          .set(
            'Cookie',
            'e2e=nonMatchingCookieValue;path=/;domain=mydomain.com'
          )
          .expect(404);
      });

      it('should correctly handle a non-matching path with a matching cookie', async () => {
        server.endpoints = [endpoint1WithCookie, endpoint2WithCookie];

        await request(server.app)
          .get('/nonMatchingEndpoint1')
          .set('Cookie', 'e2e=cookieValue;path=/;domain=mydomain.com')
          .expect(404);
      });

      it('should correctly handle a non-matching path with a non-matching cookie', async () => {
        server.endpoints = [endpoint1WithCookie, endpoint2WithCookie];

        await request(server.app)
          .get('/nonMatchingEndpoint1')
          .set(
            'Cookie',
            'e2e=nonMatchingCookieValue;path=/;domain=mydomain.com'
          )
          .expect(404);
      });

      it('deleteEndpoints should delete an endpoint with a matching path and a matching cookie', async () => {
        server.endpoints = [endpoint1WithCookie, endpoint2WithCookie];

        await request(server.app)
          .delete('/endpoints')
          .send({
            path: '/myTestEndpoint1',
            method: 'GET',
            cookie: testCookie,
          });

        expect(server.endpoints).toEqual([endpoint2WithCookie]);
      });

      it('deleteEndpoints should not delete an endpoint with a matching path and a non-matching cookie', async () => {
        server.endpoints = [endpoint1WithCookie, endpoint2WithCookie];

        const nonMatchingCookie = {
          name: 'e2e',
          value: 'nonMatchingValue',
          path: '/',
          domain: 'mydomain.com',
          expiry: Date.now() / 1000 + 365 * 24 * 3600,
          httpOnly: true,
        };

        await request(server.app)
          .delete('/endpoints')
          .send({
            path: '/myTestEndpoint1',
            method: 'GET',
            cookie: nonMatchingCookie,
          });

        expect(server.endpoints).toEqual([
          endpoint1WithCookie,
          endpoint2WithCookie,
        ]);
      });

      it('deleteEndpoints should not delete an endpoint with a non-matching path and a matching cookie', async () => {
        server.endpoints = [endpoint1WithCookie, endpoint2WithCookie];
        await request(server.app)
          .delete('/endpoints')
          .send({
            path: '/nonMatchingEndpoint1',
            method: 'GET',
            cookie: testCookie,
          });

        expect(server.endpoints).toEqual([
          endpoint1WithCookie,
          endpoint2WithCookie,
        ]);
      });

      it('deleteEndpoints should not delete an endpoint with a non-matching path and a non-matching cookie', async () => {
        server.endpoints = [endpoint1WithCookie, endpoint2WithCookie];

        const nonMatchingCookie = {
          name: 'e2e',
          value: 'nonMatchingValue',
          path: '/',
          domain: 'mydomain.com',
          expiry: Date.now() / 1000 + 365 * 24 * 3600,
          httpOnly: true,
        };

        await request(server.app)
          .delete('/endpoints')
          .send({
            path: '/nonMatchingEndpoint1',
            method: 'GET',
            cookie: nonMatchingCookie,
          });

        expect(server.endpoints).toEqual([
          endpoint1WithCookie,
          endpoint2WithCookie,
        ]);
      });
    });
  });
});
