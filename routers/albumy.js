import express from 'express'
const router = express.Router()
import mongoose from 'mongoose'
import {User} from '../models/userModel.js'
import {Album} from '../models/albumModel.js'
import {Picture} from '../models/pictureModel.js'
import multer from 'multer'
import fs, {unlink} from 'fs'
import bcrypt from 'bcrypt'

const saltRounds = 10;
const storage = multer.diskStorage({
            destination: function (req, file, cb) {
            const path = "C:/Users/linoy/OneDrive/Documents/Projects/AlbumY/client/public/uploads"
            fs.mkdirSync( path , { recursive: true })
            return cb(null, path)
        },
        filename: function (req, file, cb) {
            const suffix = createASuffix(file)
            cb(null, file.fieldname + '-' + suffix)
        }
      })
      const upload = multer({ storage: storage})
    
      function createASuffix(file){
            //the unique suffix
            const now = new Date()
        const nowFormat = now.getDate() + '-' + (now.getMonth() + 1) + '-' + now.getFullYear() + '-' + now.getTime()
        const uniqueSuffix = nowFormat + '-' + Math.round(Math.random() * 1E9)
    
        //the file type
        const fileMimeType = file.mimetype.split('/')
        const fileType = fileMimeType[1]
    
        return uniqueSuffix + '.' + fileType
    }
function getAlbumSize(album) {
    return (album.picturesIds.length)
}

function generateRelevantNo(pics,size){
    if (size == 0) return 1;
    else{
        const lastNum = pics[size-1].alt.split('#')[1].split(' ')[0]
        return parseInt(lastNum) + 1;
    }
}
router.post('/register', function(req, res, err){
    const {fname, lname, email: userEmail, password} = req.body.user
    User.findOne({ email: userEmail }).then(function(err, user){
        if(err){
            console.log('something is wrong in seraching user by email');
        }
        else{
                  
            if(!user){ // user does not exists
                bcrypt.hash(password, saltRounds, function(err, hash) {
                    if(err){
                        console.log('could not able to hash password', err)
                    }
                    else{
                        User.create({firstName: fname, lastName: lname, email: userEmail, password: hash}, function(err, user){
                            if(err){
                                console.log('Could not register user', err);
                            }
                            else{
                                console.log('Successfully added user');
                                res.status(200).send(user)
                            }
                        })
                    }
                })
            }
            else {
                res.send('user already exists')
            }
        }
    })
})
router.post('/sign', function(req, res, err){
    const {email: userEmail, password: passwordInput} = req.body.user
    User.findOne({ email: userEmail }, function(err, user){
        if(err){
            console.log('something is wrong in seraching user by email');
        }
        else{       
            console.log('USER is: ', user);
            if(user){
                bcrypt.compare(passwordInput, user.password, function(err, result) {
                    if(err){
                        console.log('could not able to make a comparation using \'bcrypt\'');
                    }
                    else{
                        if(result === true){
                            console.log('User successfully signed in');
                            res.status(200).send(user._id)
                        }
                        else{
                            console.log('Invalid password');
                            res.end()
                        }
                    }
                })
            }
            else{
                console.log('user does not exists with the current mail address\nif you meant to register as a new user please click on the \'Register\' button')
            }
        }
    })
})
router.get('/:userId', function (req, res) {
    const userId = mongoose.Types.ObjectId(req.params.userId)
    User.aggregate( [
        {
            $match: {_id: userId}
        },
        {
          $lookup:
            {
              from: "albums",
              localField: "albumsids",
              foreignField: "_id",
              as: "albums_docs"
            }
       }
     ]).then(result => {
         console.log('result of user albums is ', result);
            Album.find({ '_id': { $in: (result[0].albumsIds)} }, function(err, userAlbums){
                if(err) console.log('err while trying to get all user\'s albums', err)
                else{
                    console.log('succeeded getting all the albums', userAlbums)
                    res.status(200).send(userAlbums)
                }
            })
            }
         )
       .catch(err => {console.log('error while trying to get albums of user', err)})
})
router.get('/:userId/:albumId', function (req, res) {
    const albumID = req.params.albumId
    // console.log('Trying to find the album pictures', albumID);
    Album.findById(albumID, function (err, album) {
        if (album) {
            console.log('album was found', album);
            res.send(album)
        } else {
            console.log('User album was not found', err);
        }
    })
})
// get all the pictures in the user album
router.get('/:userId/:albumId/pictures', function (req, res) {
    const albumId = mongoose.Types.ObjectId(req.params.albumId)
    Album.aggregate( [
        {
            $match: {_id: albumId}
        },
        {
          $lookup:
            {
              from: "pictures",
              localField: "picturesids",
              foreignField: "_id",
              as: "pictures_docs"
            }
       }
     ]).then(result => {
            Picture.find({ '_id': { $in: (result[0].picturesIds)} }, function(err, userAlbumPics){
                if(err) console.log('err while trying to get all albums\' pictures', err)
                else{
                    console.log('succeeded getting all the albums', userAlbumPics)
                    res.status(200).send(userAlbumPics)
                }
            })
            }
         )
       .catch(err => {console.log('error while trying to get albums\' pics of user', err)})
})
//get all the albums in the collection
router.post('/:userId/create', function(req, res, err){
    const userId = req.params.userId
    const albumName = req.body.newAlbumName

    Album.create({name: albumName, ownerId: userId}, function(err, newAlbum){
        if(err){
            // res.status(400)
            console.log('Could not create a new album due to invalid name', albumName)
        }
        else{
            console.log('Successfully created a new album', newAlbum);
            User.findByIdAndUpdate(userId, { "$push": {"albumsIds": newAlbum._id}},
                function(err, user){
                    if(err){
                        console.log('error while adding the new album into user', err);
                    }
                    else
                    console.log('Successfully added the new album to user', user);
                    // res.status(200).send()
                    res.redirect('back')
                })
        }

    })
})
router.post('/:userId/:albumId/add', upload.single('GalleryImg'), function (req, res, next) {
    const {albumId, userId} = req.params
    console.log('req.file:', req.file)
    const {path, filename }= req.file
    const pathAfterPost = `/AlbumY/${userId}/${albumId}`
    console.log('in add route:\nuserId: ' + userId+ '\nalbumId: ' + albumId);
    console.log(`path is ${path} \nfilename is ${filename}`)
    
    Album.findById(albumId,
        function (err, album) {
        if (album) {
            const albumString = JSON.stringify(album)
            console.log('album JSON', albumString);
            // const imgSrc = req.body.srcInput
            if (path !== null) {
                //the image src is valid
                const albumSize = getAlbumSize(album) + 1
                console.log('album new size is: '+ albumSize)
                
                const newImg = new Picture({
                    albumId: albumId,
                    src: path.replace(/\\/g,'/'),
                    alt: 'pic#' + generateRelevantNo(album.picturesIds, albumSize - 1) + ' ' + filename      
                })
                newImg.save()
                album.picturesIds.push(newImg._id)
                Album.findOneAndUpdate(
                    {_id: albumId}, 
                    {numOfPics: albumSize},
                    function(err){
                        if(!err) {
                            album.save()
                        }
                        else res.end(err + '\ncould not able to update the size: ' + albumSize)
                    }
                )
               console.log('Updated the selected album succesfully')
                res.end()
            } else {
                res.end('Please select a valid image')
            }
        } else {
            res.end('the final err: ' + err +'\nAlbum does not exist')
        }
    })
})
router.delete('/:userId/:albumId/delete', function(req, res){
    // console.log('image id: ' + req.body.imgId + '\nalbum id: ' + req.body.albumId);
    const {userId, albumId} = req.params
    // const url = `/AlbumY/${userId}/${albumId}`
    Album.findOne({
        _id: albumId
    }, function (err, album) {
        if (album) {
            console.log(('found album, in delete img route: ', album));
            const albumSize = getAlbumSize(album) - 1
            const img = req.body.img
            // const imgId = mongoose.Types.ObjectId(img._id)
            const imgId = img._id

            // const imgSrc = `../`
            if (imgId) {
                // delete the image from the picture and from the album collections
                Picture.deleteOne({_id: imgId})
                    .then(() => {
                        console.log('Deleted selected image: ' + imgId)
                        console.log( `imgId is ${imgId}`);
                        //detach the pic from its album
                        // const filteredArr = album.pictures.filter(function(pic){       
                        //     console.log(`pic._id is ${pic._id}`)
                        //     return pic._id != imgId
                        // })
                        // console.log(`filtered Array : ${filteredArr}`);
                        // filteredArr.forEach((pic, index) => {
                        //     album.pictures.splice(index, 1)
                        // });
                        const indexToDelBy = album.picturesIds.findIndex(picId => picId == imgId)
                        console.log(`the index for the requested image is #${indexToDelBy}`);
                        album.picturesIds.splice(indexToDelBy, 1)
                        console.log('album pics is now:', album.picturesIds);
                        Album.updateOne({_id: albumId}, {$set: { numOfPics: albumSize}})
                                .then(()=>{
                                    console.log('updated size, after deleting selected pic, succesfully to be ' + albumSize)
                                    album.save()
                                    console.log('Updated the selected album succesfully');
                                    unlink(img.src, (err) => {
                                        if(err) console.log('Was not able to delete img from storage', err)
                                        else{
                                            console.log('successfully deleted img from the uploads folder!\nimg src: ', img.src)
                                            res.end()
                                        } 
                                    })
                                })
                                .catch((err) => console.log(err + '\ncould not able to update the size ' + albumSize))
                    })
                    .catch(function(err){ console.log("Was not able to delete the picture", err)})
                    
                
                    
            } else {
                console.log('Please select a valid image')
            }
                    //update the number of pics inside the album
                } else {
            console.log('Album does not exist')
        }
    }) 
})
router.patch('/:userId/:albumId/edit', function(req,res){
    const {userId, albumId} = req.params
    const {imgId, info: imgContent} = req.body.img
    console.log(`editing img ${imgId} on ${imgContent.title} & ${imgContent.content}`);
    Picture.findByIdAndUpdate(imgId, {info: imgContent},
        function (err, reqImg) {
        if (reqImg) {
            console.log('Updated the selected image succesfully')
            res.end()
            
        } else {
            res.end('Image does not exist', err)
        }
    })
    // Album.findById(albumId, 
    //     function (err, album) {
    //     if (album) {
    //         let reqImg = album.picturesIds.find(id => id == imgId)
    //         console.log('reqImg', reqImg);
    //         reqImg.info = imgContent
    //         console.log('Updated the selected image succesfully', reqImg)
    //         res.end()
            
    //     } else {
    //         res.end('album does not exist', err)
    //     }
    // })
})
export default router
// {
// fieldname: 'GalleryImg',      
// originalname: 'IMG-20181124-WA0018.jpg',
// encoding: '7bit',
// mimetype: 'image/jpeg',       
// destination: './uploads',     
// filename: 'GalleryImg-28-3-2022-1648496409312-998682733.jpeg',    
// path: 'uploads\\GalleryImg-28-3-2022-1648496409312-998682733.jpeg',
// size: 753219
//}
