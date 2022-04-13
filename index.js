// import imagesDatabase from './images.js'
import express from 'express'
import bodyParser from 'body-parser'
import albumRouter from './routers/albumy.js'
import connect from './initialize/db.js'
import cors from 'cors'
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
import path from 'path'
import dotenv from 'dotenv'
dotenv.config()

const port = 4000
const corsOptions ={
    origin:'http://localhost:3000', 
    credentials:true,            //access-control-allow-credentials:true
    optionSuccessStatus:200
}
const app = express()
app.use(express.static(path.join(__dirname,'uploads')))

// app.use(express.json({limit: '25mb'}))
// app.use(express.urlencoded({limit:'25mb', extended: true}))
app.use(bodyParser.urlencoded({
    extended: false
}))
app.use(bodyParser.json());
app.use(cors(corsOptions))
connect()

app.use(express.static('public'))
app.use('', albumRouter)

app.listen(process.env.PORT || port, () => {
    console.log('Server is on port ' + port)
})

// server app URL
// https://album-my.herokuapp.com/
