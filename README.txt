# 书签数据文件夹

此文件夹用于存放您的书签HTML文件。

如果您不想每次都手动上传书签文件，可以将Chrome导出的书签HTML文件重命名为 `bookmarks.html` 并放在此文件夹中。

然后，您可以修改 `script.js` 文件，添加自动加载代码（见下文）。

## 添加自动加载书签的代码

在 `script.js` 文件中的 `loadBookmarksFromStorage` 函数后添加以下代码：

```javascript
// 如果本地存储中没有书签，尝试加载预设的书签文件
if (allBookmarks.length === 0) {
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
            console.log('加载预设书签文件失败:', error);
        });
}
```

这样，当网站首次加载时，将自动尝试从 `data/bookmarks.html` 加载您的书签。
