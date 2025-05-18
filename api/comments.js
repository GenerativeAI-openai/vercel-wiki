import admin from "firebase-admin";
import { getApps } from "firebase-admin/app";

if (!getApps().length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDkRGEMVb6j9csD\nP694UoJA3Y6grX+x+qSBcV2NGO/kr4P/qQ6gdELUWcOtHACKwqcY5kNlNU7lz314\nQ/Pqlyxwrabc5tVbyZChk9HE+YJEZGxQrRSZ8/Rsl0WQ1D9gULIiGNEHAh8vM8TA\nZoX50vPWCizv7d1KfUKeMSdHqJRj+NJelLjoTeSlJ2Yi5JelpJCt7p7du8O5Njve\nMpY+FiR74rNRrnvDrna+bZN0nKdf8/keVozTctA9qh9O3IsHxL4fOVPU9qQfS8un\nTM8LCfQIqNzntTdZLpfnYkvSnwwT4Edr9K45AjQdGW27AzpVcBhEsy4bUiBh7Pko\nFgN5tyB9AgMBAAECggEAASQEViLxjnEygAQn9NJ4uylARrZHPpTxkIIIBSX8QOjN\noI/wNkYOdXAzZaCPsiHR4vJ3oMBY8hYM2vZ/+AqkWrXLcSwoIcrKkbwi3rieeYgE\n8IxE35YUARzqaJRe8rTEhx4XoVDV5g78qzd38O0occfgPJy0L+SbWh4Fw7pob21y\n+Sp+zLmKWBztaBdX4O2fPUpybwbNQeXOr+5BPlsSxaD60GkQMBKjTEfwkdYtb80D\nJUM8WoJ7c3L4kmWYpZAZgBK0DJI11zwmVmIGR2h3/+A4tPm5Eff21mkWKjWBzAJJ\nkfY8weiY+RIuPYYGf+PBP6ZHoMHz1GhmnCZrJAzdkQKBgQDyuuWdaSnmwJk5wLrn\numSEa4FVmiLSPVd605xkZ+F9F+cD7x1nWX7qXmRCNschSrp+3vW+bab4he9olZ7n\nybFsf/j6cv8bJCkC06U7KtBlCFJbYe6ZfZ29NajryBk/GxTzMgaHYOTyy3tl4qz4\nhIX+pdeYP90dq6nsRsXdX9dRpQKBgQDwvxE8J7es3nsBxHWIn21BF0nvZD5v9cLw\nJZmTdc+3pdaZlXjFW9xmhu8/cA8nhENKWag9NEm5SS7G2fCbsS48xckMLDgXriXa\nx6V/NswyGln1cq31QYxQ02VJJC8HldiORD4aOSfmgyJILIz04xXEGfM1rnKY51PX\nr6d4M6or+QKBgCo8s2/suMnagc825k8kdBFG076dj6md2vcYk4I1QVuPKTfaB/fP\n7vHBcxjCh2wXoNQq4AA+/GsKg1pjjr8urZz/t8d88z85z5kaUwo0rQanqA0WwXoc\nDbK6/6Xnr9z3TXH0JoawKabGGbbk9sxX4ykompd3pXZgRLVEq3GWF9WxAoGBALU0\nGxTcEDPdgVhjNtQOq31CujOlkBlVMdTveBi1pBLmkBApoS1rZwkEpy9oeP+VXdCo\niykGIjeEDeE+SQvm4JZ9iEXRQqcQPQ3fF4IZDLjpfKxyFN106NgtRR84TO24q7bp\nRpUWUCIAsd0BK1dnVQq1PYo6M6dC9qhxXevrdzqBAoGAeN8iWrQvKO9lMV7NDjHX\nxLQ3oCAT0aRgPQqjmiPb2dPFAt9YLcGsVTcU7XhQxqc6EeKRrglEtieLmTgwQVDm\nlks/FnBs8xRCGmu8K4cQryCZWi1nQZdfl0EssZR7eFggBTvNMg52F2hMiYQh8MKG\nOQCyfC6zdpDhHEJdvYJCz5w=\n-----END PRIVATE KEY-----\n",
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
