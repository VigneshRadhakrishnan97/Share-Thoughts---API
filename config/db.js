const config = require("config");
const mongoose = require("mongoose");
const db = config.get("monoURI");

//mongoose1=new mongoose();
//mongoose=mongoose({ useUnifiedTopology: true }); mongoose({ useUnifiedTopology: true })

//console.log(typeof(mongoose) );
const connectDB = async () => {
  try {
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useCreateIndex:true,
      useUnifiedTopology:true.valueOf,
      useFindAndModify:false
    });
    console.log("DB connected......");
  } catch (e) {
    console.log("DB connection failed " + e.message);
    process.exit(1);
  }
};

module.exports=connectDB;
