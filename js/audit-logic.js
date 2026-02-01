const API_URL = "ใส่_URL_ของ_Google_Script_ตรงนี้"; 
let stockData = [];
let auditPayload = [];

async function initAudit() {
    try {
        const response = await fetch(`${API_URL}?action=read`);
        const result = await response.json();
        if (result.success) {
            stockData = result.data;
            renderTable(stockData);
        }
    } catch (e) {
        alert("System Error: Cannot connect to database.");
    }
}

function renderTable(data) {
    const tbody = document.getElementById('audit-table-body');
    tbody.innerHTML = data.map(item => {
        const sysQty = Number(item['0243'] || 0);
        return `
            <tr>
                <td>
                    <div style="font-weight:600; color:#003366;">${item.Material}</div>
                    <div style="font-size:0.75rem; color:#64748b;">${item['Product Name']}</div>
                </td>
                <td align="center"><b>${sysQty}</b></td>
                <td align="center">
                    <input type="number" class="qty-input" id="act_${item.Material}" 
                           oninput="updateDiff('${item.Material}', ${sysQty})" placeholder="0">
                </td>
                <td align="right" class="diff-tag" id="diff_${item.Material}">-</td>
            </tr>
        `;
    }).join('');
}

function updateDiff(mat, sysQty) {
    const actual = parseFloat(document.getElementById(`act_${mat}`).value);
    const diffNode = document.getElementById(`diff_${mat}`);
    
    if (!isNaN(actual)) {
        const diff = actual - sysQty;
        diffNode.innerText = diff > 0 ? `+${diff}` : diff;
        diffNode.style.color = diff === 0 ? "#10b981" : "#ef4444";
        
        // Update data for submission
        const item = stockData.find(s => s.Material == mat);
        const entry = {
            auditor: "Internal Auditor", // Change as needed
            material: mat,
            productName: item['Product Name'],
            systemQty: sysQty,
            actualQty: actual,
            diff: diff
        };
        const idx = auditPayload.findIndex(p => p.material == mat);
        if (idx > -1) auditPayload[idx] = entry; else auditPayload.push(entry);
    }
}

function filterTable() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = stockData.filter(s => 
        String(s.Material).toLowerCase().includes(query) || 
        String(s['Product Name']).toLowerCase().includes(query)
    );
    renderTable(filtered);
}

async function submitAudit() {
    if (auditPayload.length === 0) return alert("Please audit at least one item.");
    if (!confirm("Confirm submission of this audit report?")) return;

    const btn = document.getElementById('btnSubmit');
    btn.disabled = true;
    btn.innerText = "Processing...";

    try {
        const res = await fetch(`${API_URL}?action=saveAudit&auditData=${encodeURIComponent(JSON.stringify(auditPayload))}`);
        const result = await res.json();
        if (result.success) {
            alert("✅ Audit Report successfully archived to Google Sheets.");
            location.reload();
        }
    } catch (e) {
        alert("Submission failed.");
        btn.disabled = false;
        btn.innerText = "Submit Report";
    }
}
