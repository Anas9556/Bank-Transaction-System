import mongoose from 'mongoose';
import 'dotenv/config';

const connectDB = async () => {

  try{

    const db = await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.DATABASE_NAME
    });

    console.log(`Database connected to ${db.connection.name}`);

  } catch(err) {
    console.error(`Database not connected: ${err}`);
    process.exit(1);
  }

}

export default connectDB;