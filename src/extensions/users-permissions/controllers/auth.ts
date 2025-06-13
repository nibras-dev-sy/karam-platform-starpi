import { Context } from 'koa';

const sanitizeUser = (user, ctx) => {
  const { auth } = ctx.state;
  const userSchema = strapi.getModel('plugin::users-permissions.user');

  return strapi.contentAPI.sanitize.output(user, userSchema, { auth });
};

export async function callback(ctx: Context) {
  console.log('Custom auth controller callback called');

  const { identifier, password } = ctx.request.body;

  if (!identifier || !password) {
    return ctx.badRequest('Identifier or password missing');
  }

  const [user] = await strapi.entityService.findMany(
    'plugin::users-permissions.user',
    {
      filters: { email: identifier }
    }
  );

  if (
    !user ||
    !(await strapi.plugins['users-permissions'].services.user.validatePassword(
      password,
      user.password
    ))
  ) {
    return ctx.badRequest('Invalid credentials');
  }

  const sanitizedUser: any = await sanitizeUser(
    user,
    ctx
  );

  const jwt = strapi.plugins['users-permissions'].services.jwt.issue({
    id: user.id,
  });

  ctx.send({
    jwt,
    user: {
      ...sanitizedUser,
    },
  });
}
