require('dotenv').config()
const express = require('express')
const cors = require('cors')
const nodemailer = require('nodemailer')
const app = express()
const port = process.env.PORT || 5000
ObjectID = require('mongodb').ObjectId

//middleware
app.use(cors())
app.use(express.json())
let user = process.env.DB_USER
let pass = process.env.DB_PASS

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
// const { ObjectID } = require('bson')
const uri = `mongodb+srv://khaled:VNHAybzMnVDF6NMq@cluster0.ka5da.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
})

async function run() {
  try {
    await client.connect()

    const productCollection = client
      .db('toolsmanufacture')
      .collection('products')
    const ratingCollection = client.db('toolsmanufacture').collection('rating')
    const soldCollection = client.db('toolsmanufacture').collection('sold')
    const userCollection = client.db('toolsmanufacture').collection('users')

    //index products
    app.get('/product', async (req, res) => {
      const query = {}
      //   const limit = 6
      //   const cursor = productCollection.find(query).limit(limit)
      const cursor = productCollection.find(query)
      const products = await cursor.toArray()
      res.send(products)
    })

    //upsert user
    app.put('/user/:email',async(req,res)=>{
      const user = req.body;
      const email = req.params.email;
      const filter = {email:email};
      const options ={upsert:true};
      const updateDoc = {
        $set: user}  
      const result = await userCollection.updateOne(filter,updateDoc,options)
      res.send(results);
    })

    //insert proudcts
    app.post('/product', async (req, res) => {
      const products = req.body
      const result = await productCollection.insertOne(products)
      res.send(result)
    })

    //place order
    app.post('/placceOrder', cors(), async (req, res) => {
      const name = req.body.name
      const email = req.body.mail
      const address = req.body.address
      const order = req.body.ordered
      const price = req.body.price
      const phone = req.body.phoneNumber
      const stock = req.body.stockValue
      const product = req.body.product
      const id = req.body.id

      const insert = { name, product, email, address, phone, order, price }
      const result = await soldCollection.insertOne(insert)
      if (result) {
        const filter = { _id: ObjectId(id) }
        const options = { upsert: true }
        const updateDoc = {
          $set: {
            product_stock: stock,
          },
        }

        const result = await productCollection.updateOne(
          filter,
          updateDoc,
          options,
        )
        res.send('Order submited successfully')
      }
      // try {
      //   var transport = nodemailer.createTransport({
      //     host: process.env.SMTP_SERVER,
      //     port: process.env.SEND_IN_BLUE_PORT,
      //     auth: {
      //       user: process.env.SEND_IN_BLUE_LOGIN,
      //       pass: process.env.SEND_IN_BLUE_MASTER_PASS,
      //     },
      //   })

      //   let mailStatus = await transport.sendMail({
      //     from: 'kkhaled88hasan@gmail.com',
      //     to: email,
      //     subject: 'Send from abc manufacturer company',
      //     text: 'Body message area',
      //   })

      //   return `Message sent: ${mailStatus.messageId}`
      // } catch (error) {}
    })
    //review and rating create
    app.post('/rating', async (req, res) => {
      const rate = req.body
      const result = await ratingCollection.insertOne(rate)
      res.send(result)
    })
    //review and rating index
    app.get('/rating', async (req, res) => {
      const query = {}
      const cursor = ratingCollection.find(query)
      const rating = await cursor.toArray(cursor)
      res.send(rating)
    })
  } finally {
  }
}
run().catch(console.log())
app.get('/', (req, res) => {
  res.send('Server running')
})

app.listen(port, () => {
  console.log(`Server listening on ${port}`)
})
