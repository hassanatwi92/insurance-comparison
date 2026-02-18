window.addEventListener("DOMContentLoaded", () => {

  const companiesDiv = document.getElementById('companies');
  const addCompanyBtn = document.getElementById('addCompanyBtn');
  let companiesData = [];

  // Fetch companies
  async function loadCompanies() {
    const res = await fetch('/api/companies');
    companiesData = await res.json();
    renderCompanies();
  }

  function renderCompanies() {
    companiesDiv.innerHTML = '';
    companiesData.forEach((company, ci) => {
      const compDiv = document.createElement('div');
      compDiv.className = 'company';
      compDiv.innerHTML = `
        <strong>${company.name}</strong>
        <button onclick="deleteCompany(${company.id})">Delete Company</button><br>

        <div class="plan">
          <strong>Basic</strong> <button onclick="addYearRange(${ci}, 'basic')">+ Year Range</button>
          <div id="basic-${ci}"></div>
        </div>

        <div class="plan">
          <strong>Advanced</strong> <button onclick="addYearRange(${ci}, 'advanced')">+ Year Range</button>
          <div id="advanced-${ci}"></div>
        </div>

        <button onclick="saveCompany(${ci})">Save Company</button>
      `;
      companiesDiv.appendChild(compDiv);

      renderPlan(company, ci, 'basic');
      renderPlan(company, ci, 'advanced');
    });
  }

  function renderPlan(company, ci, planName) {
    const planDiv = document.getElementById(`${planName}-${ci}`);
    planDiv.innerHTML = '';

    company.plans[planName].forEach((yr, yi) => {
      const yrDiv = document.createElement('div');
      yrDiv.className = 'year-range';

      let pricesHTML = '';
      yr.prices.forEach((p, pi) => {
        pricesHTML += `
          <div class="price-range">
            Min: <input type="number" value="${p.min}" onchange="updatePrice(${ci}, '${planName}', ${yi}, ${pi}, 'min', this.value)">
            Max: <input type="number" value="${p.max}" onchange="updatePrice(${ci}, '${planName}', ${yi}, ${pi}, 'max', this.value)">
            Percent: <input type="number" value="${p.percent}" step="0.1" onchange="updatePrice(${ci}, '${planName}', ${yi}, ${pi}, 'percent', this.value)">
            <button onclick="deletePrice(${ci}, '${planName}', ${yi}, ${pi})">Delete Price</button>
          </div>
        `;
      });

      yrDiv.innerHTML = `
        Year From: <input type="number" value="${yr.yearFrom}" onchange="updateYear(${ci}, '${planName}', ${yi}, 'from', this.value)">
        To: <input type="number" value="${yr.yearTo}" onchange="updateYear(${ci}, '${planName}', ${yi}, 'to', this.value)">
        <button onclick="addPrice(${ci}, '${planName}', ${yi})">+ Price Range</button>
        <button onclick="deleteYear(${ci}, '${planName}', ${yi})">Delete Year Range</button>
        ${pricesHTML}
      `;
      planDiv.appendChild(yrDiv);
    });
  }

  function addCompany() {
    const name = prompt("Company name?");
    if (!name) return;
    fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    }).then(loadCompanies);
  }

  function deleteCompany(id) {
    fetch(`/api/companies/${id}`, { method: 'DELETE' }).then(loadCompanies);
  }

  function addYearRange(ci, planName) {
    companiesData[ci].plans[planName].push({ yearFrom: 2020, yearTo: 2021, prices: [] });
    renderPlan(companiesData[ci], ci, planName);
  }

  function deleteYear(ci, planName, yi) {
    companiesData[ci].plans[planName].splice(yi, 1);
    renderPlan(companiesData[ci], ci, planName);
  }

  function addPrice(ci, planName, yi) {
    companiesData[ci].plans[planName][yi].prices.push({ min: 0, max: 10000, percent: 1 });
    renderPlan(companiesData[ci], ci, planName);
  }

  function deletePrice(ci, planName, yi, pi) {
    companiesData[ci].plans[planName][yi].prices.splice(pi, 1);
    renderPlan(companiesData[ci], ci, planName);
  }

  function updateYear(ci, planName, yi, field, value) {
    if (field === 'from') companiesData[ci].plans[planName][yi].yearFrom = parseInt(value);
    else companiesData[ci].plans[planName][yi].yearTo = parseInt(value);
  }

  function updatePrice(ci, planName, yi, pi, field, value) {
    if (field === 'min') companiesData[ci].plans[planName][yi].prices[pi].min = parseInt(value);
    else if (field === 'max') companiesData[ci].plans[planName][yi].prices[pi].max = parseInt(value);
    else companiesData[ci].plans[planName][yi].prices[pi].percent = parseFloat(value);
  }

  function saveCompany(ci) {
    const company = companiesData[ci];
    fetch(`/api/companies/${company.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(company)
    }).then(loadCompanies);
  }

  addCompanyBtn.addEventListener('click', addCompany);
  loadCompanies();

  window.addYearRange = addYearRange;
window.deleteYear = deleteYear;
window.addPrice = addPrice;
window.deletePrice = deletePrice;
window.updateYear = updateYear;
window.updatePrice = updatePrice;
window.saveCompany = saveCompany;
window.deleteCompany = deleteCompany;

});