document.addEventListener('DOMContentLoaded', function() {
    const exportBtn = document.getElementById('exportBtn');
    const autoClassifyCheckbox = document.getElementById('autoClassify');
    const statusDiv = document.getElementById('status');

    // 获取所有书签
    async function getAllBookmarks() {
        return new Promise((resolve) => {
            chrome.bookmarks.getTree((bookmarkTreeNodes) => {
                resolve(processBookmarks(bookmarkTreeNodes));
            });
        });
    }

    // 处理书签数据
    function processBookmarks(bookmarkNodes) {
        let bookmarks = [];
        
        function traverse(nodes, path = '') {
            for (let node of nodes) {
                if (node.children) {
                    traverse(node.children, path + (node.title ? node.title + '/' : ''));
                } else if (node.url) {
                    bookmarks.push({
                        title: node.title,
                        url: node.url,
                        path: path.slice(0, -1), // 移除最后的斜杠
                        category: classifyBookmark(node.title, node.url)
                    });
                }
            }
        }
        
        traverse(bookmarkNodes);
        return bookmarks;
    }

    // 自动分类书签
    function classifyBookmark(title, url) {
        const urlLower = url.toLowerCase();
        const titleLower = title.toLowerCase();

        // 基于URL和标题的简单分类逻辑
        if (urlLower.includes('github.com')) return '开发资源';
        if (urlLower.includes('stackoverflow.com')) return '技术问答';
        if (urlLower.includes('youtube.com')) return '视频资源';
        if (urlLower.includes('medium.com')) return '技术博客';
        if (urlLower.includes('docs.')) return '文档';
        if (urlLower.includes('shop') || urlLower.includes('store')) return '购物';
        if (urlLower.includes('news')) return '新闻';
        
        // 可以根据需要添加更多分类规则
        
        return '其他';
    }

    // 导出为Excel
    async function exportToExcel(bookmarks) {
        const ws = XLSX.utils.json_to_sheet(bookmarks);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "书签");
        
        // 生成Excel文件
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        // 下载文件
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        chrome.downloads.download({
            url: url,
            filename: `bookmarks-${timestamp}.xlsx`,
            saveAs: true
        });
    }

    // 导出按钮点击事件
    exportBtn.addEventListener('click', async () => {
        statusDiv.textContent = '正在导出书签...';
        exportBtn.disabled = true;

        try {
            const bookmarks = await getAllBookmarks();
            await exportToExcel(bookmarks);
            statusDiv.textContent = '导出成功！';
        } catch (error) {
            statusDiv.textContent = '导出失败：' + error.message;
            console.error('Export error:', error);
        } finally {
            exportBtn.disabled = false;
        }
    });
});
