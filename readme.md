https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial

https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D

https://www.w3schools.com/html/html5_canvas.asp


✅ express
🔧 Web framework for building APIs (server)

Lets you create routes like /api/signup, /api/login

Lightweight and powerful

Handles requests and responses in Node.js

ts
Copy
Edit
import express from 'express';
const app = express();
app.get('/', (req, res) => res.send('Hello World'));
✅ mysql2
🔌 MySQL client for Node.js

Connects your Node.js server to your MySQL database

Allows you to run SELECT, INSERT, etc.

Supports modern async/await syntax (better than mysql package)

ts
Copy
Edit
import mysql from 'mysql2/promise';
const conn = await mysql.createConnection(...);
✅ bcrypt
🔒 Hashing library for passwords

Encrypts passwords so you never store plain-text

Safeguards user data if your database is leaked

You’ll use it during signup and login to hash/compare passwords

ts
Copy
Edit
const hash = await bcrypt.hash("password123", 10);
const isValid = await bcrypt.compare("password123", hash);
✅ express-session
🧠 Session management middleware

Stores data between requests (like user login state)

Used to keep users signed in as they navigate your app

Works with cookies behind the scenes

ts
Copy
Edit
app.use(session({
  secret: 'keyboard cat',
  saveUninitialized: false,
  resave: false
}));
✅ dotenv
📁 Loads environment variables from .env file

Keeps sensitive config (like DB passwords) out of your code

Access with process.env.MY_VAR

ts
Copy
Edit
// .env
DB_PASS=my_secret
ts
Copy
Edit
import dotenv from 'dotenv';
dotenv.config();
console.log(process.env.DB_PASS);
Summary Table
Package	Purpose
express	Build backend server / API routes
mysql2	Connect to MySQL database
bcrypt	Secure password hashing
express-session	Handle login sessions
dotenv	Manage environment configs (e.g., DB