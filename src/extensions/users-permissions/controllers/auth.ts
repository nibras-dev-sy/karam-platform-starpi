import { ApplicationError } from '@strapi/utils/dist/errors';
import { Context } from 'koa';

const sanitizeUser = (user, ctx) => {
    const { auth } = ctx.state;
    const userSchema = strapi.getModel('plugin::users-permissions.user');

    return strapi.contentAPI.sanitize.output(user, userSchema, { auth });
};

export async function callback(ctx: Context) {

    const { identifier, password } = ctx.request.body;

    if (!identifier || !password) {
        return ctx.badRequest('Identifier or password missing');
    }

    const [user] = await strapi.entityService.findMany(
        'plugin::users-permissions.user',
        {
            filters: { email: identifier },
            //populate: 'organization', // Here I have added another attribute
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

export async function register(ctx: Context) {

    const { email, username, password, education } = ctx.request.body;

    if (!email || !username || !password || !education) {
        throw new ApplicationError('Missing required fields');
    }

    const allowedEducation = ['ninth', 'twelfth_scientific', 'twelfth_literary'];
    if (!allowedEducation.includes(education)) {
        throw new ApplicationError('Invalid education value');
    }

    const userService = strapi.plugin('users-permissions').service('user');

    const existingEmail = await strapi.query('plugin::users-permissions.user').findOne({
        where: { email },
    });

    if (existingEmail) {
        throw new ApplicationError('Email is already in use');
    }

    const newUser = await userService.add({
        email,
        username,
        password,
        confirmed: true,
        education,
    });

    const jwt = strapi.plugin('users-permissions').service('jwt').issue({ id: newUser.id });

    ctx.send({
        jwt,
        user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            education: newUser.education,
        },
    });
}