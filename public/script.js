// Global tracking for the selected predictions assembly
let userPredictions = {
    sf1_left: "",
    sf1_right: "",
    sf2_left: "",
    sf2_right: "",
    final_left: "",
    final_right: "",
    champion: ""
};

// Clear out intro animation and show the app structure
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        const intro = document.getElementById("intro-screen");
        const app = document.getElementById("app-container");
        if (intro) intro.classList.add("slide-off");
        if (app) app.style.opacity = "1";
    }, 1800);
});

// Clean layout tab-switching machine
function switchTab(tabId) {
    const tabs = ['fixtures', 'live', 'predictions', 'admin'];
    tabs.forEach(t => {
        const pane = document.getElementById(`${t}-tab`);
        if (pane) pane.classList.add('hidden');
    });
    
    const activePane = document.getElementById(`${tabId}-tab`);
    if (activePane) activePane.classList.remove('hidden');

    // Update active button state styling
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        if (btn.getAttribute('onclick').includes(tabId)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // If switching to admin tab, fetch database tables
    if (tabId === 'admin') {
        fetchAdminMatrix();
    }
}

// Automatically push selected node team winner into target next slot
function advanceTeam(sourceId, targetId) {
    const sourceBtn = document.getElementById(sourceId);
    const targetBtn = document.getElementById(targetId);
    
    if (!sourceBtn || !targetBtn) return;
    
    const teamHTML = sourceBtn.innerHTML;
    const teamText = sourceBtn.innerText.trim();
    
    // UI Visual Transfer update
    targetBtn.innerHTML = teamHTML;
    targetBtn.style.color = "#fff";
    targetBtn.style.borderColor = "var(--gold)";

    // Update internal variable map tracking array matrix
    if (targetId === 'sf1_left') userPredictions.sf1_left = teamText;
    if (targetId === 'sf1_right') userPredictions.sf1_right = teamText;
    if (targetId === 'sf2_left') userPredictions.sf2_left = teamText;
    if (targetId === 'sf2_right') userPredictions.sf2_right = teamText;
    if (targetId === 'final_left') userPredictions.final_left = teamText;
    if (targetId === 'final_right') userPredictions.final_right = teamText;
    if (targetId === 'final-winner') {
        userPredictions.champion = teamText;
        targetBtn.style.color = "var(--gold)";
    }
}

// Submit metadata payload to database backend server router
function savePredictionsToServer() {
    const errorElement = document.getElementById('auth-error');
    errorElement.innerText = ""; // clear prior failures

    // Capture standard form parameters
    const name = document.getElementById('auth-name').value.trim();
    const email = document.getElementById('auth-email').value.trim();
    const semester = document.getElementById('auth-semester').value;
    const department = document.getElementById('auth-dept').value;

    const goldenBoot = document.getElementById('golden-boot-input').value.trim();
    const goldenGlove = document.getElementById('golden-glove-input').value.trim();

    // Field completion validation check
    if (!name || !email || !semester || !department || !goldenBoot || !goldenGlove) {
        errorElement.innerText = "❌ Please fulfill all profile credentials & accolades fields.";
        return;
    }

    if (!userPredictions.champion) {
        errorElement.innerText = "❌ Please complete your bracket tree selection to assign a final Champion.";
        return;
    }

    // Assemble uniform request object data payload mapping schema
    const payload = {
        name: name,
        email: email,
        semester: semester,
        department: department,
        goldenBoot: goldenBoot,
        goldenGlove: goldenGlove,
        bracket: userPredictions
    };

    // Post to local processing router endpoint without strict tokens header configurations
    fetch('/api/predictions/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert("🎉 Your World Cup prediction has been locked in securely! Thanks for playing.");
            // Enable dashboard visibility tracking option for verification
            document.getElementById('admin-nav-btn').classList.remove('hidden');
        } else {
            errorElement.innerText = `⚠️ Submission Blocked: ${data.message}`;
        }
    })
    .catch(err => {
        console.error("Network interface error occurred:", err);
        errorElement.innerText = "❌ Infrastructure processing breakdown. Please check server connections.";
    });
}

// Fetch compiled submission row array columns to populate admin table panel metric elements
function fetchAdminMatrix() {
    fetch('/api/predictions/list')
    .then(res => res.json())
    .then(data => {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;
        tbody.innerHTML = "";
        
        if (!data.submissions || data.submissions.length === 0) {
            tbody.innerHTML = `<tr><td colspan="13" style="text-align:center; color:var(--text-muted);">No entries recorded yet in data hub instance.</td></tr>`;
            return;
        }

        data.submissions.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="gold-txt">${escapeHtml(row.name)}</td>
                <td>${escapeHtml(row.email)}</td>
                <td>${escapeHtml(row.semester)}</td>
                <td>${escapeHtml(row.department)}</td>
                <td>${escapeHtml(row.bracket?.sf1_left || '-')}</td>
                <td>${escapeHtml(row.bracket?.sf1_right || '-')}</td>
                <td>${escapeHtml(row.bracket?.sf2_left || '-')}</td>
                <td>${escapeHtml(row.bracket?.sf2_right || '-')}</td>
                <td>${escapeHtml(row.bracket?.final_left || '-')}</td>
                <td>${escapeHtml(row.bracket?.final_right || '-')}</td>
                <td class="gold-txt" style="color:var(--gold-bright);">${escapeHtml(row.bracket?.champion || '-')}</td>
                <td>${escapeHtml(row.goldenBoot)}</td>
                <td>${escapeHtml(row.goldenGlove)}</td>
            `;
            tbody.appendChild(tr);
        });
    });
}

function escapeHtml(str) {
    if(!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}