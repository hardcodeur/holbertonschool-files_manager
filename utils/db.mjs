import { MongoClient } from 'mongodb';
import crypto from "crypto";
import { log } from 'console';

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
    const usersCount = await collection.countDocuments();
    return usersCount;
  }

  async nbFiles() {
    const collection = this.db.collection('files');
    const filesCount = await collection.countDocuments();
    return filesCount;
  }

  async userEmailExist(userEmail){
    const collection = this.db.collection('users');
    let email = await collection.find({email : userEmail}).toArray();
    return ( email.length > 0 ) ? true : false;
  }

  async insertNewUser(userEmail, userPass){
    const collection = this.db.collection('users');
    const passHash = crypto.createHash('sha1').update(userPass).digest('hex');
    const insertResult = await collection.insertOne({email : userEmail,password : passHash});
    return {email: userEmail,id :insertResult.insertedId};
  }
}




const dbClient = new DBClient();
export { dbClient as default };