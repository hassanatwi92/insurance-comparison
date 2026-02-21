document.addEventListener("DOMContentLoaded", () => {

  const companiesDiv = document.getElementById('companies');
  const addCompanyBtn = document.getElementById('addCompanyBtn');

  // --- Fetch companies from server ---
  async function loadCompanies() {
    try {
      const res = await fetch('/api/companies');
      const companiesData = await res.json();
      renderCompanies(companiesData);
    } catch (err) {
      console.error("Error loading companies:", err);
    }
  }

  // --- Render companies ---
  function renderCompanies(companiesData) {
    companiesDiv.innerHTML = '';
    companiesData.forEach((company, ci) => {
      const compDiv = document.createElement('div');
      compDiv.className = 'company';
      compDiv.innerHTML = `
        <strong>${company.name}</strong>
        <button onclick="deleteCompany('${company._id}')">Delete Company</button><br>

        <div class="plan">
          <strong>Basic</strong> <button onclick="addYearRange('${company._id}', 'basic')">+ Year Range</button>
          <div id="basic-${company._id}"></div>
        </div>

        <div class="plan">
          <strong>Advanced</strong> <button onclick="addYearRange('${company._id}', 'advanced')">+ Year Range</button>
          <div id="advanced-${company._id}"></div>
        </div>

        <button onclick="saveCompany('${company._id}')">Save Company</button>
      `;
      companiesDiv.appendChild(compDiv);

      renderPlan(company, 'basic');
      renderPlan(company, 'advanced');
    });
  }

  function renderPlan(company, planName) {
    const planDiv = document.getElementById(`${planName}-${company._id}`);
    planDiv.innerHTML = '';

    (company.plans[planName] || []).forEach((yr, yi) => {
      const yrDiv = document.createElement('div');
      yrDiv.className = 'year-range';

      let pricesHTML = '';
      (yr.prices || []).forEach((p, pi) => {
        pricesHTML += `
          <div class="price-range">
            Min: <input type="number" value="${p.min}" onchange="updatePrice('${company._id}', '${planName}', ${yi}, ${pi}, 'min', this.value)">
            Max: <input type="number" value="${p.max}" onchange="updatePrice('${company._id}', '${planName}', ${yi}, ${pi}, 'max', this.value)">
            Percent: <input type="number" value="${p.percent}" step="0.1" onchange="updatePrice('${company._id}', '${planName}', ${yi}, ${pi}, 'percent', this.value)">
            <button onclick="deletePrice('${company._id}', '${planName}', ${yi}, ${pi})">Delete Price</button>
          </div>
        `;
      });

      yrDiv.innerHTML = `
        Year From: <input type="number" value="${yr.yearFrom}" onchange="updateYear('${company._id}', '${planName}', ${yi}, 'from', this.value)">
        To: <input type="number" value="${yr.yearTo}" onchange="updateYear('${company._id}', '${planName}', ${yi}, 'to', this.value)">
        <button onclick="addPrice('${company._id}', '${planName}', ${yi})">+ Price Range</button>
        <button onclick="deleteYear('${company._id}', '${planName}', ${yi})">Delete Year Range</button>
        ${pricesHTML}
      `;
      planDiv.appendChild(yrDiv);
    });
  }

  // --- Event handlers ---
  async function addCompany() {
    const name = prompt("Company name?");
    if (!name) return;
    await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    loadCompanies();
  }

  async function deleteCompany(id) {
    await fetch(`/api/companies/${id}`, { method: 'DELETE' });
    loadCompanies();
  }

  async function addYearRange(id, planName) {
    const res = await fetch(`/api/companies/${id}`);
    const company = await res.json();
    company.plans[planName].push({ yearFrom: 2020, yearTo: 2021, prices: [] });
    await fetch(`/api/companies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(company)
    });
    loadCompanies();
  }

  async function deleteYear(id, planName, yi) {
    const res = await fetch(`/api/companies/${id}`);
    const company = await res.json();
    company.plans[planName].splice(yi, 1);
    await fetch(`/api/companies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(company)
    });
    loadCompanies();
  }

  async function addPrice(id, planName, yi) {
    const res = await fetch(`/api/companies/${id}`);
    const company = await res.json();
    company.plans[planName][yi].prices.push({ min: 0, max: 10000, percent: 1 });
    await fetch(`/api/companies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(company)
    });
    loadCompanies();
  }

  async function deletePrice(id, planName, yi, pi) {
    const res = await fetch(`/api/companies/${id}`);
    const company = await res.json();
    company.plans[planName][yi].prices.splice(pi, 1);
    await fetch(`/api/companies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(company)
    });
    loadCompanies();
  }

  async function updateYear(id, planName, yi, field, value) {
    const res = await fetch(`/api/companies/${id}`);
    const company = await res.json();
    if (field === 'from') company.plans[planName][yi].yearFrom = parseInt(value);
    else company.plans[planName][yi].yearTo = parseInt(value);
    await fetch(`/api/companies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(company)
    });
  }

  async function updatePrice(id, planName, yi, pi, field, value) {
    const res = await fetch(`/api/companies/${id}`);
    const company = await res.json();
    if (field === 'min') company.plans[planName][yi].prices[pi].min = parseInt(value);
    else if (field === 'max') company.plans[planName][yi].prices[pi].max = parseInt(value);
    else company.plans[planName][yi].prices[pi].percent = parseFloat(value);
    await fetch(`/api/companies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(company)
    });
  }

  async function saveCompany(id) {
    // مجرد إعادة تحميل، لأن كل التعديلات صارت مباشرة في DB
    loadCompanies();
  }

  // --- Init ---
  addCompanyBtn.addEventListener('click', addCompany);
  loadCompanies();

});
