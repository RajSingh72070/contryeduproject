import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'your_jwt_secret_key_here',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * @desc    Register a new user
 * @route   POST /register or /api/register
 * @access  Public
 */
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide name, email, and password',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 6 characters long',
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        status: 'error',
        message: 'Database is currently unavailable. Please try again later.',
      });
    }

    // 2. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({
        status: 'error',
        message: 'User already exists with this email address',
      });
    }

    // 3. Create user
    const user = await User.create({
      name,
      email,
      password, // hashed automatically in mongoose model pre-save hook
      role: role || 'user',
    });

    if (user) {
      // 4. Respond with user details & token
      const token = generateToken(user._id);
      return res.status(201).json({
        status: 'success',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token,
        },
      });
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid user data provided',
      });
    }
  } catch (error) {
    console.error('[Register Error]', error);

    if (error.name === 'MongooseError' || error.name === 'MongoServerSelectionError' || error.message?.includes('buffering timed out')) {
      return res.status(503).json({
        status: 'error',
        message: 'Database connection failed. Please try again later.',
      });
    }

    return res.status(500).json({
      status: 'error',
      message: 'Internal server error during registration',
    });
  }
};

/**
 * @desc    Authenticate user & get token (Login)
 * @route   POST /login or /api/login
 * @access  Public
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validation
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password',
      });
    }

    // 2. Find user & select password (specifically selecting it if schema doesn't auto-select it, although we set select: true in schema, it's good practice)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
    }

    // 3. Validate password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
    }

    // 4. Respond with user details & token
    const token = generateToken(user._id);
    return res.status(200).json({
      status: 'success',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture || '',
        token,
      },
    });
  } catch (error) {
    console.error('[Login Error]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error during login',
    });
  }
};

/**
 * @desc    Get user profile
 * @route   GET /profile or /api/profile
 * @access  Private
 */
export const getUserProfile = async (req, res) => {
  try {
    // req.user is loaded in protect middleware
    const user = await User.findById(req.user._id);

    if (user) {
      return res.status(200).json({
        status: 'success',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture || '',
          createdAt: user.createdAt,
        },
      });
    } else {
      return res.status(404).json({
        status: 'error',
        message: 'User profile not found',
      });
    }
  } catch (error) {
    console.error('[Profile Retrieval Error]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error retrieving user profile',
    });
  }
};

/**
 * @desc    Update user profile details
 * @route   PUT /profile or /api/profile
 * @access  Private
 */
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User profile not found',
      });
    }

    const { name, email } = req.body;

    if (name) user.name = name;

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(409).json({
          status: 'error',
          message: 'Email address is already in use by another operator',
        });
      }
      user.email = email;
    }

    await user.save();

    return res.status(200).json({
      status: 'success',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture || '',
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[Profile Update Error]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error updating user profile',
    });
  }
};

/**
 * @desc    Change user password
 * @route   PUT /profile/password or /api/profile/password
 * @access  Private
 */
export const changeUserPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide current and new passwords',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'New password must be at least 6 characters long',
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User profile not found',
      });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Incorrect current password provided',
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      status: 'success',
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('[Change Password Error]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error updating user password',
    });
  }
};

/**
 * @desc    Upload profile picture
 * @route   POST /profile/avatar or /api/profile/avatar
 * @access  Private
 */
export const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded or file type rejected',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User profile not found',
      });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;
    user.profilePicture = avatarUrl;
    await user.save();

    return res.status(200).json({
      status: 'success',
      data: {
        profilePicture: avatarUrl,
      },
    });
  } catch (error) {
    console.error('[Avatar Upload Error]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error uploading avatar',
    });
  }
};
