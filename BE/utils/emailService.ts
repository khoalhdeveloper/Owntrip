import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Function to create a fresh transporter using the latest process.env
const getTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendEmailTemplate = async (
  to: string,
  subject: string,
  templateName: string,
  variables: Record<string, string>
) => {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      console.error(`❌ Invalid email address: ${to}`);
      throw new Error(`Invalid email address: ${to}`);
    }

    let htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Xác thực tài khoản</title>
</head>
<body style="font-family: Arial, sans-serif; background: #f7f9fc; padding: 20px;">
  <div style="max-width: 500px; margin: auto; background: white; border-radius: 10px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h2 style="color: #2b6cb0; text-align: center;">Xin chào {{DISPLAY_NAME}}</h2>
    <p>Mã OTP xác thực của bạn là:</p>
    <h1 style="text-align: center; color: #2b6cb0;">{{OTP_CODE}}</h1>
    <p style="text-align: center;">Mã này sẽ hết hạn sau 5 phút.</p>
    <hr />
    <p style="font-size: 12px; color: #999; text-align: center;">
      © 2026 Your App. All rights reserved.
    </p>
  </div>
</body>
</html>`;

    for (const [key, value] of Object.entries(variables)) {
      htmlContent = htmlContent.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    const info = await getTransporter().sendMail({
      from: `"Owntrip Support" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
    });

    console.log(`📧 Email (${templateName}) sent to ${to} (MessageId: ${info.messageId})`);
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to send ${templateName} email:`, error.message);
    return false;
  }
};
