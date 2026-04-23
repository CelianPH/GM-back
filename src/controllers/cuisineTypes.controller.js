import { QueryTypes } from 'sequelize';
import { sequelize } from '../db.js';

export async function listCuisineTypes(_req, res) {
  try {
    const rows = await sequelize.query(
      'SELECT id, name FROM cuisine_types ORDER BY name ASC',
      { type: QueryTypes.SELECT }
    );
    return res.status(200).json({ results: rows });
  } catch (err) {
    console.error('[cuisine-types controller] erreur :', err);
    return res.status(500).json({
      error: { code: 'INTERNAL', message: 'Erreur serveur.' },
    });
  }
}
