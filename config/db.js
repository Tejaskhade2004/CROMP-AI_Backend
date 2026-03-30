import mongoose from "mongoose"

const connectdb = async ()=>{
    try{
        await mongoose.connect(process.env.MONGODB_URL)
        console.log("Database Connected...");
        
    } catch(err){
        console.log("db error");
        
    }
}

export default connectdb