const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { verifyToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const {
  generateUUID,
  errorResponse,
  successResponse
} = require('../utils/helpers');

const router = express.Router();

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate URL-friendly slug from title
 * @param {string} title - The title to slugify
 * @returns {string} - URL-friendly slug
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100);
}

/**
 * Calculate reading time based on word count
 * @param {string} content - The content to analyze
 * @returns {number} - Reading time in minutes
 */
function calculateReadingTime(content) {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

/**
 * Generate excerpt from content
 * @param {string} content - The content
 * @param {number} length - Maximum excerpt length
 * @returns {string} - Excerpt
 */
function generateExcerpt(content, length = 150) {
  // Remove markdown formatting
  const plainText = content
    .replace(/#+\s/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]+)\]\([^)]+\)/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\n+/g, ' ')
    .trim();

  if (plainText.length <= length) {
    return plainText;
  }
  
  return plainText.substring(0, length).trim() + '...';
}

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

// =============================================================================
// PUBLIC ENDPOINTS
// =============================================================================

/**
 * GET /api/v1/blog/posts
 * Get all published posts with pagination and filtering
 */
router.get('/posts', [
  query('page').optional().isInt({ min: 1 }).withMessage('Invalid page number'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Invalid limit'),
  query('category').optional().trim(),
  query('tag').optional().trim(),
  query('q').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'VALIDATION_ERROR', 'Invalid parameters', {
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const category = req.query.category;
    const tag = req.query.tag;
    const searchQuery = req.query.q;

    let whereClause = 'WHERE bp.status = "published" AND (bp.published_at IS NULL OR bp.published_at <= NOW())';
    const params = [];

    if (category) {
      whereClause += ' AND bc.slug = ?';
      params.push(category);
    }

    if (tag) {
      whereClause += ' AND bt.slug = ?';
      params.push(tag);
    }

    if (searchQuery) {
      whereClause += ' AND (bp.title LIKE ? OR bp.content LIKE ? OR bp.excerpt LIKE ?)';
      const searchPattern = `%${searchQuery}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(DISTINCT bp.id) as total
       FROM blog_posts bp
       LEFT JOIN blog_post_categories bpc ON bp.id = bpc.post_id
       LEFT JOIN blog_categories bc ON bpc.category_id = bc.id
       LEFT JOIN blog_post_tags bpt ON bp.id = bpt.post_id
       LEFT JOIN blog_tags bt ON bpt.tag_id = bt.id
       ${whereClause}`,
      params
    );

    // Get posts
    const [posts] = await pool.query(
      `SELECT DISTINCT bp.id, bp.title, bp.slug, bp.excerpt, bp.featured_image,
              bp.featured_image_alt, bp.published_at, bp.reading_time_minutes,
              bp.views_count, u.full_name as author,
              GROUP_CONCAT(DISTINCT bc.name) as categories
       FROM blog_posts bp
       LEFT JOIN users u ON bp.author_id = u.id
       LEFT JOIN blog_post_categories bpc ON bp.id = bpc.post_id
       LEFT JOIN blog_categories bc ON bpc.category_id = bc.id
       LEFT JOIN blog_post_tags bpt ON bp.id = bpt.post_id
       LEFT JOIN blog_tags bt ON bpt.tag_id = bt.id
       ${whereClause}
       GROUP BY bp.id
       ORDER BY bp.published_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return successResponse(res, {
      posts: posts.map(post => ({
        ...post,
        category: post.categories ? post.categories.split(',')[0] : 'General'
      })),
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return errorResponse(res, 500, 'FETCH_FAILED', 'Failed to fetch blog posts');
  }
});

/**
 * GET /api/v1/blog/posts/:slug
 * Get single post by slug
 */
router.get('/posts/:slug', [
  param('slug').trim().notEmpty().withMessage('Slug is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'VALIDATION_ERROR', 'Invalid slug');
    }

    const { slug } = req.params;

    const [posts] = await pool.query(
      `SELECT bp.*, u.full_name as author, u.bio as author_bio
       FROM blog_posts bp
       LEFT JOIN users u ON bp.author_id = u.id
       WHERE bp.slug = ? AND bp.status = 'published'`,
      [slug]
    );

    if (posts.length === 0) {
      return errorResponse(res, 404, 'NOT_FOUND', 'Post not found');
    }

    const post = posts[0];

    // Get categories
    const [categories] = await pool.query(
      `SELECT bc.name, bc.slug
       FROM blog_categories bc
       JOIN blog_post_categories bpc ON bc.id = bpc.category_id
       WHERE bpc.post_id = ?`,
      [post.id]
    );

    // Get tags
    const [tags] = await pool.query(
      `SELECT bt.name, bt.slug
       FROM blog_tags bt
       JOIN blog_post_tags bpt ON bt.id = bpt.tag_id
       WHERE bpt.post_id = ?`,
      [post.id]
    );

    return successResponse(res, {
      post: {
        ...post,
        category: categories[0]?.name || 'General',
        categories: categories,
        tags: tags.map(t => t.name)
      }
    });

  } catch (error) {
    console.error('Error fetching blog post:', error);
    return errorResponse(res, 500, 'FETCH_FAILED', 'Failed to fetch blog post');
  }
});

/**
 * POST /api/v1/blog/posts/:id/view
 * Increment view count for a post
 */
router.post('/posts/:id/view', [
  param('id').isInt().withMessage('Invalid post ID')
], async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      'UPDATE blog_posts SET views_count = views_count + 1 WHERE id = ?',
      [id]
    );

    return successResponse(res, { message: 'View recorded' });

  } catch (error) {
    console.error('Error recording view:', error);
    return errorResponse(res, 500, 'UPDATE_FAILED', 'Failed to record view');
  }
});

/**
 * GET /api/v1/blog/posts/related/:id
 * Get related posts
 */
router.get('/posts/related/:id', [
  param('id').isInt().withMessage('Invalid post ID')
], async (req, res) => {
  try {
    const { id } = req.params;

    // Get posts from same category or with same tags
    const [posts] = await pool.query(
      `SELECT DISTINCT bp.id, bp.title, bp.slug, bp.featured_image, bp.published_at,
              bp.reading_time_minutes
       FROM blog_posts bp
       JOIN blog_post_categories bpc ON bp.id = bpc.post_id
       WHERE bp.id != ?
         AND bp.status = 'published'
         AND bpc.category_id IN (
           SELECT category_id FROM blog_post_categories WHERE post_id = ?
         )
       ORDER BY bp.published_at DESC
       LIMIT 3`,
      [id, id]
    );

    return successResponse(res, { posts });

  } catch (error) {
    console.error('Error fetching related posts:', error);
    return errorResponse(res, 500, 'FETCH_FAILED', 'Failed to fetch related posts');
  }
});

/**
 * GET /api/v1/blog/categories
 * Get all categories
 */
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await pool.query(
      `SELECT bc.id, bc.name, bc.slug, bc.description,
              COUNT(bpc.post_id) as count
       FROM blog_categories bc
       LEFT JOIN blog_post_categories bpc ON bc.id = bpc.category_id
       LEFT JOIN blog_posts bp ON bpc.post_id = bp.id AND bp.status = 'published'
       GROUP BY bc.id
       ORDER BY bc.name`
    );

    return successResponse(res, { categories });

  } catch (error) {
    console.error('Error fetching categories:', error);
    return errorResponse(res, 500, 'FETCH_FAILED', 'Failed to fetch categories');
  }
});

/**
 * GET /api/v1/blog/tags
 * Get all tags
 */
router.get('/tags', async (req, res) => {
  try {
    const [tags] = await pool.query(
      `SELECT bt.id, bt.name, bt.slug,
              COUNT(bpt.post_id) as count
       FROM blog_tags bt
       LEFT JOIN blog_post_tags bpt ON bt.id = bpt.tag_id
       LEFT JOIN blog_posts bp ON bpt.post_id = bp.id AND bp.status = 'published'
       GROUP BY bt.id
       ORDER BY count DESC
       LIMIT 20`
    );

    return successResponse(res, { tags });

  } catch (error) {
    console.error('Error fetching tags:', error);
    return errorResponse(res, 500, 'FETCH_FAILED', 'Failed to fetch tags');
  }
});

/**
 * GET /api/v1/blog/search
 * Search posts
 */
router.get('/search', [
  query('q').trim().notEmpty().withMessage('Search query is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'VALIDATION_ERROR', 'Search query is required');
    }

    const { q } = req.query;
    const searchPattern = `%${q}%`;

    const [posts] = await pool.query(
      `SELECT bp.id, bp.title, bp.slug, bp.excerpt, bp.featured_image,
              bp.published_at, bp.reading_time_minutes, u.full_name as author
       FROM blog_posts bp
       LEFT JOIN users u ON bp.author_id = u.id
       WHERE bp.status = 'published'
         AND (bp.title LIKE ? OR bp.content LIKE ? OR bp.excerpt LIKE ?)
       ORDER BY bp.published_at DESC
       LIMIT 20`,
      [searchPattern, searchPattern, searchPattern]
    );

    return successResponse(res, { posts });

  } catch (error) {
    console.error('Error searching posts:', error);
    return errorResponse(res, 500, 'SEARCH_FAILED', 'Failed to search posts');
  }
});

// =============================================================================
// ADMIN ENDPOINTS
// =============================================================================

/**
 * POST /api/v1/blog/posts
 * Create new blog post (Admin only)
 */
router.post('/posts', verifyToken, requireAdmin, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('slug').optional().trim(),
  body('excerpt').optional().trim(),
  body('meta_description').optional().trim().isLength({ max: 160 }),
  body('focus_keyword').optional().trim(),
  body('featured_image').optional().trim(),
  body('featured_image_alt').optional().trim(),
  body('category').optional().trim(),
  body('tags').optional().isArray(),
  body('status').optional().isIn(['draft', 'published', 'scheduled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'VALIDATION_ERROR', 'Invalid input data', {
        errors: errors.array()
      });
    }

    const {
      title, content, slug, excerpt, meta_description, focus_keyword,
      featured_image, featured_image_alt, category, tags, status, scheduled_for
    } = req.body;

    // Sanitize inputs
    const sanitizedTitle = sanitizeInput(title);
    const sanitizedContent = sanitizeInput(content);

    // Generate slug if not provided
    const postSlug = slug || generateSlug(sanitizedTitle);

    // Check slug uniqueness
    const [existing] = await pool.query(
      'SELECT id FROM blog_posts WHERE slug = ?',
      [postSlug]
    );

    if (existing.length > 0) {
      return errorResponse(res, 400, 'SLUG_EXISTS', 'This slug is already in use');
    }

    // Generate excerpt if not provided
    const postExcerpt = excerpt || generateExcerpt(sanitizedContent);

    // Calculate reading time
    const readingTime = calculateReadingTime(sanitizedContent);

    // Insert post
    const postId = generateUUID();
    const publishedAt = status === 'published' ? new Date() : null;

    await pool.query(
      `INSERT INTO blog_posts (
        id, title, slug, content, excerpt, featured_image, featured_image_alt,
        meta_description, focus_keyword, author_id, status, published_at,
        scheduled_for, reading_time_minutes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        postId, sanitizedTitle, postSlug, sanitizedContent, postExcerpt,
        featured_image, featured_image_alt, meta_description, focus_keyword,
        req.user.userId, status || 'draft', publishedAt, scheduled_for || null,
        readingTime
      ]
    );

    // Handle category
    if (category) {
      // Get or create category
      const [categories] = await pool.query(
        'SELECT id FROM blog_categories WHERE slug = ?',
        [category]
      );

      let categoryId;
      if (categories.length > 0) {
        categoryId = categories[0].id;
      } else {
        categoryId = generateUUID();
        await pool.query(
          'INSERT INTO blog_categories (id, name, slug) VALUES (?, ?, ?)',
          [categoryId, category, generateSlug(category)]
        );
      }

      await pool.query(
        'INSERT INTO blog_post_categories (post_id, category_id) VALUES (?, ?)',
        [postId, categoryId]
      );
    }

    // Handle tags
    if (tags && Array.isArray(tags)) {
      for (const tagName of tags) {
        const tagSlug = generateSlug(tagName);
        
        // Get or create tag
        const [existingTags] = await pool.query(
          'SELECT id FROM blog_tags WHERE slug = ?',
          [tagSlug]
        );

        let tagId;
        if (existingTags.length > 0) {
          tagId = existingTags[0].id;
        } else {
          tagId = generateUUID();
          await pool.query(
            'INSERT INTO blog_tags (id, name, slug) VALUES (?, ?, ?)',
            [tagId, tagName, tagSlug]
          );
        }

        await pool.query(
          'INSERT INTO blog_post_tags (post_id, tag_id) VALUES (?, ?)',
          [postId, tagId]
        );
      }
    }

    return successResponse(res, {
      post: {
        id: postId,
        slug: postSlug,
        status: status || 'draft'
      }
    }, 201);

  } catch (error) {
    console.error('Error creating blog post:', error);
    return errorResponse(res, 500, 'CREATE_FAILED', 'Failed to create blog post');
  }
});

/**
 * PUT /api/v1/blog/posts/:id
 * Update blog post (Admin only)
 */
router.put('/posts/:id', verifyToken, requireAdmin, [
  param('id').notEmpty().withMessage('Post ID is required'),
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('content').optional().trim().notEmpty().withMessage('Content cannot be empty'),
  body('slug').optional().trim(),
  body('excerpt').optional().trim(),
  body('meta_description').optional().trim().isLength({ max: 160 }),
  body('status').optional().isIn(['draft', 'published', 'scheduled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'VALIDATION_ERROR', 'Invalid input data', {
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updates = req.body;

    // Check if post exists
    const [existing] = await pool.query(
      'SELECT id FROM blog_posts WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return errorResponse(res, 404, 'NOT_FOUND', 'Post not found');
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];

    const allowedFields = [
      'title', 'slug', 'content', 'excerpt', 'featured_image',
      'featured_image_alt', 'meta_description', 'focus_keyword', 'status'
    ];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(sanitizeInput(updates[field]));
      }
    }

    // Update reading time if content changed
    if (updates.content) {
      updateFields.push('reading_time_minutes = ?');
      updateValues.push(calculateReadingTime(updates.content));
    }

    // Update published_at if publishing
    if (updates.status === 'published') {
      const [post] = await pool.query(
        'SELECT published_at FROM blog_posts WHERE id = ?',
        [id]
      );
      if (!post[0].published_at) {
        updateFields.push('published_at = ?');
        updateValues.push(new Date());
      }
    }

    // Handle scheduled_for
    if (updates.scheduled_for) {
      updateFields.push('scheduled_for = ?');
      updateValues.push(new Date(updates.scheduled_for));
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = NOW()');
      updateValues.push(id);

      await pool.query(
        `UPDATE blog_posts SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }

    // Handle category update
    if (updates.category !== undefined) {
      // Remove existing categories
      await pool.query(
        'DELETE FROM blog_post_categories WHERE post_id = ?',
        [id]
      );

      if (updates.category) {
        const [categories] = await pool.query(
          'SELECT id FROM blog_categories WHERE slug = ?',
          [updates.category]
        );

        let categoryId;
        if (categories.length > 0) {
          categoryId = categories[0].id;
        } else {
          categoryId = generateUUID();
          await pool.query(
            'INSERT INTO blog_categories (id, name, slug) VALUES (?, ?, ?)',
            [categoryId, updates.category, generateSlug(updates.category)]
          );
        }

        await pool.query(
          'INSERT INTO blog_post_categories (post_id, category_id) VALUES (?, ?)',
          [id, categoryId]
        );
      }
    }

    // Handle tags update
    if (updates.tags !== undefined) {
      // Remove existing tags
      await pool.query(
        'DELETE FROM blog_post_tags WHERE post_id = ?',
        [id]
      );

      if (updates.tags && Array.isArray(updates.tags)) {
        for (const tagName of updates.tags) {
          const tagSlug = generateSlug(tagName);
          
          const [existingTags] = await pool.query(
            'SELECT id FROM blog_tags WHERE slug = ?',
            [tagSlug]
          );

          let tagId;
          if (existingTags.length > 0) {
            tagId = existingTags[0].id;
          } else {
            tagId = generateUUID();
            await pool.query(
              'INSERT INTO blog_tags (id, name, slug) VALUES (?, ?, ?)',
              [tagId, tagName, tagSlug]
            );
          }

          await pool.query(
            'INSERT INTO blog_post_tags (post_id, tag_id) VALUES (?, ?)',
            [id, tagId]
          );
        }
      }
    }

    return successResponse(res, {
      message: 'Post updated successfully',
      post: { id }
    });

  } catch (error) {
    console.error('Error updating blog post:', error);
    return errorResponse(res, 500, 'UPDATE_FAILED', 'Failed to update blog post');
  }
});

/**
 * DELETE /api/v1/blog/posts/:id
 * Delete blog post (Admin only)
 */
router.delete('/posts/:id', verifyToken, requireAdmin, [
  param('id').notEmpty().withMessage('Post ID is required')
], async (req, res) => {
  try {
    const { id } = req.params;

    // Check if post exists
    const [existing] = await pool.query(
      'SELECT id FROM blog_posts WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return errorResponse(res, 404, 'NOT_FOUND', 'Post not found');
    }

    // Delete post (cascade will handle relationships)
    await pool.query('DELETE FROM blog_posts WHERE id = ?', [id]);

    return successResponse(res, { message: 'Post deleted successfully' });

  } catch (error) {
    console.error('Error deleting blog post:', error);
    return errorResponse(res, 500, 'DELETE_FAILED', 'Failed to delete blog post');
  }
});

/**
 * GET /api/v1/blog/posts/drafts
 * Get all draft posts (Admin only)
 */
router.get('/drafts', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [posts] = await pool.query(
      `SELECT bp.id, bp.title, bp.slug, bp.status, bp.created_at, bp.updated_at,
              u.full_name as author
       FROM blog_posts bp
       LEFT JOIN users u ON bp.author_id = u.id
       WHERE bp.status = 'draft'
       ORDER BY bp.updated_at DESC`
    );

    return successResponse(res, { posts });

  } catch (error) {
    console.error('Error fetching drafts:', error);
    return errorResponse(res, 500, 'FETCH_FAILED', 'Failed to fetch drafts');
  }
});

/**
 * POST /api/v1/blog/posts/:id/publish
 * Publish a draft post (Admin only)
 */
router.post('/posts/:id/publish', verifyToken, requireAdmin, [
  param('id').notEmpty().withMessage('Post ID is required')
], async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query(
      'SELECT id, status FROM blog_posts WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return errorResponse(res, 404, 'NOT_FOUND', 'Post not found');
    }

    await pool.query(
      `UPDATE blog_posts 
       SET status = 'published', published_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [id]
    );

    return successResponse(res, { message: 'Post published successfully' });

  } catch (error) {
    console.error('Error publishing post:', error);
    return errorResponse(res, 500, 'PUBLISH_FAILED', 'Failed to publish post');
  }
});

/**
 * POST /api/v1/blog/upload-image
 * Upload blog image (Admin only)
 */
router.post('/upload-image', verifyToken, requireAdmin, async (req, res) => {
  try {
    // In production, use multer middleware for file upload
    // and store in cloud storage (S3, etc.)
    
    // For now, return a placeholder response
    return successResponse(res, {
      url: '/uploads/blog-images/placeholder.jpg',
      message: 'Image upload endpoint - implement with multer and cloud storage'
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    return errorResponse(res, 500, 'UPLOAD_FAILED', 'Failed to upload image');
  }
});

/**
 * GET /api/v1/blog/sitemap.xml
 * Generate XML sitemap for blog posts
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    const [posts] = await pool.query(
      `SELECT slug, updated_at, published_at
       FROM blog_posts
       WHERE status = 'published'
       ORDER BY published_at DESC`
    );

    const baseUrl = process.env.BASE_URL || 'https://www.studyproglobal.com.bd';

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add blog listing page
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/blog</loc>\n`;
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';

    // Add individual posts
    for (const post of posts) {
      const lastmod = (post.updated_at || post.published_at).toISOString().split('T')[0];
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/blog/${post.slug}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.6</priority>\n';
      xml += '  </url>\n';
    }

    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.send(xml);

  } catch (error) {
    console.error('Error generating sitemap:', error);
    return errorResponse(res, 500, 'SITEMAP_FAILED', 'Failed to generate sitemap');
  }
});

module.exports = router;
