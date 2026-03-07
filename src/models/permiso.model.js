const mongoose = require('mongoose'); 

var permisoSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true,
    },
    number:{
        type:Number,
        required:true,
        unique:true,
    },
    precio:{
        type:Number,
        required:true,
    },
    descripcion:{
        type:String,
        required:true,
    },
},{
    timestamps: false,
    collection: 'Permisos',
    versionKey: false
});

module.exports = mongoose.model('Permiso', permisoSchema);