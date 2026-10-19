import axios from 'axios';

// Function to get CSRF token from meta tag
export const getCsrfToken = (): string | null => {
  // Ensure the meta tag exists and return its content or null
  const csrfMetaTag = document.querySelector('meta[name="csrf-token"]');
  return csrfMetaTag ? csrfMetaTag.getAttribute('content') : null;
};

// Function to set CSRF token header in Axios requests
export const setCsrfTokenHeader = (): void => {
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
  }
};
