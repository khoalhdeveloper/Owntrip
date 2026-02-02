import crypto from 'crypto';

export const generateOTP = (length: number = 6): string => {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[crypto.randomInt(0, digits.length)];
  }
  
  return otp;
};

export const getOTPExpiration = (minutes: number = 5): Date => {
  return new Date(Date.now() + minutes * 60 * 1000);
};
