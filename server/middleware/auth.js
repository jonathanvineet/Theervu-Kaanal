import jwt from 'jsonwebtoken';
import Petitioner from '../models/Petitioner.js';
import Official from '../models/Official.js';
import Admin from '../models/Admin.js';
import { JWT_SECRET, JWT_OPTIONS } from '../config/jwt.js';
import { supabase } from '../config/supabase.js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import mongoose from 'mongoose';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure dotenv to look for .env file in the server root directory
dotenv.config({ path: path.join(__dirname, '../.env') });

export const generateToken = (user) => {
    if (!user || !user._id) {
        throw new Error('Invalid user object');
    }

    const payload = {
        id: user._id.toString(),
        role: (user.role || 'petitioner').toLowerCase(),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    return jwt.sign(payload, JWT_SECRET, JWT_OPTIONS);
};

export const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET, JWT_OPTIONS);
        return {
            ...decoded,
            id: decoded.id.toString(),
            role: decoded.role.toLowerCase()
        };
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token has expired');
        }
        throw new Error('Invalid token');
    }
};

export const auth = async (req, res, next) => {
    try {
        // Log request headers for debugging
        console.log('Auth Headers:', req.headers);

        const authHeader = req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ No Bearer token found');
            return res.status(401).json({
                message: 'No authentication token provided',
                code: 'TOKEN_MISSING'
            });
        }

        const token = authHeader.replace('Bearer ', '');

        // Verify Supabase token
        const { data: { user: supabaseUser }, error: supabaseError } = await supabase.auth.getUser(token);

        if (supabaseError || !supabaseUser) {
            console.error('Supabase token verification failed:', supabaseError?.message);
            return res.status(401).json({
                message: 'Invalid or expired token',
                code: 'INVALID_TOKEN'
            });
        }

        // Get user role and details from metadata or database
        const userEmail = supabaseUser.email;
        
        // Look up user in MongoDB to get role and other details
        let user;
        let userRole;

        // Try to find user in each collection
        user = await Petitioner.findOne({ email: userEmail });
        if (user) {
            userRole = 'petitioner';
        } else {
            user = await Official.findOne({ email: userEmail });
            if (user) {
                userRole = 'official';
            } else {
                user = await Admin.findOne({ email: userEmail });
                if (user) {
                    userRole = 'admin';
                }
            }
        }

        if (!user) {
            console.error('User not found in database:', userEmail);
            return res.status(401).json({
                message: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        // Add user info to request
        req.user = {
            id: user._id.toString(),
            supabaseId: supabaseUser.id,
            role: userRole,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            ...(user.department && { department: user.department })
        };

        console.log('✅ Authentication successful for user:', user.email);
        next();
    } catch (error) {
        console.error('Token verification failed:', error);
        res.status(401).json({
            message: 'Invalid token',
            code: 'INVALID_TOKEN'
        });
    }
};

export default auth; 