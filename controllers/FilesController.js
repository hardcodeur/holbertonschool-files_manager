import { stringify } from "querystring";
import dbClient from "../utils/db.mjs";
import redisClient  from "../utils/redis.mjs";
import { v4 as uuidv4 } from 'uuid';

const fs = require("fs");

const postUpload = async (req,res) => {

    const authorizationHeader = req.get('X-Token');
    if(!authorizationHeader) return res.status(401).json({error : "Unauthorized"});

    const token = authorizationHeader.trim();
    const key = `auth_${token}`;

    const userCacheId = await redisClient.get(key);
    if(!userCacheId) return res.status(401).json({error : "Unauthorized"});


    const fileName = req.body.name || null;
    const fileType = req.body.type || null;
    const fileParentId = req.body.parentId || 0;
    const fileIsPublic = req.body.isPublic || false;
    const fileData = req.body.data || null;

    if(!fileName) return res.status(400).json({error : "Missing name"});

    const fileTypeAccept = ["folder","file","image"]
    if (!fileType || !fileTypeAccept.includes(fileType) ) return res.status(400).json({error : "Missing type"});

    if(!fileData && fileType != "folder" ) return res.status(400).json({error : "Missing data"});

    if(fileParentId){
        const parentFile = await dbClient.getFileById(fileParentId);
        if (!parentFile) return res.status(400).json({error : "Parent is not a folder"});
        if (parentFile && parentFile.type !== "folder") return res.status(400).json({error : "Parent is not a folder"});
    }

    const fileInsert = {name : fileName, type: fileType, userId : userCacheId, parentId:fileParentId, isPublic: fileIsPublic };

    if(fileType === "folder"){
        const dbFolder = await dbClient.insertFiles(fileInsert);
        return res.status(201).json({id: dbFolder._id ,userId : dbFolder.userId, name : dbFolder.name, type: dbFolder.type, isPublic: dbFolder.isPublic,parentId:dbFolder.parentId });
    }

    const tmpPath = process.env.FOLDER_PATH || "/tmp/files_manager";
    const tmpFileName = uuidv4();
    const tmpFilePath = `${tmpPath}/${tmpFileName}`;

    const buffer = Buffer.from(fileData, 'base64').toString('utf-8');

    if (!fs.existsSync(tmpPath)) {
        fs.mkdirSync(tmpPath, { recursive: true });
    }

    fs.writeFileSync(tmpFilePath, buffer);

    fileInsert.localPath = tmpFilePath;

    const dbFile = await dbClient.insertFiles(fileInsert);

    return res.status(401).json({id: dbFile._id ,userId : dbFile.userId, name : dbFile.name, type: dbFile.type, isPublic: dbFile.isPublic,parentId:dbFile.parentId });
}

const getShow = async (req,res)=>{
    const authorizationHeader = req.get('X-Token');
    if(!authorizationHeader) return res.status(401).json({error : "Unauthorized"});
    const token = authorizationHeader.trim();
    const key = `auth_${token}`;

    const userCacheId = await redisClient.get(key);
    if(!userCacheId) return res.status(401).json({ error: 'Unauthorized' });

    const fileId = req.params.id;
    const dbFile = await dbClient.getFile(userCacheId,fileId);
    if(!dbFile) return res.status(404).json({ error: 'Not found' });

    return res.json({id: dbFile._id ,userId : dbFile.userId, name : dbFile.name, type: dbFile.type, isPublic: dbFile.isPublic,parentId:dbFile.parentId })
}


const getIndex = async (req,res)=>{

    const authorizationHeader = req.get('X-Token');
    if(!authorizationHeader) return res.status(401).json({error : "Unauthorized"});

    const token = authorizationHeader.trim();
    const key = `auth_${token}`;

    const userCacheId = await redisClient.get(key);
    if(!userCacheId) return res.status(401).json({ error: 'Unauthorized' });

    let { parentId, page } = req.query;
    if (!parentId) parentId = 0;
    if (!page) page = 0;
    const maxItem = 20;
    const dbIndex = await dbClient.getAllFilesIndex(userCacheId,parentId,page,maxItem);

    return res.status(201).json(dbIndex);
}

module.exports = {postUpload,getShow,getIndex}