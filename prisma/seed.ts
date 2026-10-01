import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting realistic Indian PharmacyOS seed...");

  // 1. Create Organization
  const org = await prisma.organization.upsert({
    where: { slug: "apollo-health" },
    update: {},
    create: {
      name: "Apollo Health Medicos",
      slug: "apollo-health",
      gstin: "07AAAAA1234A1Z5",
      dlNumber: "DL-2024-DEL-98765",
      phone: "+91 98110 12345",
      email: "contact@apollohealth.in",
      address: "B-12, Inner Circle, Connaught Place, New Delhi",
      brandColor: "#059669",
    },
  });

  // 2. Create Stores
  const store1 = await prisma.store.upsert({
    where: { id: "store-cp-main" },
    update: {},
    create: {
      id: "store-cp-main",
      organizationId: org.id,
      name: "Apollo Medicos — Connaught Place (Main Flagship)",
      code: "CP-01",
      address: "B-12, Ground Floor, Inner Circle, Connaught Place",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110001",
      phone: "+91 98110 12345",
      email: "cp@apollohealth.in",
      dlNumber: "DL-01-20B-9871",
      gstin: "07AAAAA1234A1Z5",
      is24x7: true,
      openTime: "00:00",
      closeTime: "23:59",
      deliveryEnabled: true,
      deliveryFee: 35.0,
      minOrderValue: 150.0,
    },
  });

  const store2 = await prisma.store.upsert({
    where: { id: "store-gp-branch" },
    update: {},
    create: {
      id: "store-gp-branch",
      organizationId: org.id,
      name: "Apollo Medicos — Green Park Branch",
      code: "GP-02",
      address: "S-45, Main Market, Green Park",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110016",
      phone: "+91 98110 54321",
      email: "gp@apollohealth.in",
      dlNumber: "DL-02-20B-4321",
      gstin: "07AAAAA1234A1Z5",
      is24x7: false,
      openTime: "09:00",
      closeTime: "22:30",
      deliveryEnabled: true,
      deliveryFee: 30.0,
      minOrderValue: 100.0,
    },
  });

  // 3. Create Subscription
  await prisma.subscription.upsert({
    where: { id: "sub-apollo-growth" },
    update: {},
    create: {
      id: "sub-apollo-growth",
      organizationId: org.id,
      plan: "GROWTH",
      maxStores: 3,
      status: "ACTIVE",
      billingCycle: "MONTHLY",
      amount: 2999.0,
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // 4. Create Staff Users
  const owner = await prisma.user.upsert({
    where: { email: "owner@apollohealth.in" },
    update: {},
    create: {
      organizationId: org.id,
      name: "Dr. Rajesh Sharma",
      email: "owner@apollohealth.in",
      phone: "+91 98110 11111",
      passwordHash: "sharma123", // In dev demo
      role: "ORG_OWNER",
    },
  });

  const pharmacist = await prisma.user.upsert({
    where: { email: "pharmacist@apollohealth.in" },
    update: {},
    create: {
      organizationId: org.id,
      name: "Priya Nair, M.Pharm",
      email: "pharmacist@apollohealth.in",
      phone: "+91 98110 22222",
      passwordHash: "priya123",
      role: "REGISTERED_PHARMACIST",
      pharmacistRegNo: "PCI-DL-48291-R",
    },
  });

  const cashier = await prisma.user.upsert({
    where: { email: "cashier@apollohealth.in" },
    update: {},
    create: {
      organizationId: org.id,
      name: "Amit Kumar",
      email: "cashier@apollohealth.in",
      phone: "+91 98110 33333",
      passwordHash: "amit123",
      role: "CASHIER",
    },
  });

  // Assign staff to store 1
  await prisma.storeAssignment.upsert({
    where: { userId_storeId: { userId: owner.id, storeId: store1.id } },
    update: {},
    create: { userId: owner.id, storeId: store1.id, isDefault: true },
  });
  await prisma.storeAssignment.upsert({
    where: { userId_storeId: { userId: pharmacist.id, storeId: store1.id } },
    update: {},
    create: { userId: pharmacist.id, storeId: store1.id, isDefault: true },
  });
  await prisma.storeAssignment.upsert({
    where: { userId_storeId: { userId: cashier.id, storeId: store1.id } },
    update: {},
    create: { userId: cashier.id, storeId: store1.id, isDefault: true },
  });

  // 5. Create Shelf Intelligence Hierarchy (Physical Topology)
  const locGfFast1 = await prisma.location.upsert({
    where: { storeId_fullCode: { storeId: store1.id, fullCode: "GF/R-01/S-01/B-01" } },
    update: {},
    create: {
      storeId: store1.id,
      zone: "Ground Floor Counter",
      rack: "R-01 (OTC & Antipyretics)",
      shelf: "S-01 (Eye Level)",
      bin: "B-01 (Fast Dispense)",
      fullCode: "GF/R-01/S-01/B-01",
      pickingOrder: 10,
    },
  });

  const locGfFast2 = await prisma.location.upsert({
    where: { storeId_fullCode: { storeId: store1.id, fullCode: "GF/R-01/S-01/B-02" } },
    update: {},
    create: {
      storeId: store1.id,
      zone: "Ground Floor Counter",
      rack: "R-01 (OTC & Antipyretics)",
      shelf: "S-01 (Eye Level)",
      bin: "B-02",
      fullCode: "GF/R-01/S-01/B-02",
      pickingOrder: 15,
    },
  });

  const locGfAntibiotics = await prisma.location.upsert({
    where: { storeId_fullCode: { storeId: store1.id, fullCode: "GF/R-02/S-02/B-01" } },
    update: {},
    create: {
      storeId: store1.id,
      zone: "Ground Floor Counter",
      rack: "R-02 (Antibiotics & Anti-infectives)",
      shelf: "S-02 (Mid Level)",
      bin: "B-01",
      fullCode: "GF/R-02/S-02/B-01",
      pickingOrder: 20,
    },
  });

  const locColdStorage = await prisma.location.upsert({
    where: { storeId_fullCode: { storeId: store1.id, fullCode: "CS/REF-01/S-01/B-01" } },
    update: {},
    create: {
      storeId: store1.id,
      zone: "Cold Storage Refrigerator Room",
      rack: "REF-01 (Medical Grade 2-8°C)",
      shelf: "S-01 (Insulin & Vaccines)",
      bin: "B-01",
      fullCode: "CS/REF-01/S-01/B-01",
      pickingOrder: 5,
      temperatureControlled: true,
    },
  });

  const locLockedRx = await prisma.location.upsert({
    where: { storeId_fullCode: { storeId: store1.id, fullCode: "SEC/SAFE-01/S-01/B-01" } },
    update: {},
    create: {
      storeId: store1.id,
      zone: "Pharmacist Secure Room",
      rack: "SAFE-01 (Schedule H1 / X Locked Cabinet)",
      shelf: "S-01 (Controlled Drugs)",
      bin: "B-01",
      fullCode: "SEC/SAFE-01/S-01/B-01",
      pickingOrder: 50,
      isRestricted: true,
    },
  });

  // Store 2 Locations
  await prisma.location.upsert({
    where: { storeId_fullCode: { storeId: store2.id, fullCode: "MAIN/R-01/S-01/B-01" } },
    update: {},
    create: {
      storeId: store2.id,
      zone: "Main Dispense Counter",
      rack: "R-01",
      shelf: "S-01",
      bin: "B-01",
      fullCode: "MAIN/R-01/S-01/B-01",
      pickingOrder: 10,
    },
  });

  // 6. Create Suppliers
  const supplier1 = await prisma.supplier.upsert({
    where: { id: "supp-medilife" },
    update: {},
    create: {
      id: "supp-medilife",
      organizationId: org.id,
      name: "MediLife Pharma Distributors Pvt Ltd",
      contactPerson: "Vikram Malhotra",
      phone: "+91 98100 77777",
      email: "orders@medilifepharma.in",
      gstin: "07AABCM8921B1ZX",
      dlNumber: "DL-20B-11920",
      address: "Okhla Industrial Area Phase-III, New Delhi 110020",
      paymentTerms: "Net 30 Days",
      balanceAmount: 14500.0,
    },
  });

  // 7. Categories
  const catAntipyretic = await prisma.category.upsert({
    where: { organizationId_slug: { organizationId: org.id, slug: "fever-pain" } },
    update: {},
    create: { organizationId: org.id, name: "Fever & Pain Relief", slug: "fever-pain" },
  });

  const catAntibiotic = await prisma.category.upsert({
    where: { organizationId_slug: { organizationId: org.id, slug: "antibiotics" } },
    update: {},
    create: { organizationId: org.id, name: "Antibiotics & Anti-Infectives", slug: "antibiotics" },
  });

  const catGastro = await prisma.category.upsert({
    where: { organizationId_slug: { organizationId: org.id, slug: "gastro-antacid" } },
    update: {},
    create: { organizationId: org.id, name: "Gastrointestinal & Antacids", slug: "gastro-antacid" },
  });

  const catDiabetes = await prisma.category.upsert({
    where: { organizationId_slug: { organizationId: org.id, slug: "diabetes-care" } },
    update: {},
    create: { organizationId: org.id, name: "Diabetes & Insulin", slug: "diabetes-care" },
  });

  // 8. Products
  // 8.1 Dolo 650 (OTC)
  const prodDolo = await prisma.product.upsert({
    where: { id: "prod-dolo-650" },
    update: {},
    create: {
      id: "prod-dolo-650",
      organizationId: org.id,
      categoryId: catAntipyretic.id,
      name: "Dolo 650 Tablet",
      brandName: "Dolo",
      genericName: "Paracetamol",
      manufacturer: "Micro Labs Ltd",
      dosageForm: "TABLET",
      strength: "650 mg",
      packSize: "15 Tablets / Strip",
      unitsPerPack: 15,
      hsnCode: "30049060",
      gstRate: 12.0,
      schedule: "OTC",
      storageType: "ROOM_TEMP",
      requiresPrescription: false,
      mrp: 34.5,
      sellingPrice: 31.0,
      reorderLevel: 50,
      barcode: "8901148202018",
      sku: "DOL-650-TAB",
      description: "Fast antipyretic and analgesic tablet for fever and mild to moderate pain.",
    },
  });

  // 8.2 Augmentin 625 Duo (Schedule H1)
  const prodAugmentin = await prisma.product.upsert({
    where: { id: "prod-augmentin-625" },
    update: {},
    create: {
      id: "prod-augmentin-625",
      organizationId: org.id,
      categoryId: catAntibiotic.id,
      name: "Augmentin 625 Duo Tablet",
      brandName: "Augmentin",
      genericName: "Amoxicillin and Potassium Clavulanate",
      manufacturer: "GlaxoSmithKline Pharmaceuticals Ltd",
      dosageForm: "TABLET",
      strength: "500 mg + 125 mg",
      packSize: "10 Tablets / Strip",
      unitsPerPack: 10,
      hsnCode: "30041010",
      gstRate: 12.0,
      schedule: "SCHEDULE_H1",
      storageType: "COOL_DRY",
      requiresPrescription: true,
      mrp: 223.5,
      sellingPrice: 201.0,
      reorderLevel: 25,
      barcode: "8901067000887",
      sku: "AUG-625-DUO",
      description: "Broad-spectrum antibacterial for bacterial infections. Strict Schedule H1 drug.",
    },
  });

  // 8.3 Pan 40 (Schedule H)
  const prodPan40 = await prisma.product.upsert({
    where: { id: "prod-pan-40" },
    update: {},
    create: {
      id: "prod-pan-40",
      organizationId: org.id,
      categoryId: catGastro.id,
      name: "Pan 40 Tablet",
      brandName: "Pan",
      genericName: "Pantoprazole Gastro-resistant",
      manufacturer: "Alkem Laboratories Ltd",
      dosageForm: "TABLET",
      strength: "40 mg",
      packSize: "15 Tablets / Strip",
      unitsPerPack: 15,
      hsnCode: "30049099",
      gstRate: 12.0,
      schedule: "SCHEDULE_H",
      storageType: "ROOM_TEMP",
      requiresPrescription: true,
      mrp: 162.0,
      sellingPrice: 145.0,
      reorderLevel: 40,
      barcode: "8901234567890",
      sku: "PAN-40-TAB",
      description: "Proton pump inhibitor for acidity, GERD, and peptic ulcers.",
    },
  });

  // 8.4 Human Mixtard 30/70 (Cold Storage 2-8°C, Schedule H)
  const prodInsulin = await prisma.product.upsert({
    where: { id: "prod-mixtard-insulin" },
    update: {},
    create: {
      id: "prod-mixtard-insulin",
      organizationId: org.id,
      categoryId: catDiabetes.id,
      name: "Human Mixtard 30/70 100 IU/ml Suspension",
      brandName: "Human Mixtard",
      genericName: "Biphasic Isophane Insulin",
      manufacturer: "Novo Nordisk India Pvt Ltd",
      dosageForm: "INJECTION",
      strength: "100 IU/ml",
      packSize: "10 ml Vial",
      unitsPerPack: 1,
      hsnCode: "30043110",
      gstRate: 5.0,
      schedule: "SCHEDULE_H",
      storageType: "COLD_STORAGE_2_8C",
      requiresPrescription: true,
      mrp: 198.0,
      sellingPrice: 178.0,
      reorderLevel: 15,
      barcode: "8902888999123",
      sku: "MIX-3070-10ML",
      description: "Must maintain cold chain 2°C - 8°C. Do not freeze.",
    },
  });

  // 9. Batches & Physical Stock Allocation
  // 9.1 Dolo 650 - Batch 1: Valid FEFO batch
  const batchDolo1 = await prisma.batch.upsert({
    where: { storeId_productId_batchNumber: { storeId: store1.id, productId: prodDolo.id, batchNumber: "DL-24A01" } },
    update: {},
    create: {
      storeId: store1.id,
      productId: prodDolo.id,
      batchNumber: "DL-24A01",
      expiryDate: new Date("2026-12-31"), // Valid future
      mfgDate: new Date("2024-01-10"),
      purchaseCost: 20.0,
      mrp: 34.5,
      sellingPrice: 31.0,
      supplierId: supplier1.id,
      status: "ACTIVE",
    },
  });

  // Allocate 120 strips to GF/R-01/S-01/B-01
  await prisma.batchLocationStock.upsert({
    where: { batchId_locationId: { batchId: batchDolo1.id, locationId: locGfFast1.id } },
    update: {},
    create: { batchId: batchDolo1.id, locationId: locGfFast1.id, quantity: 120 },
  });

  // 9.2 Dolo 650 - Batch 2: Near Expiry (< 60 days) to demonstrate Expiry Center!
  const nearExpiryDate = new Date();
  nearExpiryDate.setDate(nearExpiryDate.getDate() + 45); // 45 days left
  const batchDoloNear = await prisma.batch.upsert({
    where: { storeId_productId_batchNumber: { storeId: store1.id, productId: prodDolo.id, batchNumber: "DL-23E99" } },
    update: {},
    create: {
      storeId: store1.id,
      productId: prodDolo.id,
      batchNumber: "DL-23E99",
      expiryDate: nearExpiryDate,
      mfgDate: new Date("2023-05-15"),
      purchaseCost: 19.5,
      mrp: 34.5,
      sellingPrice: 31.0,
      supplierId: supplier1.id,
      status: "ACTIVE",
    },
  });

  // Allocate 25 strips of near-expiry to bin 2
  await prisma.batchLocationStock.upsert({
    where: { batchId_locationId: { batchId: batchDoloNear.id, locationId: locGfFast2.id } },
    update: {},
    create: { batchId: batchDoloNear.id, locationId: locGfFast2.id, quantity: 25 },
  });

  // 9.3 Augmentin 625 - Active Batch
  const batchAug = await prisma.batch.upsert({
    where: { storeId_productId_batchNumber: { storeId: store1.id, productId: prodAugmentin.id, batchNumber: "AUG-509" } },
    update: {},
    create: {
      storeId: store1.id,
      productId: prodAugmentin.id,
      batchNumber: "AUG-509",
      expiryDate: new Date("2027-04-30"),
      mfgDate: new Date("2024-05-01"),
      purchaseCost: 145.0,
      mrp: 223.5,
      sellingPrice: 201.0,
      supplierId: supplier1.id,
      status: "ACTIVE",
    },
  });

  await prisma.batchLocationStock.upsert({
    where: { batchId_locationId: { batchId: batchAug.id, locationId: locGfAntibiotics.id } },
    update: {},
    create: { batchId: batchAug.id, locationId: locGfAntibiotics.id, quantity: 45 },
  });

  // 9.4 Insulin - Cold Storage Batch
  const batchInsulin = await prisma.batch.upsert({
    where: { storeId_productId_batchNumber: { storeId: store1.id, productId: prodInsulin.id, batchNumber: "MX-891" } },
    update: {},
    create: {
      storeId: store1.id,
      productId: prodInsulin.id,
      batchNumber: "MX-891",
      expiryDate: new Date("2026-11-30"),
      mfgDate: new Date("2024-06-01"),
      purchaseCost: 125.0,
      mrp: 198.0,
      sellingPrice: 178.0,
      supplierId: supplier1.id,
      status: "ACTIVE",
    },
  });

  await prisma.batchLocationStock.upsert({
    where: { batchId_locationId: { batchId: batchInsulin.id, locationId: locColdStorage.id } },
    update: {},
    create: { batchId: batchInsulin.id, locationId: locColdStorage.id, quantity: 30 },
  });

  // 10. Customer Demo & Sample Online Order
  const customer = await prisma.customer.upsert({
    where: { organizationId_phone: { organizationId: org.id, phone: "+91 99999 88888" } },
    update: {},
    create: {
      organizationId: org.id,
      name: "Sandeep Verma",
      phone: "+91 99999 88888",
      email: "sandeep.verma@example.com",
    },
  });

  await prisma.customerAddress.create({
    data: {
      customerId: customer.id,
      label: "Home",
      line1: "Flat 402, Royal Residency, Sector 15",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110001",
      isDefault: true,
    },
  });

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
