import { MongoClient } from 'mongodb';

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 27017;
const database = process.env.DB_DATABASE || 'files_manager';

class DBClient {
  constructor() {
    MongoClient.connect(`mongodb://${host}:${port}`, { useUnifiedTopology: true }, (err, client) => {
      this.db = client.db(database);
    });
  }

  isAlive() {
    return !!this.db;
  }

  async nbUsers() {
    const collection = this.db.collection('users');
    const usersCount = await collection.countDocuments({});
    return usersCount;
  }

  async nbFiles() {
    const collection = this.db.collection('files');
    const filesCount = await collection.countDocuments();
    return filesCount;
  }
}

const dbClient = new DBClient();
export { dbClient as default };