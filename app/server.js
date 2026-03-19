// server.js — aquí va el listen
import app from './app.js';
import { conexionBD } from './data/db.js';
import { PORT, URL } from './config.js';

conexionBD()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en ${URL}:${PORT}`);
        })
    })
    .catch(err => {
        console.log('No se pudo iniciar el servidor', err.message);
        process.exit(1);
    })