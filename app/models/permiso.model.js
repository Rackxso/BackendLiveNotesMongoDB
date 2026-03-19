import mongoose from 'mongoose'; 

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
    }
},{
    timestamps: false,
    collection: 'Permisos',
    versionKey: false
});

export const Permiso = mongoose.model('Permiso', permisoSchema);