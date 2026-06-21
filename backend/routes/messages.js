import express from 'express';
import { getFirestore } from 'firebase-admin/firestore';

const router = express.Router();
const getDb = () => getFirestore();

// Send message
router.post('/send', async (req, res) => {
  try {
    const { senderId, receiverId, text, type } = req.body;
    // type = 'text' | 'image' | 'view_once'

    const message = {
      senderId,
      receiverId,
      text: text || '',
      type: type || 'text',
      status: 'sent',        // sent → delivered → seen
      isEdited: false,
      replyTo: req.body.replyTo || null,    // reply feature
      imageUrl: req.body.imageUrl || null,  // photo ke liye
      viewOnce: type === 'view_once',       // view once flag
      viewed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await getDb().collection('messages').add(message);

    res.status(201).json({
      success: true,
      messageId: docRef.id,
      message
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all messages between 2 users
router.get('/conversation/:user1/:user2', async (req, res) => {
  try {
    const { user1, user2 } = req.params;

    const messagesRef = getDb().collection('messages');

    // user1 → user2 ke messages
    const snap1 = await messagesRef
      .where('senderId', '==', user1)
      .where('receiverId', '==', user2)
      .orderBy('createdAt', 'asc')
      .get();

    // user2 → user1 ke messages
    const snap2 = await messagesRef
      .where('senderId', '==', user2)
      .where('receiverId', '==', user1)
      .orderBy('createdAt', 'asc')
      .get();

    const messages1 = snap1.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const messages2 = snap2.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Combine aur sort karo time se
    const allMessages = [...messages1, ...messages2].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );

    res.status(200).json({
      success: true,
      messages: allMessages
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update message status (sent → delivered → seen)
router.patch('/status/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status } = req.body;
    // status = 'delivered' | 'seen'

    await getDb().collection('messages').doc(messageId).update({
      status,
      updatedAt: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Status updated'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Edit message
router.patch('/edit/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text, senderId } = req.body;

    // Pehle check karo ki sender hi edit kar raha hai
    const msgDoc = await getDb().collection('messages').doc(messageId).get();

    if (!msgDoc.exists) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (msgDoc.data().senderId !== senderId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await getDb().collection('messages').doc(messageId).update({
      text,
      isEdited: true,
      updatedAt: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Message edited'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete message
router.delete('/delete/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;

    await getDb().collection('messages').doc(messageId).delete();

    res.status(200).json({
      success: true,
      message: 'Message deleted'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Mark view once as viewed
router.patch('/view-once/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;

    const msgDoc = await getDb().collection('messages').doc(messageId).get();

    if (!msgDoc.exists) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Image URL delete karo — ek baar dekh liya
    await getDb().collection('messages').doc(messageId).update({
      viewed: true,
      imageUrl: null,   // URL hata do
      updatedAt: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'View once marked as viewed'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// Delete for me
router.patch('/delete-for-me/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;

    const msgDoc = await getDb().collection('messages').doc(messageId).get();

    if (!msgDoc.exists) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const deletedFor = msgDoc.data().deletedFor || [];

    await getDb().collection('messages').doc(messageId).update({
      deletedFor: [...deletedFor, userId],
      updatedAt: new Date().toISOString()
    });

    res.status(200).json({ success: true, message: 'Deleted for you' });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete for everyone
router.delete('/delete-for-everyone/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { senderId } = req.body;

    const msgDoc = await getDb().collection('messages').doc(messageId).get();

    if (!msgDoc.exists) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (msgDoc.data().senderId !== senderId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await getDb().collection('messages').doc(messageId).update({
      deletedForEveryone: true,
      text: '',
      imageUrl: null,
      updatedAt: new Date().toISOString()
    });

    res.status(200).json({ success: true, message: 'Deleted for everyone' });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;