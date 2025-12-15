import compression from 'compression';
import type { Request, Response, NextFunction } from 'express';

/**
 * Compression middleware configuration
 * Compresses responses using gzip/deflate for faster transfers
 */
export const compressionMiddleware = compression({
  // Only compress responses larger than 1KB
  threshold: 1024,
  
  // Compression level (0-9, higher = better compression but slower)
  level: 6,
  
  // Filter function to decide what to compress
  filter: (req: Request, res: Response) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Use compression's default filter
    return compression.filter(req, res);
  },
});
