import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::course.course', ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const filters: any = {};

    if (!user.isAdmin) {
      filters.users = {
        id: {
          $eq: user.id,
        },
      }
    }

    ctx.query = {
      ...ctx.query,
      filters,
      populate: ['image', 'teacher'], // helps validation and returns relation
    };

    const { data, meta } = await super.find(ctx);
    return { data, meta };
  }
}));
