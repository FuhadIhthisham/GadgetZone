const mongoClient = require('mongodb').MongoClient

const state = {
    db: null
}

module.exports.connect = (done)=>{
    const url = `mongodb+srv://FuhadIhthisham:${process.env.pass}@gadgetzone.90ww6.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`
    const dbname = 'gadgetzone'

    mongoClient.connect(url,(err,data)=>{
    if(err){
      return done(err);
    }
    state.db = data.db(dbname)
    done()
    
  })

}

module.exports.get = ()=>{
    return state.db
}