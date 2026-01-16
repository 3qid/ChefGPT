import User from '../models/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const signUp = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword, authType: 'local' });
        
        await newUser.save();
        res.status(201).json({ message: "User created successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

export const signIn = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || user.authType !== 'local') return res.status(400).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid password" });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(200).json({ token, user: { name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

export const googleAuth = async (req, res) => {
    try {
        const { idToken } = req.body;
        const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
        const { email, name, sub: googleId, picture } = ticket.getPayload();

        let user = await User.findOne({ email });
        if (!user) {
            user = new User({ name, email, googleId, picture, authType: 'google' });
            await user.save();
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(200).json({ token, user: { name: user.name, email: user.email, picture } });
    } catch (error) {
        res.status(401).json({ message: "Invalid Google token" });
    }
};