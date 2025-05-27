import express, {Request, Response} from 'express';
import { db } from '../db';
import bcrypt from 'bcrypt';
import 'express-session';

declare module 'express-session' {
	interface SessionData {
		userId: number;
	}
};


const router = express.Router();

router.post('/signup', async (req: Request, res: any) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ message: "Username and password required" });

  // try {

  //   const [existingUser] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
  //   if ((existingUser as any[]).length > 0) 
  //       return res.status(409).json({ message: "Username already taken" });

  //   const password_hash = await bcrypt.hash(password, 10);
  //   await db.query('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, password_hash]);

  //   return res.status(201).json({ message: "User registered successfully" });
  // } catch (err) {
  //   console.error(err);
  //   return res.status(500).json({ message: "Internal server error" });
  // }
});


router.post('/login', async (req: Request, res: any) => {
  const { username, password } = req.body;

  // try {
  //   const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
  //   const user = (rows as any[])[0];
  //   if (!user) return res.status(401).json({ message: "Invalid username" });

  //   const valid = await bcrypt.compare(password, user.password_hash);
  //   if (!valid) return res.status(401).json({ message: "Invalid password" });

  //   req.session.userId = user.id;
  //   return res.json({ message: "Login successful", user: { id: user.id, username: user.username } });
  // } catch (err) {
  //   console.error(err);
  //   return res.status(500).json({ message: "Internal server error" });
  // }
});


router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Failed to logout" });
    }
    return res.json({ message: "Logged out" });
  });
});



// Get current logged-in user
router.get('/me', async (req: Request, res: any) => {
  if (!req.session.userId) {
    return res.json({ loggedIn: false });
  }

  // try {
  //   const [rows] = await db.query('SELECT username FROM users WHERE id = ?', [req.session.userId]);
  //   const user = (rows as any[])[0];
  //   if (!user) {
  //     return res.json({ loggedIn: false });
  //   }
  //   return res.json({ loggedIn: true, userId: req.session.userId, username: user.username });
  // } catch (err) {
  //   console.error(err);
  //   return res.status(500).json({ loggedIn: false });
  // }
});

export default router;