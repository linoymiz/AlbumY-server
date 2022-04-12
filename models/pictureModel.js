import mongoose from 'mongoose'
const {Schema} = mongoose

export const PictureSchema = new Schema({
    albumId: {type: String, required: true},
    src: {type: String, required: true},
    alt: {type: String, required: true},
    info: {title: {type: String, default: ""},
           content: {type: String, default: ""}}
})
export const Picture = mongoose.model('Picture', PictureSchema)


