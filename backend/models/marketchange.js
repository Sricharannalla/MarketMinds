const mongoose = require("mongoose")
const marketchangeSchema = mongoose.Schema({
    change_type: {type: String, enum: ["price_drop","new_product","update","remove"]},
    details: {type:Object},
    originalValues: {type:Object}, // Store original values for rollback
    simulatedDecisions: {type:Array, default:[]}, // Store agent decisions from simulation
    companyId: {type:mongoose.Schema.Types.ObjectId,ref:"User"},
    timestamp: {type:Date,default: Date.now},
    committed: {type:Boolean, default:false}
})

module.exports = mongoose.model("market_change",marketchangeSchema)