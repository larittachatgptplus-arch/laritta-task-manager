// KONFIGURASI - Ganti dengan URL Google Apps Script Web App Anda
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzLJiZKzr7jaEAKo0DEMCwWx9Hm_jHvDKI5aiuLREPu15NQfMAts3fFtFtlvw_X1j9k/exec';

// Global Variables
let currentUserName = '';
let currentUserRole = 'STAFF';
let currentLeaderName = '';
let masterTeamData = {};
let teamHierarchy = {};
let allTasks = [];
let allWPS = [];

const ROLES = {
    MANAGER: 'MANAGER',
    PA: 'PA',
    STAFF: 'STAFF'
};

// ==================== API CALLS ====================

async function callGoogleScript(action, data = {}) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action, ...data })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error);
        }
        
        return result;
    } catch (error) {
        console.error('Error calling Google Script:', error);
        throw error;
    }
}

// ==================== INITIALIZATION ====================

async function initializeApp() {
    try {
        document.getElementById('login-message').textContent = 'Menghubungkan ke Google Sheets...';
        
        // Load master data
        const masterData = await callGoogleScript('getMasterTeamData');
        processMasterData(masterData.data || []);
        
        // Render login select
        renderLoginSelect();
        
        document.getElementById('login-message').textContent = 'Pilih nama Anda dan masukkan kata sandi (123456).';
        
    } catch (error) {
        console.error('Init error:', error);
        document.getElementById('login-message').textContent = 'Gagal menghubungkan ke Google Sheets. Periksa URL Script.';
    }
}

function processMasterData(data) {
    masterTeamData = {};
    teamHierarchy = {};
    
    data.forEach(member => {
        masterTeamData[member.name] = member;
        
        const leader = member.reportingTo;
        if (leader && leader !== 'N/A') {
            if (!teamHierarchy[leader]) {
                teamHierarchy[leader] = [];
            }
            teamHierarchy[leader].push(member.name);
        }
    });
}

// ==================== LOGIN ====================

function renderLoginSelect() {
    const select = document.getElementById('login-name');
    const masterNames = Object.keys(masterTeamData).sort();
    
    select.innerHTML = '<option value="" disabled selected>Pilih Nama Anda</option>';
    
    masterNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    });
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('login-name').value;
    const password = document.getElementById('login-password').value;
    const loginButton = document.getElementById('login-button');
    const loginMessage = document.getElementById('login-message');

    if (!name || !password) {
        loginMessage.textContent = 'Nama dan Kata Sandi wajib diisi.';
        return;
    }

    loginButton.disabled = true;
    loginMessage.textContent = 'Memproses login...';

    try {
        const user = masterTeamData[name];
        
        if (!user) {
            throw new Error('Nama pengguna tidak ditemukan di Master Data.');
        }

        if (password !== '123456') {
            throw new Error('Kata sandi salah.');
        }

        // Login success
        currentUserName = user.name;
        currentUserRole = user.role;
        currentLeaderName = user.reportingTo;
        
        // Load tasks
        loginMessage.textContent = 'Memuat data tugas...';
        await loadAllData();
        
        // Show main app
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-app-content').classList.remove('hidden');
        
        updateAppUI(currentUserName, currentUserRole);
        renderTeamSelects();
        
    } catch (error) {
        loginMessage.textContent = error.message;
        loginButton.disabled = false;
    }
});

async function loadAllData() {
    try {
        // Load regular tasks
        const tasksResult = await callGoogleScript('getTasks');
        allTasks = (tasksResult.data || []).map(task => ({
            ...task,
            dueDate: task.dueDate ? new Date(task.dueDate) : null,
            createdAt: task.createdAt ? new Date(task.createdAt) : null,
            completedAt: task.completedAt ? new Date(task.completedAt) : null
        }));
        
        // Load WPS tasks
        const wpsResult = await callGoogleScript('getWPSTasks');
        allWPS = (wpsResult.data || []).map(task => ({
            ...task,
            type: 'WPS',
            dueDate: task.dueDate ? new Date(task.dueDate) : null,
            createdAt: task.createdAt ? new Date(task.createdAt) : null,
            completedAt: task.completedAt ? new Date(task.completedAt) : null
        }));
        
        renderSheet2();
        
    } catch (error) {
        console.error('Error loading data:', error);
        showModal('Gagal', 'Gagal memuat data tugas: ' + error.message);
    }
}

function updateAppUI(name, role) {
    document.getElementById('current-user-info').textContent = `${name} (${role})`;
    
    const assignedSelect = document.getElementById('assigned-to-select');
    if (role === ROLES.STAFF) {
        assignedSelect.setAttribute('multiple', false);
        assignedSelect.innerHTML = `<option value="${name}" selected>${name}</option>`;
        assignedSelect.setAttribute('disabled', true);
    } else {
        assignedSelect.setAttribute('multiple', true);
        assignedSelect.removeAttribute('disabled');
    }

    const sheet4Tab = document.getElementById('sheet-4-tab');
    const sheet5Tab = document.getElementById('sheet-5-tab');
    if (role === ROLES.MANAGER || role === ROLES.PA) {
        sheet4Tab.classList.remove('hidden');
        sheet5Tab.classList.remove('hidden');
    } else {
        sheet4Tab.classList.add('hidden');
        sheet5Tab.classList.add('hidden');
    }
}

// ==================== TASK MANAGEMENT ====================

function toggleRecurrenceFields() {
    const type = document.getElementById('task-type').value;
    const dueDateContainer = document.getElementById('due-date-container');
    const recurrenceContainer = document.getElementById('recurrence-fields');
    const dayOfWeekContainer = document.getElementById('day-of-week-container');
    const dayOfMonthContainer = document.getElementById('day-of-month-container');

    dueDateContainer.classList.add('hidden');
    recurrenceContainer.classList.add('hidden');
    dayOfWeekContainer.classList.add('hidden');
    dayOfMonthContainer.classList.add('hidden');

    if (type === 'INSIDENTIL') {
        dueDateContainer.classList.remove('hidden');
    } else {
        recurrenceContainer.classList.remove('hidden');
        
        if (type === 'MINGGUAN') {
            dayOfWeekContainer.classList.remove('hidden');
        } else if (type === 'BULANAN') {
            dayOfMonthContainer.classList.remove('hidden');
        }
    }
}

document.getElementById('task-type').addEventListener('change', toggleRecurrenceFields);

document.getElementById('task-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target;
    const title = form.taskTitle.value;
    const description = form.taskDescription.value;
    const link = form.taskLink.value;
    const type = form.taskType.value;
    const assignedSelect = form.assignedTo;
    const dueDateTimeInput = form.dueDate ? form.dueDate.value : null;
    
    const recurrenceDetails = {
        dayOfWeek: form.dayOfWeek ? form.dayOfWeek.value : null,
        timeOfDay: form.timeOfDay ? form.timeOfDay.value : '23:59',
        dayOfMonth: form.dayOfMonth ? form.dayOfMonth.value : null,
    };

    if (!title || !assignedSelect.selectedOptions.length) {
        showModal('Gagal', 'Judul Tugas dan setidaknya satu PIC harus diisi.');
        return;
    }

    const assignedPICs = Array.from(assignedSelect.selectedOptions).map(option => option.value);

    try {
        const result = await callGoogleScript('createTask', {
            title,
            description,
            link,
            type,
            assignedPICs,
            dueDateTimeInput,
            recurrenceDetails,
            assignedBy: currentUserName
        });
        
        showModal('Berhasil', result.message || 'Tugas berhasil dibuat!');
        form.reset();
        toggleRecurrenceFields();
        
        // Reload tasks
        await loadAllData();
        
    } catch (error) {
        showModal('Gagal', 'Gagal membuat tugas: ' + error.message);
    }
});

async function toggleTaskStatus(taskId, currentStatus, taskType) {
    const isManager = currentUserRole === ROLES.MANAGER || currentUserRole === ROLES.PA;
    const taskList = taskType === 'WPS' ? allWPS : allTasks;
    const task = taskList.find(t => t.id === taskId);

    if (!task) return;

    const isAssignedToMe = task.assignedTo === currentUserName;

    if (!isManager && !isAssignedToMe) {
        showModal('Akses Ditolak', 'Anda hanya dapat menyelesaikan tugas Anda sendiri.');
        return;
    }

    try {
        await callGoogleScript('updateTaskStatus', {
            taskId,
            taskType,
            isComplete: !currentStatus
        });
        
        // Reload tasks
        await loadAllData();
        
    } catch (error) {
        showModal('Gagal', 'Gagal memperbarui status: ' + error.message);
    }
}

async function toggleWPSGoal(taskId, currentGoalStatus) {
    const isManager = currentUserRole === ROLES.MANAGER || currentUserRole === ROLES.PA;

    if (!isManager) {
        showModal('Akses Ditolak', 'Hanya Manager/PA yang dapat menentukan status Goal WPS.');
        return;
    }
    
    try {
        await callGoogleScript('updateWPSGoal', {
            taskId,
            goalAchieved: !currentGoalStatus
        });
        
        showModal('Berhasil', `Status Goal WPS diperbarui menjadi: ${!currentGoalStatus ? 'Tercapai' : 'Gagal'}`);
        
        // Reload tasks
        await loadAllData();
        
    } catch (error) {
        showModal('Gagal', 'Gagal memperbarui status Goal: ' + error.message);
    }
}

// ==================== SHEET 2: TASK LIST ====================

function renderSheet2(buttonElement) {
    const container = document.getElementById('task-list-container');
    
    let activeTab = 'ALL';
    if (buttonElement) {
        activeTab = buttonElement.dataset.taskType;
    } else {
        activeTab = document.querySelector('#sheet-2-tabs button.active')?.dataset.taskType || 'ALL';
    }

    const combinedTasks = allTasks.concat(allWPS);

    const filteredTasks = combinedTasks.filter(task => {
        const isAssignedToMe = task.assignedTo === currentUserName;
        const isManager = currentUserRole === ROLES.MANAGER || currentUserRole === ROLES.PA;

        if (!isManager && !isAssignedToMe) {
            return false;
        }

        if (activeTab === 'ALL') return true;
        
        return task.type === activeTab;
    });

    const groupedTasks = filteredTasks.reduce((acc, task) => {
        if (!acc[task.assignedTo]) acc[task.assignedTo] = [];
        acc[task.assignedTo].push(task);
        return acc;
    }, {});

    let html = '';

    if (Object.keys(groupedTasks).length === 0) {
         html = `<div class="p-6 text-gray-400">Tidak ada tugas yang ditemukan dalam kategori ini.</div>`;
    } else {
        const sortedPICs = Object.keys(groupedTasks).sort();
        
        sortedPICs.forEach(picName => {
            const picTasks = groupedTasks[picName].sort((a, b) => {
                if (a.isComplete !== b.isComplete) return a.isComplete ? 1 : -1;
                const dateA = a.dueDate ? a.dueDate.getTime() : Infinity;
                const dateB = b.dueDate ? b.dueDate.getTime() : Infinity;
                return dateA - dateB;
            });

            const incompleteCount = picTasks.filter(t => !t.isComplete).length;
            
            html += `
                <div class="mb-4 bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
                    <button onclick="toggleAccordion('tasks-${picName.replace(/\s/g, '-')}')"
                        class="w-full text-left p-4 flex justify-between items-center text-white transition duration-300 ${incompleteCount > 0 ? 'bg-red-700 hover:bg-red-800' : 'bg-gray-700 hover:bg-gray-600'}">
                        <span class="text-xl font-bold">${picName}</span>
                        <span class="text-sm font-semibold">${incompleteCount} Belum Selesai / ${picTasks.length} Total</span>
                    </button>
                    <div id="tasks-${picName.replace(/\s/g, '-')}" class="task-accordion hidden p-2">
                        ${picTasks.map(task => renderTaskCard(task)).join('')}
                    </div>
                </div>
            `;
        });
    }

    container.innerHTML = html;
}

function filterSheet2Tasks(buttonElement) {
    document.querySelectorAll('#sheet-2-tabs button').forEach(btn => btn.classList.remove('active'));
    buttonElement.classList.add('active');
    renderSheet2(buttonElement);
}

function renderTaskCard(task) {
    const dueDate = task.dueDate;
    const now = new Date();
    const timeDiff = dueDate ? dueDate.getTime() - now.getTime() : 0;
    const daysDiff = dueDate ? Math.ceil(timeDiff / (1000 * 3600 * 24)) : 0;
    const isOverdue = dueDate && !task.isComplete && timeDiff < 0;
    const isApproaching = dueDate && !task.isComplete && daysDiff >= 1 && daysDiff <= 3;
    
    const statusColor = task.isComplete ? 'bg-green-700' : (isOverdue ? 'bg-pink-700' : 'bg-gray-700');
    const statusText = task.isComplete ? 'Selesai' : (isOverdue ? 'TERLAMBAT' : 'Belum Selesai');
    const statusIcon = task.isComplete ? '✅' : (isOverdue ? '⚠️' : '⏳');
    const reminderIcon = isApproaching ? '🔔' : '';
    
    const taskId = task.id;
    const taskType = task.type === 'WPS' ? 'WPS' : task.type; 
    const isWPS = task.type === 'WPS';
    const isManager = currentUserRole === ROLES.MANAGER || currentUserRole === ROLES.PA;

    let wpsGoalStatusHTML = '';
    if (isWPS && isManager) {
        const goalAchieved = task.goalAchieved;
        const goalColor = goalAchieved ? 'bg-green-600' : 'bg-red-600';
        const goalText = goalAchieved ? 'GOAL TERCAPAI' : 'GOAL GAGAL';

        wpsGoalStatusHTML = `
            <div class="mt-2 text-sm border-t border-gray-600 pt-2 flex justify-between items-center">
                 <span class="font-semibold text-gray-400">Status Goal WPS:</span>
                 <button onclick="toggleWPSGoal('${taskId}', ${goalAchieved})"
                    class="text-xs px-2 py-1 rounded-md ${goalColor} hover:opacity-80 transition duration-150">
                    ${goalText} (Klik untuk ganti)
                 </button>
            </div>
        `;
    } else if (isWPS) {
         wpsGoalStatusHTML = `
            <div class="mt-2 text-sm border-t border-gray-600 pt-2">
                 <span class="font-semibold text-gray-400">Status Goal WPS:</span>
                 <span class="text-xs px-2 py-1 rounded-md ${task.goalAchieved ? 'bg-green-600' : 'bg-red-600'}">
                    ${task.goalAchieved ? 'GOAL TERCAPAI' : 'GOAL GAGAL'}
                 </span>
            </div>
        `;
    }

    const escapedDescription = (task.description || '').replace(/'/g, "\\'").replace(/\n/g, '\\n');
    const escapedLink = (task.link || '').replace(/'/g, "\\'");

    return `
        <div class="p-3 mb-2 rounded-lg ${statusColor} text-white shadow-md">
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-bold text-lg">${task.title} ${reminderIcon}</p>
                    <p class="text-xs italic">${taskType} | Ditugaskan oleh: ${task.assignedBy}</p>
                </div>
                <div class="flex flex-col items-end space-y-2">
                    <span class="text-xs font-semibold px-2 py-1 rounded-full ${task.isComplete ? 'bg-green-500' : (isOverdue ? 'bg-red-900' : 'bg-yellow-500')}">
                        ${statusIcon} ${statusText}
                    </span>
                    <button onclick="toggleTaskStatus('${taskId}', ${task.isComplete}, '${taskType}')" 
                        class="text-xs px-2 py-1 rounded-md bg-gray-900 hover:bg-gray-700 transition duration-150">
                        ${task.isComplete ? 'Batal Selesaikan' : 'Tandai Selesai'}
                    </button>
                </div>
            </div>

            <div class="mt-2 text-sm border-t border-gray-600 pt-2 flex justify-between items-center">
                <div>
                    Batas Waktu: 
                    <span class="font-semibold">${dueDate ? dueDate.toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                </div>
                <button onclick="showDescriptionModal('${task.title}', '${escapedDescription}', '${escapedLink}')" 
                    class="text-xs px-2 py-1 rounded-md bg-gray-900 hover:bg-gray-700 transition duration-150">
                    Deskripsi & Link
                </button>
            </div>
            ${wpsGoalStatusHTML}
        </div>
    `;
}

// ==================== SHEET 3: KPI DASHBOARD ====================

function renderKPIDashboard() {
    const container = document.getElementById('kpi-dashboard-container');
    const filterElement = document.getElementById('kpi-leader-filter');
    const selectedLeader = filterElement ? filterElement.value : 'ALL';
    const monthElement = document.getElementById('kpi-month-display');
    
    const now = new Date();
    const year = parseInt(monthElement.dataset.year || now.getFullYear());
    const monthIndex = parseInt(monthElement.dataset.month || now.getMonth());

    const reportDate = new Date(year, monthIndex);
    const nextMonth = new Date(year, monthIndex + 1);
    
    monthElement.textContent = reportDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
    
    let relevantPICs = new Set();
    if (selectedLeader === 'ALL') {
        relevantPICs = new Set(Object.keys(masterTeamData));
    } else {
        relevantPICs.add(selectedLeader);
        if (teamHierarchy[selectedLeader]) {
            teamHierarchy[selectedLeader].forEach(sub => relevantPICs.add(sub));
        }
    }

    const teamMetrics = {};
    
    relevantPICs.forEach(name => {
        const userData = masterTeamData[name] || { name, role: 'Unknown', reportingTo: 'N/A' };
        teamMetrics[name] = {
            name: name,
            role: userData.role,
            totalTasks: 0,
            completedTasks: 0,
            overdueTasks: 0,
            wpsTotal: 0,
            wpsAchieved: 0,
            completionRate: 0,
            score: 0,
            rankStatus: 'N/A',
            reportingTo: userData.reportingTo
        };
    });

    const combinedTasks = allTasks.concat(allWPS);

    combinedTasks.forEach(task => {
        const picName = task.assignedTo;
        const dueDate = task.dueDate;

        if (relevantPICs.has(picName) && dueDate && 
            dueDate >= reportDate && dueDate < nextMonth) {
            
            const metrics = teamMetrics[picName];
            if (!metrics) return;

            metrics.totalTasks++;
            
            if (task.type === 'WPS') {
                metrics.wpsTotal++;
                if (task.goalAchieved) metrics.wpsAchieved++;
            } else {
                if (task.isComplete) {
                    metrics.completedTasks++;
                } else if (dueDate < now) {
                    metrics.overdueTasks++;
                }
            }
        }
    });

    const PICsWithTasks = [];
    Object.values(teamMetrics).forEach(metrics => {
        const totalMeasurableTasks = metrics.totalTasks;
        const totalCompleted = metrics.completedTasks + metrics.wpsAchieved;
        
        if (totalMeasurableTasks > 0) {
            metrics.completionRate = (totalCompleted / totalMeasurableTasks) * 100;

            let baseScore = metrics.completionRate / 20; 
            const penalty = Math.min(metrics.overdueTasks * 0.5, 3);
            
            metrics.score = Math.max(1, baseScore - penalty).toFixed(2); 

            PICsWithTasks.push(metrics);
        }
    });

    PICsWithTasks.sort((a, b) => b.totalTasks - a.totalTasks);

    if (PICsWithTasks.length > 0) {
        const totalPICs = PICsWithTasks.length;
        
        if (totalPICs >= 1) PICsWithTasks[0].rankStatus = 'Team Top Score Performance';
        if (totalPICs >= 2) PICsWithTasks[1].rankStatus = 'Team Good Performance';
        if (totalPICs >= 3) PICsWithTasks[2].rankStatus = 'Team Support';

        PICsWithTasks.slice(3).forEach(m => m.rankStatus = 'Team Butuh Partisipan');
    }

    Object.values(teamMetrics).forEach(metrics => {
        if (metrics.totalTasks === 0) {
            metrics.rankStatus = 'Team Butuh Partisipan';
        }
    });
    
    const finalSortedMetrics = Object.values(teamMetrics).sort((a, b) => b.totalTasks - a.totalTasks);

    container.innerHTML = finalSortedMetrics.map(metrics => {
         let rankColor;
         switch (metrics.rankStatus) {
             case 'Team Top Score Performance': rankColor = 'bg-green-700'; break;
             case 'Team Good Performance': rankColor = 'bg-blue-700'; break;
             case 'Team Support': rankColor = 'bg-orange-700'; break;
             case 'Team Butuh Partisipan': rankColor = 'bg-pink-700'; break;
             default: rankColor = 'bg-gray-700';
         }
         return `
             <div class="bg-gray-800 p-4 rounded-lg shadow-xl mb-4 text-white border border-gray-700">
                 <div class="flex justify-between items-center pb-2 border-b border-gray-700">
                     <div class="flex flex-col">
                         <h3 class="text-lg font-bold">${metrics.name}</h3>
                         <p class="text-xs text-gray-400">${metrics.role} (${metrics.reportingTo === 'N/A' ? 'Pemimpin Tertinggi' : `Lapor ke: ${metrics.reportingTo}`})</p>
                     </div>
                     <span class="text-sm font-semibold px-3 py-1 rounded-full ${rankColor}">
                         ${metrics.rankStatus}
                     </span>
                 </div>

                 <div class="flex justify-between items-center py-3">
                     <div class="text-center w-1/3">
                         <p class="text-3xl font-extrabold text-red-500">${metrics.score}</p>
                         <p class="text-xs text-gray-400">KPI BULANAN (1-5)</p>
                     </div>
                     
                     <div class="w-2/3 text-sm grid grid-cols-2 gap-2 pl-4">
                         <p>Total Tugas Reguler: <span class="font-bold">${metrics.totalTasks - metrics.wpsTotal}</span></p>
                         <p>Selesai Reguler: <span class="font-bold text-green-400">${metrics.completedTasks}</span></p>
                         <p>Total WPS: <span class="font-bold">${metrics.wpsTotal}</span></p>
                         <p>Goal WPS Tercapai: <span class="font-bold text-green-400">${metrics.wpsAchieved}</span></p>
                         <p>Terlambat Reguler: <span class="font-bold text-red-400">${metrics.overdueTasks}</span></p>
                         <p>Rate Keseluruhan: <span class="font-bold text-yellow-400">${metrics.completionRate.toFixed(1)}%</span></p>
                     </div>
                 </div>
             </div>
         `;
    }).join('');
}

function handleKPIMonthChange(direction) {
    const monthElement = document.getElementById('kpi-month-display');
    let year = parseInt(monthElement.dataset.year);
    let month = parseInt(monthElement.dataset.month);

    month += direction;

    if (month > 11) {
        month = 0;
        year++;
    } else if (month < 0) {
        month = 11;
        year--;
    }

    monthElement.dataset.year = year;
    monthElement.dataset.month = month;
    renderKPIDashboard();
}

// ==================== SHEET 4: MASTER DATA ====================

async function renderMasterTeamList() {
    const container = document.getElementById('master-team-list');
    
    if (Object.keys(masterTeamData).length === 0) {
         container.innerHTML = '<p class="text-red-500">Data tim kosong. Coba muat ulang atau periksa koneksi.</p>';
         return;
    }

    const sortedNames = Object.keys(masterTeamData).sort();
    
    let html = `
        <div class="mb-4 text-sm text-gray-400">Total PIC: ${sortedNames.length}. Gunakan formulir di bawah untuk menambah/memperbarui.</div>
    `;

    sortedNames.forEach(name => {
        const user = masterTeamData[name];
        const subordinates = teamHierarchy[name] ? teamHierarchy[name].join(', ') : 'N/A';
        
        html += `
            <div id="master-card-${name.replace(/\s/g, '-')}" class="bg-gray-800 p-4 rounded-lg shadow-md mb-2 flex justify-between items-center border border-gray-700">
                <div>
                    <p class="font-bold text-lg text-white">${name}</p>
                    <p class="text-sm text-gray-400">Peran: ${user.role} | Lapor ke: ${user.reportingTo}</p>
                    <p class="text-xs text-gray-500">Bawahan: ${subordinates}</p>
                </div>
                <div>
                    <button onclick="editMasterUser('${name}')" class="text-xs px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white">Edit</button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function editMasterUser(name) {
    const user = masterTeamData[name];
    if (!user) return;
    
    document.getElementById('master-pic-name').value = user.name;
    document.getElementById('master-pic-name').setAttribute('readonly', true); 
    document.getElementById('master-role-select').value = user.role;
    document.getElementById('master-leader-select').value = user.reportingTo;
    document.getElementById('master-form-title').textContent = `Edit PIC: ${user.name}`;
    document.getElementById('master-form-button').textContent = 'Perbarui PIC';
}

function resetMasterForm() {
    document.getElementById('master-pic-name').value = '';
    document.getElementById('master-pic-name').removeAttribute('readonly');
    document.getElementById('master-role-select').value = ROLES.STAFF;
    document.getElementById('master-leader-select').value = 'N/A';
    document.getElementById('master-form-title').textContent = 'Tambah PIC Baru';
    document.getElementById('master-form-button').textContent = 'Tambah PIC';
}

document.getElementById('master-team-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('master-pic-name').value.trim();
    const role = document.getElementById('master-role-select').value;
    const reportingTo = document.getElementById('master-leader-select').value;

    if (!name) {
        showModal('Gagal', 'Nama PIC wajib diisi.');
        return;
    }

    try {
        const result = await callGoogleScript('updateMasterUser', {
            name,
            role,
            reportingTo
        });

        showModal('Berhasil', `${name} berhasil diperbarui di Master Data.`);
        resetMasterForm();
        
        // Reload master data
        const masterData = await callGoogleScript('getMasterTeamData');
        processMasterData(masterData.data || []);
        renderMasterTeamList();
        renderTeamSelects();
        
    } catch (error) {
        showModal('Gagal', 'Gagal menyimpan data: ' + error.message);
    }
});

// ==================== SHEET 5: WPS ====================

document.getElementById('wps-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;
    const title = form.wpsTitle.value;
    const description = form.wpsDescription.value;
    const goal = form.wpsGoal.value;
    const assignedTo = form.wpsAssignedTo.value;
    
    try {
        const result = await callGoogleScript('createWPSTask', {
            title,
            description,
            goal,
            assignedTo,
            assignedBy: currentUserName
        });
        
        showModal('Berhasil', result.message || 'Tugas WPS berhasil dibuat!');
        form.reset();
        
        // Reload tasks
        await loadAllData();
        
    } catch (error) {
        showModal('Gagal', 'Gagal membuat tugas WPS: ' + error.message);
    }
});

// ==================== UTILITY FUNCTIONS ====================

function renderTeamSelects() {
    const masterNames = Object.keys(masterTeamData).sort();
    
    // Task assignment select
    const select = document.getElementById('assigned-to-select');
    const currentValue = Array.from(select.selectedOptions).map(opt => opt.value);
    select.innerHTML = '';
    masterNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        if (currentValue.includes(name) || (currentUserName === name && currentUserRole === ROLES.STAFF)) {
            option.selected = true;
        }
        select.appendChild(option);
    });

    // KPI filter select
    const filterSelect = document.getElementById('kpi-leader-filter');
    const leaders = new Set();
    Object.values(masterTeamData).forEach(user => {
        if (teamHierarchy[user.name] && teamHierarchy[user.name].length > 0) {
            leaders.add(user.name);
        }
        if (user.role === ROLES.MANAGER || user.role === ROLES.PA || teamHierarchy[user.name]) {
             leaders.add(user.name);
        }
    });
    const sortedLeaders = Array.from(leaders).sort();
    
    const selectedFilter = filterSelect ? filterSelect.value : 'ALL';
    if (filterSelect) {
        filterSelect.innerHTML = `<option value="ALL">-- SEMUA TIM --</option>`;
        sortedLeaders.forEach(leader => {
            const option = document.createElement('option');
            option.value = leader;
            option.textContent = leader;
            if (leader === selectedFilter) {
                option.selected = true;
            }
            filterSelect.appendChild(option);
        });
    }

    // Master leader select
    const masterLeaderSelect = document.getElementById('master-leader-select');
    if (masterLeaderSelect) {
        const masterNamesForLeader = ['N/A', ...masterNames];
        masterLeaderSelect.innerHTML = masterNamesForLeader.map(name => `<option value="${name}">${name}</option>`).join('');
    }
    
    // WPS assign select
    const wpsAssignSelect = document.getElementById('wps-assigned-to');
    if (wpsAssignSelect) {
        wpsAssignSelect.innerHTML = masterNames.map(name => `<option value="${name}">${name}</option>`).join('');
    }
}

function setActiveTab(sheetId) {
    const sheets = ['sheet-1', 'sheet-2', 'sheet-3', 'sheet-4', 'sheet-5'];
    const tabs = ['sheet-1-tab', 'sheet-2-tab', 'sheet-3-tab', 'sheet-4-tab', 'sheet-5-tab'];

    sheets.forEach(id => document.getElementById(id).classList.add('hidden'));
    tabs.forEach(id => document.getElementById(id).classList.remove('active', 'border-red-500', 'text-white'));

    document.getElementById(sheetId).classList.remove('hidden');
    document.getElementById(`${sheetId}-tab`).classList.add('active', 'border-red-500', 'text-white');
    
    if (sheetId === 'sheet-2') {
         renderSheet2();
    } else if (sheetId === 'sheet-3') {
        renderKPIDashboard();
    } else if (sheetId === 'sheet-4') {
        renderMasterTeamList();
    }
}

function showModal(title, message) {
    const modal = document.getElementById('message-modal');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-message').textContent = message;
    modal.classList.remove('hidden');
}

function showDescriptionModal(title, description, link) {
     const modal = document.getElementById('description-modal');
     document.getElementById('desc-modal-title').textContent = `Deskripsi Tugas: ${title}`;
     document.getElementById('desc-modal-description').textContent = description || 'Tidak ada deskripsi.';
     
     const linkElement = document.getElementById('desc-modal-link');
     if (link && link.trim()) {
         linkElement.innerHTML = `<a href="${link}" target="_blank" class="text-blue-400 hover:text-blue-300 underline">${link}</a>`;
         linkElement.closest('div').classList.remove('hidden');
     } else {
         linkElement.closest('div').classList.add('hidden');
     }
     
     modal.classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function toggleAccordion(id) {
    const element = document.getElementById(id);
    element.classList.toggle('hidden');
}

// ==================== INITIALIZATION ON LOAD ====================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize date for KPI dashboard
    const now = new Date();
    const monthElement = document.getElementById('kpi-month-display');
    monthElement.dataset.year = now.getFullYear();
    monthElement.dataset.month = now.getMonth();

    setActiveTab('sheet-1');
    toggleRecurrenceFields();
    
    // Start initialization
    initializeApp();
});
