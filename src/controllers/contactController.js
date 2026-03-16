import prisma from '../utils/prisma.js';

export const submitMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    // Assuming we might want to store this in a ContactMessage model
    // but for now, if the model isn't in schema, we'll return success.
    // Wait, I should have added it to schema. Let me check.
    const newMessage = await prisma.contactMessage.create({
      data: { name, email, subject, message }
    });
    res.json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
