// src/config/db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Conectado com Sucesso!');
  } catch (error) {
    console.error(`Erro ao conectar com MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;