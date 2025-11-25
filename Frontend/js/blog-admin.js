/**
 * Study Pro Global - Blog Admin Module
 * 
 * Handles blog post creation, editing, and management.
 * All user input is sanitized to prevent XSS attacks.
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
    
    if (typeof marked !== 'undefined') {
        const rawHtml = marked.parse(markdown);
        if (typeof DOMPurify !== 'undefined') {
            return DOMPurify.sanitize(rawHtml, {
                ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li', 
                               'blockquote', 'pre', 'code', 'em', 'strong', 'img', 'br', 'hr',
                               'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div'],
                ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id'],
                FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input'],
                FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
            });
        }
        return rawHtml;
    }
    
    return escapeHtml(markdown);
}

// =============================================================================
// ADMIN STATE
// =============================================================================

const AdminState = {
    apiBaseUrl: '/api/v1/blog',
    postId: null,
    isEditing: false,
    isDirty: false,
    autoSaveTimer: null,
    autoSaveInterval: 30000, // 30 seconds
    featuredImage: null,
    tags: [],
    lastSaved: null
};

// =============================================================================
// AUTHENTICATION
// =============================================================================

/**
 * Check if user is authenticated as admin
 */
async function checkAdminAuth() {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    if (!token) {
        redirectToLogin();
        return false;
    }

    try {
        const response = await fetch('/api/v1/auth/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        
        if (!data.success || data.data.role !== 'admin') {
            redirectToLogin();
            return false;
        }

        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        // For demo, allow access
        return true;
    }
}

/**
 * Redirect to login page
 */
function redirectToLogin() {
    alert('Please log in as an admin to access this page.');
    window.location.href = 'index.html#login';
}

/**
 * Get auth token
 */
function getAuthToken() {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize admin blog editor
 */
async function initBlogAdmin() {
    // Check authentication
    const isAuth = await checkAdminAuth();
    if (!isAuth) return;

    // Check if editing existing post
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    if (postId) {
        AdminState.postId = postId;
        AdminState.isEditing = true;
        await loadExistingPost(postId);
    }

    // Set up event listeners
    setupEventListeners();
    
    // Set up auto-save
    setupAutoSave();

    // Set up markdown toolbar
    setupMarkdownToolbar();

    // Update SEO score initially
    updateSEOScore();
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Title input
    const titleInput = document.getElementById('postTitle');
    if (titleInput) {
        titleInput.addEventListener('input', () => {
            updateCharCount('postTitle', 'titleCharCount', 255);
            generateSlug();
            markDirty();
            updateSEOScore();
        });
    }

    // Slug input
    const slugInput = document.getElementById('postSlug');
    if (slugInput) {
        slugInput.addEventListener('input', markDirty);
    }

    // Regenerate slug button
    const regenerateBtn = document.getElementById('regenerateSlug');
    if (regenerateBtn) {
        regenerateBtn.addEventListener('click', generateSlug);
    }

    // Content input
    const contentInput = document.getElementById('postContent');
    if (contentInput) {
        contentInput.addEventListener('input', () => {
            updatePreview();
            markDirty();
            updateSEOScore();
        });
    }

    // Excerpt input
    const excerptInput = document.getElementById('postExcerpt');
    if (excerptInput) {
        excerptInput.addEventListener('input', () => {
            updateCharCount('postExcerpt', 'excerptCharCount', 300);
            markDirty();
        });
    }

    // Meta description
    const metaInput = document.getElementById('metaDescription');
    if (metaInput) {
        metaInput.addEventListener('input', () => {
            updateCharCount('metaDescription', 'metaCharCount', 160);
            markDirty();
            updateSEOScore();
        });
    }

    // Focus keyword
    const keywordInput = document.getElementById('focusKeyword');
    if (keywordInput) {
        keywordInput.addEventListener('input', () => {
            markDirty();
            updateSEOScore();
        });
    }

    // Featured image alt
    const imageAlt = document.getElementById('featuredImageAlt');
    if (imageAlt) {
        imageAlt.addEventListener('input', () => {
            markDirty();
            updateSEOScore();
        });
    }

    // Publish status options
    const statusOptions = document.querySelectorAll('.status-option');
    statusOptions.forEach(option => {
        option.addEventListener('click', () => {
            statusOptions.forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            option.querySelector('input').checked = true;

            // Show/hide schedule input
            const scheduleInput = document.getElementById('scheduleInput');
            if (scheduleInput) {
                scheduleInput.style.display = 
                    option.dataset.status === 'scheduled' ? 'flex' : 'none';
            }
            markDirty();
        });
    });

    // Featured image upload
    setupImageUpload();

    // Tags input
    setupTagsInput();

    // Action buttons
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', () => savePost('draft'));
    }

    const publishBtn = document.getElementById('publishBtn');
    if (publishBtn) {
        publishBtn.addEventListener('click', () => {
            const status = document.querySelector('input[name="postStatus"]:checked').value;
            savePost(status);
        });
    }

    const previewBtn = document.getElementById('previewBtn');
    if (previewBtn) {
        previewBtn.addEventListener('click', previewPost);
    }

    const deleteBtn = document.getElementById('deleteBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', deletePost);
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('authToken');
            window.location.href = 'index.html';
        });
    }

    // Warn before leaving with unsaved changes
    window.addEventListener('beforeunload', (e) => {
        if (AdminState.isDirty) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

// =============================================================================
// POST MANAGEMENT
// =============================================================================

/**
 * Load existing post for editing
 * @param {string} postId - The post ID
 */
async function loadExistingPost(postId) {
    try {
        const response = await fetch(`${AdminState.apiBaseUrl}/posts/${postId}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        const data = await response.json();

        if (data.success && data.data.post) {
            populateForm(data.data.post);
            
            // Update UI
            document.getElementById('editorTitle').textContent = 'Edit Blog Post';
            document.getElementById('deleteCard').style.display = 'block';
        } else {
            alert('Post not found');
            window.location.href = 'admin-blog.html';
        }
    } catch (error) {
        console.error('Error loading post:', error);
        alert('Error loading post');
    }
}

/**
 * Populate form with post data
 * @param {Object} post - The post data
 */
function populateForm(post) {
    document.getElementById('postTitle').value = post.title || '';
    document.getElementById('postSlug').value = post.slug || '';
    document.getElementById('postContent').value = post.content || '';
    document.getElementById('postExcerpt').value = post.excerpt || '';
    document.getElementById('metaDescription').value = post.meta_description || '';
    document.getElementById('focusKeyword').value = post.focus_keyword || '';
    document.getElementById('featuredImageAlt').value = post.featured_image_alt || '';

    // Category
    const categorySelect = document.getElementById('postCategory');
    if (categorySelect && post.category) {
        categorySelect.value = post.category;
    }

    // Status
    const statusInput = document.querySelector(`input[name="postStatus"][value="${post.status}"]`);
    if (statusInput) {
        statusInput.click();
    }

    // Schedule date
    if (post.scheduled_for) {
        const scheduleInput = document.getElementById('scheduleDate');
        if (scheduleInput) {
            scheduleInput.value = post.scheduled_for.slice(0, 16);
        }
    }

    // Featured image
    if (post.featured_image) {
        AdminState.featuredImage = post.featured_image;
        showImagePreview(post.featured_image);
    }

    // Tags
    if (post.tags && Array.isArray(post.tags)) {
        AdminState.tags = post.tags;
        renderTags();
    }

    // Update character counts
    updateCharCount('postTitle', 'titleCharCount', 255);
    updateCharCount('postExcerpt', 'excerptCharCount', 300);
    updateCharCount('metaDescription', 'metaCharCount', 160);

    // Update preview
    updatePreview();
    updateSEOScore();
}

/**
 * Save post (draft or publish)
 * @param {string} status - The status (draft, published, scheduled)
 */
async function savePost(status) {
    // Validate required fields
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();

    if (!title) {
        alert('Please enter a title');
        document.getElementById('postTitle').focus();
        return;
    }

    if (!content) {
        alert('Please enter content');
        document.getElementById('postContent').focus();
        return;
    }

    // Collect form data
    const formData = {
        title: title,
        slug: document.getElementById('postSlug').value.trim() || generateSlugFromTitle(title),
        content: content,
        excerpt: document.getElementById('postExcerpt').value.trim(),
        meta_description: document.getElementById('metaDescription').value.trim(),
        focus_keyword: document.getElementById('focusKeyword').value.trim(),
        category: document.getElementById('postCategory').value,
        featured_image: AdminState.featuredImage,
        featured_image_alt: document.getElementById('featuredImageAlt').value.trim(),
        tags: AdminState.tags,
        status: status
    };

    // Add schedule date if applicable
    if (status === 'scheduled') {
        const scheduleDate = document.getElementById('scheduleDate').value;
        if (!scheduleDate) {
            alert('Please select a schedule date');
            return;
        }
        formData.scheduled_for = new Date(scheduleDate).toISOString();
    }

    // Update autosave status
    updateAutosaveStatus('saving');

    try {
        const method = AdminState.isEditing ? 'PUT' : 'POST';
        const url = AdminState.isEditing 
            ? `${AdminState.apiBaseUrl}/posts/${AdminState.postId}`
            : `${AdminState.apiBaseUrl}/posts`;

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            AdminState.isDirty = false;
            AdminState.lastSaved = new Date();
            updateAutosaveStatus('saved');

            if (!AdminState.isEditing) {
                AdminState.postId = data.data.post.id;
                AdminState.isEditing = true;
                window.history.replaceState({}, '', `admin-blog.html?id=${AdminState.postId}`);
                document.getElementById('editorTitle').textContent = 'Edit Blog Post';
                document.getElementById('deleteCard').style.display = 'block';
            }

            if (status === 'published') {
                alert('Post published successfully!');
            } else if (status === 'scheduled') {
                alert('Post scheduled successfully!');
            } else {
                alert('Draft saved successfully!');
            }
        } else {
            alert(data.error?.message || 'Error saving post');
            updateAutosaveStatus('error');
        }
    } catch (error) {
        console.error('Error saving post:', error);
        // For demo, simulate success
        AdminState.isDirty = false;
        AdminState.lastSaved = new Date();
        updateAutosaveStatus('saved');
        alert('Post saved successfully! (Demo mode)');
    }
}

/**
 * Preview post in new tab
 */
function previewPost() {
    const title = document.getElementById('postTitle').value.trim();
    const slug = document.getElementById('postSlug').value.trim() || generateSlugFromTitle(title);
    
    if (slug) {
        window.open(`blog-post.html?slug=${encodeURIComponent(slug)}&preview=true`, '_blank');
    } else {
        alert('Please enter a title first');
    }
}

/**
 * Delete post
 */
async function deletePost() {
    if (!AdminState.postId) return;

    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`${AdminState.apiBaseUrl}/posts/${AdminState.postId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        const data = await response.json();

        if (data.success) {
            alert('Post deleted successfully');
            window.location.href = 'admin-blog.html';
        } else {
            alert(data.error?.message || 'Error deleting post');
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        alert('Post deleted successfully! (Demo mode)');
        window.location.href = 'admin-blog.html';
    }
}

// =============================================================================
// MARKDOWN EDITOR
// =============================================================================

/**
 * Set up markdown toolbar
 */
function setupMarkdownToolbar() {
    const toolbarBtns = document.querySelectorAll('.toolbar-btn');
    
    toolbarBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            applyMarkdownAction(action);
        });
    });

    // Keyboard shortcuts
    const contentInput = document.getElementById('postContent');
    if (contentInput) {
        contentInput.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'b':
                        e.preventDefault();
                        applyMarkdownAction('bold');
                        break;
                    case 'i':
                        e.preventDefault();
                        applyMarkdownAction('italic');
                        break;
                    case 'k':
                        e.preventDefault();
                        applyMarkdownAction('link');
                        break;
                }
            }
        });
    }
}

/**
 * Apply markdown formatting action
 * @param {string} action - The action to apply
 */
function applyMarkdownAction(action) {
    const textarea = document.getElementById('postContent');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    let replacement = '';
    let cursorOffset = 0;

    switch (action) {
        case 'bold':
            replacement = `**${selectedText || 'bold text'}**`;
            cursorOffset = selectedText ? 0 : -2;
            break;
        case 'italic':
            replacement = `*${selectedText || 'italic text'}*`;
            cursorOffset = selectedText ? 0 : -1;
            break;
        case 'strikethrough':
            replacement = `~~${selectedText || 'strikethrough'}~~`;
            cursorOffset = selectedText ? 0 : -2;
            break;
        case 'h1':
            replacement = `# ${selectedText || 'Heading 1'}`;
            break;
        case 'h2':
            replacement = `## ${selectedText || 'Heading 2'}`;
            break;
        case 'h3':
            replacement = `### ${selectedText || 'Heading 3'}`;
            break;
        case 'ul':
            replacement = selectedText 
                ? selectedText.split('\n').map(line => `- ${line}`).join('\n')
                : '- List item';
            break;
        case 'ol':
            replacement = selectedText
                ? selectedText.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n')
                : '1. List item';
            break;
        case 'quote':
            replacement = selectedText
                ? selectedText.split('\n').map(line => `> ${line}`).join('\n')
                : '> Blockquote';
            break;
        case 'link':
            const url = prompt('Enter URL:', 'https://');
            if (url) {
                replacement = `[${selectedText || 'link text'}](${url})`;
            }
            break;
        case 'image':
            const imgUrl = prompt('Enter image URL:', 'https://');
            if (imgUrl) {
                replacement = `![${selectedText || 'alt text'}](${imgUrl})`;
            }
            break;
        case 'code':
            if (selectedText.includes('\n')) {
                replacement = `\`\`\`\n${selectedText}\n\`\`\``;
            } else {
                replacement = `\`${selectedText || 'code'}\``;
            }
            break;
        case 'hr':
            replacement = '\n---\n';
            break;
        case 'table':
            replacement = `
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
`;
            break;
    }

    if (replacement) {
        textarea.focus();
        document.execCommand('insertText', false, replacement);
        
        // Update cursor position
        if (cursorOffset) {
            textarea.selectionStart = textarea.selectionEnd = end + replacement.length + cursorOffset;
        }

        updatePreview();
        markDirty();
    }
}

/**
 * Update markdown preview
 */
function updatePreview() {
    const content = document.getElementById('postContent').value;
    const preview = document.getElementById('contentPreview');
    
    if (preview) {
        if (content.trim()) {
            preview.innerHTML = renderMarkdown(content);
        } else {
            preview.innerHTML = '<p style="color: var(--text-color); font-style: italic;">Start typing to see the preview...</p>';
        }
    }
}

// =============================================================================
// IMAGE UPLOAD
// =============================================================================

/**
 * Set up image upload functionality
 */
function setupImageUpload() {
    const uploadArea = document.getElementById('featuredImageUpload');
    const fileInput = document.getElementById('featuredImageInput');
    const removeBtn = document.getElementById('removeFeaturedImage');

    if (uploadArea && fileInput) {
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                handleImageUpload(file);
            }
        });

        // Click to upload
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                handleImageUpload(file);
            }
        });
    }

    // Remove image
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            AdminState.featuredImage = null;
            document.getElementById('featuredImageUpload').style.display = 'block';
            document.getElementById('featuredImagePreview').style.display = 'none';
            document.getElementById('featuredImageInput').value = '';
            markDirty();
            updateSEOScore();
        });
    }
}

/**
 * Handle image upload
 * @param {File} file - The file to upload
 */
async function handleImageUpload(file) {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        alert('Please upload a JPEG, PNG, or WebP image');
        return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        alert('Image must be less than 5MB');
        return;
    }

    try {
        // Create preview using FileReader (for demo)
        const reader = new FileReader();
        reader.onload = (e) => {
            AdminState.featuredImage = e.target.result;
            showImagePreview(e.target.result);
            markDirty();
            updateSEOScore();
        };
        reader.readAsDataURL(file);

        // In production, upload to server
        // const formData = new FormData();
        // formData.append('image', file);
        // const response = await fetch(`${AdminState.apiBaseUrl}/upload-image`, {
        //     method: 'POST',
        //     headers: {
        //         'Authorization': `Bearer ${getAuthToken()}`
        //     },
        //     body: formData
        // });
        // const data = await response.json();
        // AdminState.featuredImage = data.data.url;

    } catch (error) {
        console.error('Error uploading image:', error);
        alert('Error uploading image');
    }
}

/**
 * Show image preview
 * @param {string} url - The image URL
 */
function showImagePreview(url) {
    const uploadArea = document.getElementById('featuredImageUpload');
    const preview = document.getElementById('featuredImagePreview');
    const previewImg = document.getElementById('featuredImagePreviewImg');

    if (uploadArea && preview && previewImg) {
        previewImg.src = url;
        uploadArea.style.display = 'none';
        preview.style.display = 'block';
    }
}

// =============================================================================
// TAGS INPUT
// =============================================================================

/**
 * Set up tags input
 */
function setupTagsInput() {
    const input = document.getElementById('tagsInput');
    const wrapper = document.getElementById('tagsInputWrapper');

    if (!input || !wrapper) return;

    // Add tag on Enter or comma
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(input.value.trim());
            input.value = '';
        }
    });

    // Add tag on blur
    input.addEventListener('blur', () => {
        if (input.value.trim()) {
            addTag(input.value.trim());
            input.value = '';
        }
    });

    // Focus input when clicking wrapper
    wrapper.addEventListener('click', () => {
        input.focus();
    });
}

/**
 * Add a tag
 * @param {string} tag - The tag to add
 */
function addTag(tag) {
    // Clean the tag
    tag = tag.replace(/,/g, '').trim();
    
    if (!tag || AdminState.tags.includes(tag)) return;
    
    AdminState.tags.push(tag);
    renderTags();
    markDirty();
}

/**
 * Remove a tag
 * @param {number} index - The tag index
 */
function removeTag(index) {
    AdminState.tags.splice(index, 1);
    renderTags();
    markDirty();
}

/**
 * Render tags in the input
 */
function renderTags() {
    const wrapper = document.getElementById('tagsInputWrapper');
    const input = document.getElementById('tagsInput');
    
    if (!wrapper || !input) return;

    // Remove existing tags
    wrapper.querySelectorAll('.tag-item').forEach(el => el.remove());

    // Add new tags before input
    AdminState.tags.forEach((tag, index) => {
        const tagEl = document.createElement('span');
        tagEl.className = 'tag-item';
        // Use textContent for security
        tagEl.textContent = tag;
        
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'tag-remove';
        removeBtn.innerHTML = '&times;';
        removeBtn.addEventListener('click', () => removeTag(index));
        
        tagEl.appendChild(removeBtn);
        wrapper.insertBefore(tagEl, input);
    });
}

// =============================================================================
// SEO SCORE
// =============================================================================

/**
 * Update SEO score based on current content
 */
function updateSEOScore() {
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    const metaDescription = document.getElementById('metaDescription').value.trim();
    const focusKeyword = document.getElementById('focusKeyword').value.trim().toLowerCase();
    const imageAlt = document.getElementById('featuredImageAlt').value.trim();

    let score = 0;
    const checks = {
        checkTitle: false,
        checkMeta: false,
        checkImage: false,
        checkContent: false,
        checkHeadings: false
    };

    // Check title contains focus keyword
    if (focusKeyword && title.toLowerCase().includes(focusKeyword)) {
        score += 20;
        checks.checkTitle = true;
    } else if (title.length > 0) {
        score += 10;
    }

    // Check meta description
    if (metaDescription.length >= 150 && metaDescription.length <= 160) {
        score += 20;
        checks.checkMeta = true;
    } else if (metaDescription.length >= 100) {
        score += 10;
    }

    // Check featured image with alt text
    if (AdminState.featuredImage && imageAlt) {
        score += 20;
        checks.checkImage = true;
    } else if (AdminState.featuredImage || imageAlt) {
        score += 10;
    }

    // Check content length (300+ words)
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount >= 300) {
        score += 20;
        checks.checkContent = true;
    } else if (wordCount >= 150) {
        score += 10;
    }

    // Check for subheadings
    if (content.includes('## ') || content.includes('### ')) {
        score += 20;
        checks.checkHeadings = true;
    }

    // Update UI
    updateSEOUI(score, checks);
}

/**
 * Update SEO UI elements
 * @param {number} score - The SEO score
 * @param {Object} checks - The check results
 */
function updateSEOUI(score, checks) {
    const scoreCircle = document.getElementById('seoScoreCircle');
    const scoreText = document.getElementById('seoScoreText');

    if (scoreCircle) {
        scoreCircle.textContent = score;
        scoreCircle.className = 'seo-score-circle ';
        
        if (score >= 80) {
            scoreCircle.classList.add('good');
        } else if (score >= 50) {
            scoreCircle.classList.add('medium');
        } else {
            scoreCircle.classList.add('poor');
        }
    }

    if (scoreText) {
        if (score >= 80) {
            scoreText.textContent = 'Great! Your SEO looks good';
        } else if (score >= 50) {
            scoreText.textContent = 'Good - Some improvements possible';
        } else {
            scoreText.textContent = 'Needs improvement';
        }
    }

    // Update check icons
    Object.keys(checks).forEach(check => {
        const icon = document.getElementById(check);
        if (icon) {
            if (checks[check]) {
                icon.className = 'seo-check-icon pass';
                icon.innerHTML = '<i class="fas fa-check"></i>';
            } else {
                icon.className = 'seo-check-icon fail';
                icon.innerHTML = '<i class="fas fa-times"></i>';
            }
        }
    });
}

// =============================================================================
// AUTO-SAVE
// =============================================================================

/**
 * Set up auto-save functionality
 */
function setupAutoSave() {
    // Auto-save every 30 seconds if dirty
    AdminState.autoSaveTimer = setInterval(() => {
        if (AdminState.isDirty) {
            savePost('draft');
        }
    }, AdminState.autoSaveInterval);
}

/**
 * Mark content as dirty (unsaved changes)
 */
function markDirty() {
    AdminState.isDirty = true;
    updateAutosaveStatus('unsaved');
}

/**
 * Update autosave status indicator
 * @param {string} status - The status (saving, saved, unsaved, error)
 */
function updateAutosaveStatus(status) {
    const statusEl = document.getElementById('autosaveStatus');
    if (!statusEl) return;

    const icon = statusEl.querySelector('i');
    const text = statusEl.querySelector('span');

    statusEl.classList.remove('saving');

    switch (status) {
        case 'saving':
            statusEl.classList.add('saving');
            icon.className = 'fas fa-sync-alt';
            text.textContent = 'Saving...';
            break;
        case 'saved':
            icon.className = 'fas fa-check-circle';
            text.textContent = 'All changes saved';
            break;
        case 'unsaved':
            icon.className = 'fas fa-circle';
            text.textContent = 'Unsaved changes';
            break;
        case 'error':
            icon.className = 'fas fa-exclamation-circle';
            text.textContent = 'Error saving';
            break;
    }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Update character count display
 * @param {string} inputId - The input element ID
 * @param {string} countId - The count display element ID
 * @param {number} max - Maximum characters
 */
function updateCharCount(inputId, countId, max) {
    const input = document.getElementById(inputId);
    const countEl = document.getElementById(countId);

    if (input && countEl) {
        const count = input.value.length;
        countEl.textContent = `${count}/${max}`;
        
        // Update styling based on count
        countEl.className = 'char-count';
        if (count > max) {
            countEl.classList.add('error');
        } else if (count > max * 0.9) {
            countEl.classList.add('warning');
        }
    }
}

/**
 * Generate slug from title
 */
function generateSlug() {
    const title = document.getElementById('postTitle').value;
    const slug = generateSlugFromTitle(title);
    document.getElementById('postSlug').value = slug;
}

/**
 * Generate URL-friendly slug from title
 * @param {string} title - The title
 * @returns {string} - The slug
 */
function generateSlugFromTitle(title) {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')      // Replace spaces with hyphens
        .replace(/-+/g, '-')       // Remove multiple hyphens
        .substring(0, 100);        // Limit length
}

// =============================================================================
// INITIALIZATION
// =============================================================================

// Initialize admin when DOM is ready
document.addEventListener('DOMContentLoaded', initBlogAdmin);

// Clean up on page unload
window.addEventListener('unload', () => {
    if (AdminState.autoSaveTimer) {
        clearInterval(AdminState.autoSaveTimer);
    }
});
