// models/presupuesto.model.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const presupuestoSchema = new Schema({
    usuario:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
    categoria:  { type: Schema.Types.ObjectId, ref: 'Categoria', required: true },
    limite:     { type: Number, required: true },
    acumulado:  { type: Number, required: true, default: 0 },
    mes:        { type: Number, required: true }, // 1-12
    anio:       { type: Number, required: true },
    superado:   { type: Boolean, default: false },
}, {
    timestamps: false,
    collection: 'Presupuestos',
    versionKey: false
});

// Un presupuesto por categoría por mes por usuario
presupuestoSchema.index({ usuario: 1, categoria: 1, mes: 1, anio: 1 }, { unique: true });

export const Presupuesto = mongoose.model('Presupuesto', presupuestoSchema);