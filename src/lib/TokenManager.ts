// Token Management Utility for Zenith Forum
// Handles automatic token refresh and API requests with authentication

class TokenManager {
  private static instance: TokenManager;
  private refreshPromise: Promise<string> | null = null;
  private tokenRefreshInterval: NodeJS.Timeout | null = null;

  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }
  
  constructor() {
    // Start periodic token refresh when TokenManager is instantiated
    if (typeof window !== 'undefined') {
      this.setupTokenRefresh();
    }
  }
  
  private setupTokenRefresh() {
    // Clear any existing interval
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
    }
    
    // Check and refresh token every 10 minutes
    this.tokenRefreshInterval = setInterval(() => {
      const token = this.getAccessToken();
      if (token && this.isTokenExpired(token)) {
        console.log('Token expired during interval check, refreshing...');
        this.refreshAccessToken().catch(error => {
          console.error('Scheduled token refresh failed:', error);
        });
      }
    }, 10 * 60 * 1000); // 10 minutes
  }

  /**
   * Get access token from localStorage
   */
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('zenith-token');
  }

  /**
   * Get refresh token from localStorage
   */
  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('zenith-refresh-token');
  }

  /**
   * Set tokens in localStorage
   */
  setTokens(accessToken: string, refreshToken?: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('zenith-token', accessToken);
    if (refreshToken) {
      localStorage.setItem('zenith-refresh-token', refreshToken);
    }
  }

  /**
   * Clear all tokens from localStorage
   */
  clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('zenith-token');
    localStorage.removeItem('zenith-refresh-token');
    localStorage.removeItem('zenith-user');
  }

  /**
   * Check if token is expired or will expire soon (decode JWT and check exp)
   * Returns true if token is within 5 minutes of expiring to allow for refresh ahead of time
   */
  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      // Return true if token will expire within 5 minutes
      return payload.exp < (currentTime + 300); // 300 seconds = 5 minutes
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<string> {
    // Prevent multiple concurrent refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this._performTokenRefresh();
    
    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async _performTokenRefresh(): Promise<string> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      console.error('No refresh token available');
      throw new Error('No refresh token available');
    }

    console.log('Attempting to refresh token...');
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        console.error('Token refresh failed with status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        this.clearTokens();
        throw new Error(`Failed to refresh token: ${response.status}`);
      }

      const data = await response.json();
      console.log('Token refresh successful');
      
      // Store both the new access token and refresh token if provided
      if (data.refreshToken) {
        this.setTokens(data.accessToken, data.refreshToken);
      } else {
        this.setTokens(data.accessToken);
      }
      
      return data.accessToken;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearTokens();
      throw error;
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getValidAccessToken(): Promise<string> {
    let accessToken = this.getAccessToken();
    
    if (!accessToken) {
      throw new Error('No access token available');
    }

    // Check if token is expired
    if (this.isTokenExpired(accessToken)) {
      console.log('Access token expired, refreshing...');
      accessToken = await this.refreshAccessToken();
    }

    return accessToken;
  }

  /**
   * Make authenticated API request with automatic token refresh
   */
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    try {
      const accessToken = await this.getValidAccessToken();
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        ...options.headers,
      };

      // Make the API request
      const response = await fetch(url, {
        ...options,
        headers,
      });
      
      // Handle 401 Unauthorized errors specifically
      if (response.status === 401) {
        console.log('Received 401 response, attempting token refresh...');
        
        // Try to refresh the token
        try {
          const newToken = await this.refreshAccessToken();
          
          // If refresh successful, retry the request with the new token
          const newHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newToken}`,
            ...options.headers,
          };
          
          return fetch(url, {
            ...options,
            headers: newHeaders,
          });
        } catch (refreshError) {
          console.error('Token refresh after 401 failed:', refreshError);
          this.clearTokens();
          
          // Only redirect to login if we're in the browser and this isn't a login-related request
          if (typeof window !== 'undefined' && !url.includes('/api/auth/')) {
            window.location.href = '/login';
          }
          throw refreshError;
        }
      }
      
      return response;
    } catch (error) {
      // If token refresh fails, redirect to login
      console.error('Authentication failed:', error);
      this.clearTokens();
      
      // Only redirect to login if we're in the browser and this isn't a login-related request
      if (typeof window !== 'undefined' && !url.includes('/api/auth/')) {
        window.location.href = '/login';
      }
      throw error;
    }
  }
}

export default TokenManager;
