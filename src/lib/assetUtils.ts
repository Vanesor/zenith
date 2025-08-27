/**
 * Asset utility functions for handling URLs in different environments
 */

// Get the base URL for assets based on environment
export const getAssetUrl = (path: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // In production, use the environment variable or fallback to current domain
  if (process.env.NODE_ENV === 'production') {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   (typeof window !== 'undefined' ? window.location.origin : '');
    return `${baseUrl}/${cleanPath}`;
  }
  
  // In development, use relative path
  return `/${cleanPath}`;
};

// Specific function for club logos
export const getClubLogoUrl = (clubName: string): string | null => {
  const logoMap: { [key: string]: string } = {
    'ACHIEVERS': 'uploads/club-logos/achievers.svg',
    'ARTOVERT': 'uploads/club-logos/artovert.svg', 
    'ASCEND': 'uploads/club-logos/ascend.svg',
    'ASTER': 'uploads/club-logos/aster.svg'
  };
  
  const normalizedName = clubName.toUpperCase();
  const logoPath = logoMap[normalizedName];
  
  return logoPath ? getAssetUrl(logoPath) : null;
};
