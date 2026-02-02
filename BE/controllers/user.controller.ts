import { Request, Response } from 'express';
import User from '../models/user.model';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


export const UserController = {
  register: async (req: Request, res: Response) => {
    try {
      const user = new User(req.body);
      await user.save();
      res.status(201).json({ success: true, message: "User registered successfully" });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
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
      const { email, displayName } = req.body;
      let user = await User.findOne({ email });
      if (!user) {
        user = new User({ email, displayName, password: Math.random().toString(36).slice(-8) });        
        await user.save();
      }

      const token = jwt.sign(
        { userId: user.userId, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '1d' }
      );
      
      res.json({ 
        success: true, 
        message: "Login with Google successful",
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
  updateProfile: async (req: Request, res: Response) => {
    try {
      const user = await User.findOneAndUpdate(
        { userId: req.params.id },
        req.body,
        { new: true }
      ).select('-password');
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json({ success: true, message: "Profile updated successfully"});
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};