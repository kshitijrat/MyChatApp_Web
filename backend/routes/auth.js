import express from 'express';
import { getAuth } from 'firebase-admin/auth';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    const user = await getAuth().createUser({
      email,
      password,
      displayName
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Verify token (middleware ke liye)
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;

    const decodedToken = await getAuth().verifyIdToken(token);

    res.status(200).json({
      success: true,
      uid: decodedToken.uid,
      email: decodedToken.email
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Get user by ID
router.get('/user/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const user = await getAuth().getUser(uid);

    res.status(200).json({
      success: true,
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    });

  } catch (error) {
    res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
});


// Get all users (dusra user dhundhne ke liye)
router.get('/users', async (req, res) => {
  try {
    const listUsers = await getAuth().listUsers();
    const users = listUsers.users.map(user => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    }));

    res.status(200).json({
      success: true,
      users
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;