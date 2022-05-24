require('dotenv').config()
const express = require('express')
const cors = require('cors')
const nodemailer = require('nodemailer');
const app = express()
const port = process.env.PORT || 5000

//middleware
app.use(cors())
app.use(express.json())
let user = process.env.DB_USER
let pass = process.env.DB_PASS

const { MongoClient, ServerApiVersion } = require('mongodb')
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

    
    //index products
    app.get('/product', async (req, res) => {
      const query = {}
      //   const limit = 6
      //   const cursor = productCollection.find(query).limit(limit)
      const cursor = productCollection.find(query)
      const products = await cursor.toArray()
      res.send(products)
    })

    //insert proudcts
    app.post('/product', async (req, res) => {
      const products = req.body
      const result = await productCollection.insertOne(products)
      res.send(result)
    })

    //place order
    app.post('/placceOrder',cors(),async(req, res)=>{
      const order = req.body.ordered;
      const price = req.body.price;
      const email = req.body.mail;
      const phone = req.body.phone;
      const address = req.body.address;
      try {  
        var transport = nodemailer.createTransport({
          host:process.env.SMTP_SERVER,
          port:process.env.SEND_IN_BLUE_PORT,
          auth:{
            user:process.env.SEND_IN_BLUE_LOGIN, 
            pass:process.env.SEND_IN_BLUE_MASTER_PASS 

          }
        })

        let mailStatus = await transport.sendMail({
          from :'kkhaled88hasan@gmail.com',
          to: email,
          subject: 'Send from abc manufacturer company',
          text: 'Body message area'
        });

        return `Message sent: ${mailStatus.messageId}`;
        
      } catch (error) {
        
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
