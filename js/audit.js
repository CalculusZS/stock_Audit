let auditRows = [];

async function loadAuditData() {
    const tbody = document.getElementById('data');
    tbody.innerHTML = '<tr><td colspan="4" align="center">⌛ Fetching Inventory...</td></tr>';
    await window.loadStockData('audit'); 
}

window.calculateDiff = (mat, systemQty) => {
    const actualInput = document.getElementById(`actual_${mat}`);
    const diffDisplay = document.getElementById(`diff_${mat}`);
    const actualQty = parseFloat(actualInput.value);

    if (!isNaN(actualQty)) {
        const diff = actualQty - systemQty;
        diffDisplay.innerText = diff > 0 ? `+${diff}` : diff;
        diffDisplay.style.color = diff === 0 ? "#22c55e" : "#ef4444";
        
        const item = rows.find(r => r.Material == mat);
        const auditIndex = auditRows.findIndex(a => a.material == mat);
        const auditObj = {
            auditor: sessionStorage.getItem('selectedUser') || "Auditor",
            material: mat,
            productName: item['Product Name'],
            systemQty: systemQty,
            actualQty: actualQty,
            diff: diff
        };

        if (auditIndex > -1) auditRows[auditIndex] = auditObj;
        else auditRows.push(auditObj);
    } else {
        diffDisplay.innerText = "-";
        diffDisplay.style.color = "#64748b";
    }
};

async function submitAudit() {
    if (auditRows.length === 0) return alert("Please enter at least one actual count.");
    if (!confirm(`Submit audit report for ${auditRows.length} items?`)) return;

    const btn = document.getElementById('btnSubmit');
    btn.disabled = true;
    btn.innerText = "Saving...";

    try {
        const url = `${API}?action=saveAudit&auditData=${encodeURIComponent(JSON.stringify(auditRows))}`;
        const response = await fetch(url);
        const res = await response.json();
        if (res.success) {
            alert("✅ Audit Report Saved Successfully!");
            window.goBack();
        }
    } catch (e) {
        alert("❌ Network Error: Could not save audit.");
        btn.disabled = false;
        btn.innerText = "Submit Report";
    }
}
