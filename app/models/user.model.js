// user.model.js
import mongoose from 'mongoose';

var avatarSchema = new mongoose.Schema({
    data: { type: Buffer, required: true },
    fileType: {
        type: String,
        required: true,
        enum: {
            values: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
            message: `{VALUE} no es un tipo de archivo válido`,
        }
    }
}, { _id: false });

var userSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    avatar: { 
        type: avatarSchema, 
        required: false, 
        default: null 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        index: true 
    },
    password: {
        type: String,
        required: false,
        default: null
    },
    permisos: {
        type: Number,
        required: [true, 'Debe tener un permiso'],
        enum: {
            values: [1, 2, 3, 13579],
            message: `{VALUE} no es un estado válido`,
        }
    },
    verificado: { 
        type: Boolean, 
        default: false 
    },
    tokenVerificacion: { 
        type: String, 
        default: null 
    },
    tokenEliminacion: { 
        type: String, 
        default: null 
    },
    tokenCambioPassword: { 
        type: String, 
        default: null 
    },
    tokenCambioPasswordExpira: {
        type: Date,
        default: null
    },
    newPasswordPending: { type: String, default: null },
    refreshToken: { type: String, default: null },
    passwordCompliant: { type: Boolean, default: false },
    stripeCustomerId: { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },
    completedTours: { type: [String], default: [] },
}, {
    timestamps: false,
    collection: 'Users',
    versionKey: false
});

export const User = mongoose.model('User', userSchema);