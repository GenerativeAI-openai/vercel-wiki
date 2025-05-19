import admin from "firebase-admin";
import { getApps } from "firebase-admin/app";
const restored = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n").toString();//JSON.parse(process.env.FIREBASE_PRIVATE_KEY);
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
    privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDkRGEMVb6j9csD\nP694UoJA3Y6grX+x+qSBcV2NGO/kr4P/qQ6gdELUWcOtHACKwqcY5kNlNU7lz314\nQ/Pqlyxwrabc5tVbyZChk9HE+YJEZGxQrRSZ8/Rsl0WQ1D9gULIiGNEHAh8vM8TA\nZoX50vPWCizv7d1KfUKeMSdHqJRj+NJelLjoTeSlJ2Yi5JelpJCt7p7du8O5Njve\nMpY+FiR74rNRrnvDrna+bZN0nKdf8/keVozTctA9qh9O3IsHxL4fOVPU9qQfS8un\nTM8LCfQIqNzntTdZLpfnYkvSnwwT4Edr9K45AjQdGW27AzpVcBhEsy4bUiBh7Pko\nFgN5tyB9AgMBAAECggEAASQEViLxjnEygAQn9NJ4uylARrZHPpTxkIIIBSX8QOjN\noI/wNkYOdXAzZaCPsiHR4vJ3oMBY8hYM2vZ/+AqkWrXLcSwoIcrKkbwi3rieeYgE\n8IxE35YUARzqaJRe8rTEhx4XoVDV5g78qzd38O0occfgPJy0L+SbWh4Fw7pob21y\n+Sp+zLmKWBztaBdX4O2fPUpybwbNQeXOr+5BPlsSxaD60GkQMBKjTEfwkdYtb80D\nJUM8WoJ7c3L4kmWYpZAZgBK0DJI11zwmVmIGR2h3/+A4tPm5Eff21mkWKjWBzAJJ\nkfY8weiY+RIuPYYGf+PBP6ZHoMHz1GhmnCZrJAzdkQKBgQDyuuWdaSnmwJk5wLrn\numSEa4FVmiLSPVd605xkZ+F9F+cD7x1nWX7qXmRCNschSrp+3vW+bab4he9olZ7n\nybFsf/j6cv8bJCkC06U7KtBlCFJbYe6ZfZ29NajryBk/GxTzMgaHYOTyy3tl4qz4\nhIX+pdeYP90dq6nsRsXdX9dRpQKBgQDwvxE8J7es3nsBxHWIn21BF0nvZD5v9cLw\nJZmTdc+3pdaZlXjFW9xmhu8/cA8nhENKWag9NEm5SS7G2fCbsS48xckMLDgXriXa\nx6V/NswyGln1cq31QYxQ02VJJC8HldiORD4aOSfmgyJILIz04xXEGfM1rnKY51PX\nr6d4M6or+QKBgCo8s2/suMnagc825k8kdBFG076dj6md2vcYk4I1QVuPKTfaB/fP\n7vHBcxjCh2wXoNQq4AA+/GsKg1pjjr8urZz/t8d88z85z5kaUwo0rQanqA0WwXoc\nDbK6/6Xnr9z3TXH0JoawKabGGbbk9sxX4ykompd3pXZgRLVEq3GWF9WxAoGBALU0\nGxTcEDPdgVhjNtQOq31CujOlkBlVMdTveBi1pBLmkBApoS1rZwkEpy9oeP+VXdCo\niykGIjeEDeE+SQvm4JZ9iEXRQqcQPQ3fF4IZDLjpfKxyFN106NgtRR84TO24q7bp\nRpUWUCIAsd0BK1dnVQq1PYo6M6dC9qhxXevrdzqBAoGAeN8iWrQvKO9lMV7NDjHX\nxLQ3oCAT0aRgPQqjmiPb2dPFAt9YLcGsVTcU7XhQxqc6EeKRrglEtieLmTgwQVDm\nlks/FnBs8xRCGmu8K4cQryCZWi1nQZdfl0EssZR7eFggBTvNMg52F2hMiYQh8MKG\nOQCyfC6zdpDhHEJdvYJCz5w=\n-----END PRIVATE KEY-----\n"//process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n").toString(),//process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
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
    
    const snapshot = await db.collection("posts")
      .orderBy("likes", "desc")
      .limit(5)
      .get();
    
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
    console.log(`검색 결과 첫번째 항목: ${posts?.[0]}`)
    return res.status(200).json(posts);
  }

  
    if (req.method === "POST" && req.query.like) {
      const postId = req.query.id;
      const ref = db.collection("posts").doc(postId);
      await ref.update({ likes: admin.firestore.FieldValue.increment(1) });
      return res.status(200).json({ success: true });
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
