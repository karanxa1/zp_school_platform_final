import { Router } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import * as c from '../controllers/communication.controller';

const r = Router();
r.get('/notices', verifyToken, c.listNotices);
r.post('/notices', verifyToken, c.createNotice);
r.put('/notices/:noticeId', verifyToken, c.updateNotice);
r.delete('/notices/:noticeId', verifyToken, c.deleteNotice);
r.get('/events', verifyToken, c.listEvents);
r.post('/events', verifyToken, c.createEvent);
r.put('/events/:eventId', verifyToken, c.updateEvent);
r.delete('/events/:eventId', verifyToken, c.deleteEvent);
r.post('/messages', verifyToken, c.sendMessage);
r.get('/messages/inbox', verifyToken, c.getInbox);
r.get('/messages/sent', verifyToken, c.getSent);
r.get('/messages/unread-count', verifyToken, c.getUnreadCount);
r.put('/messages/:messageId/read', verifyToken, c.markMessageRead);
export default r;
