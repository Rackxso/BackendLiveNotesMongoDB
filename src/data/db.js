"use strict";

import mongoose from "mongoose";
import { URI } from '../config.js';

/**
 * Conecta a la base de datos de MongoDB usando Mongoose.
 */
export const conexionBD = async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            console.log("Ya existe una conexión activa a MongoDB");
            return;
        }

        await mongoose.connect(URI, {
            dbName: "LiveNotes",
            serverSelectionTimeoutMS: 30000
        });

        console.log("✅ Conexión exitosa a MongoDB con Mongoose");
        console.log("📊 Base de datos:", mongoose.connection.name);

    } catch (error) {
        console.error(`❌ Error al conectar a MongoDB:`, error.message);
        throw new Error("No se pudo conectar a la base de datos");
    }
};
