const mongoose = require('mongoose'); 

var userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true,
        index:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    password:{
        type:String,
        required:true,
    },
    permisos:{
        type: [permisosSchema],
        
    }
},{
    timestamps: false,
    collection: 'Users',
    versionKey: false
});

var permisosSchema = new mongoose.Schema({
    indice: {
        type: Number,
        required: [true, 'Debe tener un permiso'],
        enum:{
            values: [1, 2, 3],
            message: `{VALUE} no es un estado válido`,
        }
    }
}, {_id:false});

module.exports = mongoose.model('User', userSchema);