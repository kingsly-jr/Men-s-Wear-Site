import {
  DiscountType,
  InventoryMovementReason,
  PrismaClient,
  ProductStatus,
  UserRole,
} from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

async function main() {
  const adminEmail =
    process.env.ADMIN_SEED_EMAIL ?? "admin@crimsonterminal.store";
  const adminPassword =
    process.env.ADMIN_SEED_PASSWORD ?? "ChangeMeImmediately123!";
  const adminName = process.env.ADMIN_SEED_NAME ?? "Chief Store Administrator";

  // 1. Store Settings
  await prisma.storeSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      brandName: "CRIMSON TERMINAL",
      contactEmail: "concierge@crimsonterminal.store",
      contactPhone: "+91 800-555-0199",
      storeAddress: "14 Obsidian Arcade, Colaba, Mumbai 400001",
      currencyCode: "INR",
      currencySymbol: "₹",
      taxRatePercent: 12.0,
      freeShippingThreshold: 2999.0,
      defaultShippingFee: 199.0,
      defaultLowStockThreshold: 5,
      returnWindowDays: 14,
    },
  });

  // 2. Initial Admin & Sample Customer
  const adminPasswordHash = await hashPassword(adminPassword);
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail.toLowerCase() },
    update: {},
    create: {
      email: adminEmail.toLowerCase(),
      name: adminName,
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      isActive: true,
      emailVerifiedAt: new Date(),
    },
  });

  const customerPasswordHash = await hashPassword("CustomerPass123!");
  await prisma.user.upsert({
    where: { email: "patron@crimsonterminal.store" },
    update: {},
    create: {
      email: "patron@crimsonterminal.store",
      name: "Aarav Mehta",
      phone: "+91 98200 11223",
      passwordHash: customerPasswordHash,
      role: UserRole.CUSTOMER,
      isActive: true,
      emailVerifiedAt: new Date(),
    },
  });

  // 3. Initial 11 Categories
  const categoryDefinitions = [
    {
      name: "T-Shirts",
      slug: "t-shirts",
      description: "Heavyweight combed jersey and architectural box-cut tees.",
      imageUrl:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
      sortOrder: 1,
    },
    {
      name: "Shirts",
      slug: "shirts",
      description: "Structured poplin, Oxford, and brushed twill dress shirts.",
      imageUrl:
        "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=80",
      sortOrder: 2,
    },
    {
      name: "Polo T-Shirts",
      slug: "polo-t-shirts",
      description: "Mercerized knit and pique polos with sharp collar lines.",
      imageUrl:
        "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=900&q=80",
      sortOrder: 3,
    },
    {
      name: "Jeans",
      slug: "jeans",
      description: "Raw selvedge and rinsed indigo tailored denim.",
      imageUrl:
        "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80",
      sortOrder: 4,
    },
    {
      name: "Trousers",
      slug: "trousers",
      description: "Pleated wool-blend, tapered chino, and technical trousers.",
      imageUrl:
        "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=900&q=80",
      sortOrder: 5,
    },
    {
      name: "Casual Wear",
      slug: "casual-wear",
      description: "Off-duty refined silhouettes for everyday rotation.",
      imageUrl:
        "https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&w=900&q=80",
      sortOrder: 6,
    },
    {
      name: "Formal Wear",
      slug: "formal-wear",
      description: "Sharp tailoring, blazers, and evening suiting.",
      imageUrl:
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80",
      sortOrder: 7,
    },
    {
      name: "Jackets",
      slug: "jackets",
      description: "Structured overshirts, leather blousons, and bombers.",
      imageUrl:
        "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80",
      sortOrder: 8,
    },
    {
      name: "Hoodies",
      slug: "hoodies",
      description: "500 GSM French terry monochrome hoodies.",
      imageUrl:
        "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80",
      sortOrder: 9,
    },
    {
      name: "Ethnic Wear",
      slug: "ethnic-wear",
      description: "Contemporary bandhgalas, kurtas, and festive tailoring.",
      imageUrl:
        "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&w=900&q=80",
      sortOrder: 10,
    },
    {
      name: "Accessories",
      slug: "accessories",
      description: "Full-grain leather belts, scarves, and minimalist hardware.",
      imageUrl:
        "https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=900&q=80",
      sortOrder: 11,
    },
  ];

  const categoriesBySlug = new Map<string, string>();
  for (const cat of categoryDefinitions) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        imageUrl: cat.imageUrl,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
      create: cat,
    });
    categoriesBySlug.set(cat.slug, record.id);
  }

  // 4. Initial 5 Collections
  const collectionDefinitions = [
    {
      name: "Everyday Essentials",
      slug: "everyday-essentials",
      description: "Core heavyweight basics built for relentless daily wear.",
      imageUrl:
        "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?auto=format&fit=crop&w=1000&q=80",
      sortOrder: 1,
    },
    {
      name: "Smart Casual",
      slug: "smart-casual",
      description: "Clean-lined shirts, knit polos, and tapered trousers.",
      imageUrl:
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1000&q=80",
      sortOrder: 2,
    },
    {
      name: "Formal Collection",
      slug: "formal-collection",
      description: "Architectural suiting and crisp evening silhouettes.",
      imageUrl:
        "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1000&q=80",
      sortOrder: 3,
    },
    {
      name: "Weekend Collection",
      slug: "weekend-collection",
      description: "Relaxed layers, raw denim, and unstructured overshirts.",
      imageUrl:
        "https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&w=1000&q=80",
      sortOrder: 4,
    },
    {
      name: "Seasonal Collection",
      slug: "seasonal-collection",
      description: "Limited-run outerwear and cold-weather textures.",
      imageUrl:
        "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80",
      sortOrder: 5,
    },
  ];

  const collectionsBySlug = new Map<string, string>();
  for (const col of collectionDefinitions) {
    const record = await prisma.collection.upsert({
      where: { slug: col.slug },
      update: {
        name: col.name,
        description: col.description,
        imageUrl: col.imageUrl,
        sortOrder: col.sortOrder,
        isActive: true,
      },
      create: col,
    });
    collectionsBySlug.set(col.slug, record.id);
  }

  // 5. Initial Catalog Products & Variants
  const productSeeds = [
    {
      name: "Obsidian Heavyweight Box Tee",
      slug: "obsidian-heavyweight-box-tee",
      sku: "CT-TEE-001",
      categorySlug: "t-shirts",
      collectionSlug: "everyday-essentials",
      description:
        "Cut from 280 GSM combed organic cotton jersey with a structured mock-rib collar and architectural dropped shoulder.",
      fabric: "100% Combed Organic Cotton (280 GSM)",
      material: "Single Jersey Knit",
      careInstructions: "Machine wash cold inside out. Do not tumble dry.",
      price: 1899,
      originalPrice: 2499,
      isFeatured: true,
      images: [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=900&q=80",
      ],
      variants: [
        { sku: "CT-TEE-001-BLK-M", size: "M", color: "Obsidian Black", colorHex: "#0A0A0A", stock: 18 },
        { sku: "CT-TEE-001-BLK-L", size: "L", color: "Obsidian Black", colorHex: "#0A0A0A", stock: 14 },
        { sku: "CT-TEE-001-CRM-L", size: "L", color: "Deep Crimson", colorHex: "#8B1A1A", stock: 9 },
      ],
    },
    {
      name: "Tailored Charcoal Poplin Shirt",
      slug: "tailored-charcoal-poplin-shirt",
      sku: "CT-SHT-002",
      categorySlug: "shirts",
      collectionSlug: "smart-casual",
      description:
        "Crisp Italian-weave cotton poplin tailored with hidden placket stitching and mother-of-pearl buttons.",
      fabric: "100% Two-Ply Cotton Poplin",
      material: "Woven Poplin",
      careInstructions: "Gentle wash cold. Steam press on low.",
      price: 3499,
      originalPrice: 4299,
      isFeatured: true,
      images: [
        "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=80",
      ],
      variants: [
        { sku: "CT-SHT-002-CHR-M", size: "M", color: "Charcoal", colorHex: "#262626", stock: 12 },
        { sku: "CT-SHT-002-CHR-L", size: "L", color: "Charcoal", colorHex: "#262626", stock: 10 },
        { sku: "CT-SHT-002-WHT-M", size: "M", color: "Bone White", colorHex: "#F4F4F5", stock: 7 },
      ],
    },
    {
      name: "Crimson Edge Wool-Blend Jacket",
      slug: "crimson-edge-wool-blend-jacket",
      sku: "CT-JKT-003",
      categorySlug: "jackets",
      collectionSlug: "seasonal-collection",
      description:
        "Structured cropped blouson jacket with brushed Melton wool exterior, concealed storm zip, and satin crimson lining.",
      fabric: "70% Virgin Wool, 30% Technical Polyamide",
      material: "Brushed Melton Wool",
      careInstructions: "Dry clean only.",
      price: 8999,
      originalPrice: 10999,
      isFeatured: true,
      images: [
        "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=80",
      ],
      variants: [
        { sku: "CT-JKT-003-BLK-M", size: "M", color: "Onyx", colorHex: "#141414", stock: 6 },
        { sku: "CT-JKT-003-BLK-L", size: "L", color: "Onyx", colorHex: "#141414", stock: 4 },
      ],
    },
    {
      name: "Architectural Pleated Trouser",
      slug: "architectural-pleated-trouser",
      sku: "CT-TRS-004",
      categorySlug: "trousers",
      collectionSlug: "formal-collection",
      description:
        "Single-pleat tapered trouser engineered with a high-twist wool blend for crease resistance and sharp drape.",
      fabric: "65% Merino Wool, 35% Recycled Polyester",
      material: "High-Twist Twill",
      careInstructions: "Dry clean recommended.",
      price: 4599,
      originalPrice: 5499,
      isFeatured: true,
      images: [
        "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=900&q=80",
      ],
      variants: [
        { sku: "CT-TRS-004-BLK-30", size: "30", color: "Matte Black", colorHex: "#0A0A0A", stock: 11 },
        { sku: "CT-TRS-004-BLK-32", size: "32", color: "Matte Black", colorHex: "#0A0A0A", stock: 15 },
        { sku: "CT-TRS-004-SLT-32", size: "32", color: "Slate", colorHex: "#3F3F46", stock: 8 },
      ],
    },
    {
      name: "500 GSM Terminal Hoodie",
      slug: "500-gsm-terminal-hoodie",
      sku: "CT-HDY-005",
      categorySlug: "hoodies",
      collectionSlug: "weekend-collection",
      description:
        "Heavyweight boxy hoodie crafted from double-faced 500 GSM French terry with structured double-layer hood.",
      fabric: "100% Heavyweight Cotton French Terry",
      material: "500 GSM Loopback Terry",
      careInstructions: "Machine wash cold. Lay flat to dry.",
      price: 3999,
      originalPrice: null,
      isFeatured: false,
      images: [
        "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?auto=format&fit=crop&w=900&q=80",
      ],
      variants: [
        { sku: "CT-HDY-005-BLK-M", size: "M", color: "Obsidian", colorHex: "#0A0A0A", stock: 14 },
        { sku: "CT-HDY-005-BLK-L", size: "L", color: "Obsidian", colorHex: "#0A0A0A", stock: 12 },
        { sku: "CT-HDY-005-BLK-XL", size: "XL", color: "Obsidian", colorHex: "#0A0A0A", stock: 7 },
      ],
    },
  ];

  for (const item of productSeeds) {
    const categoryId = categoriesBySlug.get(item.categorySlug);
    if (!categoryId) continue;

    const existing = await prisma.product.findUnique({
      where: { slug: item.slug },
      select: { id: true },
    });

    if (!existing) {
      const created = await prisma.product.create({
        data: {
          name: item.name,
          slug: item.slug,
          sku: item.sku,
          description: item.description,
          fabric: item.fabric,
          material: item.material,
          careInstructions: item.careInstructions,
          price: item.price,
          originalPrice: item.originalPrice,
          status: ProductStatus.PUBLISHED,
          isFeatured: item.isFeatured,
          categoryId,
          images: {
            create: item.images.map((url, idx) => ({
              url,
              altText: `${item.name} view ${idx + 1}`,
              sortOrder: idx,
              isPrimary: idx === 0,
            })),
          },
          variants: {
            create: item.variants.map((variant) => ({
              sku: variant.sku,
              size: variant.size,
              color: variant.color,
              colorHex: variant.colorHex,
              stock: variant.stock,
              lowStockThreshold: 5,
              isActive: true,
            })),
          },
        },
        include: { variants: true },
      });

      const collectionId = collectionsBySlug.get(item.collectionSlug);
      if (collectionId) {
        await prisma.collectionProduct.upsert({
          where: {
            collectionId_productId: {
              collectionId,
              productId: created.id,
            },
          },
          update: {},
          create: {
            collectionId,
            productId: created.id,
            sortOrder: 0,
          },
        });
      }

      for (const variant of created.variants) {
        await prisma.inventoryMovement.create({
          data: {
            variantId: variant.id,
            delta: variant.stock,
            previousStock: 0,
            newStock: variant.stock,
            reason: InventoryMovementReason.RESTOCK,
            actorUserId: adminUser.id,
            note: "Initial seed stock allocation",
          },
        });
      }
    }
  }

  // 6. Initial Coupon
  await prisma.coupon.upsert({
    where: { code: "CRIMSON15" },
    update: {},
    create: {
      code: "CRIMSON15",
      description: "15% off orders above ₹2,999 (capped at ₹1,500)",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 15,
      minOrderAmount: 2999,
      maxDiscountAmount: 1500,
      usageLimit: 500,
      perCustomerLimit: 2,
      isActive: true,
    },
  });

  // 7. Homepage Sections & Banner
  const sections = [
    {
      key: "HERO",
      title: "ARCHITECTURAL MENSWEAR. ENGINEERED IN OBSIDIAN.",
      subtitle:
        "Precision-cut silhouettes, heavyweight natural textiles, and monochrome discipline.",
      content: {
        primaryCtaLabel: "Shop New Arrivals",
        primaryCtaHref: "/shop?sort=newest",
        secondaryCtaLabel: "Explore Collections",
        secondaryCtaHref: "/collections",
        heroImageUrl:
          "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?auto=format&fit=crop&w=1600&q=85",
      },
      sortOrder: 1,
      isVisible: true,
    },
    {
      key: "FEATURED_CATEGORIES",
      title: "CURATED DEPARTMENTS",
      subtitle: "Explore foundational garments across eleven core categories.",
      sortOrder: 2,
      isVisible: true,
    },
    {
      key: "NEW_ARRIVALS",
      title: "NEW ARRIVALS",
      subtitle: "Latest releases from the Crimson Terminal atelier.",
      sortOrder: 3,
      isVisible: true,
    },
    {
      key: "BEST_SELLERS",
      title: "BEST SELLERS",
      subtitle: "Ranked by verified customer orders.",
      sortOrder: 4,
      isVisible: true,
    },
    {
      key: "FEATURED_COLLECTIONS",
      title: "SEASONAL & CORE COLLECTIONS",
      subtitle: "Cohesive edits built for work, travel, and evening rotation.",
      sortOrder: 5,
      isVisible: true,
    },
    {
      key: "BRAND_STORY",
      title: "THE TERMINAL PHILOSOPHY",
      subtitle: "Zero excess. Intentional structure. Built to outlast trends.",
      content: {
        body: "Founded on the conviction that modern menswear demands architectural clarity, Crimson Terminal pairs heavyweight Japanese and Italian mills with sharp, minimalist tailoring.",
      },
      sortOrder: 6,
      isVisible: true,
    },
  ];

  for (const section of sections) {
    await prisma.homepageSection.upsert({
      where: { key: section.key },
      update: {},
      create: section,
    });
  }

  console.log("Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("Seed error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
