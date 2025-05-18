import admin from "firebase-admin";
import { getApps } from "firebase-admin/app";
const restored = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/\n/g, '\n');//;
console.log('복원된 프라이벗:', restored);
console.log('첫 줄:', restored.split('\n')[0]);
// if (!getApps().length) {
//   admin.initializeApp({
//     credential: admin.credential.cert({
//       projectId: process.env.FIREBASE_PROJECT_ID,
//       clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
//       privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
//     }),
//   });
// }
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),//.replace(/\//g, ""),
  }),
});
const db = admin.firestore();

export default async function handler(req, res) {
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

  if (req.method === "GET") {
    const snapshot = await db.collection("posts").get();
    const posts = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        content: data.content,
        owner: data.owner || null,
        editable: uid && uid === data.owner,
      };
    });
    return res.status(200).json(posts);
  }

  if (req.method === "POST") {
    if (!uid) {
      return res.status(403).json({ error: "Login required" });
    }
    const { title, content } = req.body;
    const docRef = await db.collection("posts").add({
      title,
      content,
      owner: uid,
    });
    return res.status(201).json({ id: docRef.id });
  }

  return res.status(405).end();
}
