import prisma from '../config/db.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Setup nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ansupal01@gmail.com',
    pass: process.env.EMAIL_PASSWORD // Need to ensure user provides this or we use a placeholder
  }
});

export const login = async (req, res) => {
  const { email, password } = req.body;

  // For this project, we'll keep the admin123 password logic but link it to the email
  // Ideally, we'd check against hashed password in DB
  if (password !== 'admin123') {
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

      await transporter.sendMail(mailOptions);

      return res.json({ 
        requires2FA: true, 
        email: admin.email,
        message: 'OTP sent to your email' 
      });
    }

    // If 2FA not enabled, just login
    res.json({ 
      success: true, 
      email: admin.email,
      token: 'mock-token-' + admin.id // In real app, use JWT
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

    res.json({ 
      success: true, 
      email: admin.email,
      token: 'mock-token-' + admin.id 
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
    res.json({ success: true, customer: { id: customer.id, name: customer.name, email: customer.email }, token: 'cust-token-' + customer.id });
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
  const { email, name, googleId } = req.body;
  try {
    let customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: { email, name, provider: 'google' }
      });
    }
    res.json({ success: true, customer: { id: customer.id, name: customer.name, email: customer.email }, token: 'google-token-' + customer.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
