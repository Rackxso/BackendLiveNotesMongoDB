import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/user.model.js';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, URL, PORT } from '../config.js';

passport.use(new GoogleStrategy(
    {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `${URL}:${PORT}/api/user/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails?.[0]?.value;
            if (!email) return done(new Error('No se pudo obtener el email de Google'), null);

            let user = await User.findOne({ email });

            if (user) {
                if (!user.googleId) {
                    user.googleId = profile.id;
                    await user.save();
                }
                return done(null, user);
            }

            user = await User.create({
                name: profile.displayName || email.split('@')[0],
                email,
                googleId: profile.id,
                password: null,
                permisos: 1,
                verificado: true,
            });

            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }
));

export default passport;
