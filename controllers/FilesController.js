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
        const parentFile = await dbClient.findFileById(fileParentId);
        if (!parentFile) return res.status(400).json({error : "Parent is not a folder"});
        if (parentFile && parentFile.type !== "folder") return res.status(400).json({error : "Parent is not a folder"});
    }

    const fileInsert = {userId : userCacheId, name : fileName, type: fileType, isPublic: fileIsPublic,parentId:fileParentId };

    if(fileType === "folder"){
        const dbFolder = await dbClient.insertFiles(fileInsert);
        return res.status(201).json({id: dbFolder._id ,userId : dbFolder.userId, name : dbFolder.name, type: dbFolder.type, isPublic: dbFolder.isPublic,parentId:dbFolder.parentId });
    }else{

        const folderPath = process.env.FOLDER_PATH || "/tmp/files_manager";
        const newFileName = uuidv4();
        const filePath = `${folderPath}/${newFileName}`;
    
        const buffer = Buffer.from(fileData, 'base64').toString('utf-8');
    
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }
    
        fs.writeFileSync(filePath, buffer);
    
        fileInsert.localPath = filePath;
    
        const dbFile = await dbClient.insertFiles(fileInsert);
    
        return res.status(401).json({id: dbFile._id ,userId : dbFile.userId, name : dbFile.name, type: dbFile.type, isPublic: dbFile.isPublic,parentId:dbFile.parentId });

    }


}

module.exports = {postUpload}