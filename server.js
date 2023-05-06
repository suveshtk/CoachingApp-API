const express = require('express')
const app = express()
const mongoose = require('mongoose');
const User = require('./models/userModel.js');
const Batch = require('./models/batchModel.js');
const Material = require('./models/materialModel.js');
const fileUpload = require("express-fileupload");
const path = require("path");
const { OAuth2Client } = require('google-auth-library');
const CLIENT_ID = process.env.CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);

app.use(express.json());
app.use(fileUpload());
app.use(express.static('uploads'));


mongoose.connect('mongodb://localhost:27017/sciencetrack')
    .then(() => {
        console.log('Connected!');
        app.listen(3000);
    }).catch((err) => {
        console.log(err)
    });

app.get('/', async (req, res) => {
    res.sendFile(__dirname+'/index.html');
})

app.post('/addUser', async (req, res) => {
    try {
        const isAuthenticated = await verifyUserAuthentication(req);
        if (!isAuthenticated) {
            throw new Error('User authentication failed');
        }

        const user = await User.create(req.body);
        res.status(200).json(user);
    } catch (error) {
        console.log(error);
        res.status(200).json({ error: { message: error.message } });
    }
})

app.post('/getActiveUserDetails', async (req, res) => {
    try {
        const isAuthenticated = await verifyUserAuthentication(req);
        if (!isAuthenticated) {
            throw new Error('User authentication failed');
        }

        const user = await User.findOne({ email: req.body.email, isActive: true });
        if (user)
            res.status(200).json({ result : user } );
        else
            res.status(200).json({ error: { message: 'No active users found with email id ' + req.body.email } });
    } catch (error) {
        console.log(error)
        res.status(200).json({ message: error.message });
    }
})

app.post('/addBatch', async (req, res) => {
    try {
        const isAuthenticated = await verifyUserAuthentication(req);
        if (!isAuthenticated) {
            throw new Error('User authentication failed');
        }

        const batch = await Batch.create(req.body);
        res.status(200).json(batch);
    } catch (error) {
        console.log(error);
        res.status(200).json({ error: { message: error.message } });
    }
})

app.get('/getActiveBatches', async (req, res) => {
    try {
        const isAuthenticated = await verifyUserAuthentication(req);
        if (!isAuthenticated) {
            throw new Error('User authentication failed');
        }

        const batch = await Batch.find({ isActive: true });
        if (batch.length > 0)
            res.status(200).json( { result : batch } );
        else
            res.status(200).json({ error: { message: 'No active batches found!' } });
    } catch (error) {
        console.log(error)
        res.status(200).json({ message: error.message });
    }
})

app.post('/addMaterialVideo', async (req, res) => {
    try {
        const isAuthenticated = await verifyUserAuthentication(req);
        if (!isAuthenticated) {
            throw new Error('User authentication failed');
        }

        var newFileName;
        if(req.files) {
            var file = req.files.file;
            newFileName = Date.now() + "_" + file.name;
            file.mv('./uploads/' + newFileName,(error) => {
                if(error){
                    console.log(error);
                    throw error;
                }
            });
        } else {
            throw new Error('Attachment not found!');
        }
        req.body["url"] = '/uploads/' + newFileName;
        var batchesArray = req.body.batches.split(",");
        req.body["batches"] = batchesArray;
        const material = await Material.create(req.body);
        res.status(200).send("Material added successfully!");
    } catch (error) {
        console.log(error);
        res.status(200).send(error.message)
    }
})

app.post('/getMaterialsVideos', async (req, res) => {
    try {
        const isAuthenticated = await verifyUserAuthentication(req);
        if (!isAuthenticated) {
            throw new Error('User authentication failed');
        }
        
        var batch;
        if(req.body.userType.toLowerCase == 'student')
            batch = await Batch.find({ name:req.body.name, isActive: true });
        else
            batch = await Batch.find({ isActive: true });

        if(batch.length > 0)
        {
            var materials;
            if(req.body.userType.toLowerCase == 'student')
                materials = await Material.find({ batches:req.body.name, materialType:req.body.materialType } ).sort({createdAt: -1});
            else
                materials = await Material.find({ materialType:req.body.materialType } ).sort({createdAt: -1});

            if (materials.length > 0)
                res.status(200).json( { result : materials } );
            else
                throw new Error('No Materials found!!');
        } else {
            throw new Error('No active batches found!!');
        }
    } catch (error) {
        console.log(error)
        res.status(200).json({ message: error.message });
    }
})

app.get('/uploads/:filename', function(req, res) {
    var filename = req.params.filename;
    var file = __dirname + '/uploads/' + filename;
    res.sendFile(file);
});

async function verifyUserAuthentication(req) {
    const { authorization } = req.headers;
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return false; // Authentication failed
    }
  
    const token = authorization.split(' ')[1];
  
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID,
      });
  
      const payload = ticket.getPayload();
  
      const user = await User.findOne({ email: payload.email, isActive: true });
      if(user)
        return true; // Authentication successful
      else
        return false; // Authentication failed
    } catch (error) {
      console.error('Error verifying user authentication:', error);
      return false; // Authentication failed
    }
  }