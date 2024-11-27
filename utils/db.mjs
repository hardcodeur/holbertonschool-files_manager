import pkg from 'mongodb';
const { MongoClient } = pkg;

const host = process.env.DB_HOST || 'localhost';
const port = parseInt(process.env.DB_PORT || '27017');
const database = process.env.DB_DATABASE || 'files_manager';
const uri = `mongodb://${host}:${port}`

class DBClient {

  constructor() {
    MongoClient.connect(uri,{ useUnifiedTopology: true },(err, client)=>{
      if (err) {
        throw err
      }
      this.db = client.db(database)
      // console.log("Db connected");
    });
  }

  isAlive(){
    if (this.db) {
      return true;
    }else{
      return false;
    }
  }

  async nbUsers() {
    if(!this.isAlive){
      throw new Error("Db is not connected");
    }
    return this.db.collection("users").countDocuments()
  }

  async nbFiles() {
    if(!this.isAlive){
      throw new Error("Db is not connected");
    }
    return this.db.collection("files").countDocuments()
  }

}

const dbClient = new DBClient();
export { dbClient as default };