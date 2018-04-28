import pathToRegexp from 'path-to-regexp';

export default request => endpoint => {
  const regexp = pathToRegexp(endpoint.path);

  const matchesPathAndMethod =
    request.method === endpoint.method && regexp.test(request.originalUrl);
  const shouldMatchCookie = !!endpoint.cookie;

  const matchesCookie =
    !shouldMatchCookie ||
    Object.values(request.cookies).includes(endpoint.cookie.value);

  return matchesPathAndMethod && matchesCookie;
};
