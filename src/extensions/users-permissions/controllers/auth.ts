import { ApplicationError } from '@strapi/utils/dist/errors';
import { Context } from 'koa';

const sanitizeUser = (user, ctx) => {
  const { auth } = ctx.state;
  const userSchema = strapi.getModel('plugin::users-permissions.user');

  return strapi.contentAPI.sanitize.output(user, userSchema, { auth });
};

export async function callback(ctx: Context) {
  const { identifier, password, deviceId } = ctx.request.body;

  if (!identifier || !password || !deviceId) {
    return ctx.badRequest('Mobile number, password, or device ID is missing');
  }

  const [user] = await strapi.entityService.findMany(
    'plugin::users-permissions.user',
    {
      filters: { mobile: identifier },
    }
  );

  if (
    !user ||
    !(await strapi.plugins['users-permissions'].services.user.validatePassword(password, user.password))
  ) {
    return ctx.badRequest('Invalid credentials');
  }

  if (user.deviceId == '' || user.deviceId == null || user.isAdmin) {
    user.deviceId = deviceId;

    await strapi.entityService.update(
      'plugin::users-permissions.user',
      user.id,
      {
        data: {
          deviceId: deviceId
        },
      }
    );
  }

  if (user.deviceId !== deviceId) {
    return ctx.unauthorized('Access denied: Device mismatch');
  }

  const sanitizedUser: any = await sanitizeUser(user, ctx);

  const jwt = strapi.plugins['users-permissions'].services.jwt.issue({ id: user.id });

  ctx.send({
    jwt,
    user: {
      ...sanitizedUser,
    },
  });
}


export async function register(ctx: Context) {
  const { mobile, username, password, education, deviceId } = ctx.request.body;

  if (!mobile || !username || !password || !education || !deviceId) {
    throw new ApplicationError('Missing required fields');
  }

  const allowedEducation = ['ninth', 'twelfth_scientific', 'twelfth_literary'];
  if (!allowedEducation.includes(education)) {
    throw new ApplicationError('Invalid education value');
  }

  const userService = strapi.plugin('users-permissions').service('user');

  const existingMobile = await strapi.query('plugin::users-permissions.user').findOne({
    where: { mobile },
  });

  if (existingMobile) {
    throw new ApplicationError('Mobile number is already in use');
  }

  //const roleService = strapi.plugins['users-permissions'].services.role;
  //const authenticatedRole = await roleService.findOne({ type: 'authenticated' });

  const newUser = await userService.add({
    mobile,
    username,
    password,
    confirmed: true,
    education,
    deviceId,
    role: 1, // assign role
  });

  const jwt = strapi.plugin('users-permissions').service('jwt').issue({ id: newUser.id });

  ctx.send({
    jwt,
    user: {
      id: newUser.id,
      username: newUser.username,
      mobile: newUser.mobile,
      education: newUser.education,
    },
  });
}
