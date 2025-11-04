import mongoose from '../config/db'

export interface IUserDoc extends mongoose.Document {
  userId: string
  tags?: string[]
  skills?: string[]
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new mongoose.Schema<IUserDoc>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    tags: { type: [String], default: [] },
    skills: { type: [String], default: [] }
  },
  { timestamps: true }
)

export const UserModel = mongoose.models.User || mongoose.model<IUserDoc>('User', UserSchema)




