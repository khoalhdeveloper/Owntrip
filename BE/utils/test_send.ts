import { sendEmailTemplate } from './emailService';
import path from 'path';
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); 

async function test() {
  console.log("Loaded EMAIL_USER:", process.env.EMAIL_USER);
  console.log("Loaded EMAIL_PASS exists:", !!process.env.EMAIL_PASS);
  try {
    const success = await sendEmailTemplate(
      '9a5vominhchanh@gmail.com',
      'Xác thực tài khoản của bạn',
      'otpTemplate',
      {
        DISPLAY_NAME: 'Test User',
        OTP_CODE: '654321'
      }
    );
    console.log("sendEmailTemplate returned:", success);
  } catch (err) {
    console.error("Test error:", err);
  }
  process.exit(0);
}

test();
