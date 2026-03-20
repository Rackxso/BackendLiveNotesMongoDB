// models/meta.model.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const movimientoMetaSchema = new Schema({
    fecha:   { type: Date, required: true, default: Date.now },
    importe: { type: Number, required: true },
}, { _id: false });

const metaSchema = new Schema({
    usuario:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name:        { type: String, required: true },
    meta:        { type: Number, required: true },
    acumulado:   { type: Number, required: true, default: 0 },
    completada:  { type: Boolean, default: false },
    movimientos: { type: [movimientoMetaSchema], default: [] },
}, {
    timestamps: true,
    collection: 'Metas',
    versionKey: false
});

metaSchema.index({ name: 1, usuario: 1 }, { unique: true });

export const Meta = mongoose.model('Meta', metaSchema);