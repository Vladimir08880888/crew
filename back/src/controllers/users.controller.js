import { userModel } from '../models/user.model.js';
import { LIMITS } from '../config/constants.js';
import { badRequest, notFound } from '../utils/httpError.js';

export const usersController = {
  async updateProfile(req, res) {
    const { first_name, last_name } = req.body || {};
    if (!first_name || first_name.length > LIMITS.NAME_MAX) throw badRequest('Prénom invalide');
    if (!last_name || last_name.length > LIMITS.NAME_MAX) throw badRequest('Nom invalide');
    await userModel.updateProfile(req.user.id, { first_name, last_name });
    const user = await userModel.findById(req.user.id);
    if (!user) throw notFound();
    res.json(user);
  },
};
