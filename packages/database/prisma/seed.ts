import { PrismaClient, RoleCode, ComplaintStatus } from '@prisma/client';

// Dev-only seed (F0-04). All upserts are idempotent — safe to run repeatedly.
// No real credentials, production secrets, or real customer data.
// Requires a running PostgreSQL with DATABASE_URL set.
// Run: corepack pnpm db:seed

const prisma = new PrismaClient();
const DEV_STAFF_PASSWORD_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$c2VlZC1hdXRoLWRldi1zYWx0$Ee8H+eXW8u5+8ZBASu1hC3K0c1GkCvh9V7D2Y5zWn1Y';

async function main(): Promise<void> {
  // ── Branches ─────────────────────────────────────────────────────────────
  const [mainBranch, northBranch] = await Promise.all([
    prisma.branch.upsert({
      where: { code: 'MAIN' },
      update: {},
      create: { code: 'MAIN', nameEn: 'Main Branch', nameAr: 'الفرع الرئيسي' },
    }),
    prisma.branch.upsert({
      where: { code: 'NORTH' },
      update: {},
      create: { code: 'NORTH', nameEn: 'North Branch', nameAr: 'فرع الشمال' },
    }),
  ]);

  // ── Roles ─────────────────────────────────────────────────────────────────
  const roleDefs: { code: RoleCode; nameEn: string; nameAr: string }[] = [
    { code: RoleCode.CR_OFFICER,      nameEn: 'CR Officer',           nameAr: 'موظف علاقات العملاء' },
    { code: RoleCode.CR_MANAGER,      nameEn: 'CR Manager',           nameAr: 'مدير علاقات العملاء' },
    { code: RoleCode.BRANCH_MANAGER,  nameEn: 'Branch Manager',       nameAr: 'مدير الفرع' },
    { code: RoleCode.ADMIN,           nameEn: 'System Admin',         nameAr: 'مدير النظام' },
    { code: RoleCode.MGMT_READONLY,   nameEn: 'Management Read-Only', nameAr: 'إدارة للاطلاع فقط' },
    { code: RoleCode.CUSTOMER_PORTAL, nameEn: 'Customer Portal',      nameAr: 'بوابة العملاء' },
  ];

  const roleMap = new Map<RoleCode, string>();
  for (const def of roleDefs) {
    const role = await prisma.role.upsert({
      where: { code: def.code },
      update: {},
      create: def,
    });
    roleMap.set(def.code, role.id);
  }

  // ── Staff users (dev-only, no real credentials) ───────────────────────────
  const adminRoleId  = roleMap.get(RoleCode.ADMIN)!;
  const crMgrRoleId  = roleMap.get(RoleCode.CR_MANAGER)!;
  const crOffRoleId  = roleMap.get(RoleCode.CR_OFFICER)!;
  const brnMgrRoleId = roleMap.get(RoleCode.BRANCH_MANAGER)!;

  await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@cms-auto.test' },
      update: { passwordHash: DEV_STAFF_PASSWORD_HASH },
      create: {
        email: 'admin@cms-auto.test',
        nameEn: 'System Admin',
        nameAr: 'مدير النظام',
        passwordHash: DEV_STAFF_PASSWORD_HASH,
        roleId: adminRoleId,
      },
    }),
    prisma.user.upsert({
      where: { email: 'cr.manager@cms-auto.test' },
      update: { passwordHash: DEV_STAFF_PASSWORD_HASH },
      create: {
        email: 'cr.manager@cms-auto.test',
        nameEn: 'Layla Al-Farsi',
        nameAr: 'ليلى الفارسي',
        passwordHash: DEV_STAFF_PASSWORD_HASH,
        roleId: crMgrRoleId,
        branchId: mainBranch.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'officer.main@cms-auto.test' },
      update: { passwordHash: DEV_STAFF_PASSWORD_HASH },
      create: {
        email: 'officer.main@cms-auto.test',
        nameEn: 'Omar Al-Khalidi',
        nameAr: 'عمر الخالدي',
        passwordHash: DEV_STAFF_PASSWORD_HASH,
        roleId: crOffRoleId,
        branchId: mainBranch.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'branch.mgr.north@cms-auto.test' },
      update: { passwordHash: DEV_STAFF_PASSWORD_HASH },
      create: {
        email: 'branch.mgr.north@cms-auto.test',
        nameEn: 'Sara Al-Dosari',
        nameAr: 'سارة الدوسري',
        passwordHash: DEV_STAFF_PASSWORD_HASH,
        roleId: brnMgrRoleId,
        branchId: northBranch.id,
      },
    }),
  ]);

  // ── Categories ────────────────────────────────────────────────────────────
  const categoryDefs = [
    { code: 'ENGINE',      nameEn: 'Engine & Mechanical',  nameAr: 'المحرك والميكانيكا' },
    { code: 'BODY_PAINT',  nameEn: 'Body & Paint',         nameAr: 'الهيكل والطلاء' },
    { code: 'SVC_QUALITY', nameEn: 'Service Quality',      nameAr: 'جودة الخدمة' },
    { code: 'SALES',       nameEn: 'Sales Complaint',      nameAr: 'شكوى مبيعات' },
    { code: 'FINANCE',     nameEn: 'Finance & Billing',    nameAr: 'المالية والفواتير' },
  ];

  const catMap = new Map<string, string>();
  for (const def of categoryDefs) {
    const cat = await prisma.category.upsert({
      where: { code: def.code },
      update: {},
      create: def,
    });
    catMap.set(def.code, cat.id);
  }

  // ── Customers (dev-only, fictional data) ──────────────────────────────────
  const [customerA, customerB] = await Promise.all([
    prisma.customer.upsert({
      where: { phone: '+966500000001' },
      update: {},
      create: {
        nameEn: 'Faisal Al-Otaibi',
        nameAr: 'فيصل العتيبي',
        phone: '+966500000001',
        email: 'faisal.seed@cms-auto.test',
      },
    }),
    prisma.customer.upsert({
      where: { phone: '+966500000002' },
      update: {},
      create: {
        nameEn: 'Nora Al-Qahtani',
        nameAr: 'نورة القحطاني',
        phone: '+966500000002',
      },
    }),
  ]);

  // ── Vehicles (fictional VINs) ─────────────────────────────────────────────
  const [vehicle1, vehicle2] = await Promise.all([
    prisma.vehicle.upsert({
      where: { vin: 'SEEDDEMO00001' },
      update: {},
      create: { vin: 'SEEDDEMO00001', plate: 'ABC-1234', makeEn: 'Toyota', modelEn: 'Camry', year: 2022 },
    }),
    prisma.vehicle.upsert({
      where: { vin: 'SEEDDEMO00002' },
      update: {},
      create: { vin: 'SEEDDEMO00002', plate: 'XYZ-5678', makeEn: 'Hyundai', modelEn: 'Sonata', year: 2023 },
    }),
  ]);

  // ── Complaints in different states ────────────────────────────────────────
  await Promise.all([
    prisma.complaint.upsert({
      where: { referenceNumber: 'CMP-SEED-001' },
      update: {},
      create: {
        referenceNumber: 'CMP-SEED-001',
        status: ComplaintStatus.SUBMITTED,
        branchId: mainBranch.id,
        categoryId: catMap.get('ENGINE')!,
        customerId: customerA.id,
        vehicleId: vehicle1.id,
        descriptionEn: 'Engine makes a knocking noise after cold start.',
        descriptionAr: 'يصدر المحرك صوتاً طارقاً عند بدء التشغيل بالبارد.',
      },
    }),
    prisma.complaint.upsert({
      where: { referenceNumber: 'CMP-SEED-002' },
      update: {},
      create: {
        referenceNumber: 'CMP-SEED-002',
        status: ComplaintStatus.IN_PROGRESS,
        branchId: northBranch.id,
        categoryId: catMap.get('SVC_QUALITY')!,
        customerId: customerB.id,
        vehicleId: vehicle2.id,
        descriptionEn: 'Service appointment was delayed by two hours without prior notification.',
        descriptionAr: 'تأخر موعد الخدمة ساعتين دون إشعار مسبق.',
      },
    }),
    prisma.complaint.upsert({
      where: { referenceNumber: 'CMP-SEED-003' },
      update: {},
      create: {
        referenceNumber: 'CMP-SEED-003',
        status: ComplaintStatus.RESOLVED,
        branchId: mainBranch.id,
        categoryId: catMap.get('BODY_PAINT')!,
        customerId: customerA.id,
        descriptionEn: 'Paint bubbling on the rear bumper within the warranty period.',
        descriptionAr: 'تقشر الطلاء على الصدام الخلفي ضمن فترة الضمان.',
      },
    }),
  ]);

  console.log('Seed complete: 2 branches, 6 roles, 4 users, 5 categories, 2 customers, 2 vehicles, 3 complaints.');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
