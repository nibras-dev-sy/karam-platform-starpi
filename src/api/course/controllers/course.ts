import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::course.course', ({ strapi }) => ({
    async find(ctx) {
        const user = ctx.state.user;
        if (!user) return ctx.unauthorized();
      
        ctx.query = {
            ...ctx.query,
            filters: {
              users: {
                id: {
                  $eq: user.id,
                },
              },
            },
            populate: ['image', 'teacher'], // helps validation and returns relation
        };
      
        const { data, meta } = await super.find(ctx);
        return { data, meta };
      }
}));
