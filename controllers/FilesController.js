import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db.mjs';
import redisClient from '../utils/redis.mjs';

const fs = require('fs');
const mime = require('mime-types');

const postUpload = async (req, res) => {
  const authorizationHeader = req.get('X-Token');
  if (!authorizationHeader) return res.status(401).json({ error: 'Unauthorized' });

  const token = authorizationHeader.trim();
  const key = `auth_${token}`;

  const userCacheId = await redisClient.get(key);
  if (!userCacheId) return res.status(401).json({ error: 'Unauthorized' });
  
  const fileName = req.body.name || null;
  const fileType = req.body.type || null;
  const fileParentId = req.body.parentId || "0";
  const fileIsPublic = req.body.isPublic || false;
  const fileData = req.body.data || null;

  if (!fileName) return res.status(400).json({ error: 'Missing name' });
  const fileTypeAccept = ['folder', 'file', 'image'];
  if (!fileType || !fileTypeAccept.includes(fileType)) return res.status(400).json({ error: 'Missing type' });
  if (!fileData && fileType != 'folder') return res.status(400).json({ error: 'Missing data' });
  if (fileParentId !== "0") {
    const parentFile = await dbClient.getFileById(fileParentId);
    if (!parentFile) return res.status(400).json({ error: 'Parent is not a folder' });
    if (parentFile && parentFile.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
  }

  const fileInsert = {
    name: fileName, type: fileType, userId: userCacheId, parentId: fileParentId, isPublic: fileIsPublic,
  };

  if (fileType === 'folder') {
    const dbFolder = await dbClient.insertFiles(fileInsert);
    return res.status(201).json({
      id: dbFolder._id, userId: dbFolder.userId, name: dbFolder.name, type: dbFolder.type, isPublic: dbFolder.isPublic, parentId: dbFolder.parentId,
    });
  }

  const tmpPath = process.env.FOLDER_PATH || '/tmp/files_manager';
  const tmpFileName = uuidv4();
  const tmpFilePath = `${tmpPath}/${tmpFileName}`;

  const buffer = Buffer.from(fileData, 'base64').toString('utf-8');

  if (!fs.existsSync(tmpPath)) {
    fs.mkdirSync(tmpPath, { recursive: true });
  }

  fs.writeFileSync(tmpFilePath, buffer);

  fileInsert.localPath = tmpFilePath;

  const dbFile = await dbClient.insertFiles(fileInsert);

  return res.status(400).json({
    id: dbFile._id, userId: dbFile.userId, name: dbFile.name, type: dbFile.type, isPublic: dbFile.isPublic, parentId: dbFile.parentId,
  });
};

const getShow = async (req, res) => {
  const authorizationHeader = req.get('X-Token');
  if (!authorizationHeader) return res.status(401).json({ error: 'Unauthorized' });
  const token = authorizationHeader.trim();
  const key = `auth_${token}`;

  const userCacheId = await redisClient.get(key);
  if (!userCacheId) return res.status(401).json({ error: 'Unauthorized' });

  const fileId = req.params.id;
  const dbFile = await dbClient.getFile(userCacheId, fileId);
  if (!dbFile) return res.status(404).json({ error: 'Not found' });

  return res.status(200).json({
    id: dbFile._id, userId: dbFile.userId, name: dbFile.name, type: dbFile.type, isPublic: dbFile.isPublic, parentId: dbFile.parentId,
  });
};

const getIndex = async (req, res) => {
  const authorizationHeader = req.get('X-Token');
  if (!authorizationHeader) return res.status(401).json({ error: 'Unauthorized' });

  const token = authorizationHeader.trim();
  const key = `auth_${token}`;

  const userCacheId = await redisClient.get(key);
  if (!userCacheId || userCacheId.length === 0) return res.status(401).json({ error: 'Unauthorized' });

  let { parentId, page } = req.query;
  if (!parentId) parentId = 0;
  if (!page) page = 0;
  const maxItem = 20;
  const dbIndex = await dbClient.getAllFilesIndex(userCacheId, parentId, page, maxItem);
  if (!dbIndex) return res.status(404).json({ error: 'Not found' });
  
  const index = [];

  dbIndex.forEach(file => {
    index.push({
      id: file._id, userId: file.userId, name: file.name, type: file.type, isPublic: file.isPublic, parentId: file.parentId,
    })
  });

  return res.status(201).json(index);
};

const putPublish = async (req, res) => {
  const authorizationHeader = req.get('X-Token');
  if (!authorizationHeader) return res.status(401).json({ error: 'Unauthorized' });

  const token = authorizationHeader.trim();
  const key = `auth_${token}`;

  const userCacheId = await redisClient.get(key);
  if (!userCacheId) return res.status(401).json({ error: 'Unauthorized' });

  const fileId = req.params.id;
  const file = await dbClient.getFile(userCacheId, fileId);
  if (!file) return res.status(404).json({ error: 'Not found' });

  await dbClient.updatePublishFileStatus(file._id, true);

  const updateFile = await dbClient.getFile(userCacheId, fileId);
  return res.status(200).json({
    id: updateFile._id, userId: updateFile.userId, name: updateFile.name, type: updateFile.type, isPublic: updateFile.isPublic, parentId: updateFile.parentId,
  });
};

const putUnpublish = async (req, res) => {
  const authorizationHeader = req.get('X-Token');
  if (!authorizationHeader) return res.status(401).json({ error: 'Unauthorized' });

  const token = authorizationHeader.trim();
  const key = `auth_${token}`;

  const userCacheId = await redisClient.get(key);
  if (!userCacheId) return res.status(401).json({ error: 'Unauthorized' });

  const fileId = req.params.id;
  const file = await dbClient.getFile(userCacheId, fileId);
  if (!file) return res.status(404).json({ error: 'Not found' });

  await dbClient.updatePublishFileStatus(fileId, false);

  const updateFile = await dbClient.getFile(userCacheId, fileId);

  return res.status(200).json({
    id: updateFile._id, userId: updateFile.userId, name: updateFile.name, type: updateFile.type, isPublic: updateFile.isPublic, parentId: updateFile.parentId,
  });
};

const getFile = async (req, res) => {
  const fileId = req.params.id;
  if (!fileId) return res.status(404).json({ error: 'Not found' });

  const file = await dbClient.getFileById(fileId);
  if (!file) return res.status(404).json({ error: 'Not found' });

  if (file.type === 'folder') return res.status(400).json({ error: 'A folder doesn\'t have content' });

  if (!file.isPublic) {
    const authorizationHeader = req.get('X-Token');
    if (!authorizationHeader) return res.status(404).json({ error: 'Not found' });

    const token = authorizationHeader.trim();
    const key = `auth_${token}`;

    const userCacheId = await redisClient.get(key);
    if (!userCacheId) return res.status(404).json({ error: 'Not found' });
    if (userCacheId !== String(file.userId)) return res.status(404).json({ error: 'Not found' });
  }

  if (!fs.existsSync(file.localPath)) return res.status(404).json({ error: 'Not found' });

  const mimeType = mime.contentType(file.name) || 'application/octet-stream';
  res.setHeader('Content-Type', mimeType);
  const fileData = fs.readFileSync(file.localPath);
  return res.send(fileData);
};

module.exports = {
  postUpload, getShow, getIndex, putPublish, putUnpublish,getFile
};
