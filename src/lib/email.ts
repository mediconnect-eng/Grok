/**
 * Email Service for MediConnect
 * Handles all email communications including verification, notifications, and transactional emails
 */

import nodemailer from 'nodemailer';
import { logInfo, logError } from './logger';

// Email configuration from environment variables
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};

const FROM_EMAIL = process.env.SMTP_FROM || 'noreply@mediconnect.com';
const FROM_NAME = 'MediConnect';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// Create reusable transporter
const transporter = nodemailer.createTransport(SMTP_CONFIG);

// Verify SMTP connection on startup (in development only)
if (process.env.NODE_ENV === 'development') {
  transporter.verify((error, success) => {
    if (error) {
      logError('SMTP connection failed:', error);
      console.warn('⚠️  Email service not configured. Emails will not be sent.');
      console.warn('   Set SMTP_* environment variables in .env.local');
    } else {
      logInfo('Email service ready');
    }
  });
}

/**
 * Send email helper function
 */
async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  try {
    // Check if SMTP is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      logError('Email not sent: SMTP not configured');
      console.log('\n📧 EMAIL WOULD BE SENT:');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`HTML: ${html.substring(0, 200)}...\n`);
      return false;
    }

    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    });

    logInfo(`Email sent to ${to}: ${subject} (${info.messageId})`);
    return true;
  } catch (error) {
    logError('Failed to send email:', error);
    return false;
  }
}

/**
 * Email Templates
 */

// Patient Welcome & Verification Email
export async function sendVerificationEmail(
  email: string,
  name: string,
  verificationToken: string
): Promise<boolean> {
  const verificationUrl = `${APP_URL}/verify-email?token=${verificationToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - MediConnect</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 14px 28px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .button:hover { background: #5568d3; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0; font-size: 28px;">🏥 Welcome to MediConnect</h1>
      </div>
      <div class="content">
        <h2 style="color: #1f2937; margin-top: 0;">Hi ${name}! 👋</h2>
        
        <p>Thank you for signing up with MediConnect. We're excited to have you on board!</p>
        
        <p><strong>Please verify your email address to activate your account.</strong></p>
        
        <div style="text-align: center;">
          <a href="${verificationUrl}" class="button">✓ Verify Email Address</a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="background: #f3f4f6; padding: 12px; border-radius: 4px; word-break: break-all; font-size: 14px;">
          ${verificationUrl}
        </p>
        
        <div class="warning">
          <strong>⏱️ This verification link will expire in 24 hours.</strong>
        </div>
        
        <p><strong>What's next?</strong></p>
        <ul>
          <li>Complete your onboarding</li>
          <li>Set up your medical profile</li>
          <li>Book your first consultation</li>
        </ul>
        
        <p>If you didn't create this account, please ignore this email.</p>
      </div>
      <div class="footer">
        <p>MediConnect - Healthcare Made Simple</p>
        <p>Need help? Contact us at support@mediconnect.com</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Verify Your Email - MediConnect',
    html,
  });
}

// Email Verified Confirmation
export async function sendEmailVerifiedConfirmation(
  email: string,
  name: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 14px 28px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0;">✓ Email Verified!</h1>
      </div>
      <div class="content">
        <h2 style="color: #1f2937;">Welcome aboard, ${name}! 🎉</h2>
        
        <p>Your email has been successfully verified. Your account is now active!</p>
        
        <div style="text-align: center;">
          <a href="${APP_URL}" class="button">Go to MediConnect</a>
        </div>
        
        <p><strong>You can now:</strong></p>
        <ul>
          <li>✓ Book consultations with doctors</li>
          <li>✓ View and manage prescriptions</li>
          <li>✓ Order diagnostic tests</li>
          <li>✓ Access your medical records</li>
        </ul>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Email Verified - Welcome to MediConnect! 🎉',
    html,
  });
}

// Provider Application Received
export async function sendProviderApplicationReceived(
  email: string,
  name: string,
  providerType: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
        .status-box { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0;">📋 Application Received</h1>
      </div>
      <div class="content">
        <h2 style="color: #1f2937;">Dear ${name},</h2>
        
        <p>Thank you for your interest in joining MediConnect as a healthcare ${providerType}!</p>
        
        <div class="status-box">
          <strong>Application Status: UNDER REVIEW</strong><br>
          Our team is currently reviewing your application and credentials.
        </div>
        
        <p><strong>What happens next?</strong></p>
        <ol>
          <li>We'll verify your credentials and license documents</li>
          <li>Our compliance team will review your application</li>
          <li>You'll receive an email notification once approved (typically 2-3 business days)</li>
          <li>After approval, you can login and start seeing patients</li>
        </ol>
        
        <p><strong>Documents under review:</strong></p>
        <ul>
          <li>Medical license/registration certificate</li>
          <li>Professional qualifications</li>
          <li>Practice location details</li>
        </ul>
        
        <p>If we need any additional information, we'll reach out to you at this email address.</p>
        
        <p>Thank you for your patience!</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Application Received - MediConnect Healthcare Provider',
    html,
  });
}

// Provider Application Approved
export async function sendProviderApplicationApproved(
  email: string,
  name: string,
  providerType: string,
  loginUrl: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 14px 28px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0;">🎉 Application Approved!</h1>
      </div>
      <div class="content">
        <h2 style="color: #1f2937;">Congratulations, ${name}!</h2>
        
        <div class="success-box">
          <strong>✓ Your application has been approved!</strong><br>
          You can now login and start providing healthcare services on MediConnect.
        </div>
        
        <p>Welcome to the MediConnect healthcare network! We're thrilled to have you on board.</p>
        
        <div style="text-align: center;">
          <a href="${loginUrl}" class="button">Login to Your Dashboard</a>
        </div>
        
        <p><strong>Getting Started:</strong></p>
        <ul>
          <li>Complete your profile setup</li>
          <li>Set your availability hours</li>
          <li>Configure consultation preferences</li>
          <li>Start accepting patient consultations</li>
        </ul>
        
        <p><strong>Your login credentials:</strong></p>
        <p>Email: ${email}<br>Password: (the one you set during application)</p>
        
        <p>If you have any questions or need assistance, our support team is here to help!</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '🎉 Application Approved - Welcome to MediConnect!',
    html,
  });
}

// Provider Application Rejected
export async function sendProviderApplicationRejected(
  email: string,
  name: string,
  reason: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ef4444; color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
        .info-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0;">Application Status Update</h1>
      </div>
      <div class="content">
        <h2 style="color: #1f2937;">Dear ${name},</h2>
        
        <p>Thank you for your interest in joining MediConnect. After careful review of your application, we regret to inform you that we are unable to approve your application at this time.</p>
        
        <div class="info-box">
          <strong>Reason:</strong><br>
          ${reason}
        </div>
        
        <p>If you believe there was an error or would like to reapply with updated information, please contact our support team at support@mediconnect.com.</p>
        
        <p>We appreciate your interest in MediConnect and wish you the best in your professional endeavors.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Application Status Update - MediConnect',
    html,
  });
}

// Password Reset Email
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetToken: string
): Promise<boolean> {
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 14px 28px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0;">🔐 Password Reset Request</h1>
      </div>
      <div class="content">
        <h2 style="color: #1f2937;">Hi ${name},</h2>
        
        <p>We received a request to reset your MediConnect password.</p>
        
        <div style="text-align: center;">
          <a href="${resetUrl}" class="button">Reset Password</a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="background: #f3f4f6; padding: 12px; border-radius: 4px; word-break: break-all; font-size: 14px;">
          ${resetUrl}
        </p>
        
        <div class="warning">
          <strong>⏱️ This password reset link will expire in 1 hour.</strong>
        </div>
        
        <p><strong>Didn't request a password reset?</strong></p>
        <p>If you didn't make this request, you can safely ignore this email. Your password will remain unchanged.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Password Reset Request - MediConnect',
    html,
  });
}

export default {
  sendVerificationEmail,
  sendEmailVerifiedConfirmation,
  sendProviderApplicationReceived,
  sendProviderApplicationApproved,
  sendProviderApplicationRejected,
  sendPasswordResetEmail,
};
