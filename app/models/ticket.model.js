import mongoose from 'mongoose';
const { Schema } = mongoose;

const ticketSchema = new Schema({
    usuario:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    asunto:      { type: String, required: true },
    categoria:   { type: String, enum: ['bug', 'sugerencia', 'pregunta', 'otro'], required: true },
    descripcion: { type: String, required: true },
    estado:      { type: String, enum: ['abierto', 'en_revision', 'resuelto'], default: 'abierto' },
}, {
    timestamps: true,
    collection: 'Tickets',
    versionKey: false
});

ticketSchema.index({ usuario: 1 });

export const Ticket = mongoose.model('Ticket', ticketSchema);
