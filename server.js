const express = require('express');
const connectDB = require('./config/db');
const bodyParser = require('body-parser');
const passport = require('passport');
require('dotenv').config();


const app = express();

// Connect Database
connectDB();

// Middleware
app.use(bodyParser.json());
app.use(passport.initialize());

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/tasks', require('./routes/tasks'));

// Swagger setup
require('./swagger')(app);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
