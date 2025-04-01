const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

// Ellenőrzi, hogy a felhasználónév érvényes-e (pl. nem üres)
const isValid = (username) => {
  return username && typeof username === "string";
};

// Ellenőrzi, hogy a felhasználónév és jelszó páros helyes-e
const authenticatedUser = (username, password) => {
  const user = users.find(u => u.username === username && u.password === password);
  return user !== undefined;
};

// Felhasználó bejelentkezés
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  // JWT létrehozása és tárolása a session-ben
  const accessToken = jwt.sign({ username }, "secret_key", { expiresIn: "1h" });

  req.session.authorization = { accessToken, username };
  
  return res.status(200).json({ message: "Login successful", token: accessToken });
});

// Könyvértékelés hozzáadása vagy módosítása
regd_users.put("/auth/review/:isbn", (req, res) => {
  const { review } = req.query;
  const isbn = req.params.isbn;

  if (!req.session.authorization) {
    return res.status(401).json({ message: "Unauthorized access" });
  }

  const username = req.session.authorization.username;

  if (!books[isbn]) {
    return res.status(404).json({ message: "Book not found" });
  }

  if (!books[isbn].reviews) {
    books[isbn].reviews = {};
  }

  // Felhasználó korábbi értékelésének frissítése vagy új hozzáadása
  books[isbn].reviews[username] = review;

  return res.status(200).json({ message: "Review added/updated successfully", reviews: books[isbn].reviews });
});

// Könyvértékelés törlése
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;

  if (!req.session.authorization) {
    return res.status(401).json({ message: "Unauthorized access" });
  }

  const username = req.session.authorization.username;

  if (!books[isbn] || !books[isbn].reviews || !books[isbn].reviews[username]) {
    return res.status(404).json({ message: "No review found to delete" });
  }

  // Felhasználó saját értékelésének törlése
  delete books[isbn].reviews[username];

  return res.status(200).json({ message: "Review deleted successfully", reviews: books[isbn].reviews });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
