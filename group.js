// 小组划分相关变量
let selectedGroup = null;
let groupingData = {};

// 小组颜色
const groupColor = {
    1: '#FF9E80',
    2: '#FFD166',
    3: '#06D6A8',
    4: '#118AB2',
    5: '#9A77CF',
    6: '#FF6B8B',
    7: '#8A4FFF',
    8: '#3CDBD3',
    9: '#FF6B8B',
    10: '#FF9E80'
};

// 在init函数中添加事件监听
document.getElementById('groupingBtn').addEventListener('click', function() {
    if (!currentClassId) {
        showNotification('请先选择班级', 'error');
        return;
    }
    openGroupingModal();
});

document.getElementById('closeGroupingModal').addEventListener('click', function() {
    groupingModal.style.display = 'none';
});

document.getElementById('cancelGrouping').addEventListener('click', function() {
    groupingModal.style.display = 'none';
});

document.getElementById('saveGrouping').addEventListener('click', function() {
    saveGrouping();
});
// 小组划分功能函数
function openGroupingModal() {
    // 加载全局分组数据
    loadGroupingData();
    
    // 渲染小组选择按钮
    renderGroupButtons();
    
    // 渲染学生矩阵
    renderStudentMatrix();
    
    // 更新分组信息显示
    updateGroupingInfo();
    
    // 显示模态框
    document.getElementById('groupingModal').style.display = 'flex';
}

function renderGroupButtons() {
    const groupButtons = document.getElementById('groupButtons');
    groupButtons.innerHTML = '';
    
    for (let i = 1; i <= 10; i++) {
        const button = document.createElement('button');
        button.className = 'group-btn';
        if (i === selectedGroup) {
            button.classList.add('active');
        }
        button.textContent = `第${i}小组`;
        button.dataset.group = i;
        button.style.borderColor = groupColor[i] || '#ddd';
        
        button.addEventListener('click', function() {
            selectedGroup = parseInt(this.dataset.group);
            document.querySelectorAll('.group-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
        });
        
        groupButtons.appendChild(button);
    }
}

function renderStudentMatrix() {
    const matrixContainer = document.getElementById('matrixContainer');
    matrixContainer.innerHTML = '';
    
    const currentClass = getCurrentClass();
    
    // 创建50个单元格
    for (let i = 1; i <= 50; i++) {
        const cell = document.createElement('div');
        cell.className = 'student-cell';
        cell.textContent = i;
        cell.dataset.number = i;
        
        // 查找对应学号的学生
        const student = currentClass.students.find(s => parseInt(s.num) === i);
        
        if (student) {
            // 检查学生是否已分配到小组 - 使用全局分组数据
            const studentGroup = getStudentGroup(i); // 使用学号而不是学生ID
            if (studentGroup) {
                cell.classList.add('assigned');
                cell.style.backgroundColor = groupColor[studentGroup] || groupColor[1];
                cell.style.borderColor = groupColor[studentGroup] || groupColor[1];
            }
            
            cell.addEventListener('click', function() {
                if (selectedGroup) {
                    // 分配学生到选中的小组 - 使用学号而不是学生ID
                    assignStudentToGroup(i, selectedGroup); // 使用学号而不是学生ID
                    
                    // 更新单元格样式
                    this.classList.add('assigned');
                    this.style.backgroundColor = groupColor[selectedGroup];
                    this.style.borderColor = groupColor[selectedGroup];
                } else {
                    showNotification('请先选择小组', 'error');
                }
            });
        } else {
            // 没有对应学生，显示为空
            cell.classList.add('empty');
            cell.textContent = '空';
        }
        
        matrixContainer.appendChild(cell);
    }
}

function loadGroupingData() {
    const savedData = localStorage.getItem('studentGroupingData');
    if (savedData) {
        try {
            groupingData = JSON.parse(savedData);
        } catch (e) {
            console.error('加载分组数据失败:', e);
            groupingData = {};
        }
    } else {
        groupingData = {};
    }
}

function saveGrouping() {
    // 保存全局分组数据到localStorage
    localStorage.setItem('studentGroupingData', JSON.stringify(groupingData));
    
    // 关闭模态框
    document.getElementById('groupingModal').style.display = 'none';
    
    // 更新所有班级的小组排名
    renderGroupRankingList();
    
    // 更新分组信息显示
    updateGroupingInfo();
    
    showNotification('小组划分已保存', 'success');
}

function assignStudentToGroup(studentNumber, groupNumber) {
    // 使用学号作为键，而不是学生ID
    groupingData[studentNumber] = groupNumber;
}

function getStudentGroup(studentNumber) {
    // 使用学号作为键，而不是学生ID
    return groupingData[studentNumber] || null;
}

function updateGroupingInfo() {
    const groupingInfo = document.getElementById('groupingInfo');
    
    // 统计已分组的学生数量
    let groupedStudents = Object.keys(groupingData).length;
    
    // 统计每个小组的学生数量
    const groupCounts = {};
    Object.values(groupingData).forEach(groupNum => {
        groupCounts[groupNum] = (groupCounts[groupNum] || 0) + 1;
    });
    
    if (groupedStudents === 0) {
        groupingInfo.textContent = '当前分组: 默认分组';
    } else {
        let groupInfoText = '当前分组: ';
        Object.keys(groupCounts).sort().forEach(groupNum => {
            groupInfoText += `第${groupNum}组(${groupCounts[groupNum]}人) `;
        });
        groupingInfo.textContent = groupInfoText;
    }
}

// 修改calculateGroupRanking函数，使用全局分组数据
function calculateGroupRanking() {
    const currentClass = getCurrentClass();
    if (!currentClass) return {};

    const groupData = {};

    currentClass.students.forEach(student => {
        // 使用全局分组数据，如果没有则使用默认分组
        let groupNumber;
        if (groupingData[student.num]) {
            groupNumber = groupingData[student.num];
        } else {
            // 默认分组：根据学号计算小组编号
            const studentNum = parseInt(student.num);
            groupNumber = Math.ceil(studentNum / 10);
        }

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