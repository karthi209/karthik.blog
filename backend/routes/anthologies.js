import { Router } from 'express';
import { Anthology } from '../models/Anthology.js';
import { authenticateApiKey } from '../middleware/auth.js';
import cache from '../cache.js';

const router = Router();

// Get all anthologies (Public)
router.get('/', async (req, res) => {
    try {
        const { is_public } = req.query;
        const filters = {};

        // If asking for non-public, might need auth, but for now let's just allow filtering
        // Usually public view only shows is_public=true
        if (is_public !== undefined) {
            filters.is_public = is_public === 'true';
        } else {
            filters.is_public = true;
        }

        const anthologies = await Anthology.findAll(filters);
        res.json(anthologies);
    } catch (error) {
        console.error('Error fetching anthologies:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get single anthology by slug (Public)
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const anthology = await Anthology.findBySlug(slug);

        if (!anthology) {
            return res.status(404).json({ message: 'Anthology not found' });
        }

        // Populate blogs
        const blogs = await Anthology.getAnthologyBlogs(anthology.id);

        console.log(`[Anthology Debug] Slug: ${slug}`);
        console.log(`[Anthology Debug] Anthology ID: ${anthology.id}`);
        console.log(`[Anthology Debug] Raw Blogs array: ${JSON.stringify(anthology.blogs)}`);
        console.log(`[Anthology Debug] Populated Blogs: ${blogs.length}`);

        res.json({ ...anthology, blogs });
    } catch (error) {
        console.error('Error fetching anthology:', error);
        res.status(500).json({ message: error.message });
    }
});

// Create Anthology (Admin)
router.post('/', authenticateApiKey, async (req, res) => {
    try {
        const { title, description, slug, blogs, is_public } = req.body;

        if (!title || !slug) {
            return res.status(400).json({ message: 'Title and slug are required' });
        }

        const anthology = await Anthology.create({
            title,
            description,
            slug,
            blogs: blogs || [],
            is_public: is_public !== undefined ? is_public : true
        });

        res.status(201).json(anthology);
    } catch (error) {
        console.error('Error creating anthology:', error);
        if (error.code === '23505') { // Unique constraint violation
            return res.status(409).json({ message: 'Slug already exists' });
        }
        res.status(400).json({ message: error.message });
    }
});

// Update Anthology (Admin)
router.put('/:id', authenticateApiKey, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, slug, blogs, is_public } = req.body;

        const anthology = await Anthology.update(id, {
            title,
            description,
            slug,
            blogs,
            is_public
        });

        if (!anthology) {
            return res.status(404).json({ message: 'Anthology not found' });
        }

        res.json(anthology);
    } catch (error) {
        console.error('Error updating anthology:', error);
        res.status(400).json({ message: error.message });
    }
});

// Delete Anthology (Admin)
router.delete('/:id', authenticateApiKey, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Anthology.delete(id);

        if (!result) {
            return res.status(404).json({ message: 'Anthology not found' });
        }

        res.json({ message: 'Anthology deleted successfully' });
    } catch (error) {
        console.error('Error deleting anthology:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
