export const COLLECTION_MATERIAL_SPECS = {
  'Elite Collection': {
    title: 'MATERIAL SPECIFICATIONS – ELITE COLLECTION',
    items: [
      { label: '1. Board:', text: 'Standard Brand BWR Grade Full Core Plywood / HDHMR (18mm & 6mm, as applicable).' },
      { label: '2. External Finish:', text: 'Merino / Royale Touche / Greenlam or equivalent premium brand, with Laminate, Acrylic or Veneer finishes (SF/HGL/MR+ as applicable). Selected finishes shall be applied to visible surfaces only; remaining surfaces shall have a standard white finish unless otherwise specified.' },
      { label: '3. Internal Finish:', text: 'Regular Egg White, Fabric Texture or Selected Colour Laminate with Suede Finish, as specified in the quotation.' },
      { label: '4. Edge Banding:', text: 'Best possible colour-matched edge banding, subject to availability and compatibility with the selected finish.' },
      { label: '5. Hinges:', text: 'Onyx / Hettich / Häfele or equivalent premium brand, Soft-Close Hinges.' },
      { label: '6. Scope of Work:', text: 'The quotation includes only the specified items, materials, finishes, hardware and work. Any additional work, design modifications, special accessories or site requirements shall be charged separately, subject to customer approval.' }
    ],
    note: 'Handles, decorative items, special hardware and accessories are excluded unless specifically mentioned. Soft-close hinges are included as specified above.',
    additionalCharges: 'Special colours, premium finishes, veneer polishing, customized designs or material upgrades beyond the quoted specifications shall be charged extra at the actual cost difference.'
  },
  'Essential Collection': {
    title: 'MATERIAL SPECIFICATIONS – ESSENTIAL COLLECTION',
    items: [
      { label: '1. Board:', text: 'Standard Brand Pre-Laminated Particle Board (18mm & 6mm, as applicable).' },
      { label: '2. External Finish:', text: 'Prism / Action Tesa or equivalent brand, SF/HGL finish. Selected colour will be applied to visible surfaces only; remaining surfaces will be in standard white finish.' },
      { label: '3. Internal Finish:', text: 'Regular Egg White Pre-Laminated Board with Suede Finish.' },
      { label: '4. Edge Banding:', text: 'Best possible colour-matched edge banding, subject to availability.' },
      { label: '5. Hinges:', text: 'Onyx or equivalent brand, Regular (Non-Soft-Close) Hinges.' },
      { label: '6. Scope of Work:', text: 'Quotation includes only the items, materials, specifications and work explicitly mentioned. Any additional work, design changes, modifications, accessories or site requirements shall be charged separately upon customer approval.' }
    ],
    note: 'Handles, decorative items, soft-close hinges, special hardware and accessories are excluded unless specifically mentioned in the quotation.',
    additionalCharges: 'Special colours, finishes or material upgrades beyond the standard range shall be charged extra at the actual cost difference.'
  },
  'Signature Collection': {
    title: 'MATERIAL SPECIFICATIONS – SIGNATURE COLLECTION',
    items: [
      { label: '1. Plywood:', text: 'Standard Brand Alternate Plywood (Standard Thickness).' },
      { label: '2. External Laminate:', text: 'Merino / Greenlam or equivalent brand, SF/HGL finish (₹1,500–₹2,000 per sheet), applied to visible surfaces only.' },
      { label: '3. Internal Laminate:', text: 'Regular Egg White Laminate with Suede Finish.' },
      { label: '4. Edge Banding:', text: 'Best possible colour-matched edge banding, subject to availability.' },
      { label: '5. Hinges:', text: 'Onyx Brand Regular (Non-Soft-Close) Hinges.' }
    ],
    note: 'Handles, decorative items, soft-close hinges, special hardware and accessories are excluded unless specifically mentioned in the quotation.',
    additionalCharges: 'Any laminate selection exceeding the specified price range or requiring a special finish shall be charged extra at the actual cost difference.'
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
