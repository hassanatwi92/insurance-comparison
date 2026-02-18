const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// بيانات الشركات (مؤقتة – بعدين منربطها بداتا)
let companies = [
  {
    id: 1,
    name: "Rock Mutual",
    plans: {
      basic: [
        {
          yearFrom: 2013,
          yearTo: 2015,
          prices: [
            { min: 0, max: 25000, percent: 3.75 },
            { min: 25001, max: 50000, percent: 3.5 },
            { min: 50001, max: 100000, percent: 3 }
          ]
        }
      ],
      advanced: []
    }
  }
];

// حساب السعر
function calculatePrice(carYear, carPrice) {
  return companies.map(company => {

    function getPriceForPlan(planName) {
      const plan = company.plans[planName];

      if (!plan) return null;

      // نلاقي فترة السنة المناسبة
      const yearGroup = plan.find(p =>
        carYear >= p.yearFrom && carYear <= p.yearTo
      );

      if (!yearGroup) return null;

      // نلاقي شريحة السعر المناسبة
      const priceRange = yearGroup.prices.find(r =>
        carPrice >= r.min && carPrice <= r.max
      );

      if (!priceRange) return null;

      return Math.round(carPrice * (priceRange.percent / 100));
    }

    return {
      company: company.name,
      basic: getPriceForPlan("basic"),
      advanced: getPriceForPlan("advanced")
    };
  });
}


// API
app.post('/calculate', (req, res) => {
  const { year, price } = req.body;

  if (!year || !price) {
    return res.status(400).json({ error: "Year and price are required" });
  }

  const result = calculatePrice(year, price);
  res.json(result);
});

// Companies data (initial)


// Get all companies
app.get('/api/companies', (req, res) => {
  res.json(companies);
});

// Add new company
app.post('/api/companies', (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  if (companies.length >= 5) {
    return res.status(400).json({ error: "Max 5 companies allowed" });
  }

  const newCompany = {
    id: Date.now(),
    name,
    plans: {
      basic: [],
      advanced: []
    }
  };

  companies.push(newCompany);
  res.json(newCompany);
});

// Update company
app.put('/api/companies/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const company = companies.find(c => c.id === id);

  if (!company) {
    return res.status(404).json({ error: "Company not found" });
  }

  const { name, plans } = req.body;

  company.name = name;
  company.plans = plans;

  res.json(company);
});

// Delete company
app.delete('/api/companies/:id', (req, res) => {
  const id = parseInt(req.params.id);
  companies = companies.filter(c => c.id !== id);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});