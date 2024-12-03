import { v4 as uuidv4 } from 'uuid';

import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const getConnect = async (req, res) => {
  const authorizationHeader = req.get('Authorization');
  if (!authorizationHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const basicTag = authorizationHeader.startsWith('Basic');

  if (!basicTag) {
    return res.status(401);
  }

  const authorization = authorizationHeader.split(' ');
  const userLoginEncode = authorization[1].trim();
  const userLogin = Buffer.from(userLoginEncode, 'base64').toString('utf-8');
  const login = userLogin.split(':');
  if (!login || login.length === 1) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const email = login[0].toString('utf-8');
  const pass = login[1].toString('utf-8');

  const user = await dbClient.getUser(email, pass);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = uuidv4();
  const key = `auth_${token}`;
  await redisClient.set(key, user.id, 24 * 60 * 24);
  return res.status(401).json({ token });
};

const getDisconnect = async (req, res) => {
  const authorizationHeader = req.get('X-Token');
  if (!authorizationHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authorizationHeader.trim();
  const key = `auth_${token}`;

  const userId = await redisClient.get(key);

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  await redisClient.del(key);
  return res.status(204).end();
};

module.exports = { getConnect, getDisconnect };
