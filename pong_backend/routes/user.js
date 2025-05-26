import { hashPassword, comparePasswords } from '../utils/password.js';

// When creating a new user:
async function registerUser(req, res) {
  const { username, password } = req.body;

  // Hash it before saving
  const hashedPassword = await hashPassword(password);

  // Save user to db with hashed password
  await saveUserToDB({ username, password: hashedPassword });

  res.status(201).send('User registered');
}

// logging in:
async function loginUser(req, res) {
  const { username, password } = req.body;

  const user = await findUserByUsername(username);
  if (!user) {
    return res.status(401).send('Invalid username or password');
  }

  // Compare the password
  const isMatch = await comparePasswords(password, user.password);
  if (!isMatch) {
    return res.status(401).send('Invalid username or password');
  }

  // Login success — generate token, session, etc.
  res.send('Logged in');
}
