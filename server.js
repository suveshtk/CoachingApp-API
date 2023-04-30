const express = require('express')
const app = express()
const mongoose = require('mongoose');
const User = require('./models/userModel.js');
const Batch = require('./models/batchModel.js');
const Material = require('./models/materialModel.js');

app.use(express.json());

mongoose.connect('mongodb://localhost:27017/sciencetrack')
    .then(() => {
        console.log('Connected!');
        app.listen(3000);
    }).catch((err) => {
        console.log(err)
    });

app.post('/addUser', async (req, res) => {
    try {
        const user = await User.create(req.body);
        res.status(200).json(user);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: { message: error.message } });
    }
})

app.get('/getActiveUserDetails', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email, isActive: true });
        if (user)
            res.status(200).json(user);
        else
            res.status(200).json({ error: { message: 'No active users found with email id ' + req.body.email } });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message });
    }
})

app.post('/addBatch', async (req, res) => {
    try {
        const batch = await Batch.create(req.body);
        res.status(200).json(batch);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: { message: error.message } });
    }
})

app.post('/getActiveBatches', async (req, res) => {
    try {
        const batch = await Batch.find({ isActive: true });
        if (batch.length > 0)
            res.status(200).json(batch);
        else
            res.status(200).json({ error: { message: 'No active batches found!' } });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message });
    }
})

app.post('/addMaterial', async (req, res) => {
    try {
        const material = await Material.create(req.body);
        res.status(200).json(material);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: { message: error.message } });
    }
})

app.post('/getActiveMaterial', async (req, res) => {
    try {
        const materials = await Material.find({ isActive: true });
        if (materials.length > 0)
            res.status(200).json(materials);
        else
            res.status(200).json({ error: { message: 'No active batches found!' } });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message });
    }
})