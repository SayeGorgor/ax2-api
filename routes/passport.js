import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import { 
    findByUsername,
    findById,
} from './helpers.js';

export default (passport) => {
    passport.use(new LocalStrategy(
        {
            usernameField: 'username',
            passwordField: 'password',
        },
        async (username, password, done) => {
            try {
                const user = await findByUsername(username);
                if(!user) return done(null, false, { message: 'User Not Found'});

                const matchedPassword = await bcrypt.compare(password, user.password);
                if(!matchedPassword) return done(null, false, { message: 'Password Incorrect'});

                return done(null, user);
            } catch(err) {
                return done(err);
            }
        }
    ));

    passport.serializeUser((user, done) => {
        return(done(null, user.id));
    });

    passport.deserializeUser((id, done) => {
        findById(id, (err, user) => {
            if(err) return done(err);
            if(!user) return done(null, false);
            return done(null, user);
        });
    });
}