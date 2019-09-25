import mongoose from 'mongoose';

// import config from '../config/config';

//set options
mongoose.set('useCreateIndex', true);
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('runValidators', true);
mongoose.set('useUnifiedTopology', true)

//mongodb connnection
mongoose.connect(process.env.DB_MONGODB_CONNECTION_URL);
console.log("url->", process.env.DB_MONGODB_CONNECTION_URL);
const db = mongoose.connection;

db.on("error", (err: Error) => {
    console.log(err);
    // @ts-ignore
    process.exit(err.code || 1);
});

db.once("open", () => {
    console.log("Connection with database succeeded.");
});

export {db};