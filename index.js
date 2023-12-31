const exprss = require("express");
const app = exprss();
const cors = require("cors");
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(exprss.json());



app.get('/', (req, res)=>{
    res.send("Tusk hut is running.....")
})
app.listen(port, ()=>{
    console.log(`TuskHut is running on port${port}`)
})
