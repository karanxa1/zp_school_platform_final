import { Router } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import * as c from '../controllers/transport.controller';

const r = Router();
r.get('/routes', verifyToken, c.listRoutes);
r.post('/routes', verifyToken, c.createRoute);
r.put('/routes/:routeId', verifyToken, c.updateRoute);
r.delete('/routes/:routeId', verifyToken, c.deleteRoute);
r.post('/assign', verifyToken, c.assignTransport);
r.get('/assignments', verifyToken, c.listTransportAssignments);
r.delete('/assign/:assignmentId', verifyToken, c.removeTransportAssignment);
r.get('/student/:studentId', verifyToken, c.getStudentRoute);
export default r;
