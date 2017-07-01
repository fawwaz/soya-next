import { join } from 'path';
import Router from 'express/lib/router';
import cookieMiddleware from 'universal-cookie-express';
import createLocaleMiddleware from './createLocaleMiddleware';
import ensureRedirect from '../utils/ensureRedirect';
import parseRedirectionPath from '../utils/parseRedirectionPath';

const defaultOptions = {
  routes: {},
  redirects: {},
};

export default (app, {
  routes = defaultOptions.routes,
  redirects = defaultOptions.redirects,
  defaultLocale,
  siteLocales,
  compression,
} = defaultOptions) => {
  const router = Router();
  const handle = app.getRequestHandler();
  if (!app.dev) {
    router.use(require('compression')(compression));
  }
  const newRedirects = Object.keys(redirects).reduce((newRedirects, from) => {
    const redirect = redirects[from];
    newRedirects[from] = {
      page: routes[redirect.to].page,
      ...redirect,
    };
    return newRedirects;
  }, {});
  router.use((req, res, next) => {
    req.redirects = newRedirects;
    next();
  });
  router.use(cookieMiddleware());
  if (defaultLocale && siteLocales) {
    router.use(createLocaleMiddleware({ defaultLocale, siteLocales }));
  }
  router.get('/_soya/:path(*)', async (req, res) => {
    const p = join(app.dir, app.dist, 'dist', 'static', req.params.path);
    await app.serveStatic(req, res, p);
  });
  Object.keys(newRedirects).forEach(from => {
    const { method, status, to } = ensureRedirect(newRedirects[from]);
    router[method.toLowerCase()](from, (req, res) => {
      const redirectionPath = parseRedirectionPath(to, req.params);
      res.redirect(status, redirectionPath);
    });
  });
  Object.keys(routes).forEach(path => {
    const { method = 'GET', page } = routes[path];
    router[method.toLowerCase()](path, (req, res) => {
      app.render(req, res, page, Object.assign({}, req.query, req.params));
    });
  });
  router.get('*', (req, res) => handle(req, res));
  return router;
};