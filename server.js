const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
const TelegramBot = require('node-telegram-bot-api');


// Replace with your bot token from BotFather
const token = '6967411094:AAHVyNYzXB3fqCVGYLmdTk63Ax7SIacbl08';


// Create a bot that uses polling to fetch new updates
const bot = new TelegramBot(token, { polling: true });


// Connect to MongoDB
mongoose.connect('mongodb+srv://harshmanjhi1801:sukuna2279@cluster0.m8112.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', 
{ useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Middleware to parse JSON
app.use(bodyParser.json());



// Listen for any kind of message
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  // Send a simple response to the message
  bot.sendMessage(chatId, 'Hello, this is your bot!');
});


// Define Mongoose Schema and Model for transaction_collection
const transactionSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true // Ensure username is unique
  },
  score: {
    type: String,
    required: true
  }
});

const Transaction = mongoose.model('transaction_collection', transactionSchema);

// Define routes
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Handle POST request - Update if username exists, otherwise create new
app.post('/data', (req, res) => {
  const { username, score } = req.body;
  console.log(req);

  // Find by username and update the score, or create new if not found
  Transaction.findOneAndUpdate(
    { username },                  // Condition: Find by username
    { score },                     // Update: Set the new score
    { new: true, upsert: true }    // Options: create if not found (upsert), return the new document
  )
  .then((result) => {
    if (result) {
      res.send(`Data for ${username} updated successfully.`);
      console.log('ok');
    }
  })
  .catch(err => {
    console.error(err);
    res.status(500).send('Error updating data');
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
