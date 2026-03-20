import mongoose from 'mongoose';
const { Schema } = mongoose;

const categoriaSchema = new Schema({
    nombre:      { type: String, required: true },
    icono:       { type: String },
    color:       { type: String },
    predefinida: { type: Boolean, default: false },
    usuario:     { type: Schema.Types.ObjectId, ref: 'User', default: null }, // null = predefinida
}, {
    timestamps: false,
    collection: 'Categorias',
    versionKey: false
});

categoriaSchema.index({ nombre: 1, usuario: 1 }, { unique: true });

export const Categoria = mongoose.model('Categoria', categoriaSchema);