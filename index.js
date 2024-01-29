const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require('jsonwebtoken');
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.l5wiuzk.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();


    const userInfoCollection = client.db("tuskHutDB").collection("users");


    // jwt api
    app.post("/jwt", async(req, res)=>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, {
        expiresIn: '3h'
      })
      res.send({token});
    })

    // middleware
    // verify token
    const verifyToken = (req, res, next)=> {
      console.log('inside token', req.headers.authorization);
      if(!req.headers.authorization){
        return res.status(401).send({message: "forbidden access"});
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, (err, decoded)=>{
        if(err){
          return res.status(401).send({message: "forbidden access"});
        }
        req.decoded= decoded;
        next();
      })
    }

    // verify admin
    const verifyAdmin = async(req, res, next)=>{
      const email = req.decoded.email;
      const query = {email: email};
      const user = await userInfoCollection.findOne(query);
      const isAdmin = user?.role === 'admin'
      if(!isAdmin){
        return res.status(403).send({message: "forbidden access"})
      }
      next();

    }
    // verify Buyer
    const verifyBuyer = async(req, res, next)=>{
      const email = req.decoded.email;
      const query = {email: email};
      const user = await userInfoCollection.findOne(query);
      const isBuyer = user?.role === 'buyer'
      if(!isBuyer){
        return res.status(403).send({message: "forbidden access"})
      }
      next();

    }


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
      res.send(result);
    });

    app.get("/users", async(req, res)=>{
      // console.log(req.query.email)
      let query = {}
      if(req.query?.email){
        query = {email: req.query.email}
      }
      const result = await userInfoCollection.find(query).toArray();
      res.send(result);
    });

    // app.get("/users", verifyToken, async(req, res)=>{
    //   const  result = await userInfoCollection.find().toArray();
    //   res.send(result)

    // })

    // app.get('/users/:id', async(req, res)=>{
    //   const id = req.params.id;
    //   const query = {_id: new ObjectId(id)};
    //   const result = await userCollection.find(query)
    //   res.send(result);
    // })

    app.delete("/users/:id", async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await userInfoCollection.deleteOne(query);
      res.send(result);
    })

    // make admin api
    app.patch('/users/admin/:id', verifyToken, verifyAdmin, async(req, res)=>{
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
    app.get("/users/admin/:email",verifyToken, async(req, res)=>{
      const email = req.params.email;
      if(email !== req.decoded.email){
        return res.status(403).send({message: "forbidden access"});
      }
      const query = {email: email};
      const user = await userInfoCollection.findOne(query);
      let admin = false;
      if(user){
        admin = user?.role === "admin"
      }
      res.send({admin})
    })

    //  make buyer api
    app.patch("/users/buyer/:id", verifyToken, verifyBuyer, async(req, res)=>{
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
    app.get("/users/buyer/:email", verifyToken, async(req, res)=>{
      const email = req.params.email;
      if(email !== req.decoded.email){
        return res.status(403).send({message: "forbidden access"});
      }
      const query = {email: email};
      const user = await userInfoCollection.findOne(query);
      let buyer = false;
      if(user){
        buyer = user?.role === "buyer"
      }
      res.send({buyer})
    })

    
     // ----------------------------------------------------------------
    // To Delete user's account when "Delete Account" button is clicked
    // Express endpoint for deleting user account `/deleteAccount/${uidToDelete}`
    app.delete("/deleteAccount/:uidToDelete", async (req, res) => {
      try {
        const uid = req.params.uid;

        // Delete user in Firebase Authentication
        // await admin.auth().deleteUser(uid);

        // Delete user in MongoDB
        await userInfoCollection.deleteOne({ uid });

        res.status(200).json({ message: "User account deleted successfully" });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting user account" });
      }
    });
    // ----------------------------------------------------------------

   // Fetch Employee details from view details button (taskhut/findEmployee)
 
   app.get("/users/employee", async (req, res) => {
    let query = {};
    query.role = { $exists: false };
    const result = await userInfoCollection.find(query).toArray();
    res.send(result);
  });

  app.get("/users/employee/:id", async (req, res) => {
    const id = req.params.id;
    const employeeinfo = await userInfoCollection.findOne({ _id: new ObjectId(id) });
    res.send(employeeinfo);
  });


  //------------------------------------------------------------------------



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Tusk hut is running.....");
});
app.listen(port, () => {
  console.log(`TuskHut is running on port ${port}`);
});
