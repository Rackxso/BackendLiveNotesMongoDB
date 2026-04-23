import mongoose from 'mongoose';
const { Schema } = mongoose;

const habitSchema = new Schema({
    userId:         { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name:           { type: String, required: true },
    rachaActual:    { type: Number, default: 0 },
    rachaMasLarga:  { type: Number, default: 0 },
    ultimaRacha:    { type: Number, default: 0 },
    ultimoHecho:    { type: Date, default: null }, // para controlar el "una vez al día"
    completionDates: [{ type: Date }],
}, { timestamps: true, collection: 'Habits', versionKey: false });

export const Habit = mongoose.model('Habit', habitSchema);