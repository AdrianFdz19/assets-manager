import { NextFunction, Request, Response, Router } from 'express';
import { pool } from '../config/databaseConfig';
import { globalLimiter } from '../middleware/rateLimiter';
import { isAuth } from '../middleware/isAuth'; // 🔒 Importación obligatoria

export const categories = Router();

// --- 1. GET ALL CATEGORIES ---
categories.get('/', isAuth, globalLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId;

        if (!organizationId) {
            return res.status(403).json({ message: 'Acceso denegado. No se identificó un Workspace válido.' });
        }

        // 🔒 Filtramos para que solo traiga las categorías de ESTA empresa
        const query = `SELECT * FROM categories WHERE organization_id = $1 ORDER BY name ASC`;
        const response = await pool.query(query, [organizationId]);
        const data = response.rows;

        res.status(200).json({
            message: '',
            data
        });
    } catch (err) {
        next(err);
    }
});

// --- 2. CREATE CATEGORY ---
categories.post('/', isAuth, globalLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId;

        if (!organizationId) {
            return res.status(403).json({ message: 'Acceso denegado. No se identificó un Workspace válido.' });
        }

        const { name } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ message: 'El nombre de la categoría es obligatorio.' });
        }

        // 🔒 Verificar si el nombre ya existe DENTRO de la misma organización
        const checkQuery = `SELECT name FROM categories WHERE name = $1 AND organization_id = $2`;
        const verifyNameResponse = await pool.query(checkQuery, [name.trim(), organizationId]);
        
        if (verifyNameResponse.rowCount > 0) {
            return res.status(400).json({ message: 'This category name already exists. Try with another one.' });
        }

        // 🔒 Inserción atómica inyectando el organization_id
        const insertQuery = `
            INSERT INTO categories (name, organization_id) 
            VALUES ($1, $2) 
            RETURNING *
        `;
        const response = await pool.query(insertQuery, [name.trim(), organizationId]);
        const newCategory = response.rows[0];

        res.status(201).json({ // 201 Semántica de creación HTTP
            message: 'Categoría creada con éxito',
            data: newCategory
        });
    } catch (err) {
        next(err);
    }
});

// --- 3. UPDATE CATEGORY ---
categories.put('/:categoryId', isAuth, globalLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId;

        if (!organizationId) {
            return res.status(403).json({ message: 'Acceso denegado. No se identificó un Workspace válido.' });
        }

        const categoryId = Number(req.params.categoryId);
        const { name } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ message: 'El nombre de la categoría es obligatorio.' });
        }

        // 1. 🔒 Verificar duplicados en OTRA categoría, pero restringido al mismo Workspace
        const checkQuery = `SELECT id FROM categories WHERE name = $1 AND id != $2 AND organization_id = $3`;
        const checkRes = await pool.query(checkQuery, [name.trim(), categoryId, organizationId]);

        if (checkRes.rowCount > 0) {
            return res.status(400).json({ message: 'This category name already exists. Try with another one.' });
        }

        // 2. 🔒 UPDATE asegurando el aislamiento
        const updateQuery = `
            UPDATE categories 
            SET name = $1 
            WHERE id = $2 AND organization_id = $3 
            RETURNING id, name
        `;
        const response = await pool.query(updateQuery, [name.trim(), categoryId, organizationId]);
        const categoryUpdated = response.rows[0];

        if (!categoryUpdated) {
            return res.status(404).json({ message: 'Category not found in this Workspace.' });
        }

        res.status(200).json({
            message: 'Category updated successfully',
            data: categoryUpdated
        });
    } catch (err) {
        next(err);
    }
});

// --- 4. DELETE CATEGORY (TRANSACTIONAL) ---
categories.delete('/:categoryId', isAuth, globalLimiter, async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = req.organizationId;

    if (!organizationId) {
        return res.status(403).json({ message: 'Acceso denegado. No se identificó un Workspace válido.' });
    }

    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        const categoryId = Number(req.params.categoryId);

        // 1. 🔒 Desvincular assets asegurando que pertenezcan a la misma organización del cliente
        // Esto evita alterar records accidentales si hay colisión de IDs lógicos
        await client.query(
            `UPDATE assets SET category_id = NULL WHERE category_id = $1 AND organization_id = $2`, 
            [categoryId, organizationId]
        );

        // 2. 🔒 Eliminar la categoría controlando el Workspace boundary
        const deleteQuery = `DELETE FROM categories WHERE id = $1 AND organization_id = $2 RETURNING *`;
        const response = await client.query(deleteQuery, [categoryId, organizationId]);
        const categoryDeleted = response.rows[0];

        if (!categoryDeleted) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Category not found in this Workspace.' });
        }

        await client.query('COMMIT');

        res.status(200).json({
            message: 'Category and associations cleared successfully',
            data: categoryDeleted 
        });

    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
});