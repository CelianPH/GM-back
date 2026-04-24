import { ZodError } from 'zod';
import { addFriendSchema } from '../validators/friend.js';
import { FriendError, addFriend, getFriends, getFriendPass } from '../services/friend.service.js';

function handleError(err, res) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: { code: 'VALIDATION', message: 'Données invalides.', details: err.flatten().fieldErrors } });
  }
  if (err instanceof FriendError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message } });
  }
  console.error('[friend controller]', err);
  return res.status(500).json({ error: { code: 'INTERNAL', message: 'Erreur serveur.' } });
}

export async function postFriend(req, res) {
  try {
    const { friendCode } = addFriendSchema.parse(req.body);
    const friend = await addFriend(req.user.id, friendCode);
    return res.status(201).json(friend);
  } catch (err) { return handleError(err, res); }
}

export async function listFriends(req, res) {
  try {
    const friends = await getFriends(req.user.id);
    return res.status(200).json(friends);
  } catch (err) { return handleError(err, res); }
}

export async function getFriendPassHandler(req, res) {
  try {
    const friendId = parseInt(req.params.friendId, 10);
    if (isNaN(friendId)) return res.status(400).json({ error: { code: 'VALIDATION', message: 'friendId invalide.' } });
    const data = await getFriendPass(req.user.id, friendId);
    return res.status(200).json(data);
  } catch (err) { return handleError(err, res); }
}
