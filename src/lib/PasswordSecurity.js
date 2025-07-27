// Password Security Configuration for Zenith Forum
// This module provides secure password hashing and validation

const bcrypt = require('bcryptjs');

class PasswordSecurity {
  // Security constants
  static SALT_ROUNDS = 12; // Industry standard for 2024/2025
  static MIN_PASSWORD_LENGTH = 8;
  static MAX_PASSWORD_LENGTH = 128;

  /**
   * Hash a password securely using bcrypt with 12 salt rounds
   * @param {string} password - Plain text password
   * @returns {Promise<string>} - Hashed password
   */
  static async hashPassword(password) {
    if (!this.isValidPassword(password)) {
      throw new Error('Password does not meet security requirements');
    }
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verify a password against its hash
   * @param {string} password - Plain text password
   * @param {string} hash - Stored password hash
   * @returns {Promise<boolean>} - True if password matches
   */
  static async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {boolean} - True if password meets requirements
   */
  static isValidPassword(password) {
    if (!password || typeof password !== 'string') {
      return false;
    }

    // Length check
    if (password.length < this.MIN_PASSWORD_LENGTH || password.length > this.MAX_PASSWORD_LENGTH) {
      return false;
    }

    // Strength requirements (at least 3 of 4):
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    const strengthScore = [hasLowerCase, hasUpperCase, hasNumbers, hasSpecialChar]
      .filter(Boolean).length;

    return strengthScore >= 3;
  }

  /**
   * Get password strength feedback
   * @param {string} password - Password to analyze
   * @returns {object} - Strength analysis object
   */
  static getPasswordStrength(password) {
    const analysis = {
      isValid: false,
      score: 0,
      feedback: []
    };

    if (!password) {
      analysis.feedback.push('Password is required');
      return analysis;
    }

    if (password.length < this.MIN_PASSWORD_LENGTH) {
      analysis.feedback.push(`Password must be at least ${this.MIN_PASSWORD_LENGTH} characters long`);
    }

    if (password.length > this.MAX_PASSWORD_LENGTH) {
      analysis.feedback.push(`Password must be less than ${this.MAX_PASSWORD_LENGTH} characters long`);
    }

    const checks = [
      { test: /[a-z]/, message: 'Include lowercase letters' },
      { test: /[A-Z]/, message: 'Include uppercase letters' },
      { test: /\d/, message: 'Include numbers' },
      { test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, message: 'Include special characters' }
    ];

    let score = 0;
    checks.forEach(check => {
      if (check.test.test(password)) {
        score++;
      } else {
        analysis.feedback.push(check.message);
      }
    });

    analysis.score = score;
    analysis.isValid = score >= 3 && password.length >= this.MIN_PASSWORD_LENGTH;

    if (analysis.isValid) {
      analysis.feedback = ['Password meets security requirements'];
    }

    return analysis;
  }

  /**
   * Generate a secure password hash for testing/seeding
   * @param {string} password - Password to hash
   * @returns {string} - Synchronous hash (for scripts only)
   */
  static generateTestHash(password) {
    return bcrypt.hashSync(password, this.SALT_ROUNDS);
  }
}

module.exports = PasswordSecurity;
