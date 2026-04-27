// server.js — aquí va el listen
import app from './app.js';
import { conexionBD } from './data/db.js';
import { PORT, URL } from './config.js';

conexionBD()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en ${URL}:${PORT}`);

            if (process.env.NODE_ENV === 'production') {
                setInterval(async () => {
                    try {
                        await fetch(`${URL}/health`);
                    } catch (err) {
                        console.log('Self-ping fallido:', err.message);
                    }
                }, 10 * 60 * 1000);
            }
        })
    })
    .catch(err => {
        console.log('No se pudo iniciar el servidor', err.message);
        process.exit(1);
    })