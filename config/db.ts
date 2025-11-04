import mongoose from 'mongoose'

export async function connectDB(uri?: string) {
  const mongoUri = uri || process.env.MONGO_URI
  if (!mongoUri) {
    console.warn('MONGO_URI not set. Skipping MongoDB connection.')
    return
  }
  try {
    mongoose.set('strictQuery', true)
    await mongoose.connect(mongoUri)
    console.log('✅ MongoDB connected')
  } catch (err) {
    console.error('MongoDB connection error:', err)
    process.exit(1)
  }
}

export default mongoose




