import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import router from './routes/router.js';
import mongoose from 'mongoose';
import passport from 'passport';
import session from 'express-session';
import dotenv from 'dotenv';
import passportConfig from './routes/passport.js';

dotenv.config();

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

const allowedOrigins = [
    'https://ax2.onrender.com',
    'http://localhost:5173'
]

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        } else {
        callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 201
}
app.use(cors(corsOptions));

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24,
            sameSite: 'none',
            secure: true
        },
        saveUninitialized: false,
        resave: false,
    })
);

passportConfig(passport);

app.use(passport.initialize());
app.use(passport.session());

app.use('/', router);

const dbOptions = {
    useNewUrlParser: true, 
    useUnifiedTopology: true
};
mongoose.connect(process.env.DB_URI, dbOptions)
.then(() => console.log('DB connected!'))
.catch(err => console.error('MongoDB connection error:', err));;

const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
    console.log('Server is running on port 8080');
})