import admin from "firebase-admin";
import { getApps } from "firebase-admin/app";

if (!getApps().length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req;

  const token = req.headers.authorization?.split("Bearer ")[1] || null;
  let uid = null;

  if (token) {
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      uid = decoded.uid;
    } catch (err) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  const postRef = db.collection("posts").doc(id);
  const postDoc = await postRef.get();

  if (!postDoc.exists) {
    return res.status(404).json({ error: "Post not found" });
  }

  const data = postDoc.data();
  if (data.owner !== uid) {
    return res.status(403).json({ error: "Permission denied" });
  }

  if (method === "PUT") {
    const { title, content } = req.body;
    await postRef.update({ title, content });
    return res.status(200).json({ message: "Updated" });
  }

  if (method === "DELETE") {
    await postRef.delete();
    return res.status(200).json({ message: "Deleted" });
  }

  return res.status(405).end();
}
