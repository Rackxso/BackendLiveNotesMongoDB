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
}, { _id: true, timestamps: true });

const itemSchema = new Schema({
    usuario:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    idLista:     { type: String, required: true, index: true },
    texto:       { type: String, required: true },
    completado:  { type: Boolean, default: false },
    prioridad:   { type: Number, default: 1, min: 1, max: 10 },
    fechaLimite: { type: Date, default: null },
    etiquetas:   [{ type: String }],
    subItems:    { type: [subItemSchema], default: [] },
}, {
    timestamps: true,
    collection: 'Todos',
    versionKey: false
});

itemSchema.index({ usuario: 1, idLista: 1 });
itemSchema.index({ usuario: 1, prioridad: -1 });
itemSchema.index({ usuario: 1, fechaLimite: 1 });

export const Todo = mongoose.model('Todo', itemSchema);