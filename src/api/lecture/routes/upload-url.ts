export default {
    routes: [
      {
        method: 'POST',
        path: '/lectures/upload-url',
        handler: 'lecture.getSignedUrl',
      },
    ],
  };
  