const express = require('express');
const router = express.Router();

const AppController = require('../controllers/AppController.js');
const UsersController = require("../controllers/UsersController.js");
const AuthController = require("../controllers/AuthController.js")
const FilesController = require("../controllers/FilesController.js") 

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

router.get("/connect",AuthController.getConnect);
router.get("/disconnect",AuthController.getDisconnect);

router.post("/users",UsersController.postNew);
router.get("/users/me",UsersController.getMe);

router.post("/files",FilesController.postUpload);

module.exports = router;