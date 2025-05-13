import { factories } from '@strapi/strapi';

interface ActivationCode {
    id: number;
    code: string;
    is_used: boolean;
    courses: { id: number }[];
}


export default factories.createCoreController('api::activation-code.activation-code', ({ strapi }) => ({
    async activate(ctx) {
        const user = ctx.state.user;
        const codeValue = ctx.request.query.code;

        if (!user || !codeValue) {
            return ctx.badRequest('Missing user or activation code.');
        }

        // 1. Find activation code with related courses
        const [activation] = await strapi.entityService.findMany('api::activation-code.activation-code', {
            filters: { code: codeValue, is_used: false },
            populate: {
                courses: true
            },
        }) as any[];

        if (!activation) {
            return ctx.forbidden('Invalid or already used activation code.');
        }

        const courseIdsToAdd = activation.courses.map(c => c.id);

        // 2. Get current user’s courses
        const userEntity = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
            populate: ['courses'],
        }) as any;

        const currentCourseIds = userEntity.courses?.map(c => c.id) ?? [];
        const allCourses = [...currentCourseIds, ...courseIdsToAdd] as any;

        // 3. Update user
        await strapi.entityService.update('plugin::users-permissions.user', user.id, {
            data: {
                courses: allCourses,
                publishedAt: new Date().toISOString(),
            },
        });

        await Promise.all(allCourses.map(id =>
            strapi.entityService.update('api::course.course', id, {
                data: {
                    publishedAt: new Date().toISOString(),
                },
            })
        ))

        const courses = await strapi.entityService.findMany('api::course.course', {
            filters: {
                users: {
                    id: {
                        $eq: user.id,
                    },
                },
            },
        });

        console.dir(courses, { depth: null });

        // 4. Mark activation code as used
        await strapi.entityService.update('api::activation-code.activation-code', activation.id, {
            data: {
                is_used: true,
                used_user: user.id,
            },
        });

        return {
            message: 'Activation successful.',
            addedCourses: activation.courses,
        };
    },
}));
