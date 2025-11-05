import mongoose from 'mongoose'

export async function connectDB(uri?: string) {
  const mongoUri = uri || process.env.MONGO_URI
  if (!mongoUri) {
    console.warn('⚠️  MONGO_URI not set. Skipping MongoDB connection.')
    console.warn('   MongoDB is optional - app will work without it.')
    return
  }
  
  // Debug: show if URI is detected (but don't log full URI for security)
  if (mongoUri.includes('mongodb+srv://')) {
    console.log('🔗 Connecting to MongoDB Atlas...')
  } else if (mongoUri.includes('mongodb://')) {
    console.log('🔗 Connecting to MongoDB...')
  } else {
    console.warn('⚠️  MONGO_URI format looks incorrect:', mongoUri.substring(0, 20) + '...')
  }
  
  try {
    mongoose.set('strictQuery', true)
    await mongoose.connect(mongoUri)
    console.log('✅ MongoDB connected successfully')
  } catch (err: any) {
    console.error('❌ MongoDB connection failed:', err.message)
    console.error('   App will continue without MongoDB (queue will be in-memory only)')
    // Don't exit - app works without MongoDB
  }
}

export default mongoose




