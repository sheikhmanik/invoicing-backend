// routes/pricing-plan.ts
import { FastifyInstance } from "fastify";

export default async function PricingPlanRoutes(fastify: FastifyInstance) {
  // Create OR update a pricing plan
  fastify.post("/", async (req, reply) => {
    try {
      const data = req.body as any;

      const {
        planId,            // optional: if present -> update that plan
        planType,
        planName,
        description,
        basePrice,
        creditsIncluded,
        validity,
        meteredUsages     // array of { productId?, name?, credits }
      } = data;

      // === If planId provided -> update that plan ===
      let plan;
      if (planId) {
        plan = await fastify.prisma.pricingPlan.update({
          where: { id: Number(planId) },
          data: {
            planType,
            planName,
            description,
            basePrice,
            creditsIncluded,
            validity
          }
        });
      } else {
        // === create new plan ===
        plan = await fastify.prisma.pricingPlan.create({
          data: {
            planType,
            planName,
            description,
            basePrice,
            creditsIncluded,
            validity
          }
        });
      }

      // === Ensure meteredUsages processed ===
      // meteredUsages can contain items with productId OR name.
      // If name provided (new product name), we attempt to find product by name, otherwise we expect productId.
      if (Array.isArray(meteredUsages)) {
        for (const item of meteredUsages) {
          // resolve productId:
          let productId = item.productId ?? null;

          if (!productId && item.name) {
            // find product by name (case-insensitive) or create it
            const existing = await fastify.prisma.product.findUnique({
              where: { name: item.name }
            }).catch(() => null);

            if (existing) productId = existing.id;
            else {
              const created = await fastify.prisma.product.create({
                data: { name: item.name }
              });
              productId = created.id;
            }
          }

          if (!productId) {
            // skip invalid item
            fastify.log.warn(`Skipping meteredUsage item without productId or name: ${JSON.stringify(item)}`);
            continue;
          }

          // Upsert meteredUsage using unique compound key
          await fastify.prisma.meteredUsage.upsert({
            where: {
              planId_productId: {
                planId: plan.id,
                productId
              }
            },
            update: {
              credits: item.credits,
              isActive: true
            },
            create: {
              planId: plan.id,
              productId,
              credits: item.credits
            }
          });
        }
      }

      // Return the full plan including metered usages + product info
      const saved = await fastify.prisma.pricingPlan.findUnique({
        where: { id: plan.id },
        include: {
          meteredUsages: {
            include: { product: true }
          }
        }
      });

      return reply.send({ message: "Pricing plan saved", plan: saved });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: "Failed to save pricing plan", detail: err?.message ?? err });
    }
  });

  // GET all plans (with metered usages + product)
  fastify.get("/", async (req, reply) => {
    try {
      const plans = await fastify.prisma.pricingPlan.findMany({
        include: {
          meteredUsages: {
            include: { product: true }
          }
        },
        orderBy: { id: "asc" }
      });
      return reply.send(plans);
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: "Failed to fetch pricing plans" });
    }
  });
}