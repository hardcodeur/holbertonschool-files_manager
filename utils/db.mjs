import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    this.is_connected = false;
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || '27017';
    this.database = process.env.DB_DATABASE || 'files_manager';
    this.client = new MongoClient(`mongodb://${this.host}:${this.port}`, { useUnifiedTopology: true });
  }

  isAlive(callback) {
    this.client.connect((err) => {
      if (err) {
        console.log(`Error connecting to MongoDB: ${err}`);
        callback(false);
      } else {
        this.client.db(this.database).command({ ping: 1 }, (err, result) => {
          if (err) {
            console.log(`Error pinging MongoDB: ${err}`);
            callback(false);
          } else {
            callback(true);
          }
        });
      }
    });
  }

  nbUsers(callback) {
    this.client.connect((err) => {
      if (err) {
        console.log(`Error connecting to MongoDB: ${err}`);
        callback(null);
      } else {
        const db = this.client.db(this.database);
        const usersCollection = db.collection('users');
        usersCollection.countDocuments((err, count) => {
          if (err) {
            console.log(`Error counting users: ${err}`);
            callback(null);
          } else {
            this.client.close((err) => {
              if (err) {
                console.log(`Error closing MongoDB connection: ${err}`);
              }
              callback(count);
            });
          }
        });
      }
    });
  }

  nbFiles(callback) {
    this.client.connect((err) => {
      if (err) {
        console.log(`Error connecting to MongoDB: ${err}`);
        callback(null);
      } else {
        const db = this.client.db(this.database);
        const usersCollection = db.collection('files');
        usersCollection.countDocuments((err, count) => {
          if (err) {
            console.log(`Error counting files: ${err}`);
            callback(null);
          } else {
            this.client.close((err) => {
              if (err) {
                console.log(`Error closing MongoDB connection: ${err}`);
              }
              callback(count);
            });
          }
        });
      }
    });
  }
}

const dbClient = new DBClient();
export { dbClient as default };
