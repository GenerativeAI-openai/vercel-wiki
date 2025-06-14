import { db } from './firebase.js';

export default async function handler(req, res) {
  const { reviewId } = req.query;

  if (req.method === 'POST') {
    const { uid, email, text } = req.body;
    if (!uid || !email || !text || !reviewId) {
      return res.status(400).json({ error: "필수 항목 누락" });
    }

    try {
      const ref = db.collection("reviews").doc(reviewId);
      await ref.update({
        replies: db.FieldValue.arrayUnion({ uid, email, text, timestamp: Date.now() })
      });
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'GET') {
    try {
      const ref = db.collection("reviews").doc(reviewId);
      const doc = await ref.get();
      if (!doc.exists) return res.status(404).json({ error: "리뷰 없음" });
      return res.status(200).json(doc.data().replies || []);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).end();
}