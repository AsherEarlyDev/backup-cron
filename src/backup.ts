import { exec } from "child_process";
import { DeleteObjectCommand, ListObjectsCommand, PutObjectCommand, S3Client, S3ClientConfig } from "@aws-sdk/client-s3";
import { createReadStream } from "fs";

import { env } from "./env";

const uploadToS3 = async ({ name, path }: {name: string, path: string}) => {
  console.log("Uploading backup to S3...");
  const backupRate = name.split("-")[0]
  console.log("Backup Rate: "+backupRate)

  const bucket = env.AWS_S3_BUCKET;

  const clientOptions: S3ClientConfig = {
    region: env.AWS_S3_REGION,
  }

  if (env.AWS_S3_ENDPOINT) {
    console.log(`Using custom endpoint: ${env.AWS_S3_ENDPOINT}`)
    clientOptions['endpoint'] = env.AWS_S3_ENDPOINT;
  }

  const client = new S3Client(clientOptions);

  let currentObjects: any[] = []
  const response = await client.send(new ListObjectsCommand({Bucket: bucket}));
  response.Contents?.forEach((item)=>{
    const itemBackupRate = item.Key?.split("-")[0]
    console.log(itemBackupRate)
    if (itemBackupRate === backupRate){
      currentObjects.push(item)
    }
  })

  currentObjects = currentObjects.sort((a: any, b: any) => (a.LastModified > b.LastModified) ? 1 : -1)

  switch(backupRate){
    case 'daily':
      if (currentObjects.length === 7){
        await client.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: currentObjects[0].Key,
          })
        )
      }

    case 'weekly':
      if (currentObjects.length === 4){
        await client.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: currentObjects[0].Key,
          })
        )
      }

    case 'monthly':
      if (currentObjects.length === 12){
        await client.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: currentObjects[0].Key,
          })
        )
      }
  }

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: name,
      Body: createReadStream(path),
    })
  )


  console.log("Backup uploaded to S3...");
}

const dumpToFile = async (path: string) => {
  console.log("Dumping DB to file...");

  await new Promise((resolve, reject) => {
    exec(
      `pg_dump ${env.BACKUP_DATABASE_URL} -F t | gzip > ${path}`,
      (error, stdout, stderr) => {
        if (error) {
          reject({ error: JSON.stringify(error), stderr });
          return;
        }

        resolve(undefined);
      }
    );
  });

  console.log("DB dumped to file...");
}

export const backup = async (backupRate: string) => {
  console.log(`Initiating ${backupRate} DB backup...`)

  let date = new Date().toISOString()
  const timestamp = date.replace(/[:.]+/g, '-')
  const filename = `${backupRate}-backup-${timestamp}.tar.gz`
  const filepath = `/tmp/${filename}`

  await dumpToFile(filepath)
  await uploadToS3({name: filename, path: filepath})

  console.log("DB backup complete...")
}
