// 数据结构
let schoolData = {
    classes: []
};
let currentClassId = null;

// 从localStorage加载数据
function loadData() {
    const savedData = localStorage.getItem('studentPointsData');
    if (savedData) {
        try {
            schoolData = JSON.parse(savedData);

            // 如果数据格式是旧的，转换为新格式
            if (!schoolData.classes) {
                schoolData = convertOldData(schoolData);
            }

            // 确保至少有一个班级
            if (schoolData.classes.length === 0) {
                createDefaultClass();
            }
        } catch (e) {
            console.error('加载数据失败:', e);
            createDefaultClass();
        }
    } else {
        createDefaultClass();
    }

    // 设置当前班级为第一个班级
    if (schoolData.classes.length > 0) {
        currentClassId = schoolData.classes[0].id;
    }
}

// 转换旧数据格式到新格式
function convertOldData(oldData) {
    const newData = { classes: [] };

    // 遍历旧的班级数据
    for (const [classId, students] of Object.entries(oldData)) {
        if (Array.isArray(students)) {
            // 生成班级名称
            const className = getClassNameFromId(classId) || `班级${newData.classes.length + 1}`;

            // 添加到新数据结构
            newData.classes.push({
                id: classId,
                name: className,
                students: students
            });
        }
    }

    return newData;
}

// 从旧班级ID获取班级名称
function getClassNameFromId(classId) {
    const classNames = {
        'class1': '三年级9班',
        'class2': '三年级10班',
        'class3': '三年级11班',
        'class4': '三年级12班',
        'class5': '四年级6班',
        'class6': '四年级7班',
        'class7': '四年级8班',
        'class8': '四年级9班',
        'class9': '四年级10班',
        'class10': '四年级11班',
        'class11': '四年级12班'
    };

    return classNames[classId] || null;
}

// 创建默认班级
function createDefaultClass() {
    const defaultClass = {
        id: generateId(),
        name: '默认班级',
        students: []
    };

    schoolData.classes.push(defaultClass);
    currentClassId = defaultClass.id;
}

// 生成唯一ID
function generateId() {
    return 'class_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 保存数据到localStorage
function saveData() {
    localStorage.setItem('studentPointsData', JSON.stringify(schoolData));
}

// 获取当前班级
function getCurrentClass() {
    return schoolData.classes.find(cls => cls.id === currentClassId);
}

// 当前选中的学生ID
let selectedStudentId = null;
let currentPointsAction = null;
let selectedReason = null;
let selectedStudents = new Set();

// 随机点名相关变量
let randomInterval = null;
let isRandomPicking = false;

// 计时器相关变量
let timerInterval = null;
let timerSeconds = 0;
let isTimerRunning = false;
let isTimerPaused = false;

// 小组颜色
const groupColors = {
    1: '#FF9E80',
    2: '#FFD166',
    3: '#06D6A8',
    4: '#118AB2',
    5: '#9A77CF',
    6: '#FF6B8B'
};

// 加分原因
const addReasons = [
    "课堂表现优秀",
    "完成任务出色",
    "积极回答问题",
    "帮助同学"
];

// 减分原因
const subtractReasons = [
    "违反课堂纪律",
    "未完成任何任务",
    "其他原因"
];

// 全班减分原因
const classSubtractReasons = [
    "全班课堂纪律较差",
    "其他原因"
];

// DOM元素
const studentTableBody = document.getElementById('studentTableBody');
const individualRankingList = document.getElementById('individualRankingList');
const groupRankingList = document.getElementById('groupRankingList');
const individualRankingTab = document.getElementById('individualRankingTab');
const groupRankingTab = document.getElementById('groupRankingTab');
const studentSelect = document.getElementById('studentSelect');
const reasonButtons = document.getElementById('reasonButtons');
const pointsModal = document.getElementById('pointsModal');
const studentModal = document.getElementById('studentModal');
const importModal = document.getElementById('importModal');
const randomPickModal = document.getElementById('randomPickModal');
const currentClassLabel = document.getElementById('currentClassLabel');
const studentCount = document.getElementById('studentCount');
const searchInput = document.getElementById('searchInput');
const notification = document.getElementById('notification');
const notificationText = document.getElementById('notificationText');
const selectAllCheckbox = document.getElementById('selectAllCheckbox');
const bulkActions = document.getElementById('bulkActions');
const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
const randomStudentDisplay = document.getElementById('randomStudentDisplay');
const startRandomBtn = document.getElementById('startRandomBtn');
const stopRandomBtn = document.getElementById('stopRandomBtn');
const timerDisplay = document.getElementById('timerDisplay');
const timerMinutes = document.getElementById('timerMinutes');
const timerSecondsInput = document.getElementById('timerSeconds');
const startTimerBtn = document.getElementById('startTimerBtn');
const pauseTimerBtn = document.getElementById('pauseTimerBtn');
const resetTimerBtn = document.getElementById('resetTimerBtn');
const exportBackupBtn = document.getElementById('exportBackupBtn');
const backupFileInput = document.getElementById('backupFileInput');
const backupUploadArea = document.getElementById('backupUploadArea');
const backupPreview = document.getElementById('backupPreview');
const confirmRestore = document.getElementById('confirmRestore');
const classSelect = document.getElementById('classSelect');
const manageClassesBtn = document.getElementById('manageClassesBtn');
const classManager = document.getElementById('classManager');
const classList = document.getElementById('classList');
const newClassName = document.getElementById('newClassName');
const addClassBtn = document.getElementById('addClassBtn');
const closeClassManager = document.getElementById('closeClassManager');
const closeClassManagerBtn = document.getElementById('closeClassManagerBtn');

// 初始化
function init() {
    // 加载数据
    loadData();

    // 渲染界面
    renderClassSelect();
    renderStudentTable();
    renderIndividualRankingList();
    renderGroupRankingList();
    updateStudentCount();
    updateCurrentClassLabel();
    updateGroupingInfo(); // 更新分组信息显示
    // 加载数据
    loadData();

    // 加载分组数据 - 确保在渲染前加载
    loadGroupingData();


    // 事件监听
    classSelect.addEventListener('change', function () {
        currentClassId = this.value;
        updateCurrentClassLabel();
        renderStudentTable();
        renderIndividualRankingList();
        renderGroupRankingList();
        updateStudentCount();
    });

    // 添加小组划分相关事件监听
    document.getElementById('groupingBtn').addEventListener('click', function () {
        if (!currentClassId) {
            showNotification('请先选择班级', 'error');
            return;
        }
        openGroupingModal();
    });

    document.getElementById('closeGroupingModal').addEventListener('click', function () {
        document.getElementById('groupingModal').style.display = 'none';
    });

    document.getElementById('cancelGrouping').addEventListener('click', function () {
        document.getElementById('groupingModal').style.display = 'none';
    });

    document.getElementById('saveGrouping').addEventListener('click', function () {
        saveGrouping();
    });

    // 加载分组数据
    loadGroupingData();
    updateGroupingInfo();

    // 排名选项卡切换
    individualRankingTab.addEventListener('click', function () {
        individualRankingTab.classList.add('active');
        groupRankingTab.classList.remove('active');
        individualRankingList.style.display = 'block';
        groupRankingList.style.display = 'none';
    });

    groupRankingTab.addEventListener('click', function () {
        groupRankingTab.classList.add('active');
        individualRankingTab.classList.remove('active');
        groupRankingList.style.display = 'block';
        individualRankingList.style.display = 'none';


        // 更新所有班级的小组排名
        renderGroupRankingList();

        // 更新分组信息显示
        updateGroupingInfo();
    });

    document.getElementById('addPointsBtn').addEventListener('click', function () {
        if (!currentClassId) {
            showNotification('请先选择班级', 'error');
            return;
        }
        openPointsModal('add');
    });

    document.getElementById('subtractPointsBtn').addEventListener('click', function () {
        if (!currentClassId) {
            showNotification('请先选择班级', 'error');
            return;
        }
        openPointsModal('subtract');
    });

    document.getElementById('classSubtractBtn').addEventListener('click', function () {
        if (!currentClassId) {
            showNotification('请先选择班级', 'error');
            return;
        }
        openPointsModal('classSubtract');
    });

    document.getElementById('randomPickBtn').addEventListener('click', function () {
        if (!currentClassId) {
            showNotification('请先选择班级', 'error');
            return;
        }
        openRandomPickModal();
    });

    document.getElementById('timerBtn').addEventListener('click', function () {
        openTimerModal();
    });

    document.getElementById('restoreBtn').addEventListener('click', function () {
        openBackupModal();
    });

    document.getElementById('closePointsModal').addEventListener('click', function () {
        pointsModal.style.display = 'none';
    });

    document.getElementById('confirmPoints').addEventListener('click', function () {
        if (!selectedReason) {
            showNotification('请选择原因', 'error');
            return;
        }

        if (currentPointsAction === 'classSubtract') {
            // 全班减分
            const currentClass = getCurrentClass();
            currentClass.students.forEach(student => {
                student.points -= 1;
                student.coins -= 1;
            });
            showNotification('全班减分成功', 'success');
        } else {
            const studentId = parseInt(studentSelect.value);
            if (currentPointsAction === 'add') {
                addPoints(studentId, 1, selectedReason);
            } else {
                subtractPoints(studentId, 1, selectedReason);
            }
        }

        pointsModal.style.display = 'none';
        saveData();
        renderStudentTable();
        renderIndividualRankingList();
        renderGroupRankingList();
    });

    document.getElementById('cancelPoints').addEventListener('click', function () {
        pointsModal.style.display = 'none';
    });

    document.getElementById('closeStudentModal').addEventListener('click', function () {
        studentModal.style.display = 'none';
    });

    document.getElementById('saveStudent').addEventListener('click', function () {
        const name = document.getElementById('studentName').value;
        if (!name) {
            showNotification('请输入学生姓名', 'error');
            return;
        }

        const currentClass = getCurrentClass();

        if (selectedStudentId) {
            // 编辑现有学生
            const student = currentClass.students.find(s => s.id === selectedStudentId);
            student.name = name;
            showNotification('学生信息已保存', 'success');
        } else {
            // 添加新学生
            const newId = currentClass.students.length > 0 ?
                Math.max(...currentClass.students.map(s => s.id)) + 1 : 1;
            currentClass.students.push({
                id: newId,
                num: (currentClass.students.length + 1).toString(),
                name: name,
                points: 0,
                coins: 0
            });
            showNotification('学生添加成功', 'success');
        }

        studentModal.style.display = 'none';
        saveData();
        renderStudentTable();
        renderIndividualRankingList();
        renderGroupRankingList();
        updateStudentCount();
    });

    document.getElementById('deleteStudent').addEventListener('click', function () {
        if (confirm('确定要删除这个学生吗？')) {
            const currentClass = getCurrentClass();
            currentClass.students = currentClass.students.filter(s => s.id !== selectedStudentId);
            studentModal.style.display = 'none';
            showNotification('学生已删除', 'success');
            saveData();
            renderStudentTable();
            renderIndividualRankingList();
            renderGroupRankingList();
            updateStudentCount();
        }
    });

    document.getElementById('cancelStudent').addEventListener('click', function () {
        studentModal.style.display = 'none';
    });

    document.getElementById('importBtn').addEventListener('click', function () {
        if (!currentClassId) {
            showNotification('请先选择班级', 'error');
            return;
        }
        importModal.style.display = 'flex';
    });

    document.getElementById('closeImportModal').addEventListener('click', function () {
        importModal.style.display = 'none';
        document.getElementById('importPreview').innerHTML = '';
        document.getElementById('confirmImport').disabled = true;
    });

    document.getElementById('exportBtn').addEventListener('click', function () {
        if (!currentClassId) {
            showNotification('请先选择班级', 'error');
            return;
        }
        exportToExcel();
    });

    document.getElementById('deleteClassBtn').addEventListener('click', function () {
        if (!currentClassId) {
            showNotification('请先选择班级', 'error');
            return;
        }

        if (confirm('确定要删除当前班级的所有学生吗？此操作不可恢复！')) {
            const currentClass = getCurrentClass();
            currentClass.students = [];
            showNotification('全班学生已删除', 'success');
            saveData();
            renderStudentTable();
            renderIndividualRankingList();
            renderGroupRankingList();
            updateStudentCount();
        }
    });

    document.getElementById('resetBtn').addEventListener('click', function () {
        if (!currentClassId) {
            showNotification('请先选择班级', 'error');
            return;
        }

        if (confirm('确定要清零当前班级的所有数据吗？此操作不可恢复！')) {
            const currentClass = getCurrentClass();
            currentClass.students.forEach(student => {
                student.points = 0;
                student.coins = 0;
            });
            showNotification('数据已清零', 'success');
            saveData();
            renderStudentTable();
            renderIndividualRankingList();
            renderGroupRankingList();
        }
    });

    document.getElementById('cancelImport').addEventListener('click', function () {
        importModal.style.display = 'none';
        document.getElementById('importPreview').innerHTML = '';
        document.getElementById('confirmImport').disabled = true;
    });

    document.getElementById('confirmImport').addEventListener('click', function () {
        importStudents();
    });
    document.getElementById('studentMatrixBtn').addEventListener('click', function () {
        if (!currentClassId) {
            showNotification('请先选择班级', 'error');
            return;
        }
        openStudentMatrixModal();
    });

    document.getElementById('closeStudentMatrixModal').addEventListener('click', function () {
        document.getElementById('studentMatrixModal').style.display = 'none';
    });

    document.getElementById('closeStudentMatrixBtn').addEventListener('click', function () {
        document.getElementById('studentMatrixModal').style.display = 'none';
    });

    searchInput.addEventListener('input', function () {
        renderStudentTable();
    });

    // 文件上传处理
    const fileInput = document.getElementById('fileInput');
    const fileUploadArea = document.getElementById('fileUploadArea');

    fileUploadArea.addEventListener('click', function () {
        fileInput.click();
    });

    fileUploadArea.addEventListener('dragover', function (e) {
        e.preventDefault();
        this.style.borderColor = 'var(--primary)';
        this.style.background = '#f0f3ff';
    });

    fileUploadArea.addEventListener('dragleave', function () {
        this.style.borderColor = '#ddd';
        this.style.background = 'transparent';
    });

    fileUploadArea.addEventListener('drop', function (e) {
        e.preventDefault();
        this.style.borderColor = '#ddd';
        this.style.background = 'transparent';

        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleFile(fileInput.files[0]);
        }
    });

    fileInput.addEventListener('change', function () {
        if (this.files.length) {
            handleFile(this.files[0]);
        }
    });


    // 兑换金币按钮
    document.querySelectorAll('.exchange-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const amount = parseInt(this.getAttribute('data-amount'));
            if (selectedStudentId) {
                const currentClass = getCurrentClass();
                const student = currentClass.students.find(s => s.id === selectedStudentId);
                if (student.coins >= amount) {
                    student.coins -= amount;
                    showNotification(`成功兑换${amount}金币`, 'success');
                    saveData();
                    renderStudentTable();
                    renderIndividualRankingList();
                    renderGroupRankingList();
                    document.getElementById('modalCoins').textContent = student.coins;
                } else {
                    showNotification('金币不足，无法兑换', 'error');
                }
            }
        });
    });


    // 批量选择功能
    selectAllCheckbox.addEventListener('change', function () {
        const checkboxes = document.querySelectorAll('.student-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
            const studentId = parseInt(checkbox.dataset.id);
            if (this.checked) {
                selectedStudents.add(studentId);
            } else {
                selectedStudents.delete(studentId);
            }
        });
        toggleBulkActions();
    });

    // 删除选中学生
    deleteSelectedBtn.addEventListener('click', function () {
        if (selectedStudents.size === 0) {
            showNotification('请先选择要删除的学生', 'error');
            return;
        }

        if (confirm(`确定要删除选中的 ${selectedStudents.size} 名学生吗？`)) {
            const currentClass = getCurrentClass();
            currentClass.students = currentClass.students.filter(
                student => !selectedStudents.has(student.id)
            );
            selectedStudents.clear();
            showNotification(`已删除 ${selectedStudents.size} 名学生`, 'success');
            saveData();
            renderStudentTable();
            renderIndividualRankingList();
            renderGroupRankingList();
            updateStudentCount();
            toggleBulkActions();
        }
    });

    // 随机点名功能
    startRandomBtn.addEventListener('click', function () {
        startRandomPick();
    });

    stopRandomBtn.addEventListener('click', function () {
        stopRandomPick();
    });

    document.getElementById('closeRandomModal').addEventListener('click', function () {
        stopRandomPick();
        randomPickModal.style.display = 'none';
    });

    document.getElementById('closeRandomBtn').addEventListener('click', function () {
        stopRandomPick();
        randomPickModal.style.display = 'none';
    });

    // 计时器功能
    startTimerBtn.addEventListener('click', function () {
        startTimer();
    });

    pauseTimerBtn.addEventListener('click', function () {
        pauseTimer();
    });

    resetTimerBtn.addEventListener('click', function () {
        resetTimer();
    });

    document.getElementById('closeTimerModal').addEventListener('click', function () {
        pauseTimer();
        timerModal.style.display = 'none';
    });

    document.getElementById('closeTimerBtn').addEventListener('click', function () {
        pauseTimer();
        timerModal.style.display = 'none';
    });

    // 计时器预设按钮
    document.querySelectorAll('.timer-preset-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const minutes = parseInt(this.getAttribute('data-minutes'));
            const seconds = parseInt(this.getAttribute('data-seconds'));
            timerMinutes.value = minutes;
            timerSecondsInput.value = seconds;
            updateTimerDisplay(minutes * 60 + seconds);
        });
    });

    // 计时器输入验证
    timerMinutes.addEventListener('change', function () {
        if (this.value < 0) this.value = 0;
        if (this.value > 60) this.value = 60;
        updateTimerDisplay(parseInt(this.value) * 60 + parseInt(timerSecondsInput.value));
    });

    timerSecondsInput.addEventListener('change', function () {
        if (this.value < 0) this.value = 0;
        if (this.value > 59) this.value = 59;
        updateTimerDisplay(parseInt(timerMinutes.value) * 60 + parseInt(this.value));
    });

    // 数据备份与恢复功能
    exportBackupBtn.addEventListener('click', function () {
        exportBackup();
    });

    backupUploadArea.addEventListener('click', function () {
        backupFileInput.click();
    });

    backupUploadArea.addEventListener('dragover', function (e) {
        e.preventDefault();
        this.style.borderColor = 'var(--primary)';
        this.style.background = '#f0f3ff';
    });

    backupUploadArea.addEventListener('dragleave', function () {
        this.style.borderColor = '#ddd';
        this.style.background = 'transparent';
    });

    backupUploadArea.addEventListener('drop', function (e) {
        e.preventDefault();
        this.style.borderColor = '#ddd';
        this.style.background = 'transparent';

        if (e.dataTransfer.files.length) {
            backupFileInput.files = e.dataTransfer.files;
            handleBackupFile(backupFileInput.files[0]);
        }
    });

    backupFileInput.addEventListener('change', function () {
        if (this.files.length) {
            handleBackupFile(this.files[0]);
        }
    });

    confirmRestore.addEventListener('click', function () {
        restoreBackup();
    });

    document.getElementById('closeBackupModal').addEventListener('click', function () {
        backupModal.style.display = 'none';
        backupPreview.innerHTML = '';
        confirmRestore.disabled = true;
    });

    document.getElementById('cancelBackup').addEventListener('click', function () {
        backupModal.style.display = 'none';
        backupPreview.innerHTML = '';
        confirmRestore.disabled = true;
    });

    // 班级管理功能
    manageClassesBtn.addEventListener('click', function () {
        openClassManager();
    });

    addClassBtn.addEventListener('click', function () {
        addClass();
    });

    closeClassManager.addEventListener('click', function () {
        classManager.style.display = 'none';
    });

    closeClassManagerBtn.addEventListener('click', function () {
        classManager.style.display = 'none';
    });
}

// 渲染班级选择下拉框
function renderClassSelect() {
    classSelect.innerHTML = '';

    schoolData.classes.forEach(cls => {
        const option = document.createElement('option');
        option.value = cls.id;
        option.textContent = cls.name;
        classSelect.appendChild(option);
    });

    // 设置当前选中的班级
    if (currentClassId) {
        classSelect.value = currentClassId;
    }
}

// 更新当前班级标签
function updateCurrentClassLabel() {
    const currentClass = getCurrentClass();
    currentClassLabel.textContent = currentClass ? currentClass.name : '未选择班级';
}

// 打开班级管理模态框
function openClassManager() {
    renderClassList();
    classManager.style.display = 'flex';
}

// 渲染班级列表
function renderClassList() {
    classList.innerHTML = '';

    schoolData.classes.forEach(cls => {
        const classItem = document.createElement('div');
        classItem.className = 'class-item';

        classItem.innerHTML = `
                    <div class="class-name">${cls.name}</div>
                    <div class="class-actions">
                        <button class="class-btn edit-class-btn" data-id="${cls.id}">编辑</button>
                        <button class="class-btn delete-class-btn" data-id="${cls.id}">删除</button>
                    </div>
                `;

        // 编辑班级按钮事件
        const editBtn = classItem.querySelector('.edit-class-btn');
        editBtn.addEventListener('click', function () {
            editClass(cls.id);
        });

        // 删除班级按钮事件
        const deleteBtn = classItem.querySelector('.delete-class-btn');
        deleteBtn.addEventListener('click', function () {
            deleteClass(cls.id);
        });

        classList.appendChild(classItem);
    });
}

// 添加班级
function addClass() {
    const className = newClassName.value.trim();
    if (!className) {
        showNotification('请输入班级名称', 'error');
        return;
    }

    const newClass = {
        id: generateId(),
        name: className,
        students: []
    };

    schoolData.classes.push(newClass);
    saveData();

    // 更新界面
    renderClassSelect();
    renderClassList();

    // 清空输入框
    newClassName.value = '';

    showNotification('班级添加成功', 'success');
}

// 编辑班级
function editClass(classId) {
    const cls = schoolData.classes.find(c => c.id === classId);
    if (!cls) return;

    const newName = prompt('请输入新的班级名称', cls.name);
    if (newName && newName.trim()) {
        cls.name = newName.trim();
        saveData();

        // 更新界面
        renderClassSelect();
        renderClassList();

        // 如果当前编辑的是当前班级，更新标签
        if (currentClassId === classId) {
            updateCurrentClassLabel();
        }

        showNotification('班级名称已更新', 'success');
    }
}

// 删除班级
function deleteClass(classId) {
    if (schoolData.classes.length <= 1) {
        showNotification('至少需要保留一个班级', 'error');
        return;
    }

    const cls = schoolData.classes.find(c => c.id === classId);
    if (!cls) return;

    if (confirm(`确定要删除班级 "${cls.name}" 吗？此操作不可恢复！`)) {
        // 从数组中移除班级
        schoolData.classes = schoolData.classes.filter(c => c.id !== classId);

        // 如果删除的是当前班级，切换到第一个班级
        if (currentClassId === classId) {
            currentClassId = schoolData.classes[0].id;
        }

        saveData();

        // 更新界面
        renderClassSelect();
        renderClassList();
        renderStudentTable();
        renderIndividualRankingList();
        renderGroupRankingList();
        updateStudentCount();
        updateCurrentClassLabel();

        showNotification('班级已删除', 'success');
    }
}

// 渲染学生表格
function renderStudentTable() {
    studentTableBody.innerHTML = '';
    selectedStudents.clear();
    selectAllCheckbox.checked = false;
    toggleBulkActions();

    const currentClass = getCurrentClass();
    if (!currentClass) return;

    const searchTerm = searchInput.value.toLowerCase();
    const filteredStudents = currentClass.students.filter(student =>
        student.name.toLowerCase().includes(searchTerm)
    );

    // 按积分排序
    const sortedStudents = [...filteredStudents];

    sortedStudents.forEach((student, index) => {
        const row = document.createElement('tr');

        row.innerHTML = `
    <td class="checkbox-cell">
        <input type="checkbox" class="student-checkbox" data-id="${student.id}">
    </td>
    <td>${student.num}</td>
    <td>${student.name}</td>
    <td class="level" title="${getRankByPoints(student.points)}">${getRankIcon(student.points)}</td>
    <td class="points">${student.points}</td>
    <td class="coins">${student.coins}</td>
    <td class="action-buttons">
        <button class="action-btn add-btn" data-id="${student.id}">+1</button>
        <button class="action-btn subtract-btn" data-id="${student.id}">-1</button>
    </td>
`;

        row.addEventListener('click', (e) => {
            // 防止点击复选框时也触发编辑
            if (e.target.type !== 'checkbox') {
                openStudentModal(student.id);
            }
        });

        // 为加减分按钮添加事件
        const addBtn = row.querySelector('.add-btn');
        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            addPoints(student.id, 1, "快速加分");
        });

        const subtractBtn = row.querySelector('.subtract-btn');
        subtractBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            subtractPoints(student.id, 1, "快速减分");
        });

        // 复选框事件
        const checkbox = row.querySelector('.student-checkbox');
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
            const studentId = parseInt(checkbox.dataset.id);
            if (checkbox.checked) {
                selectedStudents.add(studentId);
            } else {
                selectedStudents.delete(studentId);
            }
            toggleBulkActions();
            updateSelectAllCheckbox();
        });

        studentTableBody.appendChild(row);
    });
}

// 更新全选复选框状态
function updateSelectAllCheckbox() {
    const checkboxes = document.querySelectorAll('.student-checkbox');
    if (checkboxes.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
        return;
    }

    const checkedCount = document.querySelectorAll('.student-checkbox:checked').length;
    selectAllCheckbox.checked = checkedCount === checkboxes.length;
    selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
}

// 显示/隐藏批量操作按钮
function toggleBulkActions() {
    bulkActions.style.display = selectedStudents.size > 0 ? 'flex' : 'none';
}

// 渲染个人排名列表
function renderIndividualRankingList() {
    individualRankingList.innerHTML = '';

    const currentClass = getCurrentClass();
    if (!currentClass) return;

    // 按积分排序
    const sortedStudents = [...currentClass.students].sort((a, b) => b.points - a.points);

    // 取前20名
    const top20 = sortedStudents.slice(0, 20);

    top20.forEach((student, index) => {
        const item = document.createElement('div');
        item.className = 'ranking-item';

        item.innerHTML = `
                    <div class="rank ${index < 3 ? 'rank-' + (index + 1) : ''}">${index + 1}</div>
                    <div class="student-info">
                        <div class="student-name">${student.name}</div>
                        <div class="student-points">积分: ${student.points} | 金币: ${student.coins}</div>
                    </div>
                `;

        individualRankingList.appendChild(item);
    });
}

// 渲染小组排名列表
function renderGroupRankingList() {
    groupRankingList.innerHTML = '';

    const currentClass = getCurrentClass();
    if (!currentClass) return;

    // 计算小组排名
    const groupData = calculateGroupRanking();

    // 按总积分排序
    const sortedGroups = Object.values(groupData).sort((a, b) => b.totalPoints - a.totalPoints);

    sortedGroups.forEach((group, index) => {
        const item = document.createElement('div');
        item.className = 'ranking-item';
        item.style.borderLeft = `4px solid ${groupColors[group.groupNumber] || '#ddd'}`;

        item.innerHTML = `
                    <div class="rank ${index < 3 ? 'rank-' + (index + 1) : ''}">${index + 1}</div>
                    <div class="group-info">
                        <div class="group-name">第${group.groupNumber}小组</div>
                        <div class="group-points">总积分: ${group.totalPoints} | 平均积分: ${group.averagePoints.toFixed(1)}</div>
                        <div class="group-student-count">成员: ${group.students.length}人</div>
                    </div>
                `;

        groupRankingList.appendChild(item);
    });
}

// 计算小组排名
function calculateGroupRanking() {
    const currentClass = getCurrentClass();
    if (!currentClass) return {};

    const groupData = {};

    currentClass.students.forEach(student => {
        // 根据学号计算小组编号
        const studentNum = parseInt(student.num);
        const groupNumber = Math.ceil(studentNum / 10);

        if (!groupData[groupNumber]) {
            groupData[groupNumber] = {
                groupNumber: groupNumber,
                students: [],
                totalPoints: 0,
                averagePoints: 0
            };
        }

        groupData[groupNumber].students.push(student);
        groupData[groupNumber].totalPoints += student.points;
    });

    // 计算平均积分
    Object.values(groupData).forEach(group => {
        group.averagePoints = group.students.length > 0 ? group.totalPoints / group.students.length : 0;
    });

    return groupData;
}

// 更新学生计数
function updateStudentCount() {
    const currentClass = getCurrentClass();
    studentCount.textContent = currentClass ? currentClass.students.length : 0;
}

// 打开积分操作模态框
function openPointsModal(type) {
    currentPointsAction = type;
    selectedReason = null;
    const modalTitle = document.getElementById('pointsModalTitle');
    const studentSelectGroup = document.getElementById('studentSelectGroup');

    // 填充学生选择下拉框
    studentSelect.innerHTML = '';
    const currentClass = getCurrentClass();
    currentClass.students.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = student.name;
        studentSelect.appendChild(option);
    });

    // 根据类型设置标题和原因按钮
    reasonButtons.innerHTML = '';
    let reasons = [];

    if (type === 'add') {
        modalTitle.textContent = '个人加分';
        reasons = addReasons;
        studentSelectGroup.style.display = 'block';
    } else if (type === 'subtract') {
        modalTitle.textContent = '个人减分';
        reasons = subtractReasons;
        studentSelectGroup.style.display = 'block';
    } else if (type === 'classSubtract') {
        modalTitle.textContent = '全班减分';
        reasons = classSubtractReasons;
        studentSelectGroup.style.display = 'none';
    }

    reasons.forEach(reason => {
        const button = document.createElement('button');
        button.className = 'reason-btn';
        button.textContent = reason;
        button.addEventListener('click', function () {
            // 移除之前选中的样式
            document.querySelectorAll('.reason-btn').forEach(btn => {
                btn.classList.remove('selected');
            });

            // 添加选中样式
            this.classList.add('selected');
            selectedReason = reason;
        });
        reasonButtons.appendChild(button);
    });

    pointsModal.style.display = 'flex';
}

// 打开学生详情模态框
function openStudentModal(studentId) {
    selectedStudentId = studentId;
    const currentClass = getCurrentClass();
    const student = currentClass.students.find(s => s.id === studentId);

    if (student) {
        document.getElementById('studentModalTitle').textContent = '编辑学生';
        document.getElementById('studentName').value = student.name;
        document.getElementById('modalPoints').textContent = student.points;
        document.getElementById('modalCoins').textContent = student.coins;

        studentModal.style.display = 'flex';
    }
}

// 打开随机点名模态框
function openRandomPickModal() {
    const currentClass = getCurrentClass();
    if (currentClass.students.length === 0) {
        showNotification('当前班级没有学生，无法进行随机点名', 'error');
        return;
    }

    randomStudentDisplay.textContent = '点击开始按钮开始随机点名';
    randomStudentDisplay.classList.remove('highlight');
    startRandomBtn.disabled = false;
    stopRandomBtn.disabled = true;

    randomPickModal.style.display = 'flex';
}

// 打开计时器模态框
function openTimerModal() {
    // 如果计时器已经在运行，显示当前状态
    if (isTimerRunning) {
        startTimerBtn.disabled = true;
        pauseTimerBtn.disabled = false;
    } else {
        startTimerBtn.disabled = false;
        pauseTimerBtn.disabled = true;
    }

    timerModal.style.display = 'flex';
}

// 打开数据备份与恢复模态框
function openBackupModal() {
    backupModal.style.display = 'flex';
}

// 开始随机点名
function startRandomPick() {
    if (isRandomPicking) return;

    isRandomPicking = true;
    startRandomBtn.disabled = true;
    stopRandomBtn.disabled = false;
    randomStudentDisplay.classList.remove('highlight');

    const currentClass = getCurrentClass();

    // 快速切换显示不同学生
    randomInterval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * currentClass.students.length);
        randomStudentDisplay.textContent = currentClass.students[randomIndex].name;
    }, 100);
}

// 停止随机点名
function stopRandomPick() {
    if (!isRandomPicking) return;

    clearInterval(randomInterval);
    isRandomPicking = false;
    startRandomBtn.disabled = false;
    stopRandomBtn.disabled = true;

    const currentClass = getCurrentClass();

    // 最终选择一个随机学生
    const randomIndex = Math.floor(Math.random() * currentClass.students.length);
    const selectedStudent = currentClass.students[randomIndex];

    randomStudentDisplay.textContent = selectedStudent.name;
    randomStudentDisplay.classList.add('highlight');

    // 自动高亮显示选中的学生
    highlightSelectedStudent(selectedStudent.id);
}

// 高亮显示选中的学生
function highlightSelectedStudent(studentId) {
    const rows = studentTableBody.querySelectorAll('tr');
    rows.forEach(row => {
        const checkbox = row.querySelector('.student-checkbox');
        if (checkbox && parseInt(checkbox.dataset.id) === studentId) {
            row.style.backgroundColor = '#fff9c4';
            setTimeout(() => {
                row.style.backgroundColor = '';
            }, 3000);
        }
    });
}

// 开始计时器
function startTimer() {
    if (isTimerRunning) return;

    // 如果计时器是暂停状态，则继续计时
    if (!isTimerPaused) {
        // 从输入框获取时间
        const minutes = parseInt(timerMinutes.value) || 0;
        const seconds = parseInt(timerSecondsInput.value) || 0;
        timerSeconds = minutes * 60 + seconds;

        if (timerSeconds <= 0) {
            showNotification('请设置有效的时间', 'error');
            return;
        }
    }

    isTimerRunning = true;
    isTimerPaused = false;
    startTimerBtn.disabled = true;
    pauseTimerBtn.disabled = false;

    timerInterval = setInterval(function () {
        timerSeconds--;
        updateTimerDisplay(timerSeconds);

        if (timerSeconds <= 0) {
            clearInterval(timerInterval);
            isTimerRunning = false;
            startTimerBtn.disabled = false;
            pauseTimerBtn.disabled = true;
            showNotification('时间到！', 'success');
            // 播放提示音
            playTimerSound();
        } else if (timerSeconds <= 10) {
            timerDisplay.classList.add('danger');
        } else if (timerSeconds <= 30) {
            timerDisplay.classList.add('warning');
            timerDisplay.classList.remove('danger');
        } else {
            timerDisplay.classList.remove('warning', 'danger');
        }
    }, 1000);
}

// 暂停计时器
function pauseTimer() {
    if (!isTimerRunning) return;

    clearInterval(timerInterval);
    isTimerRunning = false;
    isTimerPaused = true;
    startTimerBtn.disabled = false;
    pauseTimerBtn.disabled = true;
}

// 重置计时器
function resetTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    isTimerPaused = false;
    startTimerBtn.disabled = false;
    pauseTimerBtn.disabled = true;

    const minutes = parseInt(timerMinutes.value) || 0;
    const seconds = parseInt(timerSecondsInput.value) || 0;
    timerSeconds = minutes * 60 + seconds;
    updateTimerDisplay(timerSeconds);
    timerDisplay.classList.remove('warning', 'danger');
}

// 更新计时器显示
function updateTimerDisplay(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// 播放计时器提示音
function playTimerSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1);
    } catch (e) {
        console.log('音频播放失败:', e);
    }
}

// 导出备份文件
function exportBackup() {
    try {
        // 获取当前所有数据
        const backupData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            data: schoolData
        };

        // 创建JSON文件
        const dataStr = JSON.stringify(backupData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        // 创建下载链接
        const downloadLink = document.createElement('a');
        const date = new Date();
        const fileName = `学生积分系统备份_${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}.json`;

        downloadLink.href = URL.createObjectURL(dataBlob);
        downloadLink.download = fileName;
        downloadLink.click();

        showNotification('备份文件导出成功', 'success');
    } catch (error) {
        showNotification('导出备份文件时出错: ' + error.message, 'error');
        console.error(error);
    }
}

// 处理备份文件
function handleBackupFile(file) {
    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const backupData = JSON.parse(e.target.result);

            // 验证备份文件格式
            if (!backupData.data || !backupData.data.classes) {
                showNotification('备份文件格式不正确', 'error');
                return;
            }

            // 显示预览
            backupPreview.innerHTML = `
                        <h3>备份文件预览</h3>
                        <p><strong>导出日期:</strong> ${new Date(backupData.exportDate).toLocaleString()}</p>
                        <p><strong>版本:</strong> ${backupData.version || '未知'}</p>
                        <p><strong>包含班级:</strong> ${backupData.data.classes.length} 个</p>
                        <table>
                            <thead>
                                <tr>
                                    <th>班级</th>
                                    <th>学生数量</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${backupData.data.classes.map(function (cls) {
                return `
                                        <tr>
                                            <td>${cls.name}</td>
                                            <td>${cls.students.length}</td>
                                        </tr>
                                    `;
            }).join('')}
                            </tbody>
                        </table>
                    `;

            // 启用确认按钮
            confirmRestore.disabled = false;

            // 保存备份数据
            window.backupData = backupData;
        } catch (error) {
            showNotification('处理备份文件时出错: ' + error.message, 'error');
            console.error(error);
        }
    };

    reader.onerror = function () {
        showNotification('读取文件时出错', 'error');
    };

    reader.readAsText(file);
}

// 恢复备份
function restoreBackup() {
    if (!window.backupData) {
        showNotification('没有备份数据可恢复', 'error');
        return;
    }

    if (confirm('确定要恢复备份数据吗？这将覆盖当前所有数据！')) {
        try {
            // 恢复数据
            schoolData = window.backupData.data;

            // 保存到localStorage
            saveData();

            // 重新渲染界面
            renderClassSelect();
            renderStudentTable();
            renderIndividualRankingList();
            renderGroupRankingList();
            updateStudentCount();
            updateCurrentClassLabel();

            // 关闭模态框
            backupModal.style.display = 'none';
            backupPreview.innerHTML = '';
            confirmRestore.disabled = true;

            showNotification('数据恢复成功', 'success');
        } catch (error) {
            showNotification('恢复数据时出错: ' + error.message, 'error');
            console.error(error);
        }
    }
}

// 加分函数
function addPoints(studentId, points, reason) {
    const currentClass = getCurrentClass();
    const student = currentClass.students.find(s => s.id === studentId);
    if (student) {
        student.points += points;
        student.coins += points;
        showNotification(`已为 ${student.name} ${reason}，+${points}积分和金币`, 'success');
        saveData();
        renderStudentTable();
        renderIndividualRankingList();
        renderGroupRankingList();
    }
}

// 减分函数
function subtractPoints(studentId, points, reason) {
    const currentClass = getCurrentClass();
    const student = currentClass.students.find(s => s.id === studentId);
    if (student) {
        student.points -= points;
        student.coins -= points;
        showNotification(`已为 ${student.name} ${reason}，-${points}积分和金币`, 'success');
        saveData();
        renderStudentTable();
        renderIndividualRankingList();
        renderGroupRankingList();
    }
}

// 显示通知
function showNotification(message, type) {
    notificationText.textContent = message;

    if (type === 'error') {
        notification.className = 'notification error show';
    } else {
        notification.className = 'notification show';
    }

    setTimeout(() => {
        notification.className = 'notification';
    }, 3000);
}

// 处理Excel文件
function handleFile(file) {
    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // 获取第一个工作表
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) {
                showNotification('Excel文件中没有数据', 'error');
                return;
            }

            // 显示预览
            const preview = document.getElementById('importPreview');
            preview.innerHTML = `
                        <h3>导入预览 (${jsonData.length} 名学生)</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>学号</th>
                                    <th>姓名</th>
                                    <th>积分</th>
                                    <th>金币</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${jsonData.slice(0, 5).map(row => `
                                    <tr>
                                        <td>${row['学号'] || row['num'] || ''}</td>
                                        <td>${row['姓名'] || row['name'] || ''}</td>
                                        <td>${row['积分'] || row['points'] || 0}</td>
                                        <td>${row['金币'] || row['coins'] || 0}</td>
                                    </tr>
                                `).join('')}
                                ${jsonData.length > 5 ? '<tr><td colspan="3">......</td></tr>' : ''}
                            </tbody>
                        </table>
                    `;

            // 启用确认按钮
            document.getElementById('confirmImport').disabled = false;

            // 保存导入的数据
            window.importData = jsonData;
        } catch (error) {
            showNotification('处理Excel文件时出错: ' + error.message, 'error');
            console.error(error);
        }
    };

    reader.onerror = function () {
        showNotification('读取文件时出错', 'error');
    };

    reader.readAsArrayBuffer(file);
}
// 在班级切换事件中更新分组数据
classSelect.addEventListener('change', function () {
    currentClassId = this.value;
    updateCurrentClassLabel();
    renderStudentTable();
    renderIndividualRankingList();
    renderGroupRankingList(); // 使用全局分组数据渲染小组排名
    updateStudentCount();

    // 更新分组信息显示
    updateGroupingInfo();
});

// 导入学生
function importStudents() {
    if (!window.importData || window.importData.length === 0) {
        showNotification('没有数据可导入', 'error');
        return;
    }

    try {
        const currentClass = getCurrentClass();
        const newStudents = window.importData.map((item, index) => {
            return {
                id: currentClass.students.length > 0 ?
                    Math.max(...currentClass.students.map(s => s.id)) + index + 1 : index + 1,
                num: item['学号'] || item['num'] || (index + 1).toString(),
                name: item['姓名'] || item['name'] || `学生${index + 1}`,
                points: parseInt(item['积分'] || item['points'] || 0),
                coins: parseInt(item['金币'] || item['coins'] || 0)
            };
        });

        currentClass.students = [...currentClass.students, ...newStudents];
        showNotification(`成功导入 ${newStudents.length} 名学生`, 'success');
        saveData();
        renderStudentTable();
        renderIndividualRankingList();
        renderGroupRankingList();
        updateStudentCount();

        // 关闭模态框
        importModal.style.display = 'none';
        document.getElementById('confirmImport').disabled = true;
        document.getElementById('importPreview').innerHTML = '';
    } catch (error) {
        showNotification('导入学生时出错: ' + error.message, 'error');
        console.error(error);
    }
}

// 导出到Excel
function exportToExcel() {
    try {
        const currentClass = getCurrentClass();

        // 准备数据
        const data = currentClass.students.map(student => {
            return {
                '学号': student.num,
                '姓名': student.name,
                '积分': student.points,
                '金币': student.coins
            };
        });

        // 创建工作簿
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, '学生积分数据');

        // 导出文件
        const fileName = `${currentClass.name}-积分数据.xlsx`;
        XLSX.writeFile(workbook, fileName);

        showNotification('数据导出成功', 'success');
    } catch (error) {
        showNotification('导出数据时出错: ' + error.message, 'error');
        console.error(error);
    }
}
function openStudentMatrixModal() {
    const gridContainer = document.getElementById('studentGridContainer');
    gridContainer.innerHTML = '';

    const currentClass = getCurrentClass();
    if (!currentClass) return;

    // 创建50个学生格子，包括空位
    for (let i = 1; i <= 50; i++) {
        const student = currentClass.students.find(s => parseInt(s.num) === i);
        const studentCard = document.createElement('div');
        studentCard.className = 'student-grid-card-full';

        if (student) {
            studentCard.innerHTML = `
                <div class="student-grid-num-full">${student.num}</div>
                <div class="student-grid-name-full">${student.name}</div>
                <div class="student-grid-points-full">${student.points}积分</div>
                <div class="student-grid-coins-full">${student.coins}金币</div>
            `;

            studentCard.addEventListener('click', function () {
                openStudentModal(student.id);
                document.getElementById('studentMatrixModal').style.display = 'none';
            });

            // 根据积分设置背景色
            if (student.points >= 20) {
                studentCard.style.backgroundColor = '#e8f5e9'; // 绿色
            } else if (student.points >= 10) {
                studentCard.style.backgroundColor = '#fff3e0'; // 橙色
            } else if (student.points >= 5) {
                studentCard.style.backgroundColor = '#f3e5f5'; // 紫色
            } else {
                studentCard.style.backgroundColor = '#f5f5f5'; // 灰色
            }
        } else {
            studentCard.innerHTML = `
                <div class="student-grid-num-full">${i}</div>
                <div class="student-grid-name-full">空位</div>
                <div class="student-grid-points-full">-</div>
                <div class="student-grid-coins-full">-</div>
            `;
            studentCard.style.backgroundColor = '#f9f9f9';
            studentCard.style.color = '#999';
            studentCard.style.cursor = 'default';
        }

        gridContainer.appendChild(studentCard);
    }

    document.getElementById('studentMatrixModal').style.display = 'flex';
}
// 段位计算函数
function getRankByPoints(points) {
    if (points >= 120) return '荣耀王者';
    else if (points >= 91) return '最强王者';
    else if (points >= 71) return '至尊星耀';
    else if (points >= 51) return '永恒钻石';
    else if (points >= 31) return '尊贵铂金';
    else if (points >= 21) return '荣耀黄金';
    else if (points >= 11) return '秩序白银';
    else return '倔强青铜';
}

// 获取段位图标HTML
function getRankIcon(points) {
    const rank = getRankByPoints(points);
    const rankIcons = {
        // '倔强青铜': '<i class="fas fa-shield-alt" style="color: #CD7F32;"></i>',
        '倔强青铜': '<img src="./images/iconfont/倔强青铜.svg" alt="倔强青铜" height="30px">',
        '秩序白银': '<img src="./images/iconfont/秩序白银.svg" alt="秩序白银" height="30px">',
        '荣耀黄金': '<img src="./images/iconfont/荣耀黄金.svg" alt="荣耀黄金" height="30px">',
        '尊贵铂金': '<img src="./images/iconfont/尊贵铂金.svg" alt="尊贵铂金" height="30px">',
        '永恒钻石': '<img src="./images/iconfont/永恒钻石.svg" alt="永恒钻石" height="30px">',
        '至尊星耀': '<img src="./images/iconfont/至尊星耀.svg" alt="至尊星耀" height="30px">',
        '最强王者': '<img src="./images/iconfont/最强王者.svg" alt="最强王者" height="30px">',
        '荣耀王者': '<img src="./images/iconfont/荣耀王者.svg" alt="荣耀王者" height="30px">'
    };
    return rankIcons[rank] || '<i class="fas fa-question" style="color: #999;"></i>';
}


// 初始化应用
window.onload = init;