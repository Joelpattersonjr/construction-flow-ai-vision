/**
 * Utility functions for secure cookie handling
 * Ensures all cookies have proper security attributes
 */

export interface CookieOptions {
  path?: string;
  maxAge?: number;
  domain?: string;
  sameSite?: 'Strict' | 'Lax' | 'None';
  secure?: boolean;
  httpOnly?: boolean;
}

/**
 * Sets a cookie with secure attributes automatically applied
 * @param name - Cookie name
 * @param value - Cookie value
 * @param options - Additional cookie options
 */
export const setSecureCookie = (
  name: string, 
  value: string, 
  options: CookieOptions = {}
): void => {
  const {
    path = '/',
    maxAge,
    domain,
    sameSite = 'Strict',
    secure = window.location.protocol === 'https:',
    httpOnly = false
  } = options;

  let cookieString = `${name}=${encodeURIComponent(value)}`;
  
  cookieString += `; path=${path}`;
  cookieString += `; SameSite=${sameSite}`;
  
  if (maxAge !== undefined) {
    cookieString += `; max-age=${maxAge}`;
  }
  
  if (domain) {
    cookieString += `; domain=${domain}`;
  }
  
  if (secure) {
    cookieString += '; Secure';
  }
  
  if (httpOnly) {
    cookieString += '; HttpOnly';
  }

  document.cookie = cookieString;
};

/**
 * Gets a cookie value by name
 * @param name - Cookie name
 * @returns Cookie value or null if not found
 */
export const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue ? decodeURIComponent(cookieValue) : null;
  }
  return null;
};

/**
 * Deletes a cookie by setting it to expire
 * @param name - Cookie name
 * @param path - Cookie path (should match the original path)
 * @param domain - Cookie domain (should match the original domain)
 */
export const deleteCookie = (name: string, path: string = '/', domain?: string): void => {
  setSecureCookie(name, '', { 
    path, 
    domain, 
    maxAge: 0 
  });
};