import pkg from 'mongodb';
import crypto from "crypto";

const { MongoClient,ObjectID } = pkg;

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 27017;
const database = process.env.DB_DATABASE || 'files_manager';

class DBClient {
  constructor() {
    MongoClient.connect(`mongodb://${host}:${port}`, { useUnifiedTopology: true }, (err, client) => {
      if(err){
        console.log(err.message);
        this.db = false;
      }
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

  
  async insertNewUser(userEmail, userPass){
    const collection = this.db.collection('users');
    const passHash = crypto.createHash('sha1').update(userPass).digest('hex');
    const insertResult = await collection.insertOne({email : userEmail,password : passHash});
    return {email: userEmail,id :insertResult.insertedId};
  }
  
  async userEmailExist(userEmail){
    const collection = this.db.collection('users');
    let email = await collection.findOne({email : userEmail});
    return ( email ) ? true : false;
  }

  async getUser(userEmail, userPass){
    const collection = this.db.collection('users');
    const passHash = crypto.createHash('sha1').update(userPass).digest('hex');
    let user = await collection.findOne({email : userEmail,password:passHash});
    return (user) ? {id:user._id} : false;
  }

  async getUserById(userId){
    const collection = this.db.collection('users');
    let user = await collection.findOne({_id : ObjectID(userId)});
    
    return (user) ? {id:user._id,email:user.email} : false;
  }

  async getFileById(fileId){
    const collection = this.db.collection('files');
    let file = await collection.findOne({_id : ObjectID(fileId)});
    
    return (file) ? file : false;
  }

  async insertFiles(file){
    const collection = this.db.collection('files');
    let insert = await collection.insertOne(file);
    let dbFile = this.getFileById(insert.insertedId);
    return (dbFile) ? dbFile : false;
  }

}

const dbClient = new DBClient();
export { dbClient as default };