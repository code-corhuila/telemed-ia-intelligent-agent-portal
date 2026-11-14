const {
  withNativeFederation,
  shareAll,
} = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({
  name: 'agent',

  exposes: {
    './routes': './src/app/agent/agent.routes.ts',
  },

  shared: {
    ...shareAll({
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto',
    }),
  },

  // NORMA 5.4.1: HTTP client, session and error type come from the shell.
  externals: [
    'shell/apiClient',
    'shell/session',
    'shell/apiError',
  ],

  // Entry points the application never loads: sharing them would bundle their
  // dependencies (@angular/animations is not installed).
  skip: [
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
    '@angular/platform-browser/animations',
    '@angular/platform-browser/animations/async',
  ],
});