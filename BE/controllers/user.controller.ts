import { Request, Response } from 'express';
import User from '../models/user.model';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateOTP, getOTPExpiration } from '../utils/otpGenerator';
import { sendEmailTemplate } from '../utils/emailService';



export const UserController = {
  register: async (req: Request, res: Response) => {
    try {
      const otp = generateOTP();
      const otpExpires = getOTPExpiration();
      
      const user = new User({
        ...req.body,
        otp,
        otpExpires,
        isVerified: false
      });
      await user.save();
      
      
      await sendEmailTemplate(
        user.email,
        'Xác thực tài khoản của bạn',
        'otpTemplate',
        {
          DISPLAY_NAME: user.displayName,
          OTP_CODE: otp
        }
      );
      
      res.status(201).json({ 
        success: true, 
        message: "User registered successfully. Please verify your email with the OTP sent.",
        otp 
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
  verifyEmail: async (req: Request, res: Response) => {
    try {
      const { email, otp } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ success: false, message: "Invalid email or OTP" });
      } 
      if (user.isVerified) {
        return res.status(400).json({ success: false, message: "Email is already verified" });
      }   
      if (user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
        return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
      } 
      user.isVerified = true;
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();
      res.json({ success: true, message: "Email verified successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }   
  },
  resendOTP: async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ success: false, message: "User not found" });
      } 
     
      const otp = generateOTP();
      const otpExpires = getOTPExpiration();
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();

      await sendEmailTemplate(
        user.email,
        'Xác thực tài khoản của bạn',
        'otpTemplate',
        {
          DISPLAY_NAME: user.displayName,
          OTP_CODE: otp
        }
      );

      res.json({ success: true, message: "OTP resent successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },  
  getProfile: async (req: Request, res: Response) => {
    try {
      const user = await User.findOne({ userId: req.params.id }).select('-password');
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json({ success: true, data: user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ success: false, message: "Invalid email or password" });
      }
      const isMatch = await bcrypt.compare(password, user.password!);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: "Invalid email or password" });
      }
      
      if (!user.isVerified) {
        return res.status(403).json({ success: false, message: "Please verify your email first" });
      }

      const token = jwt.sign(
        { userId: user.userId, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '1d' }
      );
      
      res.json({ 
        success: true, 
        message: "Login successful",
        token,
        
          userId: user.userId,
          email: user.email,
          displayName: user.displayName,
          role: user.role
        
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  loginwithgoogle: async (req: Request, res: Response) => {
  try {
    const { email, displayName, avatar } = req.body;
    let user = await User.findOne({ email });

    if (!user) {
      
      user = new User({ 
        email, 
        displayName, 
        avatar,
        isVerified: true, 
        password: await bcrypt.hash(Math.random().toString(36), 10) 
      });        
      await user.save();
    }

    const token = jwt.sign(
      { userId: user.userId, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '1d' }
    );
    
    res.json({ success: true, token, userId: user.userId });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
},
  updateProfile: async (req: Request, res: Response) => {
    try {
      
      const { password, balance, points, ...allowedUpdates } = req.body;
      
      const user = await User.findOneAndUpdate(
        { userId: req.params.id },
        allowedUpdates,
        { new: true }
      ).select('-password');
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json({ success: true, message: "Profile updated successfully"});
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  updatePassword: async (req: Request, res: Response) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const user = await User.findOne({ userId: req.params.id });
      if (!user) return res.status(404).json({ message: "User not found" });
      const isMatch = await bcrypt.compare(oldPassword, user.password!);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: "Old password is incorrect" });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();
      res.json({ success: true, message: "Password updated successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

};
