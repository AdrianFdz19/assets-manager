import { NextFunction, Request, Response, Router } from 'express'
import { pool } from '../config/databaseConfig';

export const categories = Router();

categories.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = `SELECT * FROM categories`;
        const response = await pool.query(query);
        const data = response.rows;

        res.status(200)
            .json({
                message: '',
                data
            });
    } catch (err) {
        next(err);
    }
});

categories.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name } = req.body; // Por el momento solo el nombre de la categoria

        // Verificar si el nombre ya existe en la base de datos

        const query = `SELECT name FROM categories WHERE name = $1`;
        const verifyNameResponse = await pool.query(query, [name]);
        const alreadyCategoryNameExists = verifyNameResponse.rows[0];

        if (alreadyCategoryNameExists) return res.status(400).json({ message: 'This category name already exists. try with another one.' });

        const response = await pool.query(`INSERT INTO categories ( name ) VALUES ( $1 ) RETURNING *`, [name]);
        const newCategory = response.rows[0];

        res.status(200)
            .json({
                message: '',
                data: newCategory
            });
    } catch (err) {
        next(err);
    }
});

categories.put('/:categoryId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const categoryId = Number(req.params.categoryId);
        const { name } = req.body; 

        // 1. Verificar si el nombre ya existe en OTRA categoría (excluyendo la actual)
        const checkQuery = `SELECT id FROM categories WHERE name = $1 AND id != $2`;
        const checkRes = await pool.query(checkQuery, [name, categoryId]);

        if (checkRes.rows.length > 0) {
            return res.status(400).json({ message: 'This category name already exists. Try with another one.' });
        }

        // 2. UPDATE con WHERE y RETURNING
        const updateQuery = `
            UPDATE categories 
            SET name = $1 
            WHERE id = $2 
            RETURNING id, name
        `;
        const response = await pool.query(updateQuery, [name, categoryId]);
        
        const categoryUpdated = response.rows[0];

        // 3. Manejar si el ID no existía
        if (!categoryUpdated) {
            return res.status(404).json({ message: 'Category not found.' });
        }

        res.status(200).json({
            message: 'Category updated successfully',
            data: categoryUpdated
        });
    } catch (err) {
        next(err);
    }
});

categories.delete('/:categoryId', async (req: Request, res: Response, next: NextFunction) => {
    // 1. Iniciamos una transacción para asegurar integridad
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        const categoryId = Number(req.params.categoryId);

        // 2. Desvincular assets (Paso previo necesario)
        await client.query(`UPDATE assets SET category_id = NULL WHERE category_id = $1`, [categoryId]);

        // 3. Eliminar la categoría y RETORNAR los datos antes de que se borren
        // El truco está en el "RETURNING *"
        const response = await client.query(`DELETE FROM categories WHERE id = $1 RETURNING *`, [categoryId]);
        
        const categoryDeleted = response.rows[0];

        if (!categoryDeleted) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Category not found.' });
        }

        // 4. Confirmar cambios
        await client.query('COMMIT');

        res.status(200).json({
            message: 'Category and associations cleared successfully',
            data: categoryDeleted // ¡Ahora sí devuelves lo que borraste!
        });

    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
});

