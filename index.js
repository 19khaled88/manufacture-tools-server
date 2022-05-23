require('dotenv').config();
const express = require('express');
const cors = require('cors');


const app=express()
const port =process.env.PORT || 5000 

//middleware
app.use(cors())
app.use(express.json())
let user = process.env.DB_USER
let pass = process.env.DB_PASS

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://khaled:VNHAybzMnVDF6NMq@cluster0.ka5da.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run(){
    try {
        
        await client.connect();

        const productCollection = client.db("toolsmanufacture").collection('products')

      
        //index products
        app.get('/product',async(req, res)=>{
            const query = {};
            const limit = 6;
            const cursor = productCollection.find(query).limit(limit);
            const products = await cursor.toArray();
            res.send(products)
        })

        //insert proudcts
        app.post('/product',async(req, res)=>{
            const products = req.body;
            const result = await productCollection.insertOne(products)
            res.send(result)
        })
    } finally {
        
    }
}
run().catch(console.log())
app.get('/',(req, res)=>{
    res.send('Server running')
})

app.listen(port, ()=>{
    console.log(`Server listening on ${port}`)
})