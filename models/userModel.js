import mongoose from 'mongoose'
import 'mongoose-type-email'

const {Schema} = mongoose 

const UserSchema = new Schema({
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    email: {type: String, required: true},
    password: {type: String, required: true},
    albumsIds: {type: String}
})
export const User = mongoose.model('User', UserSchema)