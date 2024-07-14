const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Category = require('../models/Category');
const Task = require('../models/Task');
const connectDB = require('../config/db');

// Connect to the database
connectDB();

const createDummyData = async () => {
    try {
        // Clear existing data
        await User.deleteMany({});
        await Category.deleteMany({});
        await Task.deleteMany({});

        // Create users
        const users = [
            { name: 'John Doe', email: 'john@example.com', password: 'password123' },
            { name: 'Jane Doe', email: 'jane@example.com', password: 'password123' }
        ];

        for (let user of users) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
        }

        const createdUsers = await User.insertMany(users);

        // Create categories
        const categories = [
            { name: 'Work', user: createdUsers[0]._id },
            { name: 'Personal', user: createdUsers[0]._id },
            { name: 'Hobby', user: createdUsers[1]._id },
            { name: 'Fitness', user: createdUsers[1]._id }
        ];

        const createdCategories = await Category.insertMany(categories);

        // Create tasks
        const tasks = [
            { title: 'Complete project report', type: 'text', body: 'Finish the report by EOD', shared: false, category: createdCategories[0]._id, user: createdUsers[0]._id },
            { title: 'Buy groceries', type: 'list', body: ['Milk', 'Bread', 'Eggs'], shared: true, category: createdCategories[1]._id, user: createdUsers[0]._id },
            { title: 'Read a book', type: 'text', body: 'Read 20 pages of a book', shared: true, category: createdCategories[2]._id, user: createdUsers[1]._id },
            { title: 'Morning run', type: 'list', body: ['5 km run', 'Stretching'], shared: false, category: createdCategories[3]._id, user: createdUsers[1]._id }
        ];

        await Task.insertMany(tasks);

        console.log('Dummy data inserted successfully');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

createDummyData();
