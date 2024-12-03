import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db.mjs';
import redisClient from '../utils/redis';

function isBase64(str) {
  return str.match(/^[A-Za-z0-9+/=]+$/);
}

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
  if(isBase64(userLoginEncode)) return res.status(401).json({ error: 'Unauthorized' });
  const userLogin = atob(userLoginEncode);
  const login = userLogin.split(':');
  const email = login[0];
  const pass = login[1];

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
  return res.status(204);
};

module.exports = { getConnect, getDisconnect };
