import { Core } from '@strapi/strapi';
import lifecycles from './extensions/users-permissions/content-types/user/lifecycles';
import { callback, register } from './extensions/users-permissions/controllers/auth';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    strapi.plugin('users-permissions').controller('auth').callback = callback;
    strapi.plugin('users-permissions').controller('auth').register = register;
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }: { strapi: Core.Strapi }) {
    strapi.server.httpServer.requestTimeout = 20000 * 1000;

    strapi.db.lifecycles.subscribe({
      models: ['plugin::users-permissions.user'],
      ...lifecycles,
    });
  },
};