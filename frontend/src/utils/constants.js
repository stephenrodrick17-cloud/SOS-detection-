// Frontend Constants and Utilities

export const CONSTANTS = {
  MAX_FILE_SIZE: parseInt(process.env.REACT_APP_MAX_FILE_SIZE || 52428800), // 50MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/quicktime'],
  API_HEALTH_CHECK_INTERVAL: 10000, // 10 seconds
  DASHBOARD_REFRESH_INTERVAL: 10000, // 10 seconds
  DETECTION_ANALYSIS_DELAY: 600, // 600ms

  // India GPS boundaries
  GPS_BOUNDS: {
    MIN_LAT: 8,
    MAX_LAT: 35,
    MIN_LON: 68,
    MAX_LON: 97
  }
};

// Sanitization utilities
export const sanitizePath = (path) => {
  if (!path || typeof path !== 'string') return '';
  // Remove directory traversal attempts
  return path.replace(/\.\.\//g, '').replace(/^\/+/, '').replace(/\0/g, '');
};

// Validation utilities
export const isValidGPSCoordinates = (lat, lon) => {
  if (lat === 0 && lon === 0) return false; // Invalid default
  if (!(-90 <= lat <= 90 && -180 <= lon <= 180)) return false; // Valid ranges
  // Check if within India bounds (optional strict check)
  return lat >= CONSTANTS.GPS_BOUNDS.MIN_LAT && 
         lat <= CONSTANTS.GPS_BOUNDS.MAX_LAT &&
         lon >= CONSTANTS.GPS_BOUNDS.MIN_LON && 
         lon <= CONSTANTS.GPS_BOUNDS.MAX_LON;
};

export const validateFile = (file) => {
  if (!file) return { valid: false, error: 'No file selected' };
  
  const isImage = CONSTANTS.ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = CONSTANTS.ALLOWED_VIDEO_TYPES.includes(file.type);
  
  if (!isImage && !isVideo) {
    return { valid: false, error: `File type not supported. Allowed: ${[...CONSTANTS.ALLOWED_IMAGE_TYPES, ...CONSTANTS.ALLOWED_VIDEO_TYPES].join(', ')}` };
  }
  
  if (file.size > CONSTANTS.MAX_FILE_SIZE) {
    return { valid: false, error: `File too large. Max size: ${(CONSTANTS.MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB` };
  }
  
  return { valid: true };
};

// XSS Prevention
export const sanitizeHtml = (html) => {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};
