import mongoose from 'mongoose';
const { Schema } = mongoose;

// --- Esquema base ---
const eventSchema = new Schema(
  {
    userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date:      { type: Date, required: true },
    type:      { type: String, required: true, enum: ['calendar', 'habit', 'mood'] },
    notes:     { type: String },
  },
  { timestamps: true, discriminatorKey: 'type' }
);

const Event = mongoose.model('Event', eventSchema);

// --- Subtipo: Evento de calendario ---
const CalendarEvent = Event.discriminator('calendar', new Schema({
  title:       { type: String, required: true },
  endDate:     { type: Date },
  location:    { type: String },
  allDay:      { type: Boolean, default: false },
  color:       { type: String },
}));

// --- Subtipo: Entrada de habit tracker ---
const HabitEntry = Event.discriminator('habit', new Schema({
  habitId:     { type: Schema.Types.ObjectId, ref: 'Habit', required: true },
  habitName:   { type: String, required: true },
}));

// --- Subtipo: Entrada de mood tracker ---
const MoodEntry = Event.discriminator('mood', new Schema({
  score:       { type: Number, min: 1, max: 10, required: true },
  emotions:    [{ type: String }],          // ['happy', 'calm', ...]
  energy:      { type: Number, min: 1, max: 5 },
}));

export { Event, CalendarEvent, HabitEntry, MoodEntry };