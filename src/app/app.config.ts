import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { KeyBinder } from '@thegraid/easeljs-lib';

import { routes } from './app.routes';

// https://v17.angular.io/guide/standalone-migration

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes),
        KeyBinder]
};
