const exprss = require("express");
const app = exprss();
const cors = require("cors");
require("dotenv").config()
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(exprss.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.l5wiuzk.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();


    const userInfoCollection = client.db("tuskHutDB").collection("users");


    // user collection
    app.post("/users", async(req, res)=>{
      const user = req.body;
      // insert user if not exits
      const query = {email: user?.email}
      const exitstingUser = await userInfoCollection.findOne(query)
      if(exitstingUser){
        return res.send({message: "user already exit", insertedId: null})
      }
      const result = await userInfoCollection.insertOne(user);
      res.send(result)
    })


    app.get("/users", async(req, res)=>{
      console.log(req.query.email)
      let query = {}
      if(req.query?.email){
        query = {email: req.query.email}
      }
      const result = await userInfoCollection.find(query).toArray();
      res.send(result);
    })

    // app.get('/users/:id', async(req, res)=>{
    //   const id = req.params.id;
    //   const query = {_id: new ObjectId(id)};
    //   const result = await userCollection.find(query)
    //   res.send(result);
    // })

    // for make admin api
    app.patch('/users/admin/:id', async(req, res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updateDoc = {
        $set: {
          role: "admin"
        }
      }
      const result = await userInfoCollection.updateOne(filter, updateDoc);
      res.send(result);
    })
    
    // check admin or not
    app.get("/users/admin/:email", async(req, res)=>{
      const email = req.params.email;
      // use jwt for better security
      const query = {email: email};
      const user = await userInfoCollection.findOne(query);
      let admin = false;
      if(user){
        admin = user?.role === "admin"
      }
      res.send({admin})
    })

    // for make buyer api
    app.patch("/users/buyer/:id", async(req, res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updateDoc = {
        $set: {
          role: "buyer"
        }
      }
      const result = await userInfoCollection.updateOne(filter, updateDoc);
      res.send(result);
    })

    // check buyer or not
    app.get("/users/buyer/:email", async(req, res)=>{
      const email = req.params.email;
      // use jwt for better security
      const query = {email: email};
      const user = await userInfoCollection.findOne(query);
      let buyer = false;
      if(user){
        buyer = user?.role === "buyer"
      }
      res.send({buyer})
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res)=>{
    res.send("Tusk hut is running.....");
});
app.listen(port, ()=>{
    console.log(`TuskHut is running on port ${port}`);
})
