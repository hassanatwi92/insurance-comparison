const express = require('express');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// الاتصال بالـ MongoDB
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("Connected to MongoDB");
}).catch(err => {
  console.error("MongoDB connection error:", err);
});

// تعريف Schema للشركات
const companySchema = new mongoose.Schema({
  name: String,
  plans: {
    basic: [
      {
        yearFrom: Number,
        yearTo: Number,
        prices: [{ min: Number, max: Number, percent: Number }]
      }
    ],
    advanced: [
      {
        yearFrom: Number,
        yearTo: Number,
        prices: [{ min: Number, max: Number, percent: Number }]
      }
    ]
  }
});

const Company = mongoose.model('Company', companySchema);

// حساب السعر
function calculatePrice(carYear, carPrice, companies) {
  return companies.map(company => {

    function getPriceForPlan(planName) {
      const plan = company.plans[planName];
      if (!plan) return null;

      const yearGroup = plan.find(p => carYear >= p.yearFrom && carYear <= p.yearTo);
      if (!yearGroup) return null;

      const priceRange = yearGroup.prices.find(r => carPrice >= r.min && carPrice <= r.max);
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

// API لحساب السعر
app.post('/calculate', async (req, res) => {
  const { year, price } = req.body;
  if (!year || !price) return res.status(400).json({ error: "Year and price are required" });

  const companies = await Company.find();
  const result = calculatePrice(year, price, companies);
  res.json(result);
});

// API للشركات
app.get('/api/companies', async (req, res) => {
  const companies = await Company.find();
  res.json(companies);
});

app.post('/api/companies', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });

  const newCompany = new Company({ name, plans: { basic: [], advanced: [] } });
  await newCompany.save();
  res.json(newCompany);
});

app.put('/api/companies/:id', async (req, res) => {
  const { id } = req.params;
  const { name, plans } = req.body;

  const company = await Company.findById(id);
  if (!company) return res.status(404).json({ error: "Company not found" });

  company.name = name;
  company.plans = plans;
  await company.save();

  res.json(company);
});

app.delete('/api/companies/:id', async (req, res) => {
  const { id } = req.params;
  await Company.findByIdAndDelete(id);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
