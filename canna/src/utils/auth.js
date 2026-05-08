// Cloudflare Access authentication utility

export const getCFAccessToken = () => {
  const match = document.cookie.match(/CF_Authorization=([^;]+)/);
  return match ? match[1] : null;
};

export const authenticatedFetch = async (url, options = {}) => {
  const token = getCFAccessToken();
  const headers = {
    ...options.headers,
    'Cookie': token ? `CF_Authorization=${token}` : ''
  };
  return fetch(url, { ...options, headers, credentials: 'include' });
};

export const isAuthenticated = () => {
  return !!getCFAccessToken();
};
