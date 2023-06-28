const express = require('express');
const app = express();
const cors = require('cors');
const port = 8090;

const mongoose = require('mongoose');

const routes = require('../routes/routes')

const userMongoDB = process.env.MONGODB_USER
const passMongoDB = process.env.MONGODB_PASSWORD

main().catch(err => { console.log(err) })

app.use(express.json());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "https://frontend-tm-nu.vercel.app/");
    res.header("Access-Control-Allow-Methods", 'GET,PUT,POST,DELETE');
    app.use(cors());
    next();
});

app.use('/api', routes)

app.listen(port, () => {
    console.log(`Listening app on port ${port}`)
})


async function main() {
    await mongoose.connect(
        process.env.MONGODB_URI,
        { useNewUrlParser: true, useUnifiedTopology: true }
    )
        .then(() => {
            console.log('Conexão com MongoDB realizada com sucesso!');
        }).catch(() => {
            console.log('Erro: Conexão com MongoDB não foi realizada com sucesso!');
        })
}