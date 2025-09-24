/**
 * lecture controller
 */

import { factories } from '@strapi/strapi'
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_ACCESS_SECRET!,
    region: process.env.AWS_REGION!,
});

export default factories.createCoreController('api::lecture.lecture', ({ strapi }) => ({
    async find(ctx) {
        const user = ctx.state.user;
        if (!user) return ctx.unauthorized();

        const courseDocumentId = ctx.query.course;

        if (!courseDocumentId) return ctx.forbidden("No Course Id");

        const courseFilter: any = {};
        var coursePopulate: any = {};

        if (!user.isAdmin) {
            courseFilter.users = {
                id: {
                    $eq: user.id,
                },
            }

            courseFilter.documentId = {
                $eq: courseDocumentId
            }

            coursePopulate = ['progress', 'courses', 'examFile'];
        } else {
            courseFilter.documentId = {
                $eq: courseDocumentId
            }

            coursePopulate = ['courses', 'examFile'];
        }

        ctx.query = {
            ...ctx.query,
            filters: {
                courses: courseFilter
            },
            populate: coursePopulate, // helps validation and returns relation
        };

        const { data, meta } = await super.find(ctx);
        return { data, meta };
    },

    async findOne(ctx) {
        const user = ctx.state.user;
        if (!user) return ctx.unauthorized();

        const courseFilter: any = {};

        if (!user.isAdmin) {
            courseFilter.users = {
                id: {
                    $eq: user.id,
                },
            }
        }

        ctx.query = {
            ...ctx.query,
            filters: {
                courses: courseFilter
            },
            populate: ['progress', 'courses', 'examFile'], // helps validation and returns relation
        };

        const { data, meta } = await super.findOne(ctx);
        return { data, meta };
    },

    async getSignedUrl(ctx) {
        const user = ctx.state.user;
        if (!user) return ctx.unauthorized();
        if (!user.isAdmin) return ctx.unauthorized();

        const { filename, contentType } = ctx.request.query;

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: filename,
            Expires: 2 * 60 * 60, // seconds
            ContentType: contentType,
            ACL: 'public-read', // or 'private'
        };

        const uploadUrl = await s3.getSignedUrlPromise('putObject', params);

        return {
            uploadUrl
        }
    },
}));

