export default ({ env }) => ({
  /*
  upload: {
    config: {
      sizeLimit: 2 * 1024 * 1024 * 1024,
      enabled: true,
      multipart: true,
      provider: 'strapi-provider-upload-aws-s3',
      providerOptions: {
        accessKeyId: env('AWS_ACCESS_KEY_ID'),
        secretAccessKey: env('AWS_ACCESS_SECRET'),
        region: env('AWS_REGION'),
        params: {
          Bucket: env('AWS_BUCKET_NAME'),
        },
        // Optional: custom endpoint for S3-compatible services
        // endpoint: env('AWS_S3_ENDPOINT'),
      },
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  },
  */
});
