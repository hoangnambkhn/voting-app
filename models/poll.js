const mongoose = require("mongoose");
const Schema = mongoose.Schema ;
var autoIncrement = require('mongoose-auto-increment');
mongoose.Promise = global.Promise;
var connection = mongoose.createConnection(process.env.MONGODB_URI || 'mongodb://localhost/myDatabase');

autoIncrement.initialize(connection);
const pollSchema = new Schema({
  
   pollName : String ,
   userId : String,
   options : [{
       optionName : String ,
       optionVote : Number  
   }]
  
});

 
pollSchema.plugin(autoIncrement.plugin, 'poll');
var poll = connection.model('Book', pollSchema);

const modelClass = mongoose.model("poll",pollSchema);
module.exports = modelClass;