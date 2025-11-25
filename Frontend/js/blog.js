/**
 * Study Pro Global - Blog Frontend Module
 * 
 * Handles blog listing, individual post display, search, and filtering.
 * Uses DOMPurify for secure HTML rendering of markdown content.
 */

// =============================================================================
// SECURITY UTILITIES
// =============================================================================

/**
 * Escape HTML special characters to prevent XSS attacks
 * @param {string} str - The string to escape
 * @returns {string} - The escaped string
 */
function escapeHtml(str) {
    if (typeof str !== 'string') {
        return '';
    }
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Safely render markdown content using DOMPurify for sanitization
 * @param {string} markdown - The markdown content to render
 * @returns {string} - Sanitized HTML
 */
function renderMarkdown(markdown) {
    if (typeof markdown !== 'string') {
        return '';
    }
    
    // Check if marked.js is available
    if (typeof marked !== 'undefined') {
        const rawHtml = marked.parse(markdown);
        // Sanitize HTML using DOMPurify if available
        if (typeof DOMPurify !== 'undefined') {
            return DOMPurify.sanitize(rawHtml, {
                ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li', 
                               'blockquote', 'pre', 'code', 'em', 'strong', 'img', 'br', 'hr',
                               'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div'],
                ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel'],
                ADD_ATTR: ['target', 'rel'],
                FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input'],
                FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
            });
        }
        return rawHtml;
    }
    
    // Fallback: escape all HTML
    return escapeHtml(markdown);
}

// =============================================================================
// BLOG STATE
// =============================================================================

const BlogState = {
    apiBaseUrl: '/api/v1/blog',
    currentPage: 1,
    postsPerPage: 10,
    totalPosts: 0,
    currentCategory: null,
    currentTag: null,
    searchQuery: '',
    viewMode: 'grid',
    posts: [],
    categories: [],
    tags: []
};

// =============================================================================
// BLOG LISTING PAGE
// =============================================================================

/**
 * Initialize blog listing page
 */
async function initBlogListing() {
    const postsContainer = document.getElementById('blogPostsContainer');
    if (!postsContainer) return;

    // Set up event listeners
    setupViewToggle();
    setupSearchForm();
    setupCategoryFilters();
    
    // Load initial data
    await Promise.all([
        loadBlogPosts(),
        loadCategories(),
        loadRecentPosts(),
        loadTags()
    ]);
}

/**
 * Load blog posts from API
 */
async function loadBlogPosts() {
    const container = document.getElementById('blogPostsContainer');
    if (!container) return;

    // Show loading state
    container.innerHTML = `
        <div class="blog-loading">
            <div class="loading-spinner"></div>
            <p>Loading blog posts...</p>
        </div>
    `;

    try {
        const params = new URLSearchParams({
            page: BlogState.currentPage,
            limit: BlogState.postsPerPage
        });

        if (BlogState.currentCategory) {
            params.append('category', BlogState.currentCategory);
        }
        if (BlogState.currentTag) {
            params.append('tag', BlogState.currentTag);
        }
        if (BlogState.searchQuery) {
            params.append('q', BlogState.searchQuery);
        }

        const response = await fetch(`${BlogState.apiBaseUrl}/posts?${params}`);
        const data = await response.json();

        if (data.success) {
            BlogState.posts = data.data.posts || [];
            BlogState.totalPosts = data.data.pagination?.total || 0;
            renderBlogPosts();
            renderPagination();
            updateResultsCount();
        } else {
            showEmptyState(container, 'Unable to load posts. Please try again later.');
        }
    } catch (error) {
        console.error('Error loading blog posts:', error);
        // Show sample posts for demo
        renderSamplePosts(container);
    }
}

/**
 * Render sample posts for demonstration when API is not available
 */
function renderSamplePosts(container) {
    const samplePosts = [
        {
            id: 1,
            title: 'Complete Guide to Studying Abroad in 2025',
            slug: 'complete-guide-studying-abroad-2025',
            excerpt: 'Everything you need to know about starting your international education journey, from choosing a country to applying for universities.',
            featured_image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400',
            category: 'Study Abroad',
            author: 'Sarah Johnson',
            published_at: '2025-01-15',
            reading_time_minutes: 8,
            views_count: 1250
        },
        {
            id: 2,
            title: 'Top 10 Scholarships for International Students',
            slug: 'top-10-scholarships-international-students',
            excerpt: 'Discover the best scholarship opportunities available for students looking to study abroad. Full funding options included.',
            featured_image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400',
            category: 'Scholarships',
            author: 'Michael Chen',
            published_at: '2025-01-10',
            reading_time_minutes: 6,
            views_count: 2340
        },
        {
            id: 3,
            title: 'How to Write a Winning Statement of Purpose',
            slug: 'how-write-winning-statement-purpose',
            excerpt: 'Learn the secrets to crafting a compelling SOP that will make your application stand out from thousands of others.',
            featured_image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400',
            category: 'University Tips',
            author: 'Emily Davis',
            published_at: '2025-01-05',
            reading_time_minutes: 10,
            views_count: 890
        },
        {
            id: 4,
            title: 'Student Visa Interview Tips and Common Questions',
            slug: 'student-visa-interview-tips-questions',
            excerpt: 'Prepare for your visa interview with these expert tips and practice answering the most frequently asked questions.',
            featured_image: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=400',
            category: 'Visa Guide',
            author: 'David Wilson',
            published_at: '2024-12-28',
            reading_time_minutes: 7,
            views_count: 1567
        },
        {
            id: 5,
            title: 'Best Countries for International Students in 2025',
            slug: 'best-countries-international-students-2025',
            excerpt: 'Compare the top study destinations based on quality of education, cost of living, work opportunities, and student experience.',
            featured_image: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=400',
            category: 'Study Abroad',
            author: 'Sarah Johnson',
            published_at: '2024-12-20',
            reading_time_minutes: 12,
            views_count: 3210
        },
        {
            id: 6,
            title: 'IELTS vs TOEFL: Which Test Should You Take?',
            slug: 'ielts-vs-toefl-which-test',
            excerpt: 'A comprehensive comparison of the two most popular English proficiency tests to help you make the right choice.',
            featured_image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400',
            category: 'Test Preparation',
            author: 'Michael Chen',
            published_at: '2024-12-15',
            reading_time_minutes: 9,
            views_count: 1890
        }
    ];

    BlogState.posts = samplePosts;
    BlogState.totalPosts = samplePosts.length;
    renderBlogPosts();
    renderPagination();
    updateResultsCount();
}

/**
 * Render blog posts to the container
 */
function renderBlogPosts() {
    const container = document.getElementById('blogPostsContainer');
    if (!container) return;

    if (BlogState.posts.length === 0) {
        showEmptyState(container, 'No posts found. Check back later for new content.');
        return;
    }

    const isGrid = BlogState.viewMode === 'grid';
    container.className = isGrid ? 'blog-posts-grid' : 'blog-posts-list';

    container.innerHTML = BlogState.posts.map(post => createPostCard(post)).join('');
}

/**
 * Create a blog post card HTML
 * @param {Object} post - The post data
 * @returns {string} - HTML string
 */
function createPostCard(post) {
    const title = escapeHtml(post.title);
    const excerpt = escapeHtml(post.excerpt || '');
    const category = escapeHtml(post.category || 'General');
    const author = escapeHtml(post.author || 'Admin');
    const date = formatDate(post.published_at);
    const readTime = post.reading_time_minutes || 5;
    const slug = encodeURIComponent(post.slug);
    const imageUrl = post.featured_image || 'images/blog-placeholder.jpg';
    const imageAlt = escapeHtml(post.featured_image_alt || post.title);

    return `
        <article class="blog-card">
            <div class="blog-card-image">
                <img src="${imageUrl}" alt="${imageAlt}" loading="lazy">
                <span class="category-badge">${category}</span>
            </div>
            <div class="blog-card-content">
                <div class="blog-card-meta">
                    <span><i class="fas fa-user"></i> ${author}</span>
                    <span><i class="fas fa-calendar"></i> ${date}</span>
                </div>
                <h2><a href="blog-post.html?slug=${slug}">${title}</a></h2>
                <p class="blog-card-excerpt">${excerpt}</p>
                <div class="blog-card-footer">
                    <a href="blog-post.html?slug=${slug}" class="read-more-link">
                        Read More <i class="fas fa-arrow-right"></i>
                    </a>
                    <span class="read-time">
                        <i class="fas fa-clock"></i> ${readTime} min read
                    </span>
                </div>
            </div>
        </article>
    `;
}

/**
 * Show empty state message
 */
function showEmptyState(container, message) {
    container.innerHTML = `
        <div class="blog-empty">
            <i class="fas fa-newspaper"></i>
            <h3>No Posts Found</h3>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}

/**
 * Update results count display
 */
function updateResultsCount() {
    const countElement = document.getElementById('resultsCount');
    if (countElement) {
        // Use textContent instead of innerHTML for security
        countElement.textContent = `Showing ${BlogState.posts.length} of ${BlogState.totalPosts} posts`;
    }
}

/**
 * Render pagination controls
 */
function renderPagination() {
    const container = document.getElementById('blogPagination');
    if (!container) return;

    const totalPages = Math.ceil(BlogState.totalPosts / BlogState.postsPerPage);
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '';
    
    // Previous button
    html += `
        <button class="pagination-btn" ${BlogState.currentPage === 1 ? 'disabled' : ''} 
                onclick="changePage(${BlogState.currentPage - 1})" aria-label="Previous page">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= BlogState.currentPage - 1 && i <= BlogState.currentPage + 1)) {
            html += `
                <button class="pagination-number ${i === BlogState.currentPage ? 'active' : ''}" 
                        onclick="changePage(${i})" aria-label="Page ${i}">
                    ${i}
                </button>
            `;
        } else if (i === BlogState.currentPage - 2 || i === BlogState.currentPage + 2) {
            html += '<span class="pagination-ellipsis">...</span>';
        }
    }

    // Next button
    html += `
        <button class="pagination-btn" ${BlogState.currentPage === totalPages ? 'disabled' : ''} 
                onclick="changePage(${BlogState.currentPage + 1})" aria-label="Next page">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    container.innerHTML = html;
}

/**
 * Change to a different page
 * @param {number} page - The page number
 */
function changePage(page) {
    BlogState.currentPage = page;
    loadBlogPosts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Set up view toggle (grid/list)
 */
function setupViewToggle() {
    const toggleButtons = document.querySelectorAll('.view-btn');
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            BlogState.viewMode = view;
            
            // Update active state
            toggleButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Re-render posts
            renderBlogPosts();
        });
    });
}

/**
 * Set up search form
 */
function setupSearchForm() {
    const form = document.getElementById('blogSearchForm');
    const input = document.getElementById('blogSearchInput');
    
    if (form && input) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            BlogState.searchQuery = input.value.trim();
            BlogState.currentPage = 1;
            loadBlogPosts();
        });
    }
}

/**
 * Set up category filters
 */
function setupCategoryFilters() {
    const list = document.getElementById('categoriesList');
    if (list) {
        list.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                e.preventDefault();
                const category = e.target.dataset.category;
                BlogState.currentCategory = category === 'all' ? null : category;
                BlogState.currentPage = 1;
                loadBlogPosts();
            }
        });
    }
}

/**
 * Load categories from API
 */
async function loadCategories() {
    try {
        const response = await fetch(`${BlogState.apiBaseUrl}/categories`);
        const data = await response.json();
        
        if (data.success) {
            renderCategories(data.data.categories);
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        // Show sample categories
        renderCategories([
            { slug: 'study-abroad', name: 'Study Abroad', count: 12 },
            { slug: 'scholarships', name: 'Scholarships', count: 8 },
            { slug: 'visa-guide', name: 'Visa Guide', count: 6 },
            { slug: 'university-tips', name: 'University Tips', count: 10 },
            { slug: 'test-preparation', name: 'Test Preparation', count: 5 }
        ]);
    }
}

/**
 * Render categories list
 */
function renderCategories(categories) {
    const list = document.getElementById('categoriesList');
    if (!list) return;

    let total = 0;
    let html = '';
    
    categories.forEach(cat => {
        total += cat.count || 0;
        html += `
            <li>
                <a href="#" data-category="${escapeHtml(cat.slug)}">${escapeHtml(cat.name)}</a>
                <span class="category-count">${cat.count || 0}</span>
            </li>
        `;
    });

    // Update all count
    const allCount = document.getElementById('allCount');
    if (allCount) {
        allCount.textContent = total;
    }

    // Add categories after "All Categories"
    const allItem = list.querySelector('li:first-child');
    list.innerHTML = '';
    if (allItem) list.appendChild(allItem);
    list.insertAdjacentHTML('beforeend', html);
}

/**
 * Load recent posts
 */
async function loadRecentPosts() {
    try {
        const response = await fetch(`${BlogState.apiBaseUrl}/posts?limit=5`);
        const data = await response.json();
        
        if (data.success) {
            renderRecentPosts(data.data.posts);
        }
    } catch (error) {
        console.error('Error loading recent posts:', error);
        // Show sample recent posts
        renderRecentPosts([
            { title: 'Complete Guide to Studying Abroad in 2025', slug: 'complete-guide', published_at: '2025-01-15' },
            { title: 'Top 10 Scholarships for International Students', slug: 'top-10-scholarships', published_at: '2025-01-10' },
            { title: 'How to Write a Winning Statement of Purpose', slug: 'winning-sop', published_at: '2025-01-05' }
        ]);
    }
}

/**
 * Render recent posts widget
 */
function renderRecentPosts(posts) {
    const container = document.getElementById('recentPostsList');
    if (!container) return;

    container.innerHTML = posts.slice(0, 5).map(post => `
        <div class="recent-post-item">
            <div class="recent-post-image">
                <img src="${post.featured_image || 'images/blog-placeholder.jpg'}" 
                     alt="${escapeHtml(post.title)}" loading="lazy">
            </div>
            <div class="recent-post-content">
                <h4><a href="blog-post.html?slug=${encodeURIComponent(post.slug)}">${escapeHtml(post.title)}</a></h4>
                <span class="recent-post-date">${formatDate(post.published_at)}</span>
            </div>
        </div>
    `).join('');
}

/**
 * Load tags from API
 */
async function loadTags() {
    try {
        const response = await fetch(`${BlogState.apiBaseUrl}/tags`);
        const data = await response.json();
        
        if (data.success) {
            renderTags(data.data.tags);
        }
    } catch (error) {
        console.error('Error loading tags:', error);
        // Show sample tags
        renderTags([
            { slug: 'usa', name: 'USA' },
            { slug: 'uk', name: 'UK' },
            { slug: 'canada', name: 'Canada' },
            { slug: 'scholarship', name: 'Scholarship' },
            { slug: 'visa', name: 'Visa' },
            { slug: 'ielts', name: 'IELTS' },
            { slug: 'toefl', name: 'TOEFL' },
            { slug: 'masters', name: 'Masters' }
        ]);
    }
}

/**
 * Render tags cloud
 */
function renderTags(tags) {
    const container = document.getElementById('tagsCloud');
    if (!container) return;

    container.innerHTML = tags.map(tag => `
        <a href="blog.html?tag=${encodeURIComponent(tag.slug)}" class="blog-tag">
            ${escapeHtml(tag.name)}
        </a>
    `).join('');
}

// =============================================================================
// INDIVIDUAL POST PAGE
// =============================================================================

/**
 * Initialize individual blog post page
 */
async function initBlogPost() {
    const postContent = document.getElementById('postContent');
    if (!postContent) return;

    // Get slug from URL
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');

    if (!slug) {
        showPostError('Post not found. Please check the URL.');
        return;
    }

    await loadSinglePost(slug);
}

/**
 * Load a single blog post
 * @param {string} slug - The post slug
 */
async function loadSinglePost(slug) {
    try {
        const response = await fetch(`${BlogState.apiBaseUrl}/posts/${encodeURIComponent(slug)}`);
        const data = await response.json();

        if (data.success && data.data.post) {
            renderSinglePost(data.data.post);
            incrementViewCount(data.data.post.id);
            loadRelatedPosts(data.data.post.id);
        } else {
            showPostError('Post not found.');
        }
    } catch (error) {
        console.error('Error loading post:', error);
        // Show sample post for demo
        renderSamplePost();
    }
}

/**
 * Render sample post for demonstration
 */
function renderSamplePost() {
    const samplePost = {
        id: 1,
        title: 'Complete Guide to Studying Abroad in 2025',
        slug: 'complete-guide-studying-abroad-2025',
        content: `# Introduction

Studying abroad is one of the most enriching experiences a student can have. This comprehensive guide will walk you through everything you need to know about pursuing your education internationally in 2025.

## Why Study Abroad?

There are numerous benefits to studying abroad:

- **Global Perspective**: Exposure to different cultures and ways of thinking
- **Career Advancement**: International experience is valued by employers
- **Personal Growth**: Independence and self-discovery
- **Networking**: Build connections with people from around the world
- **Language Skills**: Opportunity to become fluent in another language

## Top Destinations for 2025

### United States
The USA remains the most popular destination with over 1 million international students. Key benefits include:
- World-renowned universities
- Cutting-edge research opportunities
- OPT work authorization

### United Kingdom
The UK offers a rich academic tradition with shorter program durations:
- 1-year master's programs
- Post-study work visa available
- Historic institutions

### Canada
Canada continues to attract students with its welcoming immigration policies:
- Post-graduation work permits
- Pathway to permanent residency
- High quality of life

### Australia
Australia offers excellent education with a great lifestyle:
- Top-ranked universities
- Post-study work rights
- Beautiful weather and nature

## Application Timeline

Here's a typical timeline for applying to universities abroad:

1. **12-18 months before**: Research universities and programs
2. **10-12 months before**: Prepare for standardized tests (IELTS, TOEFL, GRE, GMAT)
3. **8-10 months before**: Request transcripts and recommendation letters
4. **6-8 months before**: Write your statement of purpose
5. **4-6 months before**: Submit applications
6. **2-4 months before**: Apply for visa
7. **1-2 months before**: Arrange accommodation and travel

## Financial Planning

Studying abroad requires careful financial planning:

\`\`\`
Estimated Annual Costs (USD):
USA: $30,000 - $70,000
UK: $25,000 - $50,000
Canada: $20,000 - $45,000
Australia: $25,000 - $50,000
Germany: $10,000 - $20,000
\`\`\`

### Funding Options
- Scholarships (merit-based and need-based)
- Student loans
- Part-time work
- Teaching/Research assistantships

## Conclusion

Starting your study abroad journey might seem overwhelming, but with proper planning and guidance, it can be the most rewarding decision of your life. At Study Pro Global, we're here to help you every step of the way.

> "Education is the passport to the future, for tomorrow belongs to those who prepare for it today." - Malcolm X
`,
        excerpt: 'Everything you need to know about starting your international education journey, from choosing a country to applying for universities.',
        featured_image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
        featured_image_alt: 'Students studying abroad at a university campus',
        meta_description: 'Complete guide to studying abroad in 2025. Learn about top destinations, application timelines, financial planning, and more.',
        category: 'Study Abroad',
        author: 'Sarah Johnson',
        author_bio: 'Sarah is a education consultant with over 10 years of experience helping students achieve their dreams of studying abroad.',
        published_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-16T14:30:00Z',
        reading_time_minutes: 8,
        views_count: 1250,
        tags: ['USA', 'UK', 'Canada', 'Australia', 'Application Guide']
    };

    renderSinglePost(samplePost);
}

/**
 * Render a single blog post
 * @param {Object} post - The post data
 */
function renderSinglePost(post) {
    // Update page title
    document.title = `${escapeHtml(post.title)} - Study Pro Global`;

    // Update meta tags
    updateMetaTags(post);

    // Update header elements using textContent (secure)
    const titleEl = document.getElementById('postTitle');
    const excerptEl = document.getElementById('postExcerpt');
    const breadcrumbTitle = document.getElementById('breadcrumbTitle');
    const categoryEl = document.getElementById('postCategory');
    const dateEl = document.getElementById('postDate');
    const authorEl = document.getElementById('postAuthor');
    const readTimeEl = document.getElementById('postReadTime');
    const viewsEl = document.getElementById('postViews');

    if (titleEl) titleEl.textContent = post.title;
    if (excerptEl) excerptEl.textContent = post.excerpt || '';
    if (breadcrumbTitle) breadcrumbTitle.textContent = truncateText(post.title, 50);
    if (categoryEl) categoryEl.textContent = post.category || 'General';
    if (dateEl) dateEl.textContent = formatDate(post.published_at);
    if (authorEl) authorEl.textContent = post.author || 'Admin';
    if (readTimeEl) readTimeEl.textContent = post.reading_time_minutes || '5';
    if (viewsEl) viewsEl.textContent = formatNumber(post.views_count || 0);

    // Featured image
    const imageContainer = document.getElementById('featuredImageContainer');
    const imageEl = document.getElementById('featuredImage');
    if (imageContainer && imageEl && post.featured_image) {
        imageEl.src = post.featured_image;
        imageEl.alt = post.featured_image_alt || post.title;
        imageContainer.style.display = 'block';
    }

    // Hide loading, show content
    const loading = document.getElementById('postLoading');
    const article = document.getElementById('articleContent');
    const footer = document.getElementById('postFooter');
    const authorBio = document.getElementById('authorBio');

    if (loading) loading.style.display = 'none';
    
    // Render markdown content securely
    if (article) {
        article.innerHTML = renderMarkdown(post.content);
        article.style.display = 'block';
        
        // Apply syntax highlighting to code blocks
        if (typeof hljs !== 'undefined') {
            article.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        }

        // Add external link attributes
        article.querySelectorAll('a').forEach(link => {
            if (link.hostname !== window.location.hostname) {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            }
        });

        // Generate table of contents
        generateTableOfContents(article);
    }

    // Render tags
    if (footer) {
        footer.style.display = 'block';
        const tagsContainer = document.getElementById('postTags');
        if (tagsContainer && post.tags && post.tags.length > 0) {
            const tagsHtml = post.tags.map(tag => 
                `<a href="blog.html?tag=${encodeURIComponent(tag)}" class="blog-tag">${escapeHtml(tag)}</a>`
            ).join('');
            tagsContainer.innerHTML = `<span>Tags:</span>${tagsHtml}`;
        }
    }

    // Set up social share buttons
    setupShareButtons(post);

    // Author bio
    if (authorBio && post.author) {
        document.getElementById('authorName').textContent = post.author;
        document.getElementById('authorDescription').textContent = post.author_bio || 
            'Education consultant at Study Pro Global.';
        authorBio.style.display = 'flex';
    }
}

/**
 * Generate table of contents from headings
 * @param {HTMLElement} article - The article element
 */
function generateTableOfContents(article) {
    const toc = document.getElementById('tableOfContents');
    const tocList = document.getElementById('tocList');
    
    if (!toc || !tocList) return;

    const headings = article.querySelectorAll('h2, h3');
    
    if (headings.length < 2) {
        toc.style.display = 'none';
        return;
    }

    let html = '';
    headings.forEach((heading, index) => {
        const id = `heading-${index}`;
        heading.id = id;
        
        const level = heading.tagName.toLowerCase();
        const text = heading.textContent;
        
        html += `
            <li class="toc-${level}">
                <a href="#${id}">${escapeHtml(text)}</a>
            </li>
        `;
    });

    tocList.innerHTML = html;
    toc.style.display = 'block';
}

/**
 * Update meta tags for SEO
 * @param {Object} post - The post data
 */
function updateMetaTags(post) {
    const baseUrl = 'https://www.studyproglobal.com.bd';
    const postUrl = `${baseUrl}/blog/${post.slug}`;

    // Update standard meta tags
    updateMetaTag('description', post.meta_description || post.excerpt);
    
    // Update canonical URL
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = postUrl;

    // Update Open Graph tags
    updateMetaTag('og:url', postUrl);
    updateMetaTag('og:title', post.title);
    updateMetaTag('og:description', post.meta_description || post.excerpt);
    updateMetaTag('og:image', post.featured_image || `${baseUrl}/images/logo.jpg`);

    // Update Twitter tags
    updateMetaTag('twitter:url', postUrl);
    updateMetaTag('twitter:title', post.title);
    updateMetaTag('twitter:description', post.meta_description || post.excerpt);
    updateMetaTag('twitter:image', post.featured_image || `${baseUrl}/images/logo.jpg`);

    // Update Schema.org JSON-LD
    const schema = document.getElementById('articleSchema');
    if (schema) {
        const schemaData = {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.title,
            "image": post.featured_image,
            "author": {
                "@type": "Person",
                "name": post.author
            },
            "publisher": {
                "@type": "Organization",
                "name": "Study Pro Global",
                "logo": {
                    "@type": "ImageObject",
                    "url": `${baseUrl}/images/logo.jpg`
                }
            },
            "datePublished": post.published_at,
            "dateModified": post.updated_at || post.published_at,
            "description": post.meta_description || post.excerpt
        };
        schema.textContent = JSON.stringify(schemaData);
    }
}

/**
 * Update a meta tag
 * @param {string} property - The property name
 * @param {string} content - The content value
 */
function updateMetaTag(property, content) {
    let meta = document.querySelector(`meta[property="${property}"]`) || 
               document.querySelector(`meta[name="${property}"]`);
    if (meta) {
        meta.content = content || '';
    }
}

/**
 * Set up social share buttons
 * @param {Object} post - The post data
 */
function setupShareButtons(post) {
    const pageUrl = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(post.title);

    const facebookBtn = document.getElementById('shareFacebook');
    const twitterBtn = document.getElementById('shareTwitter');
    const linkedinBtn = document.getElementById('shareLinkedIn');
    const whatsappBtn = document.getElementById('shareWhatsApp');
    const printBtn = document.getElementById('printBtn');

    if (facebookBtn) {
        facebookBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`;
    }
    if (twitterBtn) {
        twitterBtn.href = `https://twitter.com/intent/tweet?url=${pageUrl}&text=${title}`;
    }
    if (linkedinBtn) {
        linkedinBtn.href = `https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`;
    }
    if (whatsappBtn) {
        whatsappBtn.href = `https://wa.me/?text=${title}%20${pageUrl}`;
    }
    if (printBtn) {
        printBtn.addEventListener('click', () => window.print());
    }
}

/**
 * Increment view count for a post
 * @param {number} postId - The post ID
 */
async function incrementViewCount(postId) {
    try {
        await fetch(`${BlogState.apiBaseUrl}/posts/${postId}/view`, {
            method: 'POST'
        });
    } catch (error) {
        console.error('Error incrementing view count:', error);
    }
}

/**
 * Load related posts
 * @param {number} postId - The current post ID
 */
async function loadRelatedPosts(postId) {
    try {
        const response = await fetch(`${BlogState.apiBaseUrl}/posts/related/${postId}`);
        const data = await response.json();
        
        if (data.success && data.data.posts.length > 0) {
            renderRelatedPosts(data.data.posts);
        }
    } catch (error) {
        console.error('Error loading related posts:', error);
        // Show sample related posts
        renderRelatedPosts([
            { title: 'Top 10 Scholarships for International Students', slug: 'top-10-scholarships', published_at: '2025-01-10' },
            { title: 'How to Write a Winning Statement of Purpose', slug: 'winning-sop', published_at: '2025-01-05' },
            { title: 'Student Visa Interview Tips', slug: 'visa-interview-tips', published_at: '2024-12-28' }
        ]);
    }
}

/**
 * Render related posts
 * @param {Array} posts - Related posts array
 */
function renderRelatedPosts(posts) {
    const container = document.getElementById('relatedPosts');
    const grid = document.getElementById('relatedPostsGrid');
    
    if (!container || !grid) return;

    grid.innerHTML = posts.slice(0, 3).map(post => `
        <article class="related-post-card">
            <div class="related-post-image">
                <img src="${post.featured_image || 'images/blog-placeholder.jpg'}" 
                     alt="${escapeHtml(post.title)}" loading="lazy">
            </div>
            <div class="related-post-content">
                <h4><a href="blog-post.html?slug=${encodeURIComponent(post.slug)}">${escapeHtml(post.title)}</a></h4>
                <span class="related-post-date">${formatDate(post.published_at)}</span>
            </div>
        </article>
    `).join('');

    container.style.display = 'block';
}

/**
 * Show post error message
 * @param {string} message - The error message
 */
function showPostError(message) {
    const loading = document.getElementById('postLoading');
    if (loading) {
        loading.innerHTML = `
            <div class="blog-empty">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Error</h3>
                <p>${escapeHtml(message)}</p>
                <a href="blog.html" class="btn-primary" style="margin-top: 1rem;">Back to Blog</a>
            </div>
        `;
    }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format a date string
 * @param {string} dateString - The date string to format
 * @returns {string} - Formatted date
 */
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Format a number with K/M suffix
 * @param {number} num - The number to format
 * @returns {string} - Formatted number
 */
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

/**
 * Truncate text to specified length
 * @param {string} text - The text to truncate
 * @param {number} length - Maximum length
 * @returns {string} - Truncated text
 */
function truncateText(text, length) {
    if (!text || text.length <= length) return text;
    return text.substring(0, length) + '...';
}

// =============================================================================
// INITIALIZATION
// =============================================================================

// Initialize the appropriate page
document.addEventListener('DOMContentLoaded', () => {
    // Check which page we're on
    if (document.getElementById('blogPostsContainer')) {
        initBlogListing();
    } else if (document.getElementById('postContent')) {
        initBlogPost();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        escapeHtml,
        renderMarkdown,
        BlogState,
        initBlogListing,
        initBlogPost
    };
}
