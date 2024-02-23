// const express = require("express");
const fs = require("fs").promises;
const AWS = require("aws-sdk");

require("dotenv").config();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: process.env.REGION,
});

const s3 = new AWS.S3();

const bucketParams = {
  Bucket: process.env.S3_BUCKET,
};

async function downloadAndSaveLatestFile() {
  try {
    const data = await s3.listObjectsV2(bucketParams).promise();

    const currentDate = new Date();
    const month = currentDate
      .toLocaleString("default", { month: "short" })
      .toUpperCase();
    const day = currentDate.getDate();

    const folderPath = `./downloads/${month}/${day}/`;

    await fs.mkdir(folderPath, { recursive: true });

    const files = data.Contents.map((obj) => ({
      Key: obj.Key,
      LastModified: obj.LastModified,
    }));

    const latestFile = files.reduce((prev, current) =>
      prev.LastModified > current.LastModified ? prev : current
    );

    const params = {
      Bucket: bucketParams.Bucket,
      Key: latestFile.Key,
    };

    const fileData = await s3.getObject(params).promise();

    const fileName = latestFile.Key.split("/").pop();
    const localFilePath = `${folderPath}${fileName}`;

    await fs.writeFile(localFilePath, fileData.Body);

    console.log(`File downloaded and saved locally at: ${localFilePath}`);
  } catch (error) {
    console.error("Error:", error);
  }
}

// async function logUsernameAndTime(username) {
//   try {
//     const currentDate = new Date();
//     const logMessage = `Username: ${username} - Time: ${currentDate.toString()}\n`;

//     await fs.appendFile("log.txt", logMessage);
//     console.log("Username and time logged successfully.");
//   } catch (error) {
//     console.error("Error logging username and time:", error);
//   }
// }

// const app = express();
// app.use(express.json());

// app.post("/download-latest-file", async (req, res) => {
//   try {
//     const { username } = req.body;

//     if (!username) {
//       return res.status(400).send("Username is required");
//     }

//     await logUsernameAndTime(username);

//     await downloadAndSaveLatestFile();
//     res.send("Latest file downloaded and saved locally!");
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).send("Internal Server Error");
//   }
// });

// const port = process.env.PORT || 3000;
// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });

downloadAndSaveLatestFile();
