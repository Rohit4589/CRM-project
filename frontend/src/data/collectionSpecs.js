export const COLLECTION_MATERIAL_SPECS = {
  'Elite Collection': {
    title: 'Material Specifications – Elite Collection',
    items: [
      { label: '1. Board:', text: 'Standard Brand BWR Grade Full Core Plywood / HDHMR (18mm & 6mm, as applicable).' },
      { label: '2. External Finish:', text: 'Merino / Royale Touche / Greenlam or equivalent premium brand, with Laminate, Acrylic or Veneer finishes (SF/HGL/MR+ as applicable). Selected finishes applied to visible surfaces only; remaining in standard white finish.' },
      { label: '3. Internal Finish:', text: 'Regular Egg White, Fabric Texture or Selected Colour Laminate with Suede Finish, as specified.' },
      { label: '4. Edge Banding:', text: 'Best possible colour-matched edge banding, subject to availability and compatibility with selected finish.' },
      { label: '5. Hinges:', text: 'Onyx / Hettich / Häfele or equivalent premium brand, Soft-Close Hinges.' },
      { label: '6. Scope of Work:', text: 'Includes only specified items, materials, finishes, hardware and work. Any additional work or modifications charged separately.' }
    ],
    note: 'Handles, decorative items, special hardware and accessories are excluded unless specifically mentioned. Soft-close hinges are included as specified above.',
    additionalCharges: 'Any changes in model, design or material specifications, or special colours, premium finishes, veneer polishing or upgrades beyond quoted specifications, made after work is in process shall be charged extra at actual cost difference.'
  },
  'Essential Collection': {
    title: 'Material Specifications – Essential Collection',
    items: [
      { label: '1. Board:', text: 'Standard Brand Pre-Laminated Particle Board (18mm & 6mm, as applicable).' },
      { label: '2. External Finish:', text: 'Prism / Action Tesa or equivalent brand, SF/HGL finish. Selected colour applied to visible surfaces only; remaining in standard white finish.' },
      { label: '3. Internal Finish:', text: 'Regular Egg White Pre-Laminated Board with Suede Finish.' },
      { label: '4. Edge Banding:', text: 'Best possible colour-matched edge banding, subject to availability.' },
      { label: '5. Hinges:', text: 'Onyx or equivalent brand, Regular (Non-Soft-Close) Hinges.' },
      { label: '6. Scope of Work:', text: 'Includes only explicitly mentioned items, materials, specifications and work. Any additional work charged separately.' }
    ],
    note: 'Handles, decorative items, soft-close hinges, special hardware and accessories are excluded unless specifically mentioned.',
    additionalCharges: 'Any changes in model, design or material specifications, or special colours, finishes or material upgrades beyond standard range, made after work is in process shall be charged extra at actual cost difference.'
  },
  'Signature Collection': {
    title: 'Material Specifications – Signature Collection',
    items: [
      { label: '1. Plywood:', text: 'Standard Brand Alternate Plywood (Standard Thickness).' },
      { label: '2. External Laminate:', text: 'Merino / Greenlam or equivalent brand, SF/HGL finish (₹1,500–₹2,000 per sheet), applied to visible surfaces only.' },
      { label: '3. Internal Laminate:', text: 'Regular Egg White Laminate with Suede Finish.' },
      { label: '4. Edge Banding:', text: 'Best possible colour-matched edge banding, subject to availability.' },
      { label: '5. Hinges:', text: 'Onyx or equivalent Brand Regular (Non-Soft-Close) Hinges.' }
    ],
    note: 'Handles, decorative items, soft-close hinges, special hardware and accessories are excluded unless specifically mentioned in the quotation.',
    additionalCharges: 'Any changes in model, design or material specifications, or laminate selection exceeding the specified price range / requiring special finishes, made after work is in process shall be charged extra at actual cost difference.'
  }
};

export const getMaterialSpecsForCollection = (tier) => {
  const raw = String(tier || '').trim();
  if (raw === 'Modern' || raw.toLowerCase().includes('essential')) {
    return COLLECTION_MATERIAL_SPECS['Essential Collection'];
  }
  if (raw === 'Luxury' || raw.toLowerCase().includes('elite')) {
    return COLLECTION_MATERIAL_SPECS['Elite Collection'];
  }
  return COLLECTION_MATERIAL_SPECS['Signature Collection'];
};
