const jwt = require("jsonwebtoken")
const User = require("../models/users")

module.exports = async (req, res, next) => {
    try{
        const token = req.header("Authorization")?.replace("Bearer ", "")
        if(!token) return res.status(401).json({error:"No token"})
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findById(decoded.id).select("-password")
        if(!user) return res.status(401).json({error:"User not found"})
        console.log(user);
        req.user = user
        next()
    }
    catch (error){
        res.status(401).json({error:"invalid token"})
    }
}