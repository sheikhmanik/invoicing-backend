import { FastifyInstance } from "fastify";

export default async function PricingPlanRoutes(fastify: FastifyInstance) {
  
  // fastify.post("/", async (req, reply) => {
  //   try {
  //     const data = req.body as any;

  //     const {
  //       planId,
  //       planType,
  //       planName,
  //       description,
  //       fixedPrice,
  //       basePrice,
  //       creditsIncluded,
  //       billingCycle,
  //       validity,
  //       meteredProducts,
  //       includedProducts,
  //     } = data;

  //     const fixedPlanData = {
  //       planType,
  //       planName,
  //       description,
  //       fixedPrice,
  //       billingCycle,
  //       includedProducts,
  //     };
  //     const meteredPlanData = {
  //       planType,
  //       planName,
  //       description,
  //       basePrice,
  //       creditsIncluded,
  //       validity,
  //       meteredProducts,
  //     };
  //     const hybridPlanData = {
  //       planType,
  //       planName,
  //       description,
  //       fixedPrice,
  //       basePrice,
  //       creditsIncluded,
  //       billingCycle,
  //       validity,
  //       meteredProducts,
  //       includedProducts,
  //     }

  //     // If plan exists then just update
  //     if (planId) {
  //       if (planType === "fixed") {
  //         await fastify.prisma.pricingPlan.update({
  //           where: { id: Number(planId) },
  //           data: fixedPlanData,
  //         })
  //       }
  //       if (planType === "metered") {
  //         await fastify.prisma.pricingPlan.update({
  //           where: { id: Number(planId) },
  //           data: meteredPlanData,
  //         })
  //       }
  //       if (planType === "hybrid") {
  //         await fastify.prisma.pricingPlan.update({
  //           where: { id: Number(planId) },
  //           data: hybridPlanData,
  //         })
  //       }
  //     } else {
  //       if (planType === "fixed") {
  //         await fastify.prisma.pricingPlan.create({
  //           data: fixedPlanData,
  //         })
  //       }
  //       if (planType === "metered") {
  //         await fastify.prisma.pricingPlan.create({
  //           data: meteredPlanData,
  //         })
  //       }
  //       if (planType === "hybrid") {
  //         await fastify.prisma.pricingPlan.create({
  //           data: hybridPlanData,
  //         })
  //       }
  //     }

  //     // const planData = {
  //     //   planType,
  //     //   planName,
  //     //   description,
  //     //   basePrice,
  //     //   creditsIncluded,
  //     //   validity,
  //     // }

  //     // if (typeof fixedPrice !== undefined) {
  //     //   planData.fixedPrice = fixedPrice
  //     // }

  //     // // === If planId provided -> update that plan ===
  //     // let plan;
  //     // if (planId) {
  //     //   plan = await fastify.prisma.pricingPlan.update({
  //     //     where: { id: Number(planId) },
  //     //     data: planData
  //     //   });
  //     // } else {
  //     //   // === create new plan ===
  //     //   plan = await fastify.prisma.pricingPlan.create({
  //     //     data: planData
  //     //   });
  //     // }

  //     // if (Array.isArray(meteredProducts)) {
  //     //   for (const item of meteredProducts) {
  //     //     // resolve productId:
  //     //     let productId = item.productId ?? null;

  //     //     if (!productId && item.name) {
  //     //       // find product by name (case-insensitive) or create it
  //     //       const existing = await fastify.prisma.product.findUnique({
  //     //         where: { name: item.name }
  //     //       }).catch(() => null);

  //     //       if (existing) productId = existing.id;
  //     //       else {
  //     //         const created = await fastify.prisma.product.create({
  //     //           data: { name: item.name }
  //     //         });
  //     //         productId = created.id;
  //     //       }
  //     //     }

  //     //     if (!productId) {
  //     //       // skip invalid item
  //     //       fastify.log.warn(`Skipping meteredProduct item without productId or name: ${JSON.stringify(item)}`);
  //     //       continue;
  //     //     }

  //     //     // Upsert meteredProduct using unique compound key
  //     //     await fastify.prisma.meteredProduct.upsert({
  //     //       where: {
  //     //         planId_productId: {
  //     //           planId: plan.id,
  //     //           productId
  //     //         }
  //     //       },
  //     //       update: {
  //     //         credits: item.credits,
  //     //         isActive: true
  //     //       },
  //     //       create: {
  //     //         planId: plan.id,
  //     //         productId,
  //     //         credits: item.credits
  //     //       }
  //     //     });
  //     //   }
  //     // }
      
  //     // if (includedProducts !== undefined && Array.isArray(includedProducts)) {
  //     //   for (const item of includedProducts) {
  //     //     // resolve productId:
  //     //     let productId = item.productId ?? null;

  //     //     if (!productId && item.name) {
  //     //       // find product by name (case-insensitive) or create it
  //     //       const existing = await fastify.prisma.product.findUnique({
  //     //         where: { name: item.name }
  //     //       }).catch(() => null);

  //     //       if (existing) productId = existing.id;
  //     //       else {
  //     //         const created = await fastify.prisma.product.create({
  //     //           data: { name: item.name }
  //     //         });
  //     //         productId = created.id;
  //     //       }
  //     //     }

  //     //     if (!productId) {
  //     //       // skip invalid item
  //     //       fastify.log.warn(`Skipping meteredProduct item without productId or name: ${JSON.stringify(item)}`);
  //     //       continue;
  //     //     }

  //     //     // Upsert meteredProduct using unique compound key
  //     //     await fastify.prisma.includedProduct.upsert({
  //     //       where: {
  //     //         planId_productId: {
  //     //           planId: plan.id,
  //     //           productId
  //     //         }
  //     //       },
  //     //       update: {
  //     //         credits: item.credits,
  //     //         isActive: true
  //     //       },
  //     //       create: {
  //     //         planId: plan.id,
  //     //         productId,
  //     //         credits: item.credits
  //     //       }
  //     //     });
  //     //   }
  //     // }

  //     // // Return the full plan including metered usages + product info
  //     // const saved = await fastify.prisma.pricingPlan.findUnique({
  //     //   where: { id: plan.id },
  //     //   include: {
  //     //     meteredProducts: {
  //     //       include: { product: true }
  //     //     },
  //     //     includedProducts: {
  //     //       include: { product: true }
  //     //     }
  //     //   }
  //     // });

  //     // return reply.send({ message: "Pricing plan saved", plan: saved });
    
  //   } catch (err: any) {
  //     fastify.log.error(err);
  //     const backendMessage = err.response?.data?.error;
  //     if (backendMessage?.includes("exists")) {
  //       alert("A plan with this name already exists.");
  //       return;
  //     }
  //     return reply.code(500).send({
  //       error: "Failed to save pricing plan",
  //       detail: err instanceof Error ? err.message : String(err)
  //     });
  //   }
  // });

  fastify.post("/", async (req, reply) => {
    try {
      const {
        planId,
        planType,
        planName,
        description = "",
        fixedPrice,
        basePrice,
        creditsIncluded,
        billingCycle,
        validity,
        meteredProducts = [],
        includedProducts = []
      } = req.body as any;
  
      if (!planName?.trim()) {
        return reply.code(400).send({ error: "Plan name required" });
      }
  
      if (!["fixed", "metered", "hybrid"].includes(planType)) {
        return reply.code(400).send({ error: "Invalid plan type" });
      }
  
      const data: any = {
        planType,
        planName: planName.trim(),
        description: description.trim(),
      };
  
      // Assign fields based on plan type
      if (planType !== "metered") {
        data.fixedPrice = fixedPrice ? Number(fixedPrice) : 0;
        data.billingCycle = billingCycle ? Number(billingCycle) : 1;
      } else {
        data.fixedPrice = null;
        data.billingCycle = null;
      }
  
      if (planType !== "fixed") {
        data.basePrice = basePrice ? Number(basePrice) : 0;
        data.creditsIncluded = creditsIncluded ? Number(creditsIncluded) : 0;
        data.validity = validity ? Number(validity) : 1;
      } else {
        data.basePrice = null;
        data.creditsIncluded = null;
        data.validity = null;
      }
  
      // Create OR Update plan
      const plan = planId
        ? await fastify.prisma.pricingPlan.update({
            where: { id: Number(planId) },
            data,
          })
        : await fastify.prisma.pricingPlan.create({ data })
      ;
  
      // =============================
      // Products Section
      // =============================
  
      const keepIncludedIds: number[] = [];
      const keepMeteredIds: number[] = [];
  
      if (planType !== "metered") {
        for (const item of includedProducts) {
          const productId = item.productId;
          if (!productId) continue;
  
          const result = await fastify.prisma.includedProduct.upsert({
            where: {
              planId_productId: { planId: plan.id, productId }
            },
            update: { isActive: true },
            create: { planId: plan.id, productId, isActive: true }
          });
  
          keepIncludedIds.push(result.id);
        }
  
        await fastify.prisma.includedProduct.deleteMany({
          where: { planId: plan.id, id: { notIn: keepIncludedIds } }
        });
      } else {
        await fastify.prisma.includedProduct.deleteMany({ where: { planId: plan.id } });
      }
  
      if (planType !== "fixed") {
        for (const item of meteredProducts) {
          const productId = item.productId;
          if (!productId) continue;
  
          const result = await fastify.prisma.meteredProduct.upsert({
            where: {
              planId_productId: { planId: plan.id, productId }
            },
            update: { credits: Number(item.credits), isActive: true },
            create: {
              planId: plan.id,
              productId,
              credits: Number(item.credits),
              isActive: true
            }
          });
  
          keepMeteredIds.push(result.id);
        }
  
        await fastify.prisma.meteredProduct.deleteMany({
          where: { planId: plan.id, id: { notIn: keepMeteredIds } }
        });
      } else {
        await fastify.prisma.meteredProduct.deleteMany({ where: { planId: plan.id } });
      }
  
      const saved = await fastify.prisma.pricingPlan.findUnique({
        where: { id: plan.id },
        include: {
          includedProducts: { include: { product: true } },
          meteredProducts: { include: { product: true } }
        }
      });
  
      return reply.send({
        message: "Pricing Plan Saved!",
        plan: saved,
      });
  
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: error.message });
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