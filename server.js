const express = require('express')
const app = express()
const mongoose = require('mongoose');
const User = require('./models/userModel.js');
const Batch = require('./models/batchModel.js');
const Material = require('./models/materialModel.js');
const fileUpload = require("express-fileupload");
const path = require("path");
const { OAuth2Client } = require('google-auth-library');
const ffmpeg = require('fluent-ffmpeg');
const { spawn } = require('child_process');

const CLIENT_ID = process.env.CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);

app.use(express.json());
app.use(fileUpload());
app.use(express.static('uploads'));
app.use(express.static('thumbnails'));


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

app.post('/getAllActiveUsers', async (req, res) => {
    try {
        const isAuthenticated = await verifyUserAuthentication(req);
        if (!isAuthenticated) {
            throw new Error('User authentication failed');
        }
        
        var users = await User.find({ isActive: true } ).sort({createdAt: -1});

        if (users.length > 0)
            res.status(200).json( { result : users } );
        else
            throw new Error('No Materials found!!');
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

app.get('/getAllActiveBatches', async (req, res) => {
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

app.delete('/batch/:id', async (req, res) => {
    try {

        const isAuthenticated = await verifyUserAuthentication(req);
        if (!isAuthenticated) {
            throw new Error('User authentication failed');
        }

        const deletedBatch = await Batch.findOneAndDelete({ name: req.params.id });
        if (!deletedBatch) {
            return res.status(200).send('Batch not found!');
        }
    
        return res.status(200).send('Batch deleted successfully - ' + req.params.id);
    } catch (error) {
        console.error('Error deleting batch:', error);
        res.status(200).send(error.message);
    }
});

app.post('/addMaterialVideo', async (req, res) => {
    try {
        const isAuthenticated = await verifyUserAuthentication(req);
        if (!isAuthenticated) {
            throw new Error('User authentication failed');
        }

        var newFileName, thumbnailName, thumbnailPath;
        if(req.files) {
            var file = req.files.file;
            newFilePath = './uploads/' + Date.now() + "_" + file.name;
            thumbnailPath = './thumbnails/' + Date.now() + '_Thumbnail.jpg';

            // Move the uploaded file to the desired location
            await moveFile(file, newFilePath);

            // Generate thumbnail
            if(req.body.materialType.toLowerCase() == 'video') {
                thumbnailSavedPath = await createThumbnail(newFilePath, thumbnailPath);
            }

        } else {
            throw new Error('Attachment not found!');
        }

        req.body["url"] = newFilePath;
        if(req.body.materialType.toLowerCase() == 'video') {
            req.body["thumbnail"] = thumbnailSavedPath;
        } else {
            req.body["thumbnail"] = null;
        }
        var batchesArray = req.body.batches.split(",");
        req.body["batches"] = batchesArray;
        const material = await Material.create(req.body);
        res.status(200).send("Material added successfully!");
    } catch (error) {
        console.log(error);
        res.status(200).send(error.message)
    }
})

app.post('/getAllActiveMaterials', async (req, res) => {
    try {
        const isAuthenticated = await verifyUserAuthentication(req);
        if (!isAuthenticated) {
            throw new Error('User authentication failed');
        }
        
        var materials = await Material.find({ isActive: true } ).sort({createdAt: -1});

        if (materials.length > 0)
            res.status(200).json( { result : materials } );
        else
            throw new Error('No Materials found!!');
    } catch (error) {
        console.log(error)
        res.status(200).json({ message: error.message });
    }
})

app.post('/getMaterialsVideosBasedOnBatch', async (req, res) => {
    try {
        const isAuthenticated = await verifyUserAuthentication(req);
        if (!isAuthenticated) {
            throw new Error('User authentication failed');
        }
        
        var batch;
        if(req.body.userType.toLowerCase() == 'student')
            batch = await Batch.find({ name:req.body.name, isActive: true });
        else
            batch = await Batch.find({ isActive: true });

        if(batch.length > 0)
        {
            var materials;
            if(req.body.userType.toLowerCase() == 'student')
                materials = await Material.find({ batches:req.body.name, materialType:req.body.materialType, isActive: true } ).sort({createdAt: -1});
            else
                materials = await Material.find({ materialType:req.body.materialType, isActive: true } ).sort({createdAt: -1});

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

app.get('/thumbnails/:filename', function(req, res) {
    var filename = req.params.filename;
    var file = __dirname + '/thumbnails/' + filename;
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

function moveFile(file, filePath) {
    return new Promise((resolve, reject) => {
        file.mv(filePath,(error) => {
            if(error){
                console.log(error);
                reject(error);
            } else{
                resolve();
            }
        });
    });
  }

function createThumbnail (videoPath, filename) {
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
            '-i',
            videoPath,
            '-ss',
            '00:00:02', // Set the time offset for the thumbnail (e.g., 5 seconds)
            '-vframes',
            '1', // Set the number of frames to capture
            '-vf',
            'scale=320:-1', // Set the dimensions of the thumbnail (e.g., width: 320px, maintain aspect ratio)
            filename,
        ]);
    
        ffmpeg.stderr.on('data', (data) => {
            // console.log(`ffmpeg stderr: ${data}`);
        });
        
        ffmpeg.on('message', (message) => {
            // console.log(`ffmpeg message: ${message}`);
        });
    
        ffmpeg.on('close', (code) => {
            if (code === 0) {
                console.log('Thumbnail generation completed successfully');
                resolve(filename);
            } else {
                reject(new Error(`Thumbnail generation failed with code ${code}`));
            }
        });
    
        ffmpeg.on('error', (error) => {
            reject(error);
        });
    });
  }