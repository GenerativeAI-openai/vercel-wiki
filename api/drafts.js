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

  const draftRef = db.collection("drafts").doc(uid);

  if (req.method === "GET") {
    const doc = await draftRef.get();
    return res.status(200).json(doc.exists ? doc.data() : {});
  }

  if (req.method === "POST") {
    const { title, content } = req.body;
    await draftRef.set({ title, content, updated: new Date().toISOString() });
    return res.status(200).json({ message: "Saved" });
  }

  return res.status(405).end();
}
