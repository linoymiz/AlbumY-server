import mongoose from 'mongoose'

export default async function connect() {

    try {
        const MongoURI= 'mongodb+srv://LinoyRot:23128978@cluster0.kwapi.mongodb.net/AlbumY?retryWrites=true&w=majority'
        await mongoose.connect(MongoURI,
        // mongodb://localhost:27017/AlbumY'
            {useNewUrlParser: true,
            useUnifiedTopology: true
        })
        console.log('connected to database');
    } catch (err) {
        console.log(err);
        console.log('could not manage to connect to database');
    }
}
