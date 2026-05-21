const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'users.json');

// Initialize users.json if it doesn't exist
const initDB = () => {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [] }, null, 2));
  }
};

// Read all users
const readUsers = () => {
  initDB();
  const data = fs.readFileSync(DB_FILE, 'utf8');
  return JSON.parse(data).users || [];
};

// Write users to file
const writeUsers = (users) => {
  fs.writeFileSync(DB_FILE, JSON.stringify({ users }, null, 2));
};

// Find user by email
const findUserByEmail = (email) => {
  const users = readUsers();
  return users.find(u => u.email === email.toLowerCase());
};

// Find user by ID
const findUserById = (id) => {
  const users = readUsers();
  return users.find(u => u.id === id);
};

// Create new user
const createUser = (userData) => {
  const users = readUsers();
  const newUser = {
    id: Date.now().toString(),
    ...userData,
    email: userData.email.toLowerCase(),
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  writeUsers(users);
  return newUser;
};

// Update user
const updateUser = (id, userData) => {
  const users = readUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return null;
  users[index] = { ...users[index], ...userData, id };
  writeUsers(users);
  return users[index];
};

// Delete user
const deleteUser = (id) => {
  const users = readUsers();
  const filtered = users.filter(u => u.id !== id);
  if (filtered.length === users.length) return false;
  writeUsers(filtered);
  return true;
};

module.exports = {
  initDB,
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  deleteUser,
  readUsers
};
