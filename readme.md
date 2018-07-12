# Web Dev Quiz App

### Required ENV Variables
- MONGOOSE_SRV: Mongoose URI or SRV
- PROFILE_TOKEN_SECRET: secret key to create a user profile token
- GOOGLE_API_KEY: google clientId, to verfiy idTokens from app,
- QUIZ_APP_CLIENT_ID: google cliendId that is used in the app
- (PORT: server port)
- (NODE_ENV: if not set to "production" a secret.json with these env variables is required)