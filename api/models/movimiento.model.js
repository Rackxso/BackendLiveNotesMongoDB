const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var movimientoSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true,
        index:true,
    },
    fecha:{
        type: Date,
        required: true,
        default: Date.now
    },
    destinatario:{
        type: String
    },
    tipo:{
        type: Boolean,
        required: true
    },
    importe:{
        type:Number,
        required:true,
    },
    cuenta:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref: 'Cuenta'
    },
    metodo:{
        type: String,
        enum: ['Transferencia', 'Tarjeta', 'Factura', 'Subscripcion', 'Bizum', 'Efectivo', 'Otro']
    }
},{
    timestamps: false,
    collection: 'Movimientos',
    versionKey: false
});

module.exports = mongoose.model('Movimiento', movimientoSchema);