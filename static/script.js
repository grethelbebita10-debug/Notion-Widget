// Global variables
let allData = [];
let currentPlatformFilter = 'all';
let currentStatusFilter = 'all';
let currentModalImages = [];
let currentModalIndex = 0;
let availablePlatforms = [];
let availableStatuses = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadGallery();
    setupEventListeners();
});

// Set up event listeners
function setupEventListeners() {
    // ESC key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
    
    // Click outside modal to close
    document.getElementById('imageModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
    
    // Prevent clicks on modal content from closing modal
    document.querySelector('.modal-content').addEventListener('click', function(e) {
        e.stopPropagation();
    });
}

// Load gallery data and platforms
async function loadGallery() {
    showLoadingState();
    
    try {
        // Load data, platforms, and statuses in parallel
        const [dataResponse, platformsResponse, statusesResponse] = await Promise.all([
            fetch('/api/data'),
            fetch('/api/platforms'),
            fetch('/api/statuses')
        ]);
        
        if (!dataResponse.ok) {
            throw new Error(`Failed to fetch data: ${dataResponse.status}`);
        }
        
        const data = await dataResponse.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        allData = data;
        
        // Load platforms and statuses (don't fail if these fail)
        if (platformsResponse.ok) {
            availablePlatforms = await platformsResponse.json();
            updatePlatformOptions();
        }
        
        if (statusesResponse.ok) {
            availableStatuses = await statusesResponse.json();
            updateStatusOptions();
        }
        
        renderGallery();
        hideLoadingState();
        
    } catch (error) {
        console.error('Error loading gallery:', error);
        showErrorState(error.message);
    }
}

// Show loading state
function showLoadingState() {
    document.getElementById('loading-state').classList.remove('d-none');
    document.getElementById('error-state').classList.add('d-none');
    document.getElementById('empty-state').classList.add('d-none');
    document.getElementById('gallery-container').classList.add('d-none');
}

// Hide loading state
function hideLoadingState() {
    document.getElementById('loading-state').classList.add('d-none');
}

// Show error state
function showErrorState(message) {
    document.getElementById('loading-state').classList.add('d-none');
    document.getElementById('gallery-container').classList.add('d-none');
    document.getElementById('empty-state').classList.add('d-none');
    document.getElementById('error-state').classList.remove('d-none');
    document.getElementById('error-message').textContent = message;
}

// Show empty state
function showEmptyState() {
    document.getElementById('loading-state').classList.add('d-none');
    document.getElementById('error-state').classList.add('d-none');
    document.getElementById('gallery-container').classList.add('d-none');
    document.getElementById('empty-state').classList.remove('d-none');
}

// Update platform filter options with counts
function updatePlatformOptions() {
    const platformOptionsContainer = document.getElementById('platform-options');
    const existingItems = platformOptionsContainer.querySelectorAll('.option-item:not([data-platform="all"])');
    
    // Remove existing platform items (except "All Platforms")
    existingItems.forEach(item => item.remove());
    
    // Count posts per platform
    const platformCounts = {};
    const processedData = allData.map(item => ({
        platform: extractPlatform(item),
        images: extractImageUrls(item)
    })).filter(item => item.images.length > 0);
    
    processedData.forEach(item => {
        platformCounts[item.platform] = (platformCounts[item.platform] || 0) + 1;
    });
    
    // Update "All Platforms" count
    const allItem = platformOptionsContainer.querySelector('[data-platform="all"] .platform-count');
    if (allItem) {
        allItem.textContent = processedData.length;
    }
    
    // Add new platform items with counts
    availablePlatforms.forEach(platform => {
        const count = platformCounts[platform] || 0;
        const item = document.createElement('div');
        item.className = 'option-item';
        item.setAttribute('data-platform', platform);
        item.onclick = () => selectPlatform(platform);
        item.innerHTML = `
            <div class="radio-circle"></div>
            <span>${platform} <span class="platform-count">${count}</span></span>
        `;
        platformOptionsContainer.appendChild(item);
    });
}

// Update status filter options with counts
function updateStatusOptions() {
    const statusOptionsContainer = document.getElementById('status-options');
    const existingItems = statusOptionsContainer.querySelectorAll('.option-item:not([data-status="all"])');
    
    // Remove existing status items (except "All Status")
    existingItems.forEach(item => item.remove());
    
    // Count posts per status
    const statusCounts = {};
    const processedData = allData.map(item => ({
        status: extractStatus(item),
        images: extractImageUrls(item)
    })).filter(item => item.images.length > 0);
    
    processedData.forEach(item => {
        statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
    });
    
    // Update "All Status" count
    const allItem = statusOptionsContainer.querySelector('[data-status="all"] .status-count');
    if (allItem) {
        allItem.textContent = processedData.length;
    }
    
    // Add new status items with counts
    availableStatuses.forEach(status => {
        const count = statusCounts[status] || 0;
        const item = document.createElement('div');
        item.className = 'option-item';
        item.setAttribute('data-status', status);
        item.onclick = () => selectStatus(status);
        item.innerHTML = `
            <div class="radio-square"></div>
            <span>${status} <span class="status-count">${count}</span></span>
        `;
        statusOptionsContainer.appendChild(item);
    });
}

// Extract image URLs from Notion attachment fields
function extractImageUrls(item) {
    const imageFields = ['Image', 'image', 'Photo', 'photo', 'Picture', 'Attachment'];
    const images = [];
    
    for (const fieldName of imageFields) {
        const field = item.properties[fieldName];
        if (field && field.type === 'files' && field.files.length > 0) {
            field.files.forEach(file => {
                if (file.type === 'file' && file.file && file.file.url) {
                    images.push(file.file.url);
                } else if (file.type === 'external' && file.external && file.external.url) {
                    images.push(file.external.url);
                }
            });
            break; // Use first matching field
        }
    }
    
    return images;
}

// Extract title from Notion item
function extractTitle(item) {
    const titleFields = ['Name', 'Title', 'name', 'title'];
    
    for (const fieldName of titleFields) {
        const field = item.properties[fieldName];
        if (field && field.type === 'title' && field.title.length > 0) {
            return field.title[0].plain_text || 'Untitled';
        }
    }
    
    return 'Untitled';
}

// Extract date from Notion item
function extractDate(item) {
    const dateFields = ['Publish Date', 'Date', 'Created', 'Last edited time'];
    
    for (const fieldName of dateFields) {
        const field = item.properties[fieldName];
        if (field) {
            if (field.type === 'date' && field.date && field.date.start) {
                return new Date(field.date.start + 'T00:00:00');
            } else if (field.type === 'last_edited_time') {
                return new Date(field.last_edited_time);
            } else if (field.type === 'created_time') {
                return new Date(field.created_time);
            }
        }
    }
    
    return new Date(item.created_time || item.last_edited_time);
}

// Extract platform from Notion item
function extractPlatform(item) {
    const platformFields = ['Platform', 'platform', 'Type', 'Category'];
    
    for (const fieldName of platformFields) {
        const field = item.properties[fieldName];
        if (field) {
            if (field.type === 'multi_select' && field.multi_select.length > 0) {
                return field.multi_select[0].name;
            } else if (field.type === 'select' && field.select) {
                return field.select.name;
            }
        }
    }
    
    return 'Other';
}

// Extract pin status from Notion item
function extractPinStatus(item) {
    const pinField = item.properties['Pin'];
    if (pinField && pinField.type === 'checkbox') {
        return pinField.checkbox;
    }
    return false;
}

// Extract status from Notion item
function extractStatus(item) {
    const statusField = item.properties['Status'];
    if (statusField && statusField.type === 'select' && statusField.select) {
        return statusField.select.name;
    }
    return 'No Status';
}

// Format date for display
function formatDate(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
}

// Render the gallery
function renderGallery() {
    const processedData = allData.map(item => ({
        id: item.id,
        title: extractTitle(item),
        date: extractDate(item),
        platform: extractPlatform(item),
        status: extractStatus(item),
        images: extractImageUrls(item),
        isPinned: extractPinStatus(item),
        currentImageIndex: 0
    })).filter(item => item.images.length > 0);
    
    // Sort by pinned status first, then by date
    processedData.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.date - a.date;
    });
    
    // Filter by platform and status
    let filteredData = processedData;
    if (currentPlatformFilter !== 'all') {
        filteredData = filteredData.filter(item => item.platform === currentPlatformFilter);
    }
    if (currentStatusFilter !== 'all') {
        filteredData = filteredData.filter(item => item.status === currentStatusFilter);
    }
    
    if (filteredData.length === 0) {
        showEmptyState();
        return;
    }
    
    // Show gallery and render items
    document.getElementById('error-state').classList.add('d-none');
    document.getElementById('empty-state').classList.add('d-none');
    document.getElementById('gallery-container').classList.remove('d-none');
    
    const container = document.getElementById('gallery-container');
    container.innerHTML = '';
    
    // Create 15 slots
    for (let i = 0; i < 15; i++) {
        const slot = document.createElement('div');
        slot.className = 'gallery-item';
        
        if (i < filteredData.length) {
            const item = filteredData[i];
            renderGalleryItem(slot, item, i);
        } else {
            // No content placeholder
            slot.classList.add('no-content');
            slot.innerHTML = '<div>No Content</div>';
        }
        
        container.appendChild(slot);
    }
}

// Render individual gallery item
function renderGalleryItem(slot, item, index) {
    const currentImage = item.images[item.currentImageIndex];
    
    slot.innerHTML = `
        <img src="${currentImage}" alt="${item.title}" loading="lazy">
        
        ${item.isPinned ? `
            <div class="pin-indicator">
                <i class="fas fa-thumbtack"></i>
            </div>
        ` : item.images.length > 1 ? `
            <div class="multiple-images-indicator">
                <i class="fas fa-layer-group"></i>
            </div>
        ` : ''}
        
        ${item.images.length > 1 ? `
            <button class="hover-nav hover-nav-left" onclick="navigateImage(${index}, -1)" ${item.currentImageIndex === 0 ? 'style="display: none;"' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
            <button class="hover-nav hover-nav-right" onclick="navigateImage(${index}, 1)" ${item.currentImageIndex === item.images.length - 1 ? 'style="display: none;"' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        ` : ''}
        
        <div class="gallery-item-overlay">
            <div class="gallery-item-title">${item.title}</div>
            <div class="gallery-item-date">${formatDate(item.date)}</div>
        </div>
    `;
    
    // Add click handler for modal
    const img = slot.querySelector('img');
    if (img) {
        img.onclick = (e) => {
            e.stopPropagation();
            openModal(item.images, item.currentImageIndex, item.title, item.date);
        };
    }
}

// Navigate between images in gallery item
function navigateImage(itemIndex, direction) {
    // Find the current filtered data
    const processedData = allData.map(item => ({
        id: item.id,
        title: extractTitle(item),
        date: extractDate(item),
        platform: extractPlatform(item),
        status: extractStatus(item),
        images: extractImageUrls(item),
        isPinned: extractPinStatus(item),
        currentImageIndex: 0
    })).filter(item => item.images.length > 0);
    
    // Sort by pinned status first, then by date
    processedData.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.date - a.date;
    });
    
    let filteredData = processedData;
    if (currentPlatformFilter !== 'all') {
        filteredData = filteredData.filter(item => item.platform === currentPlatformFilter);
    }
    if (currentStatusFilter !== 'all') {
        filteredData = filteredData.filter(item => item.status === currentStatusFilter);
    }
    
    const item = filteredData[itemIndex];
    if (!item) return;
    
    const newIndex = item.currentImageIndex + direction;
    if (newIndex >= 0 && newIndex < item.images.length) {
        item.currentImageIndex = newIndex;
        
        // Re-render this specific item
        const galleryItems = document.querySelectorAll('.gallery-item');
        if (galleryItems[itemIndex]) {
            renderGalleryItem(galleryItems[itemIndex], item, itemIndex);
        }
    }
}

// Toggle filter section
function toggleFilters() {
    const filterSection = document.getElementById('filter-section');
    filterSection.classList.toggle('d-none');
    
    // Hide platform options when closing filters
    if (filterSection.classList.contains('d-none')) {
        document.getElementById('platform-options').classList.add('d-none');
    }
}

// Toggle platform filter dropdown
function togglePlatformFilter() {
    const platformOptions = document.getElementById('platform-options');
    const statusOptions = document.getElementById('status-options');
    const platformArrow = document.getElementById('platform-arrow');
    
    // Close status dropdown if open
    statusOptions.classList.add('d-none');
    document.getElementById('status-arrow').className = 'fas fa-chevron-down';
    
    // Toggle platform dropdown
    platformOptions.classList.toggle('d-none');
    
    // Update arrow direction
    if (platformOptions.classList.contains('d-none')) {
        platformArrow.className = 'fas fa-chevron-down';
    } else {
        platformArrow.className = 'fas fa-chevron-up';
    }
}

// Toggle status filter dropdown
function toggleStatusFilter() {
    const statusOptions = document.getElementById('status-options');
    const platformOptions = document.getElementById('platform-options');
    const statusArrow = document.getElementById('status-arrow');
    
    // Close platform dropdown if open
    platformOptions.classList.add('d-none');
    document.getElementById('platform-arrow').className = 'fas fa-chevron-down';
    
    // Toggle status dropdown
    statusOptions.classList.toggle('d-none');
    
    // Update arrow direction
    if (statusOptions.classList.contains('d-none')) {
        statusArrow.className = 'fas fa-chevron-down';
    } else {
        statusArrow.className = 'fas fa-chevron-up';
    }
}

// Select platform
function selectPlatform(platform) {
    currentPlatformFilter = platform;
    
    // Update active state
    document.querySelectorAll('#platform-options .radio-circle').forEach(circle => {
        circle.classList.remove('active');
    });
    document.querySelector(`[data-platform="${platform}"] .radio-circle`).classList.add('active');
    
    // Update button text
    const platformText = document.getElementById('platform-text');
    platformText.textContent = platform === 'all' ? 'All Platforms' : platform;
    
    // Hide platform options
    document.getElementById('platform-options').classList.add('d-none');
    document.getElementById('platform-arrow').className = 'fas fa-chevron-down';
    
    // Re-render gallery
    renderGallery();
}

// Select status
function selectStatus(status) {
    currentStatusFilter = status;
    
    // Update active state
    document.querySelectorAll('#status-options .radio-square').forEach(square => {
        square.classList.remove('active');
    });
    document.querySelector(`[data-status="${status}"] .radio-square`).classList.add('active');
    
    // Update button text
    const statusText = document.getElementById('status-text');
    statusText.textContent = status === 'all' ? 'Status' : status;
    
    // Hide status options
    document.getElementById('status-options').classList.add('d-none');
    document.getElementById('status-arrow').className = 'fas fa-chevron-down';
    
    // Re-render gallery
    renderGallery();
}

// Open modal
function openModal(images, startIndex, title, date) {
    currentModalImages = images;
    currentModalIndex = startIndex;
    
    document.getElementById('modalImage').src = images[startIndex];
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalDate').textContent = formatDate(date);
    document.getElementById('imageModal').classList.remove('d-none');
    
    updateModalNavigation();
}

// Close modal
function closeModal() {
    document.getElementById('imageModal').classList.add('d-none');
}

// Navigate to previous image in modal
function prevModalImage() {
    if (currentModalIndex > 0) {
        currentModalIndex--;
        document.getElementById('modalImage').src = currentModalImages[currentModalIndex];
        updateModalNavigation();
    }
}

// Navigate to next image in modal
function nextModalImage() {
    if (currentModalIndex < currentModalImages.length - 1) {
        currentModalIndex++;
        document.getElementById('modalImage').src = currentModalImages[currentModalIndex];
        updateModalNavigation();
    }
}

// Update modal navigation buttons
function updateModalNavigation() {
    const prevBtn = document.getElementById('prevImage');
    const nextBtn = document.getElementById('nextImage');
    
    prevBtn.style.display = currentModalIndex === 0 ? 'none' : 'flex';
    nextBtn.style.display = currentModalIndex === currentModalImages.length - 1 ? 'none' : 'flex';
}
