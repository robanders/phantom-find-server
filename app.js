require('dotenv').config({ path:'./.env' });
const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('apollo-server-express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const User = require('./models/user');
const typeDefs = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');
const isAuth = require('./src/isAuth');
const { createAccessToken, createRefreshToken } = require('./src/auth');
const { sendRefreshToken } = require('./src/sendRefreshToken');
const nodemailer = require('nodemailer');

const app = express();

app.use(
    cors({
        origin: "http://localhost:3000",
        credentials: true
    }));
app.use(cookieParser());
app.use(isAuth);

app.post("/refresh_token", async (req, res) => {
    const token = req.cookies.lid;
    if(!token) {
        return res.send({ ok: false, accessToken: "" });
    }

    let payload = null;
    try {
        payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
        return res.send({ ok: false, accessToken: "" });
    }

    // token is valid and can send back an access token
    const user = await User.findById(payload.userId);
    if(!user) {
        return res.send({ ok: false, accessToken: "" });
    }

    // checks to see if the refresh token tokenVersion matches with the tokenVersion in the DB. If not, the refresh token will
    // be revoked and the user will only have access for the timeout value of the access token
    if(user.tokenVersion !== payload.tokenVersion) {
        return res.send({ ok: false, accessToken: ""})
    }

    // Create a new refresh token when they want to refresh access token
    sendRefreshToken(res, createRefreshToken(user));
    return res.send({ ok: true, accessToken: createAccessToken(user)});
});

app.get("/confirmation/:token", async (req, res) => {
    try {
        //get user id from jwt token
        const payload = jwt.verify(req.params.token, process.env.EMAIL_TOKEN_SECRET);
        // update user model in DB with emailVerified = true
        await User.findOneAndUpdate({ _id: payload.userId }, { emailVerified: true }, {useFindAndModify: false});
    } catch(err) {
        throw err;
    }
    res.redirect('http://localhost:3000/login');
});

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req, res }) => ({ req, res }),
    playground: true
});
// passing in req and res in the context lets us access them in our resolvers

server.applyMiddleware({ app, cors: false });

//app.use(cors);

const oldUri = `mongodb+srv://${process.env.MONGO_DB_USER}:${process.env.MONGO_DB_PW}@phantomfinddevcluster.1mxpo.mongodb.net/${process.env.MONGO_DB_NAME}?retryWrites=true&w=majority`

// const newUri = `mongodb://phantom-find-dev:${process.env.MONGO_DB_PW}@phantomfinddevcluster-shard-00-00.1mxpo.mongodb.net:27017,phantomfinddevcluster-shard-00-01.1mxpo.mongodb.net:27017,phantomfinddevcluster-shard-00-02.1mxpo.mongodb.net:27017/${process.env.MONGO_DB_NAME}?ssl=true&replicaSet=atlas-jamxla-shard-0&authSource=admin&retryWrites=true&w=majority`

mongoose.connect( oldUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true});

app.listen(4000);