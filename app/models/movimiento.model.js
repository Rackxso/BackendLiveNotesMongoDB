import mongoose from "mongoose";

const movimientoSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        index: true,
    },
    fecha: {
        type: Date,
        required: true,
        default: Date.now
    },
    destinatario: {
        type: String
    },
    tipo: {
        type: Boolean,
        required: true
    },
    importe: {
        type: Number,
        required: true,
    },
    cuenta: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Cuenta'
    },
    metodo: {
        type: String,
        enum: ['Transferencia', 'Tarjeta', 'Factura', 'Subscripcion', 'Bizum', 'Efectivo', 'Otro']
    },
    metaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Meta',
        default: null
    },
    categorias: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Categoria' }],
        default: []
    }
}, {
    timestamps: false,
    collection: 'Movimientos',
    versionKey: false
});

export const Movimiento = mongoose.model("Movimiento", movimientoSchema);