const exprss = require("express");
const app = exprss();
const cors = require("cors");
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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

    const userCollection = client.db('touristDB').collection('users');


    // user collection
    app.post('/users', async(req, res)=>{
      const user = req.body;
      // insert user if not exits
      const query = {email: user?.email}
      const exitstingUser = await userCollection.findOne(query)
      if(exitstingUser){
        return res.send({message: 'user already exit', insertedId: null})
      }
      const result = await userCollection.insertOne(user);
      res.send(result)
    })


    app.get('/users', async(req, res)=>{
      console.log(req.query.email)
      let query = {}
      if(req.query?.email){
        query = {email: req.query.email}
      }
      const result = await userCollection.find(query).toArray();
      res.send(result);
    })

    // app.get('/users/:id', async(req, res)=>{
    //   const id = req.params.id;
    //   const query = {_id: new ObjectId(id)};
    //   const result = await userCollection.find(query)
    //   res.send(result);
    // })


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
    res.send("Tusk hut is running.....")
})
app.listen(port, ()=>{
    console.log(`TuskHut is running on port ${port}`)
})
