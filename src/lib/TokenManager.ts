// Token Management Utility for Zenith Forum
// Handles automatic token refresh and API requests with authentication

class TokenManager {
  private static instance: TokenManager;
  private refreshPromise: Promise<string> | null = null;

  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
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
   * Check if token is expired (decode JWT and check exp)
   */
  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
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
      throw new Error('No refresh token available');
    }

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      this.clearTokens();
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    this.setTokens(data.accessToken);
    
    return data.accessToken;
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

      return fetch(url, {
        ...options,
        headers,
      });
    } catch (error) {
      // If token refresh fails, redirect to login
      console.error('Authentication failed:', error);
      this.clearTokens();
      window.location.href = '/login';
      throw error;
    }
  }
}

export default TokenManager;
