import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Simple caching utility for API responses
export const cache = {
  data: new Map(),
  
  set(key, value, ttl = 30000) { // 30 seconds default
    this.data.set(key, {
      value,
      expires: Date.now() + ttl
    });
  },
  
  get(key) {
    const item = this.data.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.data.delete(key);
      return null;
    }
    
    return item.value;
  },
  
  clear() {
    this.data.clear();
  }
};

// Optimized API call with caching
export const cachedApiCall = async (url, options = {}, ttl = 30000) => {
  const cacheKey = `${url}-${JSON.stringify(options)}`;
  const cached = cache.get(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const response = await fetch(url, {
    credentials: 'include',
    ...options
  });
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.status}`);
  }
  
  const data = await response.json();
  cache.set(cacheKey, data, ttl);
  
  return data;
}; 

// Request deduplication to prevent multiple simultaneous calls
const pendingRequests = new Map();

export const deduplicatedApiCall = async (url, options = {}, ttl = 30000) => {
  const cacheKey = `${url}-${JSON.stringify(options)}`;
  
  // Check if there's already a pending request
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }
  
  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Create new request
  const requestPromise = (async () => {
    try {
      const response = await fetch(url, {
        credentials: 'include',
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }
      
      const data = await response.json();
      cache.set(cacheKey, data, ttl);
      return data;
    } finally {
      // Remove from pending requests
      pendingRequests.delete(cacheKey);
    }
  })();
  
  // Store the promise
  pendingRequests.set(cacheKey, requestPromise);
  
  return requestPromise;
}; 