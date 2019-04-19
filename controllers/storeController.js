// exports.myMiddleware = (req,res,next) => {
//     req.name = 'Iuliia';
//     if(req.name === 'Iuliia'){
//         throw Error('That is a lovely name');
//     }
//     // res.cookie('name', 'Iuliia is cool', { maxAge: 9000000 });
//     next();
// }

const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');

const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
    storage: multer.memoryStorage(),
    fileFilter: function(req, file, next) {
        const isPhoto = file.mimetype.startsWith('image/');
        if(isPhoto) {
            next(null, true);
        } else {
            next({message: 'That filetype isn\t allowed!'}, false);
        }
    }
}

exports.homePage = (req, res) => {
    // req.flash('error', 'Something happened');
    // req.flash('info', 'Something happened')
    // req.flash('warning', 'Something happened')
    // req.flash('success', 'Something happened')
    res.render('index');
}

exports.addStore = (req, res) => {
    res.render('editStore', {title: 'Add Store'});
}

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
    // check if there is no new file to resize
    if (!req.file) {
        next(); // skip to the next middleware, e.g. createStore
    }
    console.log(req.file);
    const extention = req.file.mimetype.split('/')[1];
    req.body.photo = `${uuid.v4()}.${extention}`;
    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO);
    await photo.write(`./public/uploads/${req.body.photo}`);
    // once we have written the photo to our filesystem, keep going
    next();
}

exports.createStore = async (req, res) => {
    req.body.author = req.user._id;
    const store = await (new Store(req.body)).save();

    req.flash('success', `Successfully created ${store.name}`);
    // console.log('It worked!');
    res.redirect(`/store/${store.slug}`);
    // одразу перекидає на сторінку новоствореного магазину
}

exports.getStores = async (req, res) => {
    const page = req.params.page || 1;
    const limit = 4;
    const skip = (page * limit) - limit;

    
    const storesPromise = Store
        .find()
        .skip(skip)
        .limit(limit)
        .sort({ created: 'desc' })

    const countPromise = Store.count();

    const [stores, count] = await Promise.all([storesPromise, countPromise]);

    const pages = Math.ceil(count / limit);
    if (!stores.length && skip) {
        req.flash('info', `Hey! You asked for page ${page}. But that doesn't exist. So I put you on page ${pages}`);
        res.redirect(`/stores/page/${pages}`);
        return;
    }

    res.render('stores', {title: 'Stores', stores, page, pages, count});
}

const confirmOwner = (store, user) => {
    // store.author is ObjectId, in order to compare it with string, we use the method equals
    // it is possible to add admin access rights using "|| userlevel" (e.g. level 20)
    if (!store.author.equals(user.id)) {
        throw Error('You mush own a store in order to edit it!');
    }
}

exports.editStore = async (req, res) => {
    // find the store given the id
    // res.json(req.params.id);
    const store = await Store.findOne({_id: req.params.id});
    // res.json(store);
    // confirm who is the owner of the store
    confirmOwner(store, req.user);
    // render out the edit form so the user can update their store
    res.render('editStore', {title: `Edit ${store.name}`, store: store});
}

exports.updateStore = async (req, res) => {
    req.body.location.type = 'Point';
    // find and update the store
    const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, { 
        new: true, // return the new store instead of the old one
        runValidators: true, // force our model to run required values
    }).exec();
    req.flash(
        'success', 
        `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store -></a>`);
    res.redirect(`/stores/${store._id}/edit`);
    // redirect them to the store and tell them it worked
}

exports.getStoreBySlug = async (req, res, next) => {
    const store = await Store.findOne({slug: req.params.slug}).
        populate('author reviews');
    if(!store) return next();
    res.render('store', {store, title: store.name});
}

exports.getStoresByTag = async (req, res) => {
    const tag = req.params.tag;
    const tagQuery = tag || { $exists: true };

    const tagsPromise = Store.getTagsList();
    const storesPromise = Store.find({tags: tagQuery});
    const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
    // res.json(tags);
    res.render('tag', { tags, title: 'Tags', tag, stores })
}

// mongodb $text searches in all that is marked as text in Store.js
exports.searchStores = async (req,res) => {
    const stores = await Store
    .find({
        $text: {
            $search: req.query.q
        }
    }, {
        score: {$meta: 'textScore'}
    })
    // sort the result to reverse the order 
    .sort({
        score: {$meta: 'textScore'}
    })
    // limit to only 5 results
    .limit(5);
    res.json(stores);
};

exports.mapStores = async (req, res) => {
    const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
    const q = {
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: coordinates
                },
                $maxDistance: 10000 // 10km
            }
        }
    }
    // the stores can be accessed via req.query.limit
    const stores = await Store.find(q).select('slug name description location photo').limit(10);
    res.json(stores);
};

exports.mapPage = (req, res) => {
    res.render('map', { title: 'Map' });
}

exports.heartStore = async (req, res) => {
    const hearts = req.user.hearts.map(obj => obj.toString());
    // $pull is the mongodb operator of removing from the array
    // $addToSet is the mongodb operator of adding to the array. It will make sure we don't accidentally add it twice for the specific user. It makes sure it is unique
    const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
    const user = await User
        .findByIdAndUpdate(req.user._id,
            // ES6 allows us to use the following syntax: [operator]
            { [operator]: { hearts: req.params.id }},
            // { new: true } returns updated user rather than the previous user
            { new: true }
        )
    res.json(user)
}

exports.getHearts = async (req, res) => {
    const stores = await Store.find({
        // where the '_id' property of the store is '$in' the array 'req.user.hearts'
        _id: { $in: req.user.hearts }
    })

    res.render('stores', { title: 'Hearted Stores', stores });

}

exports.getTopStores = async (req, res) => {
    const stores = await Store.getTopStores();
    res.render('topStores', { stores, title: 'Top Stores!' });
}

// exports.viewTopStores = async (req, res) => {

// }