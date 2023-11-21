import { MongoClient } from "mongodb";
const connectionString = "mongodb+srv://ifafsilva12:p0vNu4PiQ86sUe8t@cluster0.ndwywum.mongodb.net/";
const client = new MongoClient(connectionString);


let conn;
try {
    conn = await client.connect();
} catch(e) {
    console.error(e);
}
// Database name
let db = conn.db("movies");
export default db;
