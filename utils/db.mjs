import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    this.is_connected = false;
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || '27017';
    this.database = process.env.DB_DATABASE || 'files_manager';

    this.client = new MongoClient(`mongodb://${this.host}:${this.port}`, { useUnifiedTopology: true });
  }

  isAlive() {
    try {
      this.client.connect();
      this.client.db(this.database).command({ ping: 1 });
      return true;
    } catch (error) {
      console.log(`Error connecting to MongoDB: ${error}`);
      return false;
    }
  }

  async nbUsers() {
    await this.client.connect();
    const db = this.client.db(this.database);
    const usersCollection = db.collection('users');
    const userCount = await usersCollection.countDocuments();
    await this.client.close();
    return userCount;
  }

  async nbFiles() {
    await this.client.connect();
    const db = this.client.db(this.database);
    const usersCollection = db.collection('files');
    const fileCount = await usersCollection.countDocuments();
    await this.client.close();
    return fileCount;
  }
}

const dbClient = new DBClient();
export { dbClient as default };