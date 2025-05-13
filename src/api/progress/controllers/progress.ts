/**
 * progress controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::progress.progress', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in to create progress.');
    }

    const { data } = ctx.request.body;
    const documentId = data?.lectureDocumentId;

    if (!documentId) {
      return ctx.badRequest('Lecture documentId is required');
    }

    // Find lecture by documentId
    const lecture = await strapi.entityService.findMany('api::lecture.lecture', {
      filters: {
        ...({ documentId } as any)
      },
      populate: ['progress'],
      limit: 1,
    }) as any[];

    if (!lecture || lecture.length === 0) {
      return ctx.notFound('Lecture not found');
    }

    if (lecture[0].progress) {
      return ctx.badRequest('It is already done');
    }

    const lectureId = lecture[0].id;

    // Create progress entry
    const newProgress = await strapi.entityService.create('api::progress.progress', {
      data: {
        lecture: lectureId,
        user: user.id,
        complation_date: new Date().toISOString(),
      }
    });

    return this.transformResponse(newProgress);
  },

  async delete(ctx) {

  }
}));

