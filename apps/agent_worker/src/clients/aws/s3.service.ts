import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

export class S3StorageService {
  private readonly client: S3Client;

  public constructor(region: string) {
    this.client = new S3Client({ region });
  }

  public async downloadPdf(bucketName: string, objectKey: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: bucketName, Key: objectKey }),
    );
    if (!response.Body) {
      throw new Error(`S3 object "${bucketName}/${objectKey}" returned an empty body`);
    }

    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
}
