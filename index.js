require('dotenv').config()
const express = require('express')
const cors = require('cors')
const nodemailer = require('nodemailer')
const app = express()
const port = process.env.PORT || 5000
const jwt = require('jsonwebtoken')
// const ObjectId = require('mongodb').ObjectId

//middleware
app.use(cors())
app.use(express.json())
let user = process.env.DB_USER
let pass = process.env.DB_PASS

function middleware(req, res, next) {
  const authorizationHeader = req.headers.authorization
  if (!authorizationHeader) {
    return res.status(401).send({ message: 'Unauthrized access' })
  }
  const token = authorizationHeader.split(' ')[1]

  jwt.verify(token, process.env.WEB_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' })
    }
    req.decoded = decoded
    next()
  })
}

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
    const profileCollection = client
      .db('toolsmanufacture')
      .collection('profile')

    //index products
    app.get('/product', async (req, res) => {
      const query = {}
      const cursor = productCollection.find(query)
      const products = await cursor.toArray()
      res.send(products)
    })

    //upsert user
    app.put('/user/:email', async (req, res) => {
      const user = req.body
      const email = req.params.email

      const filter = { email: email }
      const options = { upsert: true }
      const updateDoc = {
        $set: user,
      }
      const result = await userCollection.updateOne(filter, updateDoc, options)
      const token = jwt.sign({ email: email }, process.env.WEB_TOKEN, {
        expiresIn: '1h',
      })
      res.send({ result, token })
    })
    //users index
    app.get('/users', middleware, async (req, res) => {
      const query = {}
      const users = await userCollection.find(query).toArray()
      res.send(users)
    })
    //if admin
    app.get('/users/admin/:email', async (req, res) => {
      const email = req.params.email
      const users = await userCollection.findOne({ email: email })
      const isAdmin = users.role === 'admin'
      res.send({ admin: isAdmin })
    })
    // make admin
    app.put('/admin/:email', middleware, async (req, res) => {
      const email = req.params.email
      const filter = { email: email }
      const ifAdmin = req.decoded.email
      const findAdmin = await userCollection.findOne({ email: ifAdmin })
      if (findAdmin.role === 'admin') {
        const updateDoc = {
          $set: { role: 'admin' },
        }
        const result = await userCollection.updateOne(filter, updateDoc)
        const token = jwt.sign({ email: email }, process.env.WEB_TOKEN, {
          expiresIn: '1h',
        })
        res.status(200).send({ result, webToken: token })
      } else {
        res.status(403).send({ message: 'forbidden access' })
      }
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
      const pay = req.body.payment
      const id = req.body.id
      const insert = { name, product, email, address, phone, order, price, pay }
      const result = await soldCollection.insertOne(insert)
      if (result) {
        const filter = { _id: ObjectId(id) }
        const options = { upsert: true }
        const updateDoc = {
          $set: {
            product_stock: stock,
          },
        }
        // UPDATE PRODUCT STOCK
        const result = await productCollection.updateOne(
          filter,
          updateDoc,
          options,
        )
        // SEND MAIL TO BUYER
        try {
          var transport = nodemailer.createTransport({
            host: process.env.E_COMMERCE_SMTP_SERVER,
            port: process.env.E_COMMERCE_PORT,
            auth: {
              user: process.env.E_COMMERCE_USER,
              pass: process.env.E_COMMERCE_PASS,
            },
          })

          let mailStatus = await transport.sendMail({
            from: 'kkhaled88hasan@gmail.com',
            to: email,
            subject: 'Send from abc manufacturer company',
            text: 'Body message area',
          })

          return `Message sent: ${mailStatus.messageId}`
        } catch (error) {}

        res.send('Order submitted successfully')
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
    // my orders
    app.get('/order', middleware, async (req, res) => {
      const user = req.query.user
      // const authorization = req.headers.authorization
      // console.log(authorization)
      const decodedUser = req.decoded.email

      if (decodedUser === user) {
        const query = { email: user }
        const orders = soldCollection.find(query)
        const result = await orders.toArray()
        return res.send(result)
      } else {
        return res.status(403).send({ message: 'forbidden access' })
      }
    })

    app.put('/updateProfile/:email', async (req, res) => {
      const data = req.body
      const email = req.params.email
      const filter = { email: email }
      const options = { upsert: true }
      const updateDoc = { $set: data }
      const result = await profileCollection.updateOne(
        filter,
        updateDoc,
        options,
      )
      const token = jwt.sign({ email: email }, process.env.WEB_TOKEN, {
        expiresIn: '1h',
      })
      res.send({ result, token })
    })
    app.get('/updateProfile/:email', async (req, res) => {
      const email = req.params.email

      const result = await profileCollection.findOne({ email: email })
      if (result) {
        res.send(result)
      } else {
        res.send({ message: 'data empty' })
      }
    })
    app.put('/manageProduct/:id', async (req, res) => {
      const id = req.params.id
      const data = req.body
      const filter = { _id: ObjectId(id) }
      const options = { upsert: true }
      const updateDoc = { $set: data }
      const result = await productCollection.updateOne(
        filter,
        updateDoc,
        options,
      )
      res.send(result)
    })
    // manage orders
    app.get('/manageorders', async (req, res) => {
      const query = {}
      const cursor = soldCollection.find(query)
      const result = await cursor.toArray()
      res.send(result)
    })
    //index sold product
    app.get('/soldProduct', async (req, res) => {
      const query = {}
      const cursor = soldCollection.find(query)
      const result = await cursor.toArray()
      res.send(result)
    })
    //delete sold product
    app.delete('/deleteSoldProduct/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: ObjectId(id) }

      const result = await soldCollection.deleteOne(query)
      if (result.deletedCount === 1) {
        res.status(200).send(result)
      } else {
        res.status(400).send({ message: 'delete unsuccessful' })
      }
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
