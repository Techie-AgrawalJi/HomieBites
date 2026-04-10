import { Response } from 'express';
import PlatformFeedback from '../models/PlatformFeedback';
import { AuthRequest } from '../middleware/auth';

export const createPlatformFeedback = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    if (!['user', 'provider'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only users and providers can submit platform feedback' });
    }

    const { category, title, message } = req.body;
    const normalizedTitle = String(title || '').trim();
    const normalizedMessage = String(message || '').trim();

    if (!normalizedTitle || normalizedTitle.length < 5) {
      return res.status(400).json({ success: false, message: 'Please provide a clear feedback title' });
    }

    if (!normalizedMessage || normalizedMessage.length < 15) {
      return res.status(400).json({ success: false, message: 'Please provide more details in feedback message' });
    }

    const feedback = await PlatformFeedback.create({
      submittedBy: req.user._id,
      submitterRole: req.user.role,
      category,
      title: normalizedTitle,
      message: normalizedMessage,
    });

    res.status(201).json({ success: true, data: feedback, message: 'Feedback submitted' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMyPlatformFeedback = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const feedback = await PlatformFeedback.find({ submittedBy: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: feedback, message: 'Success' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
