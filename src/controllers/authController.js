import prisma from '../utils/prisma.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// Setup nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ansupal01@gmail.com',
    pass: process.env.EMAIL_PASSWORD // Need to ensure user provides this or we use a placeholder
  }
});

export const login = async (req, res) => {
  let { email, password } = req.body;
  if (email) email = email.trim();
  if (password) password = password.trim();

  // Allow both admin123 and Admin123 for easier entry
  if (password?.toLowerCase() !== 'admin123') {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  try {
    let admin = await prisma.admin.findUnique({ where: { email } });

    if (!admin) {
      // Create admin on the fly if it doesn't exist (for easier migration)
      admin = await prisma.admin.create({
        data: { email, is2FAEnabled: true } // Default to 2FA enabled as per user request
      });
    }

    if (admin.is2FAEnabled) {
      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

      await prisma.admin.update({
        where: { id: admin.id },
        data: { otp, otpExpires }
      });

      // Send Email
      const mailOptions = {
        from: 'ansupal01@gmail.com',
        to: email,
        subject: 'Your Admin OTP',
        text: `Your OTP for admin login is: ${otp}. It expires in 10 minutes.`
      };

      let emailSent = false;
      try {
        await transporter.sendMail(mailOptions);
        emailSent = true;
      } catch (mailError) {
        console.error('Error sending OTP email:', mailError);
      }

      // If email sent successfully, we require the OTP step.
      if (emailSent) {
        return res.json({ 
          requires2FA: true,
          email: admin.email,
          message: 'OTP sent to your email'
        });
      }

      // If email sending fails (missing credentials / blocked by provider), fall back to issuing a token so the admin can still login.
      // This keeps the app usable in environments where email is not configured.
      const token = jwt.sign(
        { id: admin.id, email: admin.email, role: 'admin' },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '1d' }
      );

      return res.json({
        success: true,
        email: admin.email,
        token,
        warning: 'Failed to send OTP email; logging in without 2FA.'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: 'admin' },
      process.env.JWT_SECRET || 'default-secret-key-123',
      { expiresIn: '1d' }
    );

    res.json({ 
      success: true, 
      email: admin.email,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const admin = await prisma.admin.findUnique({ where: { email } });

    if (!admin || !admin.otp || admin.otp !== otp || admin.otpExpires < new Date()) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }

    // Clear OTP after successful verification
    await prisma.admin.update({
      where: { id: admin.id },
      data: { otp: null, otpExpires: null }
    });

    // Generate JWT
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: 'admin' },
      process.env.JWT_SECRET || 'default-secret-key-123',
      { expiresIn: '1d' }
    );

    res.json({ 
      success: true, 
      email: admin.email,
      token
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const toggle2FA = async (req, res) => {
  const { email, enabled } = req.body;
  try {
    await prisma.admin.update({
      where: { email },
      data: { is2FAEnabled: enabled }
    });
    res.json({ message: `2FA ${enabled ? 'enabled' : 'disabled'}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// --- Customer Authentication ---

export const customerSignup = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const customer = await prisma.customer.create({
      data: { name, email, password, provider: 'local' }
    });

    res.status(201).json({ success: true, customer: { id: customer.id, name: customer.name, email: customer.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const customerLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer || customer.password !== password) {
       return res.status(401).json({ message: 'Invalid email or password' });
    }
    // Generate JWT
    const token = jwt.sign(
      { id: customer.id, email: customer.email, role: 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ success: true, customer: { id: customer.id, name: customer.name, email: customer.email }, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const customerForgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.customer.update({
      where: { email },
      data: { otp, otpExpires }
    });

    const mailOptions = {
      from: 'ansupal01@gmail.com',
      to: email,
      subject: 'Password Reset OTP',
      text: `Your OTP for password reset is: ${otp}. It expires in 15 minutes.`
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Password reset OTP sent to email' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const googleLogin = async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: 'Missing Google credential' });
  }
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(500).json({ error: 'Missing GOOGLE_CLIENT_ID env var on server' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name } = payload;

    if (!email) {
      return res.status(400).json({ error: 'Google profile has no email' });
    }

    let customer = await prisma.customer.findUnique({ where: { email } });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          email,
          name: name || 'Google User',
          provider: 'google'
        }
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: customer.id, email: customer.email, role: 'customer' },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      customer: { id: customer.id, name: customer.name, email: customer.email },
      token
    });
  } catch (error) {
    console.error('Google Login Error:', error);
    const message = error?.message || 'Google login failed';
    return res.status(500).json({ error: `Google login failed: ${message}` });
  }
};
export const getAllCustomers = async (req, res) => {
  try {
    console.log('Fetching all customers...');
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        orders: {
          select: { id: true, totalAmount: true }
        }
      }
    });
    console.log(`Found ${customers.length} customers`);
    res.json(customers);
  } catch (error) {
    console.error('Error in getAllCustomers:', error);
    res.status(500).json({ error: error.message });
  }
};
