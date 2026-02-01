/* ===== Audit Core - Standalone Version ===== */
const AUDIT_API = "https://script.google.com/macros/s/AKfycbwd2Db27tpGfv1STLX8N6I6tBv5CDYkAM4bHbsxQDJ8wgRLqP_f3kvwkleemCH9DrEf/exec";
let auditRows = [];
let allInventory = [];

// 1. Load Data specifically for Audit
async function initAudit() {
    const tbody = document.getElementById('audit-data');
    tbody.innerHTML = '<tr><td colspan="4" align="center">⌛ Loading Inventory...</td></tr>';
    
    try {
        const response = await fetch(`${AUDIT_API}?action=read&password=Service`);
        const res = await response.json();
        if (res.success) {
            allInventory = res.data;
            renderAuditTable(allInventory);
        }
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="4" align="center" style="color:red;">❌ Error loading data</td></tr>';
    }
}

// 2. Render Audit Table (Standalone)
function renderAuditTable(data) {
    const tbody = document.getElementById('audit-data');
    tbody.innerHTML = data.map(r => {
        const mat = r.Material;
        const name = r['Product Name'];
        const systemQty = Number(r['0243'] || 0);

        return `
            <tr>
                <td>
                    <div style="display:flex; flex-direction:column;">
                        <b style="color:#003366;">${mat}</b>
                        <small style="color:#64748b;">${name}</small>
                    </div>
                </td>
                <td align="center"><b>${systemQty}</b></td>
                <td align="center">
                    <input type="number" id="actual_${mat}" 
                           oninput="calculateDiff('${mat}', ${systemQty})" 
                           placeholder="0" 
                           style="width:60px; height:35px; text-align:center; border-radius:8px; border:1px solid #cbd5e1;">
                </td>
                <td align="right"><b id="diff_${mat}" style="font-size:16px;">-</b></td>
            </tr>`;
    }).join('');
}

// 3. Search Function for Audit
function searchAudit(keyword) {
    const filtered = allInventory.filter(r => 
        String(r.Material).toLowerCase().includes(keyword.toLowerCase()) || 
        String(r['Product Name']).toLowerCase().includes(keyword.toLowerCase())
    );
    renderAuditTable(filtered);
}

// 4. Calculate Discrepancy
function calculateDiff(mat, systemQty) {
    const actualInput = document.getElementById(`actual_${mat}`);
    const diffDisplay = document.getElementById(`diff_${mat}`);
    const actualQty = parseFloat(actualInput.value);

    if (!isNaN(actualQty)) {
        const diff = actualQty - systemQty;
        diffDisplay.innerText = diff > 0 ? `+${diff}` : diff;
        diffDisplay.style.color = diff === 0 ? "#22c55e" : "#ef4444";
        
        const item = allInventory.find(r => r.Material == mat);
        const idx = auditRows.findIndex(a => a.material == mat);
        const data = {
            auditor: sessionStorage.getItem('selectedUser') || "Supervisor",
            material: mat,
            productName: item['Product Name'],
            systemQty: systemQty,
            actualQty: actualQty,
            diff: diff
        };
        if (idx > -1) auditRows[idx] = data; else auditRows.push(data);
    }
}

// 5. Submit to Google Sheets (Audit_Log)
async function submitAuditReport() {
    if (auditRows.length === 0) return alert("Please enter actual count for at least 1 item.");
    
    const btn = document.getElementById('btnSubmit');
    btn.disabled = true;
    btn.innerText = "Saving...";

    try {
        const response = await fetch(`${AUDIT_API}?action=saveAudit&auditData=${encodeURIComponent(JSON.stringify(auditRows))}`);
        const res = await response.json();
        if (res.success) {
            alert("✅ Audit Data Logged Successfully!");
            location.href = 'supervisor.html';
        }
    } catch (e) {
        alert("❌ Failed to save audit data.");
        btn.disabled = false;
        btn.innerText = "Submit Report";
    }
}
