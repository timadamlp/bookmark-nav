// 全局变量
let allBookmarks = [];
let currentView = localStorage.getItem('view') || 'grid'; // 默认网格视图
let currentTheme = localStorage.getItem('theme') || 'light'; // 默认亮色主题

// DOM元素
const emptyState = document.getElementById('empty-state');
const bookmarksContainer = document.getElementById('bookmarks-container');
const searchInput = document.getElementById('search-input');
const searchResultsCount = document.getElementById('search-results-count');
const bookmarkFileInput = document.getElementById('bookmark-file');
const clearBookmarksBtn = document.getElementById('clear-bookmarks');
const toggleViewBtn = document.getElementById('toggle-view');
const toggleThemeBtn = document.getElementById('toggle-theme');
const viewModeText = document.getElementById('view-mode-text');
const loadingIndicator = document.getElementById('loading-indicator');
const bookmarkCountEl = document.getElementById('bookmark-count');
const folderCountEl = document.getElementById('folder-count');
const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggle-sidebar');
const closeSidebarBtn = document.getElementById('close-sidebar');
const foldersList = document.getElementById('folders-list');
const sidebarSearchInput = document.getElementById('sidebar-search-input');
const addFolderBtn = document.getElementById('add-folder-btn');

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
    // 设置页脚年份
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // 应用主题
    setTheme(currentTheme);
    
    // 初始化侧边栏
    initSidebar();
    
    // 尝试从本地存储加载书签
    loadBookmarksFromStorage();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 设置视图模式
    setViewMode(currentView);
});

// 设置所有事件监听器
function setupEventListeners() {
    // 文件输入监听
    bookmarkFileInput.addEventListener('change', handleFileSelection);
    
    // 搜索功能
    searchInput.addEventListener('input', handleSearch);
    
    // 清除书签按钮
    clearBookmarksBtn.addEventListener('click', clearAllBookmarks);
    
    // 切换视图按钮
    toggleViewBtn.addEventListener('click', toggleView);
    
    // 切换主题按钮
    toggleThemeBtn.addEventListener('click', toggleTheme);
    
    // 拖放区域
    setupDragAndDrop();
    
    // 回到顶部快捷键
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Home' || (e.ctrlKey && e.key === 'ArrowUp')) {
            window.scrollTo({top: 0, behavior: 'smooth'});
        }
    });
}

// 设置拖放区域事件
function setupDragAndDrop() {
    const container = document.querySelector('.container');
    const dropZone = document.querySelector('.drop-zone');
    
    // 阻止默认行为以允许拖放
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        container.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // 高亮拖放区域
    ['dragenter', 'dragover'].forEach(eventName => {
        container.addEventListener(eventName, () => {
            dropZone.classList.add('active');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        container.addEventListener(eventName, () => {
            dropZone.classList.remove('active');
        }, false);
    });
    
    // 处理文件拖放
    container.addEventListener('drop', handleDrop, false);
}

// 处理拖放的文件
function handleDrop(e) {
    const files = e.dataTransfer.files;
    
    if (files.length > 0) {
        const file = files[0];
        
        if (file.name.toLowerCase().endsWith('.html')) {
            processBookmarkFile(file);
        } else {
            showNotification('请上传HTML格式的书签文件', 'error');
        }
    }
}

// 设置主题
function setTheme(theme) {
    if (theme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        toggleThemeBtn.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.body.removeAttribute('data-theme');
        toggleThemeBtn.innerHTML = '<i class="fas fa-moon"></i>';
    }
    currentTheme = theme;
    localStorage.setItem('theme', theme);
}

// 切换主题
function toggleTheme() {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

// 显示通知
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close"><i class="fas fa-times"></i></button>
    `;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 显示通知
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // 设置自动关闭
    const autoClose = setTimeout(() => {
        closeNotification(notification);
    }, 5000);
    
    // 手动关闭按钮
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        clearTimeout(autoClose);
        closeNotification(notification);
    });
}

// 关闭通知
function closeNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
        notification.remove();
    }, 300);
}

// 从文件输入框处理文件
function handleFileSelection(e) {
    const file = e.target.files[0];
    
    if (file) {
        processBookmarkFile(file);
    }
}

// 处理书签文件
function processBookmarkFile(file) {
    // 显示加载指示器
    showLoading(true);
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const content = e.target.result;
            parseAndRenderBookmarks(content);
        } catch (error) {
            console.error('处理书签文件时出错:', error);
            showNotification('解析书签文件时发生错误，请确保上传了有效的Chrome书签HTML文件', 'error');
            showLoading(false);
        }
    };
    
    reader.onerror = () => {
        showNotification('读取文件时发生错误', 'error');
        showLoading(false);
    };
    
    reader.readAsText(file);
}

// 解析书签HTML并渲染
function parseAndRenderBookmarks(html) {
    setTimeout(() => { // 使用setTimeout使UI有机会更新
        try {
            const bookmarks = parseBookmarks(html);
            allBookmarks = bookmarks;
            
            // 更新UI
            renderBookmarks(bookmarks);
            updateStats(bookmarks);
            updateFoldersList(); // 更新侧边栏
            
            // 保存到本地存储
            localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
            
            // 显示成功通知
            showNotification(`成功导入 ${bookmarks.length} 个书签`);
            
            // 隐藏加载指示器
            showLoading(false);
        } catch (error) {
            console.error('解析书签时出错:', error);
            showNotification('解析书签时发生错误', 'error');
            showLoading(false);
        }
    }, 10);
}

// 解析Chrome书签HTML文件
function parseBookmarks(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const bookmarks = [];
    
    // 递归函数解析书签和文件夹
    function traverseNodes(node, folder = '未分类') {
        const items = node.children;
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            
            // 如果是DT元素（可能是书签或文件夹）
            if (item.tagName === 'DT') {
                const h3 = item.querySelector('h3');
                const a = item.querySelector('a');
                
                // 是文件夹
                if (h3) {
                    const folderName = h3.textContent.trim();
                    const dl = item.querySelector('dl');
                    
                    if (dl) {
                        traverseNodes(dl, folderName);
                    }
                } 
                // 是书签
                else if (a) {
                    try {
                        const title = a.textContent.trim();
                        const url = a.getAttribute('href');
                        const addDate = a.getAttribute('add_date');
                        
                        // 只处理有效URL的书签
                        if (url && url.startsWith('http')) {
                            const domain = new URL(url).hostname;
                            const favicon = `https://www.google.com/s2/favicons?domain=${domain}`;
                            
                            bookmarks.push({
                                title,
                                url,
                                favicon,
                                folder,
                                domain,
                                addDate: addDate ? new Date(parseInt(addDate) * 1000) : null
                            });
                        }
                    } catch (e) {
                        console.warn('解析书签时出错:', e);
                    }
                }
            }
        }
    }
    
    // 获取书签文件中的顶级DL元素
    const dls = doc.querySelectorAll('dl');
    if (dls.length > 0) {
        traverseNodes(dls[0]);
    }
    
    return bookmarks;
}

// 渲染书签到页面
function renderBookmarks(bookmarks) {
    // 如果没有书签，显示空状态
    if (!bookmarks || bookmarks.length === 0) {
        emptyState.style.display = 'flex';
        bookmarksContainer.innerHTML = '';
        return;
    }
    
    // 隐藏空状态
    emptyState.style.display = 'none';
    
    // 按文件夹分组书签
    const folderGroups = {};
    bookmarks.forEach(bookmark => {
        if (!folderGroups[bookmark.folder]) {
            folderGroups[bookmark.folder] = [];
        }
        folderGroups[bookmark.folder].push(bookmark);
    });
    
    // 清空书签容器
    bookmarksContainer.innerHTML = '';
    
    // 按文件夹名称排序
    const sortedFolders = Object.keys(folderGroups).sort();
    
    // 为每个文件夹创建一个区块
    sortedFolders.forEach(folder => {
        const folderBookmarks = folderGroups[folder];
        
        // 创建分类容器
        const categoryEl = document.createElement('div');
        categoryEl.className = 'category';
        categoryEl.id = `folder-${folder.replace(/\s+/g, '-').toLowerCase()}`;
        
        // 创建分类头部
        const headerEl = document.createElement('div');
        headerEl.className = 'category-header';
        headerEl.innerHTML = `
            <div class="category-title">
                <i class="fas fa-folder"></i> ${folder}
            </div>
            <div class="category-count">${folderBookmarks.length}</div>
        `;
        categoryEl.appendChild(headerEl);
        
        // 创建书签网格或列表
        const bookmarksEl = document.createElement('div');
        bookmarksEl.className = currentView === 'grid' ? 'bookmark-grid' : 'bookmark-list';
        
        // 排序书签（按标题字母顺序）
        folderBookmarks.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
        
        // 添加书签
        folderBookmarks.forEach(bookmark => {
            const bookmarkEl = document.createElement('a');
            bookmarkEl.className = 'bookmark-item';
            bookmarkEl.href = bookmark.url;
            bookmarkEl.target = '_blank';
            bookmarkEl.rel = 'noopener noreferrer';
            
            // 使用data属性存储书签数据，方便编辑
            bookmarkEl.setAttribute('data-url', bookmark.url);
            bookmarkEl.setAttribute('data-title', bookmark.title);
            bookmarkEl.setAttribute('data-folder', bookmark.folder);
            
            // 添加右键菜单支持
            bookmarkEl.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                showBookmarkContextMenu(e, bookmark, bookmarkEl);
            });
            
            // 使用自定义图标作为默认图标
            bookmarkEl.innerHTML = `
                <img src="${bookmark.favicon}" alt="" class="bookmark-icon" onerror="this.src='assets/favicon.png'">
                <div class="bookmark-info">
                    <div class="bookmark-title">${bookmark.title}</div>
                    <div class="bookmark-url">${bookmark.domain}</div>
                </div>
                <div class="bookmark-actions">
                    <button class="bookmark-action-btn edit-btn" title="编辑书签">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                    <button class="bookmark-action-btn delete-btn" title="删除书签">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
            
            // 添加点击事件，防止编辑按钮点击触发链接跳转
            const actionBtns = bookmarkEl.querySelectorAll('.bookmark-action-btn');
            actionBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (btn.classList.contains('edit-btn')) {
                        showEditBookmarkModal(bookmark, bookmarkEl);
                    } else if (btn.classList.contains('delete-btn')) {
                        showDeleteBookmarkConfirmation(bookmark);
                    }
                });
            });
            
            bookmarksEl.appendChild(bookmarkEl);
        });
        
        // 添加"添加新书签"按钮
        const addBookmarkBtn = document.createElement('div');
        addBookmarkBtn.className = 'add-bookmark-btn';
        addBookmarkBtn.innerHTML = `
            <i class="fas fa-plus"></i>
            <span>添加书签</span>
        `;
        addBookmarkBtn.addEventListener('click', () => {
            showAddBookmarkModal(folder);
        });
        bookmarksEl.appendChild(addBookmarkBtn);
        
        categoryEl.appendChild(bookmarksEl);
        bookmarksContainer.appendChild(categoryEl);
        
        // 添加折叠功能
        headerEl.addEventListener('click', () => {
            categoryEl.classList.toggle('collapsed');
        });
    });
}

// 更新统计信息
function updateStats(bookmarks) {
    const folderSet = new Set();
    bookmarks.forEach(bookmark => folderSet.add(bookmark.folder));
    
    bookmarkCountEl.textContent = bookmarks.length;
    folderCountEl.textContent = folderSet.size;
}

// 处理搜索功能
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (!allBookmarks || allBookmarks.length === 0) {
        return;
    }
    
    if (searchTerm === '') {
        // 如果搜索框为空，显示所有书签
        renderBookmarks(allBookmarks);
        searchResultsCount.textContent = '';
    } else {
        // 过滤匹配的书签
        const filteredBookmarks = allBookmarks.filter(bookmark => 
            bookmark.title.toLowerCase().includes(searchTerm) || 
            bookmark.url.toLowerCase().includes(searchTerm)
        );
        
        renderBookmarks(filteredBookmarks);
        searchResultsCount.textContent = `找到 ${filteredBookmarks.length} 个结果`;
    }
}

// 清除所有书签
function clearAllBookmarks() {
    if (confirm('确定要清除所有书签吗？此操作无法撤销。')) {
        localStorage.removeItem('bookmarks');
        allBookmarks = [];
        renderBookmarks([]);
        updateStats([]);
        updateFoldersList();
        showNotification('已清除所有书签');
    }
}

// 切换视图模式
function toggleView() {
    currentView = currentView === 'grid' ? 'list' : 'grid';
    setViewMode(currentView);
    
    // 保存视图设置
    localStorage.setItem('view', currentView);
}

// 设置视图模式
function setViewMode(mode) {
    if (mode === 'list') {
        bookmarksContainer.classList.add('list-view');
        toggleViewBtn.innerHTML = '<i class="fas fa-th-large"></i> <span id="view-mode-text">网格视图</span>';
    } else {
        bookmarksContainer.classList.remove('list-view');
        toggleViewBtn.innerHTML = '<i class="fas fa-list"></i> <span id="view-mode-text">列表视图</span>';
    }
    
    // 如果有书签，重新渲染以应用新的视图模式
    if (allBookmarks && allBookmarks.length > 0) {
        renderBookmarks(allBookmarks);
    }
}

// 从本地存储加载书签
function loadBookmarksFromStorage() {
    const savedBookmarks = localStorage.getItem('bookmarks');
    
    if (savedBookmarks) {
        try {
            allBookmarks = JSON.parse(savedBookmarks);
            renderBookmarks(allBookmarks);
            updateStats(allBookmarks);
            updateFoldersList();
        } catch (error) {
            console.error('从本地存储加载书签时出错:', error);
            showNotification('加载保存的书签时出错', 'error');
            allBookmarks = [];
        }
    } else {
        // 尝试从预设文件加载
        tryLoadPresetBookmarks();
    }
}

// 尝试加载预设书签文件
function tryLoadPresetBookmarks() {
    fetch('data/bookmarks.html')
        .then(response => {
            if (response.ok) {
                return response.text();
            }
            throw new Error('未找到预设书签文件');
        })
        .then(html => {
            parseAndRenderBookmarks(html);
        })
        .catch(error => {
            console.log('无预设书签文件:', error);
            // 静默失败，这只是一个可选功能
        });
}

// 显示/隐藏加载指示器
function showLoading(show) {
    loadingIndicator.style.display = show ? 'flex' : 'none';
}

// 添加键盘快捷键支持
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + F: 聚焦搜索框
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInput.focus();
    }
    
    // Esc: 清空搜索框
    if (e.key === 'Escape' && document.activeElement === searchInput) {
        searchInput.value = '';
        handleSearch();
    }
    
    // Ctrl/Cmd + Shift + L: 切换列表/网格视图
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        toggleView();
    }
    
    // Ctrl/Cmd + Shift + D: 切换暗色/亮色主题
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        toggleTheme();
    }
});

// 侧边栏相关功能
// 侧边栏初始化
function initSidebar() {
    // 创建侧边栏遮罩层（用于移动设备）
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
    
    // 设置事件监听器
    toggleSidebarBtn.addEventListener('click', toggleSidebar);
    closeSidebarBtn.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);
    sidebarSearchInput.addEventListener('input', filterFolders);
    addFolderBtn.addEventListener('click', showAddFolderModal);
    
    // 更新分类列表
    updateFoldersList();
    
    // 设置侧边栏键盘快捷键
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + B: 切换侧边栏
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            e.preventDefault();
            toggleSidebar();
        }
        
        // Esc: 关闭侧边栏
        if (e.key === 'Escape' && sidebar.classList.contains('open')) {
            closeSidebar();
        }
    });
}

// 切换侧边栏显示/隐藏
function toggleSidebar() {
    sidebar.classList.toggle('open');
    document.querySelector('.sidebar-overlay').classList.toggle('active');
}

// 关闭侧边栏
function closeSidebar() {
    sidebar.classList.remove('open');
    document.querySelector('.sidebar-overlay').classList.remove('active');
}

// 更新分类列表
function updateFoldersList() {
    if (!allBookmarks || allBookmarks.length === 0) {
        foldersList.innerHTML = `
            <div class="no-folders">
                <p>没有可用的分类</p>
                <p class="text-small">导入书签后将自动显示</p>
            </div>
        `;
        return;
    }
    
    // 获取所有唯一分类和每个分类的书签数量
    const folderCounts = {};
    allBookmarks.forEach(bookmark => {
        if (!folderCounts[bookmark.folder]) {
            folderCounts[bookmark.folder] = 0;
        }
        folderCounts[bookmark.folder]++;
    });
    
    // 按字母顺序排序分类
    const sortedFolders = Object.keys(folderCounts).sort();
    
    // 生成分类列表HTML
    foldersList.innerHTML = sortedFolders.map(folder => `
        <div class="folder-item" data-folder="${folder}">
            <div class="folder-name">
                <i class="fas fa-folder"></i>
                <span>${folder}</span>
                <span class="folder-count">${folderCounts[folder]}</span>
            </div>
            <div class="folder-actions">
                <button class="folder-action-btn edit-folder-btn" title="重命名分类">
                    <i class="fas fa-pencil-alt"></i>
                </button>
                <button class="folder-action-btn delete-folder-btn" title="删除分类">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    // 添加事件监听器
    document.querySelectorAll('.folder-item').forEach(item => {
        // 点击分类跳转到对应部分
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.folder-actions')) {
                const folder = item.getAttribute('data-folder');
                scrollToFolder(folder);
                
                // 在移动设备上自动关闭侧边栏
                if (window.innerWidth < 1024) {
                    closeSidebar();
                }
            }
        });
        
        // 编辑分类
        const editBtn = item.querySelector('.edit-folder-btn');
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const folder = item.getAttribute('data-folder');
                showEditFolderModal(folder);
            });
        }
        
        // 删除分类
        const deleteBtn = item.querySelector('.delete-folder-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const folder = item.getAttribute('data-folder');
                showDeleteFolderConfirmation(folder);
            });
        }
    });
}

// 搜索过滤分类
function filterFolders() {
    const searchTerm = sidebarSearchInput.value.toLowerCase().trim();
    
    document.querySelectorAll('.folder-item').forEach(item => {
        const folderName = item.querySelector('.folder-name span').textContent.toLowerCase();
        if (folderName.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// 滚动到指定分类
function scrollToFolder(folderName) {
    // 移除所有活动状态
    document.querySelectorAll('.folder-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // 为当前选中分类添加活动状态
    const folderItem = document.querySelector(`.folder-item[data-folder="${folderName}"]`);
    if (folderItem) {
        folderItem.classList.add('active');
    }
    
    // 找到对应的分类DOM元素
    const categoryId = `folder-${folderName.replace(/\s+/g, '-').toLowerCase()}`;
    const category = document.getElementById(categoryId);
    
    if (category) {
        // 平滑滚动到该分类
        category.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // 高亮效果
        category.classList.add('highlight');
        setTimeout(() => {
            category.classList.remove('highlight');
        }, 1500);
    }
}

// 显示添加分类模态框
function showAddFolderModal() {
    showModal({
        title: '新建分类',
        content: `
            <div class="form-group">
                <label for="new-folder-name">分类名称</label>
                <input type="text" id="new-folder-name" class="modal-input" placeholder="输入分类名称">
            </div>
        `,
        onConfirm: () => {
            const folderName = document.getElementById('new-folder-name').value.trim();
            if (folderName) {
                addNewFolder(folderName);
            } else {
                showNotification('分类名称不能为空', 'error');
                return false;
            }
        }
    });
}

// 添加新分类
function addNewFolder(folderName) {
    // 检查分类是否已存在
    const folderExists = allBookmarks.some(bookmark => bookmark.folder === folderName);
    
    if (folderExists) {
        showNotification(`分类 "${folderName}" 已存在`, 'error');
        return;
    }
    
    // 创建一个示例书签到新分类
    const newBookmark = {
        title: '新书签',
        url: 'https://example.com',
        favicon: 'https://www.google.com/s2/favicons?domain=example.com',
        folder: folderName,
        domain: 'example.com',
        addDate: new Date()
    };
    
    // 添加到书签集合
    allBookmarks.push(newBookmark);
    
    // 更新存储和UI
    saveBookmarks();
    renderBookmarks(allBookmarks);
    updateFoldersList();
    updateStats(allBookmarks);
    
    // 显示通知并滚动到新分类
    showNotification(`已创建分类 "${folderName}"`);
    scrollToFolder(folderName);
    
    // 显示书签编辑对话框
    setTimeout(() => {
        const bookmarkItems = document.querySelectorAll('.bookmark-item');
        const newBookmarkEl = Array.from(bookmarkItems).find(item => 
            item.querySelector('.bookmark-title').textContent === '新书签' && 
            item.closest('.category').querySelector('.category-title').textContent.includes(folderName)
        );
        
        if (newBookmarkEl) {
            showEditBookmarkModal(newBookmark, newBookmarkEl);
        }
    }, 500);
}

// 显示编辑分类模态框
function showEditFolderModal(folderName) {
    showModal({
        title: '重命名分类',
        content: `
            <div class="form-group">
                <label for="edit-folder-name">分类名称</label>
                <input type="text" id="edit-folder-name" class="modal-input" value="${folderName}" placeholder="输入新名称">
            </div>
        `,
        onConfirm: () => {
            const newName = document.getElementById('edit-folder-name').value.trim();
            if (newName && newName !== folderName) {
                renameFolder(folderName, newName);
            } else if (!newName) {
                showNotification('分类名称不能为空', 'error');
                return false;
            }
        }
    });
}

// 重命名分类
function renameFolder(oldName, newName) {
    // 检查新名称是否已存在
    const folderExists = allBookmarks.some(bookmark => bookmark.folder === newName);
    
    if (folderExists) {
        showNotification(`分类 "${newName}" 已存在`, 'error');
        return;
    }
    
    // 更新所有属于该分类的书签
    allBookmarks.forEach(bookmark => {
        if (bookmark.folder === oldName) {
            bookmark.folder = newName;
        }
    });
    
    // 更新存储和UI
    saveBookmarks();
    renderBookmarks(allBookmarks);
    updateFoldersList();
    
    showNotification(`已将分类 "${oldName}" 重命名为 "${newName}"`);
    scrollToFolder(newName);
}

// 显示删除分类确认对话框
function showDeleteFolderConfirmation(folderName) {
    const bookmarkCount = allBookmarks.filter(bookmark => bookmark.folder === folderName).length;
    
    showModal({
        title: '删除分类',
        content: `
            <p>您确定要删除分类 "${folderName}" 吗？</p>
            <p>此操作将删除该分类中的所有 ${bookmarkCount} 个书签。</p>
            <p class="text-danger">此操作无法撤销！</p>
        `,
        confirmText: '删除',
        confirmClass: 'danger',
        onConfirm: () => {
            deleteFolder(folderName);
        }
    });
}

// 删除分类及其所有书签
function deleteFolder(folderName) {
    // 过滤掉指定分类的书签
    allBookmarks = allBookmarks.filter(bookmark => bookmark.folder !== folderName);
    
    // 更新存储和UI
    saveBookmarks();
    renderBookmarks(allBookmarks);
    updateFoldersList();
    updateStats(allBookmarks);
    
    showNotification(`已删除分类 "${folderName}"`);
}

// 保存书签到本地存储
function saveBookmarks() {
    localStorage.setItem('bookmarks', JSON.stringify(allBookmarks));
}

// 书签管理功能

// 显示书签上下文菜单
function showBookmarkContextMenu(event, bookmark, element) {
    // 移除任何已有的上下文菜单
    removeContextMenu();
    
    // 创建上下文菜单
    const contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    contextMenu.innerHTML = `
        <div class="context-menu-item" data-action="edit">
            <i class="fas fa-pencil-alt"></i> 编辑书签
        </div>
        <div class="context-menu-item" data-action="move">
            <i class="fas fa-folder-open"></i> 移动到分类
        </div>
        <div class="context-menu-item" data-action="copy">
            <i class="fas fa-copy"></i> 复制链接
        </div>
        <div class="context-menu-item" data-action="delete">
            <i class="fas fa-trash-alt"></i> 删除书签
        </div>
    `;
    
    // 设置菜单位置
    contextMenu.style.top = `${event.pageY}px`;
    contextMenu.style.left = `${event.pageX}px`;
    
    // 添加到页面
    document.body.appendChild(contextMenu);
    
    // 确保菜单在视口内
    const menuRect = contextMenu.getBoundingClientRect();
    if (menuRect.right > window.innerWidth) {
        contextMenu.style.left = `${event.pageX - menuRect.width}px`;
    }
    if (menuRect.bottom > window.innerHeight) {
        contextMenu.style.top = `${event.pageY - menuRect.height}px`;
    }
    
    // 添加菜单项事件
    contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const action = item.getAttribute('data-action');
            
            switch (action) {
                case 'edit':
                    showEditBookmarkModal(bookmark, element);
                    break;
                case 'move':
                    showMoveBookmarkModal(bookmark);
                    break;
                case 'copy':
                    navigator.clipboard.writeText(bookmark.url)
                        .then(() => showNotification('已复制链接到剪贴板'))
                        .catch(() => showNotification('复制链接失败', 'error'));
                    break;
                case 'delete':
                    showDeleteBookmarkConfirmation(bookmark);
                    break;
            }
            
            removeContextMenu();
        });
    });
    
    // 点击其他区域关闭菜单
    document.addEventListener('click', removeContextMenu);
    document.addEventListener('contextmenu', removeContextMenu);
    
    // 按下Esc键关闭菜单
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            removeContextMenu();
        }
    });
}

// 移除上下文菜单
function removeContextMenu() {
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) {
        existingMenu.remove();
    }
    
    // 移除全局事件监听器
    document.removeEventListener('click', removeContextMenu);
    document.removeEventListener('contextmenu', removeContextMenu);
}

// 显示添加书签模态框
function showAddBookmarkModal(folderName) {
    // 获取所有分类作为选项
    const folders = getAllFolders();
    const folderOptions = folders.map(folder => 
        `<option value="${folder}" ${folder === folderName ? 'selected' : ''}>${folder}</option>`
    ).join('');
    
    showModal({
        title: '添加新书签',
        content: `
            <div class="form-group">
                <label for="bookmark-title">标题</label>
                <input type="text" id="bookmark-title" class="modal-input" placeholder="输入书签标题">
            </div>
            <div class="form-group">
                <label for="bookmark-url">网址</label>
                <input type="url" id="bookmark-url" class="modal-input" placeholder="https://example.com">
            </div>
            <div class="form-group">
                <label for="bookmark-folder">分类</label>
                <select id="bookmark-folder" class="modal-select">
                    ${folderOptions}
                </select>
            </div>
        `,
        onConfirm: () => {
            const title = document.getElementById('bookmark-title').value.trim();
            const url = document.getElementById('bookmark-url').value.trim();
            const folder = document.getElementById('bookmark-folder').value;
            
            if (title && url) {
                addBookmark(title, url, folder);
            } else {
                showNotification('标题和网址不能为空', 'error');
                return false; // 防止关闭模态框
            }
        }
    });
}

// 添加新书签
function addBookmark(title, url, folder) {
    // 确保URL格式正确
    try {
        // 添加协议如果缺少
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        
        // 创建新书签对象
        const newBookmark = {
            title,
            url,
            favicon: `https://www.google.com/s2/favicons?domain=${domain}`,
            folder,
            domain,
            addDate: new Date()
        };
        
        // 添加到书签集合
        allBookmarks.push(newBookmark);
        
        // 更新存储和UI
        saveBookmarks();
        renderBookmarks(allBookmarks);
        updateFoldersList();
        updateStats(allBookmarks);
        
        showNotification('成功添加新书签');
        
        // 滚动到新添加的书签所在分类
        scrollToFolder(folder);
    } catch (error) {
        showNotification('无效的URL格式', 'error');
        console.error('添加书签出错:', error);
    }
}

// 显示编辑书签模态框
function showEditBookmarkModal(bookmark, element) {
    // 获取所有分类作为选项
    const folders = getAllFolders();
    const folderOptions = folders.map(folder => 
        `<option value="${folder}" ${folder === bookmark.folder ? 'selected' : ''}>${folder}</option>`
    ).join('');
    
    showModal({
        title: '编辑书签',
        content: `
            <div class="form-group">
                <label for="edit-bookmark-title">标题</label>
                <input type="text" id="edit-bookmark-title" class="modal-input" value="${bookmark.title}" placeholder="输入书签标题">
            </div>
            <div class="form-group">
                <label for="edit-bookmark-url">网址</label>
                <input type="url" id="edit-bookmark-url" class="modal-input" value="${bookmark.url}" placeholder="https://example.com">
            </div>
            <div class="form-group">
                <label for="edit-bookmark-folder">分类</label>
                <select id="edit-bookmark-folder" class="modal-select">
                    ${folderOptions}
                </select>
            </div>
        `,
        onConfirm: () => {
            const title = document.getElementById('edit-bookmark-title').value.trim();
            const url = document.getElementById('edit-bookmark-url').value.trim();
            const folder = document.getElementById('edit-bookmark-folder').value;
            
            if (title && url) {
                updateBookmark(bookmark, title, url, folder);
            } else {
                showNotification('标题和网址不能为空', 'error');
                return false; // 防止关闭模态框
            }
        }
    });
}

// 更新书签
function updateBookmark(bookmark, newTitle, newUrl, newFolder) {
    try {
        // 添加协议如果缺少
        if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
            newUrl = 'https://' + newUrl;
        }
        
        const urlObj = new URL(newUrl);
        const domain = urlObj.hostname;
        
        // 查找并更新书签
        const index = allBookmarks.findIndex(b => 
            b.url === bookmark.url && 
            b.title === bookmark.title && 
            b.folder === bookmark.folder
        );
        
        if (index !== -1) {
            // 更新书签属性
            allBookmarks[index].title = newTitle;
            allBookmarks[index].url = newUrl;
            allBookmarks[index].domain = domain;
            
            // 如果分类改变，更新分类
            if (newFolder !== bookmark.folder) {
                allBookmarks[index].folder = newFolder;
            }
            
            // 更新网站图标
            if (newUrl !== bookmark.url) {
                allBookmarks[index].favicon = `https://www.google.com/s2/favicons?domain=${domain}`;
            }
            
            // 更新存储和UI
            saveBookmarks();
            renderBookmarks(allBookmarks);
            
            // 如果分类改变，更新侧边栏
            if (newFolder !== bookmark.folder) {
                updateFoldersList();
            }
            
            showNotification('书签已更新');
            
            // 如果分类改变，滚动到新分类
            if (newFolder !== bookmark.folder) {
                scrollToFolder(newFolder);
            }
        } else {
            showNotification('找不到要更新的书签', 'error');
        }
    } catch (error) {
        showNotification('无效的URL格式', 'error');
        console.error('更新书签出错:', error);
    }
}

// 显示删除书签确认对话框
function showDeleteBookmarkConfirmation(bookmark) {
    showModal({
        title: '删除书签',
        content: `
            <p>您确定要删除书签 "${bookmark.title}" 吗？</p>
            <p class="text-danger">此操作无法撤销！</p>
        `,
        confirmText: '删除',
        confirmClass: 'danger',
        onConfirm: () => {
            deleteBookmark(bookmark);
        }
    });
}

// 删除书签
function deleteBookmark(bookmark) {
    // 找到并删除书签
    const index = allBookmarks.findIndex(b => 
        b.url === bookmark.url && 
        b.title === bookmark.title && 
        b.folder === bookmark.folder
    );
    
    if (index !== -1) {
        allBookmarks.splice(index, 1);
        
        // 更新存储和UI
        saveBookmarks();
        renderBookmarks(allBookmarks);
        updateFoldersList();
        updateStats(allBookmarks);
        
        showNotification('书签已删除');
    } else {
        showNotification('找不到要删除的书签', 'error');
    }
}

// 显示移动书签模态框
function showMoveBookmarkModal(bookmark) {
    // 获取所有分类作为选项
    const folders = getAllFolders();
    const folderOptions = folders.map(folder => 
        `<option value="${folder}" ${folder === bookmark.folder ? 'selected' : ''}>${folder}</option>`
    ).join('');
    
    showModal({
        title: '移动书签到分类',
        content: `
            <p>将 "${bookmark.title}" 移动到：</p>
            <div class="form-group">
                <select id="move-bookmark-folder" class="modal-select">
                    ${folderOptions}
                </select>
            </div>
        `,
        onConfirm: () => {
            const folder = document.getElementById('move-bookmark-folder').value;
            if (folder !== bookmark.folder) {
                moveBookmark(bookmark, folder);
            }
        }
    });
}

// 移动书签到新分类
function moveBookmark(bookmark, newFolder) {
    // 找到并更新书签
    const index = allBookmarks.findIndex(b => 
        b.url === bookmark.url && 
        b.title === bookmark.title && 
        b.folder === bookmark.folder
    );
    
    if (index !== -1) {
        // 更新分类
        allBookmarks[index].folder = newFolder;
        
        // 更新存储和UI
        saveBookmarks();
        renderBookmarks(allBookmarks);
        updateFoldersList();
        
        showNotification(`已将书签移动到 "${newFolder}"`);
        scrollToFolder(newFolder);
    } else {
        showNotification('找不到要移动的书签', 'error');
    }
}

// 获取所有唯一分类
function getAllFolders() {
    const folderSet = new Set();
    
    // 添加所有现有分类
    allBookmarks.forEach(bookmark => {
        folderSet.add(bookmark.folder);
    });
    
    // 如果没有分类，添加"未分类"
    if (folderSet.size === 0) {
        folderSet.add('未分类');
    }
    
    return Array.from(folderSet).sort();
}

// 显示模态框
function showModal({ title, content, confirmText = '确定', cancelText = '取消', confirmClass = 'primary', onConfirm, onCancel }) {
    // 移除任何已存在的模态框
    const existingModal = document.querySelector('.modal-container');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 创建模态框元素
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-container';
    
    // 设置模态框内容
    modalContainer.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title">${title}</h3>
                <button class="modal-close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
            <div class="modal-footer">
                <button class="modal-btn modal-cancel-btn">${cancelText}</button>
                <button class="modal-btn modal-confirm-btn ${confirmClass}">${confirmText}</button>
            </div>
        </div>
    `;
    
    // 添加到页面
    document.body.appendChild(modalContainer);
    
    // 获取按钮和覆盖层
    const closeBtn = modalContainer.querySelector('.modal-close-btn');
    const confirmBtn = modalContainer.querySelector('.modal-confirm-btn');
    const cancelBtn = modalContainer.querySelector('.modal-cancel-btn');
    const overlay = modalContainer.querySelector('.modal-overlay');
    
    // 焦点自动放在第一个输入框上
    setTimeout(() => {
        const firstInput = modalContainer.querySelector('input, select, textarea');
        if (firstInput) {
            firstInput.focus();
        }
    }, 100);
    
    // 设置关闭事件
    function closeModal() {
        modalContainer.classList.add('closing');
        setTimeout(() => {
            modalContainer.remove();
        }, 300);
    }
    
    // 设置事件监听器
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', () => {
        if (onCancel) onCancel();
        closeModal();
    });
    overlay.addEventListener('click', closeModal);
    
    confirmBtn.addEventListener('click', () => {
        // 如果onConfirm返回false，不关闭模态框
        const result = onConfirm ? onConfirm() : true;
        if (result !== false) {
            closeModal();
        }
    });
    
    // 键盘事件
    modalContainer.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        } else if (e.key === 'Enter') {
            // 确保不是在textarea中按Enter
            if (e.target.tagName !== 'TEXTAREA') {
                const result = onConfirm ? onConfirm() : true;
                if (result !== false) {
                    closeModal();
                }
            }
        }
    });
    
    // 动画效果
    setTimeout(() => {
        modalContainer.classList.add('show');
    }, 10);
}