# Express.js + Database Connection Guide

This project demonstrates how to connect an Express.js server to a database with full CRUD operations.

## 📁 Project Structure

```
express-db-example/
├── package.json
├── README.md
└── src/
    ├── index.js           # Main Express server file
    └── config/
        └── database.js    # Database connection module
```

## 🗄️ Database Connection Explained

### 1. Installing Dependencies

```bash
npm install express sqlite3 cors dotenv
```

**Dependencies explained:**
- **express**: Web framework for Node.js
- **sqlite3**: SQLite database driver (file-based, no server needed)
- **cors**: Enable Cross-Origin Resource Sharing
- **dotenv**: Environment variable management

### 2. Creating the Connection

In [`src/config/database.js`](src/config/database.js):

```javascript
const sqlite3 = require('sqlite3').verbose();

// Create connection to database file
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error connecting:', err.message);
  } else {
    console.log('Connected to database');
  }
});
```

**How it works:**
- SQLite creates a file-based database (`database.sqlite`)
- The `verbose()` method enables extended error messages
- The callback confirms connection success or failure

### 3. Using Promises for Async Operations

SQLite3 uses callbacks, but we wrap them in Promises for cleaner async/await syntax:

```javascript
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}
```

**Helper functions explained:**
- `run()`: INSERT, UPDATE, DELETE - returns last ID and changes count
- `get()`: SELECT single row
- `all()`: SELECT multiple rows

## 🚀 Running the Server

### 1. Install dependencies
```bash
cd express-db-example
npm install
```

### 2. Start the server
```bash
npm start
```

### 3. Test the API

**Get all users:**
```bash
curl http://localhost:3000/api/users
```

**Create a user:**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "password": "123456"}'
```

## 📚 API Endpoints

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users |
| GET | `/api/users/:id` | Get user by ID |
| POST | `/api/users` | Create user |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products |
| POST | `/api/products` | Create product |

## 🔧 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Products Table
```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔐 Using Parameterized Queries

**Always use parameterized queries to prevent SQL injection:**

```javascript
// ✅ SAFE - Using ?
const user = await get('SELECT * FROM users WHERE id = ?', [userId]);

// ❌ UNSAFE - String concatenation
const user = await get(`SELECT * FROM users WHERE id = ${userId}`);
```

## 🔄 Switching to Other Databases

### PostgreSQL
```bash
npm install pg
```

```javascript
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

### MySQL
```bash
npm install mysql2
```

```javascript
const mysql = require('mysql2/promise');
const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'mydb'
});
```

### MongoDB
```bash
npm install mongoose
```

```javascript
const mongoose = require('mongoose');
await mongoose.connect(process.env.MONGODB_URI);
```

## 📝 Environment Variables

Create a `.env` file:

```env
PORT=3000
DB_PATH=./database.sqlite
```

Load in code:
```javascript
require('dotenv').config();
const PORT = process.env.PORT || 3000;
```

## ✅ Best Practices

1. **Always close database connections** when shutting down
2. **Use parameterized queries** to prevent SQL injection
3. **Handle errors** with try/catch blocks
4. **Use async/await** for cleaner asynchronous code
5. **Validate input** before inserting into database
6. **Use environment variables** for sensitive data
7. **Create indexes** on frequently queried columns

## 📖 Learning Resources

- [Express.js Documentation](https://expressjs.com/)
- [SQLite Tutorial](https://www.sqlite.org/tutorial.html)
- [Node.js Database Integration](https://nodejs.org/docs/latest/api/cli.html)
