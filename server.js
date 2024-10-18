const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
const TelegramBot = require('node-telegram-bot-api');
const bcrypt = require('bcrypt'); // To hash passwords

// Replace with your bot token from BotFather
const token = '6967411094:AAHVyNYzXB3fqCVGYLmdTk63Ax7SIacbl08';  // Replace with actual bot token

// Create a bot that uses polling to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Connect to MongoDB
mongoose.connect('mongodb+srv://harshmanjhi1801:sukuna2279@cluster0.m8112.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', 
{ useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Middleware to parse JSON
app.use(bodyParser.json());

// Define Mongoose Schema and Model for users
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true // Ensure username is unique
  },
  password: {
    type: String,
    required: true
  }
});

const User = mongoose.model('users', userSchema);

// To store user states
const userStates = {};

// Function to send message and handle async bot replies
const askUser = (chatId, message, callback) => {
  bot.sendMessage(chatId, message).then(() => {
    userStates[chatId].callback = callback;
  });
};

// Listen for any kind of message
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text.toLowerCase();

  // Check if the user has an ongoing state
  if (!userStates[chatId]) {
    userStates[chatId] = { state: null };
  }

  const userState = userStates[chatId];

  // Registration Flow
  if (userState.state === 'register_username') {
    const username = text;
    User.findOne({ username }).then((existingUser) => {
      if (existingUser) {
        bot.sendMessage(chatId, 'Username already exists. Try another one.');
      } else {
        userState.username = username;
        userState.state = 'register_password';
        askUser(chatId, 'Set your password:', 'register_password');
      }
    });
  } else if (userState.state === 'register_password') {
    const password = text;
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) return bot.sendMessage(chatId, 'Error hashing password.');
      const newUser = new User({ username: userState.username, password: hashedPassword });
      newUser.save()
        .then(() => {
          bot.sendMessage(chatId, 'Registration successful! You can now log in.');
          userState.state = null;
        })
        .catch(err => bot.sendMessage(chatId, 'Error registering user.'));
    });
  }

  // Login Flow
  else if (userState.state === 'login_username') {
    const username = text;
    User.findOne({ username }).then((user) => {
      if (!user) {
        bot.sendMessage(chatId, 'Username not found. Please register.');
        userState.state = null;
      } else {
        userState.username = username;
        userState.state = 'login_password';
        askUser(chatId, 'Enter your password:', 'login_password');
      }
    });
  } else if (userState.state === 'login_password') {
    const password = text;
    User.findOne({ username: userState.username }).then((user) => {
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (isMatch) {
          bot.sendMessage(chatId, `Login successful! Welcome, ${userState.username}.`);
          userState.state = null;
        } else {
          bot.sendMessage(chatId, 'Incorrect password. Try again.');
        }
      });
    });
  }

  // Handle Register/Login Commands
  else if (text === 'register') {
    userState.state = 'register_username';
    askUser(chatId, 'Set your username:', 'register_username');
  } else if (text === 'login') {
    userState.state = 'login_username';
    askUser(chatId, 'Enter your username:', 'login_username');
  } else {
    bot.sendMessage(chatId, 'Please type "login" to log in or "register" to register.');
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

6967411094:AAHVyNYzXB3fqCVGYLmdTk63Ax7SIacbl08
