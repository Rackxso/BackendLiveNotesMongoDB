import mongoose from 'mongoose';
const { Schema } = mongoose;

const notaSchema = new Schema({
    usuario:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    titulo:    { type: String, required: true },
    contenido: { type: String, default: '' },
    categoria: { type: String, default: '' },
}, {
    timestamps: true,
    collection: 'Notas',
    versionKey: false
});

notaSchema.index({ usuario: 1 });

export const Nota = mongoose.model('Nota', notaSchema);