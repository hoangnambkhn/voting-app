var express = require("express");
var bodyParser = require("body-parser");
var app = express(app);
var passport = require('passport');
var Strategy = require('passport-twitter').Strategy;
var port = process.env.PORT || 8080;

var MongoClient = require("mongodb").MongoClient;
var mongoose = require("mongoose");
var poll = require("./models/poll");



mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/myDatabase');
mongoose.Promise = global.Promise;
// poll.remove({}, function(){}); 
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true })); 
passport.use(new Strategy({
  consumerKey: "WiSZ4CeoyA5tRR8cIMlhmZK4T",
  consumerSecret: "Mk33FlpyIv3ZQqeQSIOAFyrgG7Tq3KAtxDeqAY78yUns1JCk7f",
  callbackURL: 'https://dynamicweb-namhoang18595.c9users.io/login/twitter/return'
},
                          function(token, tokenSecret, profile, cb) {
  // In this example, the user's Twitter profile is supplied as the user
  // record.  In a production-quality application, the Twitter profile should
  // be associated with a user record in the application's database, which
  // allows for account linking and authentication with other identity
  // providers.
  return cb(null, profile);
}));
passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});
// app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());
app.get('/',function(req,res){
  // // console.log(req.user);
  res.render('home', { user: req.user });
});

app.get('/home',function(req,res){
    res.render('home',{user :req.user});
})

app.get('/about', function(req,res){
    res.render('about');
    // res.send("tester");
})

app.get('/login',passport.authenticate('twitter'));
app.get('/login/twitter/return', 
        passport.authenticate('twitter', { failureRedirect: '/login' }),
        function(req, res) {
  res.redirect('/');

});

app.get('/logout',function(req, res) {
    req.logout();
    res.redirect('/');
})

app.get('/new-poll',function(req, res) {
    res.render('new-poll',{ user: req.user });
})

app.get('/getdata/alldata',function(req, res) {
    poll.find({},function(err,data){
        if(err) console.error(err);
        res.json({"polls":data});
    })
})

app.get('/getdata/once',function(req, res) {
    
})
app.get('/getPolls', function(req, res) {
    poll.find({},function(err,data){
        res.json({"polls":data});
        // res.json(data);
        //console.log(data);
    })
})

app.get('/submit-poll',function(req, res) {
    // res.render('about');
    var pollname = req.query.titleinput;
    var pollOptions = req.query.options.split('\n');
    var optionsAndVote = [];
    for(var i = 0; i<pollOptions.length; i++){
        if((typeof pollOptions[i] != 'undefined') && ( pollOptions[i].replace(/\r?\n|\r/,'') !== '' )){
            var tpm = {
            optionName  : pollOptions[i].replace(/\r?\n|\r/,''),
            optionVote : 0
            }
        optionsAndVote.push(tpm);
        }
        
    }
    if((typeof pollname != 'undefined')){
        var data = new poll({
        pollName : pollname,
        userId : req.user.id,
        options : optionsAndVote
        })
        data.save(function(err){
            if(err) console.error(err);
            
        })
    }
    
    console.log(pollname);
    console.log(optionsAndVote);
    res.render('my-poll',{ user: req.user})
})


app.get('/my-poll',function(req, res) {
    res.render('my-poll', { user: req.user });
})

app.get('/removepoll/:id(*)',function(req, res) {
    var pollId = req.params.id;
    console.log(pollId);
    poll.find({ _id:pollId }).remove().exec();
    // res.send("deleted the poll" );
    res.redirect('/');
    
})

app.get('/removePoll',function(req, res) {
     var pollId= req.headers.referer.split('=')[1]; 
     console.log('pollid: '+pollId);
     poll.find({_id:pollId}).remove().exec();
     res.redirect('/');
})

app.get('/getMyPolls', function(req, res) {
    var userId  = req.user.id;
    console.log(userId);
    poll.find({userId : userId},function(err, data) {
        if(err) console.error(err);
        res.json({"polls":data});  
        console.log(data);
    })
})

app.get('/singlePoll',function(req,res){
  if (req.user) {
    res.render('single-poll', { user : req.user });
  }
  else {
    res.render('single-poll', { user : null });
  }
})

// get data from poll and push to html
app.get('/getSinglePoll',function(req, res) {
    // console.log('getsinglepoll');
  var id = req.query.id;
      //console.log(id);
  poll.find({
    _id : id 
  },function(err,data){
    if(err) console.log("Err");
    if(req.user) {
      data.push({"userId":req.user.id});
      res.json({"poll":data});
    } else 
      res.json({"poll":data});
  });
});
app.get('/voteformsubmit',function(req, res) {
    var votefor = req.query.select;
    var newOptionName = req.query.customoption;
    console.log(newOptionName);
    var pollId= req.headers.referer.split('=')[1];
    var ip = req.headers['x-forwarded-for'] || 
     req.connection.remoteAddress || 
     req.socket.remoteAddress ||
     req.connection.socket.remoteAddress;
    var isNewOption;
    if(votefor !== "Create new option"){
        isNewOption = false
    }
    else{
        isNewOption = true;
    }
    
    poll.findById(pollId,function(err,data){
        if(err) console.error(err);
        if(isNewOption){
            console.log(newOptionName);
            var newOption = {
                   optionName : newOptionName,
                   optionVote : 1
            }
            data.options.push(newOption);
            console.log(newOption);
            
        }
        else {
            for(var i=0;i<data.options.length;i++){
                if(votefor==data.options[i].optionName)
                data.options[i].optionVote+=1;
                
            }
        }
        console.log(data);
        data.save(function(err){
            if(err) console.error(err);
        });
        res.redirect(req.get('referer'));
    })
    // res.send(votefor);
})
//
app.listen(port,function(err){
    if(err) console.err(err);
    console.log('The magic happens on port ' + port);
});
