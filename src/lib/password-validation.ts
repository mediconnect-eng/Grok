/**
 * Password Validation Utilities
 * Production-grade password requirements
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let strength: PasswordValidationResult['strength'] = 'weak';

  // Minimum length check
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }

  // Maximum length check (prevent DoS)
  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }

  // Uppercase letter check
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Lowercase letter check
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Number check
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Special character check
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*...)');
  }

  // Common password check (basic list)
  const commonPasswords = [
    'password', 'password123', '12345678', 'qwerty', 'abc123',
    'password1', 'password12', '123456789', 'letmein', 'welcome',
    'admin', 'admin123', 'root', 'user', 'test', 'test123'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('This password is too common. Please choose a different one');
  }

  // Check for repeated characters (e.g., "aaaaaa")
  if (/(.)\1{5,}/.test(password)) {
    errors.push('Password should not contain repeated characters');
  }

  // Calculate strength
  const isValid = errors.length === 0;
  
  if (isValid) {
    let strengthScore = 0;
    
    if (password.length >= 12) strengthScore++;
    if (password.length >= 16) strengthScore++;
    if (/[A-Z]/.test(password)) strengthScore++;
    if (/[a-z]/.test(password)) strengthScore++;
    if (/\d/.test(password)) strengthScore++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strengthScore++;
    if (password.length >= 20) strengthScore++;
    if (/[^A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strengthScore++;
    
    if (strengthScore <= 4) strength = 'weak';
    else if (strengthScore <= 5) strength = 'medium';
    else if (strengthScore <= 6) strength = 'strong';
    else strength = 'very-strong';
  }

  return {
    isValid,
    errors,
    strength
  };
}

export function getPasswordStrengthColor(strength: PasswordValidationResult['strength']): string {
  switch (strength) {
    case 'weak': return 'text-red-600';
    case 'medium': return 'text-yellow-600';
    case 'strong': return 'text-green-600';
    case 'very-strong': return 'text-emerald-700';
    default: return 'text-gray-600';
  }
}

export function getPasswordStrengthLabel(strength: PasswordValidationResult['strength']): string {
  switch (strength) {
    case 'weak': return 'Weak';
    case 'medium': return 'Medium';
    case 'strong': return 'Strong';
    case 'very-strong': return 'Very Strong';
    default: return 'Unknown';
  }
}
