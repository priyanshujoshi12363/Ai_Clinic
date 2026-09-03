import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },      // brand / common name
  generic: { type: String },                                // active ingredient
  form: { type: String, default: 'Tablet' },                // Tablet, Capsule, Syrup, Injection, Drops, Ointment
  strength: { type: String },                               // e.g. 500 mg
  category: { type: String },                               // Analgesic, Antibiotic, AYUSH ...
  defaultFrequency: { type: String, default: '1-0-1' },     // morning-noon-night
  defaultTiming: { type: String, default: 'After food' },   // Before / After food
  defaultDuration: { type: String, default: '5 days' },
  system: { type: String, enum: ['ALLOPATHY', 'AYUSH'], default: 'ALLOPATHY' }
}, { timestamps: true });

medicineSchema.index({ name: 'text', generic: 'text' });

const Medicine = mongoose.model('Medicine', medicineSchema);

// A practical OPD formulary used to seed the searchable medicine database.
export const MEDICINE_SEED = [
  ['Paracetamol', 'Paracetamol', 'Tablet', '500 mg', 'Analgesic / Antipyretic', '1-0-1', 'After food', '5 days'],
  ['Dolo 650', 'Paracetamol', 'Tablet', '650 mg', 'Analgesic / Antipyretic', '1-1-1', 'After food', '3 days'],
  ['Ibuprofen', 'Ibuprofen', 'Tablet', '400 mg', 'NSAID', '1-0-1', 'After food', '5 days'],
  ['Aceclofenac', 'Aceclofenac', 'Tablet', '100 mg', 'NSAID', '1-0-1', 'After food', '5 days'],
  ['Diclofenac', 'Diclofenac Sodium', 'Tablet', '50 mg', 'NSAID', '1-0-1', 'After food', '5 days'],
  ['Amoxicillin', 'Amoxicillin', 'Capsule', '500 mg', 'Antibiotic', '1-0-1', 'After food', '5 days'],
  ['Augmentin 625', 'Amoxicillin + Clavulanate', 'Tablet', '625 mg', 'Antibiotic', '1-0-1', 'After food', '5 days'],
  ['Azithromycin', 'Azithromycin', 'Tablet', '500 mg', 'Antibiotic', '1-0-0', 'After food', '3 days'],
  ['Ciprofloxacin', 'Ciprofloxacin', 'Tablet', '500 mg', 'Antibiotic', '1-0-1', 'After food', '5 days'],
  ['Metronidazole', 'Metronidazole', 'Tablet', '400 mg', 'Antibiotic / Antiprotozoal', '1-1-1', 'After food', '5 days'],
  ['Cefixime', 'Cefixime', 'Tablet', '200 mg', 'Antibiotic', '1-0-1', 'After food', '5 days'],
  ['Doxycycline', 'Doxycycline', 'Capsule', '100 mg', 'Antibiotic', '1-0-1', 'After food', '7 days'],
  ['Pantoprazole', 'Pantoprazole', 'Tablet', '40 mg', 'Proton pump inhibitor', '1-0-0', 'Before food', '10 days'],
  ['Omeprazole', 'Omeprazole', 'Capsule', '20 mg', 'Proton pump inhibitor', '1-0-0', 'Before food', '10 days'],
  ['Rantac', 'Ranitidine', 'Tablet', '150 mg', 'Antacid (H2 blocker)', '1-0-1', 'Before food', '7 days'],
  ['Digene', 'Antacid gel', 'Syrup', '—', 'Antacid', '1-1-1', 'After food', '5 days'],
  ['Ondansetron', 'Ondansetron', 'Tablet', '4 mg', 'Antiemetic', '1-0-1', 'Before food', '3 days'],
  ['Domperidone', 'Domperidone', 'Tablet', '10 mg', 'Antiemetic / Prokinetic', '1-0-1', 'Before food', '5 days'],
  ['Cetirizine', 'Cetirizine', 'Tablet', '10 mg', 'Antihistamine', '0-0-1', 'After food', '5 days'],
  ['Levocetirizine', 'Levocetirizine', 'Tablet', '5 mg', 'Antihistamine', '0-0-1', 'After food', '5 days'],
  ['Montair LC', 'Montelukast + Levocetirizine', 'Tablet', '10 mg', 'Anti-allergic', '0-0-1', 'After food', '10 days'],
  ['Chlorpheniramine', 'Chlorpheniramine Maleate', 'Tablet', '4 mg', 'Antihistamine', '1-0-1', 'After food', '3 days'],
  ['Ambroxol', 'Ambroxol', 'Syrup', '—', 'Mucolytic', '2-2-2 (tsp)', 'After food', '5 days'],
  ['Salbutamol', 'Salbutamol', 'Inhaler', '100 mcg', 'Bronchodilator', 'As needed', '—', '30 days'],
  ['Cough Syrup (Benadryl)', 'Diphenhydramine', 'Syrup', '—', 'Antitussive', '2-0-2 (tsp)', 'After food', '5 days'],
  ['Metformin', 'Metformin', 'Tablet', '500 mg', 'Antidiabetic', '1-0-1', 'After food', '30 days'],
  ['Glimepiride', 'Glimepiride', 'Tablet', '1 mg', 'Antidiabetic', '1-0-0', 'Before food', '30 days'],
  ['Amlodipine', 'Amlodipine', 'Tablet', '5 mg', 'Antihypertensive', '1-0-0', 'After food', '30 days'],
  ['Telmisartan', 'Telmisartan', 'Tablet', '40 mg', 'Antihypertensive', '1-0-0', 'Before food', '30 days'],
  ['Atenolol', 'Atenolol', 'Tablet', '50 mg', 'Beta blocker', '1-0-0', 'After food', '30 days'],
  ['Atorvastatin', 'Atorvastatin', 'Tablet', '10 mg', 'Statin', '0-0-1', 'After food', '30 days'],
  ['Aspirin', 'Aspirin', 'Tablet', '75 mg', 'Antiplatelet', '0-1-0', 'After food', '30 days'],
  ['Thyronorm', 'Levothyroxine', 'Tablet', '50 mcg', 'Thyroid hormone', '1-0-0', 'Empty stomach', '30 days'],
  ['ORS', 'Oral Rehydration Salts', 'Sachet', '—', 'Rehydration', 'As needed', 'After loose stool', '3 days'],
  ['Zincovit', 'Multivitamin + Zinc', 'Tablet', '—', 'Supplement', '1-0-0', 'After food', '15 days'],
  ['Shelcal 500', 'Calcium + Vitamin D3', 'Tablet', '500 mg', 'Supplement', '1-0-0', 'After food', '30 days'],
  ['Vitamin D3 (60k)', 'Cholecalciferol', 'Sachet', '60000 IU', 'Supplement', 'Once weekly', 'After food', '8 weeks'],
  ['Folic Acid', 'Folic Acid', 'Tablet', '5 mg', 'Supplement', '1-0-0', 'After food', '30 days'],
  ['Ferrous Ascorbate', 'Iron + Folic Acid', 'Tablet', '100 mg', 'Haematinic', '1-0-0', 'After food', '30 days'],
  ['B-Complex', 'Vitamin B Complex', 'Tablet', '—', 'Supplement', '1-0-0', 'After food', '15 days'],
  ['Prednisolone', 'Prednisolone', 'Tablet', '10 mg', 'Corticosteroid', '1-0-0', 'After food', '5 days'],
  ['Dexamethasone', 'Dexamethasone', 'Tablet', '0.5 mg', 'Corticosteroid', '1-0-1', 'After food', '3 days'],
  ['Hydroxyzine', 'Hydroxyzine', 'Tablet', '25 mg', 'Antihistamine / Anxiolytic', '0-0-1', 'After food', '5 days'],
  ['Tramadol', 'Tramadol', 'Tablet', '50 mg', 'Opioid analgesic', '1-0-1', 'After food', '3 days'],
  ['Gabapentin', 'Gabapentin', 'Capsule', '300 mg', 'Neuropathic pain', '0-0-1', 'After food', '15 days'],
  ['Pregabalin', 'Pregabalin', 'Capsule', '75 mg', 'Neuropathic pain', '0-0-1', 'After food', '15 days'],
  ['Sumatriptan', 'Sumatriptan', 'Tablet', '50 mg', 'Anti-migraine', 'As needed', 'After food', '—'],
  ['Norflox TZ', 'Norfloxacin + Tinidazole', 'Tablet', '—', 'Antidiarrhoeal', '1-0-1', 'After food', '3 days'],
  ['Loperamide', 'Loperamide', 'Tablet', '2 mg', 'Antidiarrhoeal', 'After each stool', '—', '2 days'],
  ['Dicyclomine', 'Dicyclomine', 'Tablet', '10 mg', 'Antispasmodic', '1-0-1', 'Before food', '3 days'],
  ['Meftal Spas', 'Mefenamic Acid + Dicyclomine', 'Tablet', '—', 'Antispasmodic / Analgesic', '1-0-1', 'After food', '3 days'],
  ['Silverex', 'Silver Sulfadiazine', 'Ointment', '—', 'Topical antibiotic', 'Apply', 'Local', '7 days'],
  ['Betadine', 'Povidone Iodine', 'Ointment', '—', 'Antiseptic', 'Apply', 'Local', '7 days'],
  ['Eye Drops (Ciprofloxacin)', 'Ciprofloxacin', 'Drops', '0.3%', 'Ophthalmic antibiotic', '1 drop x4', 'Local', '5 days'],
  // AYUSH
  ['Ashwagandha', 'Withania somnifera', 'Tablet', '500 mg', 'AYUSH — Rasayana', '1-0-1', 'After food', '30 days', 'AYUSH'],
  ['Triphala Churna', 'Triphala', 'Powder', '—', 'AYUSH — Digestive', '0-0-1 (tsp)', 'Before bed with warm water', '30 days', 'AYUSH'],
  ['Giloy', 'Tinospora cordifolia', 'Tablet', '500 mg', 'AYUSH — Immunity', '1-0-1', 'After food', '30 days', 'AYUSH'],
  ['Sitopaladi Churna', 'Sitopaladi', 'Powder', '—', 'AYUSH — Respiratory', '1-0-1 (tsp)', 'With honey after food', '15 days', 'AYUSH'],
  ['Liv 52', 'Herbomineral', 'Tablet', '—', 'AYUSH — Hepatoprotective', '1-0-1', 'After food', '30 days', 'AYUSH'],
];

export const seedMedicines = async () => {
  const count = await Medicine.estimatedDocumentCount();
  if (count > 0) return { seeded: false, count };
  const docs = MEDICINE_SEED.map((m) => ({
    name: m[0], generic: m[1], form: m[2], strength: m[3], category: m[4],
    defaultFrequency: m[5], defaultTiming: m[6], defaultDuration: m[7],
    system: m[8] || 'ALLOPATHY'
  }));
  await Medicine.insertMany(docs);
  return { seeded: true, count: docs.length };
};

export default Medicine;
