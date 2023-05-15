const MongoClient = require("mongodb").MongoClient;
let db;

const connectionString = process.env.MONGO_URI;

const loadDB = async () => {
  if (db) {
    return db;
  }
  try {
    const client = await MongoClient.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    db = client.db();
  } catch (err) {
    console.log(err);
  }
  return db;
};

module.exports = loadDB;
