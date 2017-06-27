const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if (isPhoto) {
      next(null, true);
    } else {
      next({message: 'Invalid filetype.'}, false);
    }
  }
};

exports.addStore = (req, res) => {
  res.render('edit-store', { title: 'Add Store' });
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  // check if there is no new file to reize
  if (!req.file) return next(); // skip to the next middleware
  const extension = req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  // now we resize
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  // once we have written the photo to our file system, keep going
  next();
};

exports.getStores = async (req, res) => {
  // Pagination
  const page = req.params.page || 1;
  const limit = 6;
  const skip = (page * limit) - limit;

  const storesPromise = Store
    .find() // Query the DB for a list of all the stores
    .skip(skip)
    .limit(limit)
    .sort({ created: 'desc' });
  const countPromise = Store.count();
  const [stores, count] = await Promise.all([storesPromise, countPromise]);
  const pages = Math.ceil(count / limit);
  if (!stores.length && skip) {
    req.flash('info', `Hey! You asked for page ${page}. However, it doesn't exist. So I put you on page ${pages}`);
    res.redirect(`/stores/page/${pages}`);
    return;
  }
  res.render('stores', { stores, page, pages, count, title: 'Stores' });
};

exports.createStore = async (req, res) => {
  req.body.author = req.user._id;
  const store = await (new Store(req.body)).save();
  req.flash('success', `Successfully Created ${store.name}.`);
  res.redirect(`/store/${store.slug}`);
};

const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) throw Error('You must own a store in order to edit it');
};

exports.editStore = async (req, res) => {
  // 1.Find the store given the ID
  const store = await Store.findOne({ _id: req.params.id });
  // 2.Confirm they are the owner of the store
  confirmOwner(store, req.user);
  // 3.Render out the edit form so the user can update their store
  res.render('edit-store', { store, title: `Edit ${store.name}`});
};

exports.updateStore = async (req, res) => {
  // set location data to be a Point
  req.body.location.type = 'Point';
  // find and update the store
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body,
  {
    new: true, // return the new store instead of the old one
    runValidators: true
  }).exec();
  // Redirect them the store and tell them it worked
  req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/store/${store.slug}">View Store</a>`);
  res.redirect(`/stores/${store._id}/edit`);
};

exports.showStoreBySlug = async (req, res, next) => {
  // find store with given slug
  const store = await Store.findOne({ slug: req.params.slug }).populate('author reviews');
  // next if store is null
  if (!store) return next();
  // all is good render the show store page
  res.render('show-store', {store, title: `${store.name}`});
};

exports.getStoresByTag = async (req, res) => {
  const tag = req.params.tag;
  const tagQuery = tag || { $exists: true };
  const tagsPromise = Store.getTagsList();
  const storesPromise = Store.find({ tags: tagQuery });
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
  res.render('tags', {tags, tag, stores});
};

exports.mapPage = (req, res) => {
  res.render('map', { title: 'Map' });
};

/*
  STORE API
*/

exports.searchStores = async (req, res) => {
  const stores = await Store
  // find stores that match
  .find({
    $text: {
      $search: req.query.q
    }
  }, {
    score: { 
      $meta: 'textScore' 
    }
  })
  // sort stores by textscore
  .sort({
    score: { $meta: 'textScore' }
  })
  // limit to only 6 results
  .limit(6);
  res.json(stores);
};

exports.mapStores = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const q = {
    location: {
      $near: {
        $geometry: {
          coordinates,
          type: 'Point'
        },
        $maxDistance: 10000 // 10km
      }
    }
  };

  const stores = await Store.find(q)
    .select('slug name description location photo')
    .limit(8);

  res.json(stores);
};

exports.favoriteStore = async (req, res) => {
  const favorites = req.user.favorites.map(obj => obj.toString());
  const operator = favorites.includes(req.params.id) ? '$pull' : '$addToSet';
  const user = await User
    .findByIdAndUpdate(req.user._id,
      { [operator]: {favorites: req.params.id } }, 
      { new: true }
    );
    
  res.json(user);
};

exports.getFavorites = async (req, res) => {
  // get all stores that are favorited
  const favoriteStores = await Store.find({ _id: { $in: req.user.favorites } });
  res.render('favorites', { favoriteStores, title: 'Favorite Stores' });
};

exports.getTopStores = async (req, res) => {
  // get top reviewed stores from db
  const stores = await Store.getTopStores();
  res.render('top-stores', { stores, title: 'Top Stores' });
};
