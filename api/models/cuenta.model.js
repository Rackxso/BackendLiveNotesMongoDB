import mongoose from 'mongoose';

const cuentaSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, index: true },
    balance: { type: Number, required: true },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true } // 👈
}, {
    timestamps: false,
    collection: 'Cuentas',
    versionKey: false
});

export const Cuenta = mongoose.model('Cuenta', cuentaSchema);