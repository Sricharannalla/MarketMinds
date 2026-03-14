const mongoose = require("mongoose")
const productSchema = mongoose.Schema({
    product_id: {type:String,unique:true,required:true},
    brand: {type:String,required:true},
    price: {type:Number,required:true},
    quality: {type:Number,min:0,max:1,required:true},
    category: {type:String,  required:true},
    popularity_score: {type:Number,min:0,max:1},
    isStaged: {type: Boolean,default:false},
    companyId: {type:mongoose.Schema.Types.ObjectId,ref:'User'}
});

productSchema.index({ companyId: 1, isStaged: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ category: 1 });

module.exports = mongoose.model('products',productSchema);