import { Router } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import * as c from '../controllers/hostel.controller';

const r = Router();
r.get('/rooms', verifyToken, c.listRooms);
r.post('/rooms', verifyToken, c.createRoom);
r.put('/rooms/:roomId', verifyToken, c.updateRoom);
r.post('/assign', verifyToken, c.assignHostel);
r.get('/assignments', verifyToken, c.listHostelAssignments);
r.delete('/assign/:assignmentId', verifyToken, c.vacateHostel);
r.post('/mess-menu', verifyToken, c.saveMessMenu);
r.get('/mess-menu', verifyToken, c.getMessMenu);
r.post('/visitors', verifyToken, c.logVisitor);
r.get('/visitors', verifyToken, c.listVisitors);
export default r;
