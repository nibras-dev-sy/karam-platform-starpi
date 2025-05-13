/**
 * lecture controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::lecture.lecture', ({ strapi }) => ({
    async find(ctx) {
        const user = ctx.state.user;
        if (!user) return ctx.unauthorized();

        const courseDocumentId = ctx.query.course;

        if(!courseDocumentId) return ctx.forbidden("No Course Id");

        ctx.query = {
            ...ctx.query,
            filters: {
                course: {
                    users: {
                        id: {
                            $eq: user.id,
                        },
                    },
                    documentId: {
                        $eq: courseDocumentId
                    }
                },
            },
            populate: ['progress'], // helps validation and returns relation
        };

        const { data, meta } = await super.find(ctx);
        return { data, meta };
    },

    async findOne(ctx) {
        const user = ctx.state.user;
        if (!user) return ctx.unauthorized();

        ctx.query = {
            ...ctx.query,
            filters: {
                course: {
                    users: {
                        id: {
                            $eq: user.id,
                        },
                    }
                },
            },
            populate: ['progress', 'video', 'course'], // helps validation and returns relation
        };

        const { data, meta } = await super.findOne(ctx);
        return { data, meta };
    }
}));

