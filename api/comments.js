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
  const token = req.headers.authorization?.split("Bearer ")[1] || null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  let uid;
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }

  if (req.method === "POST") {
    const { postId, content } = req.body;
    const ref = db.collection("posts").doc(postId).collection("comments");
    await ref.add({ content, authorUid: uid, createdAt: new Date().toISOString() });
    return res.status(200).json({ message: "Comment added" });
  }

  if (req.method === "GET") {
    const { postId } = req.query;
    const snapshot = await db.collection("posts").doc(postId).collection("comments").get();
    const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.status(200).json(comments);
  }

  return res.status(405).end();
}
