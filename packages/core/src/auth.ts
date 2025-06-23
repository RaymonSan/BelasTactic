import { createHash, randomBytes, pbkdf2Sync } from 'crypto';
import jwt from 'jsonwebtoken';

export interface AccessCodeAuth {
  code: string;
  userId?: string;
  expiresAt: Date;
}

export interface AuthResult {
  success: boolean;
  token?: string;
  userId?: string;
  error?: string;
}

export interface JWTPayload {
  userId: string;
  role: 'user' | 'admin';
  iat: number;
  exp: number;
}

export class AccessCodeService {
  private jwtSecret: string;
  private codeValidityHours: number = 24; // Access codes valid for 24 hours

  constructor(jwtSecret: string) {
    this.jwtSecret = jwtSecret;
  }

  /**
   * Generate a secure access code (8 characters, alphanumeric)
   */
  generateAccessCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const randomArray = randomBytes(8);
    
    for (let i = 0; i < 8; i++) {
      result += chars[randomArray[i] % chars.length];
    }
    
    return result;
  }

  /**
   * Hash access code with salt for secure storage
   */
  hashAccessCode(code: string, salt?: string): { hash: string; salt: string } {
    const actualSalt = salt || randomBytes(32).toString('hex');
    const hash = pbkdf2Sync(code, actualSalt, 10000, 64, 'sha512').toString('hex');
    
    return { hash, salt: actualSalt };
  }

  /**
   * Verify access code against stored hash
   */
  verifyAccessCode(code: string, storedHash: string, salt: string): boolean {
    const { hash } = this.hashAccessCode(code, salt);
    return hash === storedHash;
  }

  /**
   * Generate JWT token for authenticated user
   */
  generateJWT(userId: string, role: 'user' | 'admin' = 'user'): string {
    const payload: JWTPayload = {
      userId,
      role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    };

    return jwt.sign(payload, this.jwtSecret);
  }

  /**
   * Verify and decode JWT token
   */
  verifyJWT(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as JWTPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Create a new user with access code
   */
  async createUserWithAccessCode(email: string): Promise<{ userId: string; accessCode: string }> {
    const accessCode = this.generateAccessCode();
    const { hash, salt } = this.hashAccessCode(accessCode);
    
    // This would be implemented with actual database calls in the API routes
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      userId,
      accessCode, // Return unhashed code to send to user
    };
  }

  /**
   * Validate access code and return auth result
   */
  async authenticateWithAccessCode(
    email: string, 
    accessCode: string,
    userLookupFn: (email: string) => Promise<{ id: string; accessCodeHash: string; accessCodeSalt: string; role: 'user' | 'admin' } | null>
  ): Promise<AuthResult> {
    try {
      // Look up user by email
      const user = await userLookupFn(email);
      
      if (!user) {
        return {
          success: false,
          error: 'Invalid email or access code'
        };
      }

      // Verify access code
      const isValidCode = this.verifyAccessCode(accessCode, user.accessCodeHash, user.accessCodeSalt);
      
      if (!isValidCode) {
        return {
          success: false,
          error: 'Invalid email or access code'
        };
      }

      // Generate JWT token
      const token = this.generateJWT(user.id, user.role);

      return {
        success: true,
        token,
        userId: user.id
      };
    } catch (error) {
      return {
        success: false,
        error: 'Authentication failed'
      };
    }
  }

  /**
   * Generate a secure session ID
   */
  generateSessionId(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Extract JWT from Authorization header
   */
  extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    return authHeader.substring(7);
  }
}

// Factory function for creating auth service
export function createAuthService(jwtSecret?: string): AccessCodeService {
  const secret = jwtSecret || process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  
  return new AccessCodeService(secret);
}

// Constants for access code generation
export const ACCESS_CODE_CONFIG = {
  LENGTH: 8,
  VALIDITY_HOURS: 24,
  SALT_LENGTH: 32,
  PBKDF2_ITERATIONS: 10000,
  PBKDF2_KEY_LENGTH: 64,
  PBKDF2_DIGEST: 'sha512' as const,
} as const; 