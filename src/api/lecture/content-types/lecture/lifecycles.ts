// src/api/lecture/content-types/lecture/lifecycles.ts

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import AWS from 'aws-sdk';

export default {
  async afterCreate(event: any) {
    const { result } = event;
    const lectureId = result.id;
    const lectureDocumentId = result.documentId;

    const video = result.video;
    const videoUrl: string | undefined = video?.url || video;

    if (!videoUrl) return;

    const videoKey = `lecture_${lectureDocumentId}_${uuidv4()}`;
    const inputFilePath = path.resolve(__dirname, `../../../../../tmp/${videoKey}.mp4`);
    const outputDir = path.resolve(__dirname, `../../../../../tmp/hls_${lectureDocumentId}`);

    fs.mkdirSync(outputDir, { recursive: true });

    const videoDownloadUrl = videoUrl.startsWith('http')
      ? videoUrl
      : `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com${videoUrl}`;

    const response = await fetch(videoDownloadUrl);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(inputFilePath, Buffer.from(buffer));

    const m3u8FileName = 'index.m3u8';
    const hlsOutputPath = path.join(outputDir, m3u8FileName);

    await new Promise<void>((resolve, reject) => {
      const ffmpegCmd = `ffmpeg -i "${inputFilePath}" -profile:v baseline -level 3.0 -start_number 0 -hls_time 10 -hls_list_size 0 -f hls "${hlsOutputPath}"`;
      exec(ffmpegCmd, (error, stdout, stderr) => {
        if (error) {
          console.error('FFmpeg Error:', stderr);
          return reject(error);
        }
        resolve();
      });
    });

    const s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_ACCESS_SECRET!,
      region: process.env.AWS_REGION!,
    });

    const files = fs.readdirSync(outputDir);
    const s3Folder = `lectures/${lectureDocumentId}`;

    for (const file of files) {
      const filePath = path.join(outputDir, file);
      const fileContent = fs.readFileSync(filePath);
      const contentType = file.endsWith('.m3u8')
        ? 'application/vnd.apple.mpegurl'
        : 'video/MP2T';

      await s3
        .upload({
          Bucket: process.env.AWS_BUCKET_NAME!,
          Key: `${s3Folder}/${file}`,
          Body: fileContent,
          ACL: 'public-read',
          ContentType: contentType,
        })
        .promise();
    }

    const finalM3u8Url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Folder}/${m3u8FileName}`;

    await strapi.entityService.update('api::lecture.lecture', lectureId, {
      data: {
        videoUrl: finalM3u8Url,
      },
    });

    try {
      fs.unlinkSync(inputFilePath);
      fs.rmSync(outputDir, { recursive: true, force: true });
    } catch (e) {
      console.warn('Cleanup failed:', e);
    }
  },
};
