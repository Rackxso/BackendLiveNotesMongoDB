// models/todo.model.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const subItemSchema = new Schema({
    usuario:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    texto:       { type: String, required: true },
    completado:  { type: Boolean, default: false },
    prioridad:   { type: Number, default: 1, min: 1, max: 10 },
    fechaLimite: { type: Date, default: null },
    etiquetas:   [{ type: String }],
    order:       { type: Number, default: 0 },
}, { _id: true, timestamps: true });

const itemSchema = new Schema({
    usuario:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    idLista:     { type: String, default: '', index: true },
    texto:       { type: String, required: true },
    completado:  { type: Boolean, default: false },
    prioridad:   { type: Number, default: 1, min: 1, max: 10 },
    dificultad:  { type: Number, default: 3, min: 1, max: 5 },
    importancia: { type: Number, default: 3, min: 0, max: 3 },
    fechaLimite: { type: Date, default: null },
    etiquetas:   [{ type: String }],
    subItems:    { type: [subItemSchema], default: [] },
    order:       { type: Number, default: 0 },
}, {
    timestamps: true,
    collection: 'Todos',
    versionKey: false
});

itemSchema.index({ usuario: 1, idLista: 1 });
itemSchema.index({ usuario: 1, prioridad: -1 });
itemSchema.index({ usuario: 1, fechaLimite: 1 });

export const Todo = mongoose.model('Todo', itemSchema);