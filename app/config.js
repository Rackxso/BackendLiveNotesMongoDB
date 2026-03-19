import {config} from 'dotenv'

config(); //leer las variables de entorno

export const PORT=process.env.PORT
export const URI=process.env.URI
export const JWT_SECRET=process.env.SECRET_KEY
export const JWT_REFRESH_SECRET=process.env.REFRESH_SECRET_KEY

export const EMAIL_USER=process.env.EMAIL_USER
export const EMAIL_PASS=process.env.EMAIL_PASS
export const URL=process.env.URL

export const MAIL_USER = process.env.EMAIL_USER;
export const MAIL_PASS = process.env.EMAIL_PASS;
