const express = require('express')
const dotenv = require('dotenv')
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require('mongodb');
dotenv.config()

const uri = process.env.MONGODB_URI;

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});



async function run() {
  try {
    await client.connect();

    const db = client.db("studynook")

    const roomCollection = db.collection("rooms")

    app.post('/room', async (req, res) => {
      try {
        const roomData = req.body
        console.log(roomData);
        const result = await roomCollection.insertOne(roomData)

        res.json(result)
      } catch (error) {
        console.error('Failed to create room:', error)
        res.status(500).json({ message: 'Failed to create room' })
      }
    })



    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Keep the client open while the server is running.
  }
}
run().catch(console.dir);

process.on('SIGINT', async () => {
  try {
    await client.close();
  } finally {
    process.exit(0);
  }
});



app.get('/', (req, res) => {
    res.send("Server is running fine!")
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})