const express = require('express');
const path = require('path');
var mongo = require('mongodb');
var monk = require('monk');
var objectID = require('mongodb').ObjectID;
var db = monk('localhost:27017/webtutor');	//database ip:port number
//may still have to set this up with mongodb from CLI (and make a data folder)

const port = process.env.PORT || 5000;
const app = express();
//next line is for running the app in production
//app.use(‘/’, express.static(`${__dirname}/client/build`));
//Make our DB available to our routers in express. 
//(might need to be tweaked for use with react?)
//In any case, it has to go before any routes (urls) are set
app.use(express.json());
app.use(function(req,res,next){
  	req.db = db;
  	next();
});
//
app.get('/admin', (req, res) => {
//
});
app.post('/api/login', (req, res) => {
	var db = req.db;
	var collection = db.get('userlist');
	collection.findOne({
		'username': req.body.username,
		'password': req.body.password
	})
	.then(doc => {
		if(doc) res.send(JSON.stringify({authenticated:true, msg: 'login successful'}));
		else res.send(JSON.stringify({authenticated:false, msg: 'login failed'}));
	});
	//cursor.forEach(printjson);
});
//this is the first one that works.
app.get('/api/livedoc/:author/:title', (req, res) => {
	var db = req.db;
	db.get('posts').findOne({'author': req.params.author, 'title': req.params.title})
		.then(liveDoc => {
			if(liveDoc) {
				resData = {
					title : liveDoc.title,
					content: liveDoc.content
				};
				res.send(resData);
			}
		})
		.catch(err => {
			res.send({msg: 'err: ' + err})
		});
	
});
//have to do a find on the user to get their id.
//definitely should get the auth_id on the client side when the user logs in!
app.put('/api/livedoc/:author/newdoc', (req, res) => {
	var db = req.db;
	console.log(req.body.doc_id);
	//I can only assume the promises + arrow function is the problem? try making it a callback.
	//this is the most frustrating thing I've ever encountered.
	db.get('userlist').findOne({'username': req.body.author})
		.then(postAuthor => {
			if(postAuthor) {
				var posts = db.get('posts');
				console.log('just before finding post by id')
				posts.findOne({'_id': req.body.doc_id}, {castIds:false})
				.then((postExists) => {
					if(postExists) {
						//console.log('inside postExists')
						posts.update({'_id': req.body.doc_id}, 
						{
							'title': req.body.doctitle,
							'content': req.body.doccontent
						}, {castIds:false})
						.then(updateRes => {
							if(updateRes)
								res.send({msg: 'doc update to db successful'});
							else (res.send({msg: 'doc update to db failed'})); //spicy current error!
							//what is going on with this.
						})
						.catch(err => res.send({msg: 'update post err: ' + err}));
					}
					else //post is brand new
						posts.insert({
							'_id' : req.body.doc_id,
							'auth_id' : postAuthor._id,
							'title' : req.body.doctitle,
							'content' : req.body.doccontent,
							'datetime' : req.body.datetime,
							'author' : req.body.author
						}, {castIds: false})
						//err will be 0 results written
						.then(writeRes => { 
							if(writeRes) {
								res.send({msg: 'wrote ' + writeRes.nInserted + ' documents to the db'})
							} else res.send({msg: 'write to db failed for REASONS'})
						})
						.catch(err => res.send({msg: 'when they want you to catch all the errors'}));
				})
				.catch(err => res.send({msg: 'find post err: ' + err}));
			}
			else res.send({msg: 'database read for authorID failed'}); //trips
		})
		//interesting so if you toString it, the read fails.
		//wai.
		.catch(err => res.send({msg: 'find post author err: ' + err + ' ' + req.body.author}));
		//error could have tripped ANYWHERE in the block. this is effectively useless.
});
app.listen(port, () => console.log(`Listening on port ${port}`));