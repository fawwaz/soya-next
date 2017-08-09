import createRouter from '../createRouter';

jest.mock('express/lib/router', () => jest.fn(
  () => {
    const middlewares = [];
    const routes = [];
    return {
      middlewares,
      routes,
      get: jest.fn((path, handler) => {
        routes.push({ path, handler });
      }),
      use: jest.fn(middleware => {
        middlewares.push(middleware);
      }),
    };
  }
));

describe('createRouter', () => {
  let app;
  const next = ({ dev }) => {
    const handle = jest.fn();
    return {
      dev,
      dir: '.',
      dist: '.next',
      getRequestHandler: jest.fn(() => handle),
      handle,
      render: jest.fn(),
      serveStatic: jest.fn(),
    };
  };

  describe('production', () => {
    beforeEach(() => {
      app = next({ dev: false }); // eslint-disable-line callback-return
    });

    it('should create gzip enabled router', () => {
      const router = createRouter(app);
      expect(router.use.mock.calls.length).toBe(3);
    });
  });

  describe('non-production', () => {
    beforeEach(() => {
      app = next({ dev: true }); // eslint-disable-line callback-return
    });

    it('should create basic router', async () => {
      const router = createRouter(app);
      const req = {
        headers: {},
        params: {
          path: '/react.png',
        },
      };
      const res = {};
      const next = jest.fn();

      // redirects middleware
      router.middlewares[0](req, res, next);
      expect(req).toHaveProperty('redirects');
      expect(next).toBeCalled();

      // universal cookies middleware
      router.middlewares[1](req, res, next);
      expect(req).toHaveProperty('universalCookies');
      expect(next.mock.calls.length).toBe(2);

      // next handler
      await router.routes[0].handler(req, res);
      expect(app.handle).toBeCalled();

      expect(router.use.mock.calls.length).toBe(2);
      expect(router.get.mock.calls.length).toBe(1);
      expect(app.getRequestHandler).toBeCalled();
    });

    it('should create router with custom routes', async () => {
      const routes = {
        '/p/:id': {
          page: '/post',
        },
      };
      const router = createRouter(app, { routes });
      await router.routes[0].handler({
        query: { locale: 'en-id' },
        params: { id: 1 },
      }, {});
      expect(app.render).toBeCalled();
      expect(app.render.mock.calls[0]).toMatchSnapshot();
      expect(router.get.mock.calls.length).toBe(2);
    });

    it('should create router with redirection', () => {
      const defaultLocale = 'id-id';
      const routes = {
        '/p/:id': {
          page: '/post',
        },
      };
      const redirects = {
        '/tentang': {
          to: '/about',
        },
        '/post/:id': {
          to: '/p/:id',
        },
      };
      const router = createRouter(app, { defaultLocale, routes, redirects });
      const res = {
        redirect: jest.fn(),
      };
      router.routes[0].handler({}, res);
      expect(res.redirect).toBeCalled();
      expect(res.redirect.mock.calls[0]).toMatchSnapshot();
      router.routes[1].handler({
        locale: {
          language: 'en',
          country: 'id',
        },
        params: { id: 1 },
      }, res);
      expect(res.redirect.mock.calls[1]).toMatchSnapshot();
      expect(router.get.mock.calls.length).toBe(4);
    });

    it('should create locale aware router', () => {
      const router = createRouter(app, {
        defaultLocale: 'id-id',
        siteLocales: [
          'id-id',
          'en-id',
        ],
      });
      expect(router.use.mock.calls.length).toBe(3);
    });
  });
});