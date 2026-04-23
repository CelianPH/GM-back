import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { postFriend, listFriends, getFriendPassHandler } from '../controllers/friend.controller.js';

export const friendRouter = Router();

friendRouter.post('/', authenticate, postFriend);
friendRouter.get('/', authenticate, listFriends);
friendRouter.get('/:friendId/pass', authenticate, getFriendPassHandler);
