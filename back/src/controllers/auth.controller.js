import { userModel } from '../models/user.model.js';
import { hashPassword, comparePassword } from '../services/password.service.js';
import { signToken } from '../services/jwt.service.js';
import { randomHex } from '../utils/randomToken.js';
import {
  validateRegister, validateLogin, validateChangePassword,
} from '../validators/auth.validator.js';
import { conflict, unauthorized, notFound } from '../utils/httpError.js';

export const authController = {
  async register(req, res) {
    const data = validateRegister(req.body);
    const existing = await userModel.findByEmail(data.email);
    if (existing) throw conflict('Cet email est déjà utilisé');

    const password_hash = await hashPassword(data.password);
    const calendar_token = randomHex(24);
    const id = await userModel.create({ ...data, password_hash, calendar_token });
    const token = signToken(id);
    const user = await userModel.findById(id);
    res.status(201).json({ token, user });
  },

  async login(req, res) {
    const { email, password } = validateLogin(req.body);
    const user = await userModel.findByEmail(email);
    if (!user) throw unauthorized('Identifiants incorrects');
    const ok = await comparePassword(password, user.password_hash);
    if (!ok) throw unauthorized('Identifiants incorrects');
    const token = signToken(user.id);
    const { password_hash, ...safe } = user;
    res.json({ token, user: safe });
  },

  async me(req, res) {
    const user = await userModel.findById(req.user.id);
    if (!user) throw notFound('Utilisateur introuvable');
    res.json(user);
  },

  async changePassword(req, res) {
    const { current_password, new_password } = validateChangePassword(req.body);
    const full = await userModel.findByEmail((await userModel.findById(req.user.id)).email);
    const ok = await comparePassword(current_password, full.password_hash);
    if (!ok) throw unauthorized('Mot de passe actuel incorrect');
    const hash = await hashPassword(new_password);
    await userModel.updatePassword(req.user.id, hash);
    res.json({ message: 'Mot de passe modifié' });
  },
};
