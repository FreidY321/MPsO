const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const UserRepository = require('../repositories/UserRepository');

const userRepository = new UserRepository();

/**
 * Configure Passport with Google OAuth 2.0 Strategy
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Extract user information from Google profile
        const googleId = profile.id;
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        const name = profile.name.givenName || '';
        const surname = profile.name.familyName || '';

        if (!email) {
          return done(new Error('No email found in Google profile'), null);
        }

        // Check if user already exists with this google_id
        let user = await userRepository.findByGoogleId(googleId);

        if (user) {
          // User exists, return the user
          return done(null, user);
        }

        // Check if user exists with this email
        user = await userRepository.findByEmail(email);

        if (user) {
          // User exists with email but no google_id, update with google_id
          await userRepository.update(user.id, { google_id: googleId });
          user.google_id = googleId;
          return done(null, user);
        }

        // User doesn't exist, create new user
        // Note: For students, they should be pre-registered by admin
        // So we'll only allow OAuth for existing users
        return done(new Error('No account found with this email. Please contact your administrator.'), null);

      } catch (error) {
        return done(error, null);
      }
    }
  )
);

/**
 * Serialize user for session
 * Note: We're using JWT, so we don't need full session serialization
 * But passport requires these methods
 */
passport.serializeUser((user, done) => {
  done(null, user.id);
});

/**
 * Deserialize user from session
 */
passport.deserializeUser(async (id, done) => {
  try {
    const user = await userRepository.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
