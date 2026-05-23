const express = require('express')
const dotenv = require('dotenv')
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
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


const JWKS = createRemoteJWKSet (
  new URL("http://localhost:3000/api/auth/jwks")
)


const verifyToken = async (req, res, next) => {
  const authHeader = req?.headers.authorization;
  if(!authHeader) {
    return res.status(401).json({message: "Unauthorized"});
  }
  const token = authHeader.split(" ")[1];
  if(!token){
    return res.status(401).json({message: "Unauthorized"});
  }

  try {
    const {payload} = await jwtVerify (token, JWKS);
    console.log(payload);
    next();
  } catch {
    return res.status(403).json({message: "Forbidden"});
  }
};


async function run() {
  try {
    await client.connect();

    const db = client.db("studynook");
    const roomCollection = db.collection("rooms");
    const bookingCollection = db.collection("bookings");
    
    app.get("/room", async(req, res) => {
      const result = await roomCollection.find().toArray();
      res.json(result);
    });

        app.get("/room/:id", verifyToken, async (req, res) => {
          const { id } = req.params;
          const result = await roomCollection.findOne({
            _id: new ObjectId(id),
          });

          res.json(result);
      });



    app.post("/room", async (req, res) => {
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


     app.patch("/room/:id", async (req, res) => {
      const { id } = req.params;
      const updatedData = req.body;
      console.log(updatedData);

      const result = await roomCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData },
      );

      res.json(result);
    });


    app.delete("/room/:id", async (req, res) => {
      const { id } = req.params;
      const result = await roomCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.json(result);
    });


      app.get("/bookings", async (req, res) => {
      const { userId } = req.params;

      const result = await bookingCollection.find({ userId: userId }).toArray();

      res.json(result);
    });


     app.post("/booking", verifyToken, async (req, res) => {
      const bookingData = req.body;
      const result = await bookingCollection.insertOne(bookingData);

      res.json(result);
    });


    app.delete("/bookings/:bookingId", verifyToken, async (req, res) => {
      const { bookingId } = req.params;
      const result = await bookingCollection.deleteOne({
        _id: new ObjectId(bookingId),
      });

      res.json(result);
    });

      
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