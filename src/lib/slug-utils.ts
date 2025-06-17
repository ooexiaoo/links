/**
 * Generates a URL-friendly slug from a string
 * @param str The string to convert to a slug
 * @returns A URL-friendly slug
 */
export const generateSlug = (str: string): string => {
  return str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with a single dash
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
};

/**
 * Validates if a string is a valid URL
 * @param url The URL to validate
 * @returns boolean indicating if the URL is valid
 */
export const isValidUrl = (url: string): boolean => {
  try {
    // Check if the URL is valid
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Ensures a URL has a protocol (defaults to https:// if missing)
 * @param url The URL to normalize
 * @returns The normalized URL with a protocol
 */
export const normalizeUrl = (url: string): string => {
  // If the URL already has a protocol, return as is
  if (/^https?:\/\//.test(url)) {
    return url;
  }
  
  // If it starts with //, add https:
  if (url.startsWith('//')) {
    return `https:${url}`;
  }
  
  // Otherwise, add https://
  return `https://${url}`;
};

/**
 * Generates a random alphanumeric string of a given length
 * @param length The length of the random string (default: 6)
 * @returns A random alphanumeric string
 */
export const generateRandomSlug = (length = 6): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

/**
 * Extracts the domain from a URL
 * @param url The URL to extract the domain from
 * @returns The domain name
 */
export const extractDomain = (url: string): string => {
  try {
    const domain = new URL(normalizeUrl(url)).hostname.replace('www.', '');
    return domain;
  } catch (e) {
    return '';
  }
};

/**
 * Shortens a URL for display purposes
 * @param url The URL to shorten
 * @param maxLength The maximum length of the shortened URL (default: 40)
 * @returns The shortened URL
 */
export const shortenUrlForDisplay = (url: string, maxLength = 40): string => {
  if (url.length <= maxLength) {
    return url;
  }
  
  const urlObj = new URL(normalizeUrl(url));
  const path = urlObj.pathname + urlObj.search + urlObj.hash;
  
  // If the domain itself is too long, just return it truncated
  if (urlObj.hostname.length > maxLength) {
    return `${urlObj.hostname.substring(0, maxLength - 3)}...`;
  }
  
  // Otherwise, keep the domain and part of the path
  const remainingLength = maxLength - urlObj.hostname.length - 3; // 3 for the ellipsis
  
  if (remainingLength <= 0) {
    return `${urlObj.hostname}...`;
  }
  
  return `${urlObj.hostname}${path.substring(0, remainingLength)}...`;
};
