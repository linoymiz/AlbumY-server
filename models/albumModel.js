import mongoose from 'mongoose'
const {Schema} = mongoose
// import {Picture} from './pictureModel.js'


const AlbumSchema = new Schema({
    ownerId: {type:  String, required: true},
    name: {type: String, required: true},
    creationDate: {type: String, default: (new Date()).toLocaleDateString('en-GB')},
    numOfPics: {type: Number, default: 0},
    picturesIds: [{type: mongoose.ObjectId, ref: 'Picture'}]
})

export const Album = mongoose.model('Album', AlbumSchema)