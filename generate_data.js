const fs = require('fs');
const data = ['date,product,category,region,salesperson,quantity,unit_price,revenue,cost,profit'];
const products = [
  {name: 'Enterprise Server X', p: 5000, c: 3000},
  {name: 'Cloud Storage Tier 1', p: 100, c: 20},
  {name: 'Consulting Retainer', p: 10000, c: 2000}
];
const regions = ['North America', 'Europe', 'Asia'];
const reps = ['Alice', 'Bob', 'Charlie', 'Unknown'];

for(let i=0; i<300; i++) {
  const d = new Date(2026, 3, Math.floor(Math.random()*28)+1).toISOString().split('T')[0];
  const prod = products[Math.floor(Math.random() * products.length)];
  const reg = regions[Math.floor(Math.random() * regions.length)];
  const rep = reps[Math.floor(Math.random() * reps.length)];
  
  let qty = Math.floor(Math.random()*10)+1;
  // Anomaly 1: Europe has 0 sales for Enterprise Server X
  if (reg === 'Europe' && prod.name === 'Enterprise Server X') qty = 0;
  // Anomaly 2: 'Unknown' rep has huge sales
  if (rep === 'Unknown') qty = qty * 3;
  
  const rev = qty * prod.p;
  const cost = qty * prod.c;
  const prof = rev - cost;
  
  if (qty > 0) {
    data.push(`${d},${prod.name},Tech,${reg},${rep},${qty},${prod.p},${rev},${cost},${prof}`);
  }
}
fs.writeFileSync('custom_sales_data.csv', data.join('\n'));
