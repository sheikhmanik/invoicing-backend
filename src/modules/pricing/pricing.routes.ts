import { FastifyInstance } from "fastify";

export default async function PricingPlanRoutes(fastify: FastifyInstance) {
  fastify.post("/", async (req, reply) => {
    try {
      const data = req.body as any;

      const {
        planId,
        planType,
        planName,
        description,
        fixedPrice,
        basePrice,
        creditsIncluded,
        validity,
        meteredProducts,
        includedProducts,
      } = data;

      const planData = {
        planType,
        planName,
        description,
        basePrice,
        creditsIncluded,
        validity,
      }

      if (typeof fixedPrice !== undefined) {
        planData.fixedPrice = fixedPrice
      }

      // === If planId provided -> update that plan ===
      let plan;
      if (planId) {
        plan = await fastify.prisma.pricingPlan.update({
          where: { id: Number(planId) },
          data: planData
        });
      } else {
        // === create new plan ===
        plan = await fastify.prisma.pricingPlan.create({
          data: planData
        });
      }

      if (Array.isArray(meteredProducts)) {
        for (const item of meteredProducts) {
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
            fastify.log.warn(`Skipping meteredProduct item without productId or name: ${JSON.stringify(item)}`);
            continue;
          }

          // Upsert meteredProduct using unique compound key
          await fastify.prisma.meteredProduct.upsert({
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
      
      if (includedProducts !== undefined && Array.isArray(includedProducts)) {
        for (const item of includedProducts) {
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
            fastify.log.warn(`Skipping meteredProduct item without productId or name: ${JSON.stringify(item)}`);
            continue;
          }

          // Upsert meteredProduct using unique compound key
          await fastify.prisma.includedProduct.upsert({
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
          meteredProducts: {
            include: { product: true }
          },
          includedProducts: {
            include: { product: true }
          }
        }
      });

      return reply.send({ message: "Pricing plan saved", plan: saved });
    } catch (err: any) {
      fastify.log.error(err);

      const backendMessage = err.response?.data?.error;
      if (backendMessage?.includes("exists")) {
        alert("A plan with this name already exists.");
        return;
      }
    
      return reply.code(500).send({
        error: "Failed to save pricing plan",
        detail: err instanceof Error ? err.message : String(err)
      });
    }
  });

  // GET all plans (with metered usages + product)
  fastify.get("/", async (req, reply) => {
    try {
      const plans = await fastify.prisma.pricingPlan.findMany({
        include: {
          meteredProducts: { include: { product: true } },
          includedProducts: { include: { product: true } }
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