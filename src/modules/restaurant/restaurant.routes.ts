import { FastifyInstance } from "fastify";

export default async function restaurantRoutes(fastify: FastifyInstance) {
  fastify.post("/", async (req, reply) => {
    const {
      name,
      address,
      location,
      GSTIN,
      FSSAI,
      PrimaryContactName,
      PrimaryContactPhone,
      brandId,
    } = req.body as any;

    try {
      const restaurant = await fastify.prisma.restaurant.create({
        data: {
          name,
          address,
          location,
          GSTIN,
          FSSAI,
          PrimaryContactName,
          PrimaryContactPhone,
          brandId: Number(brandId),
        },
      });

      return reply.send({ message: "Restaurant created", restaurant });
    } catch (error) {
      console.error(error);
      return reply.code(500).send({ error: "Failed to create restaurant" });
    }
  });

  // Post/Create specifc Restaurant Plan
  fastify.post("/plan-map", async (req, reply) => {
    const {
      restaurantId,
      pricingPlanId,
      CGST,
      SGST,
      IGST,
      LUT,
      startDate,
      planMode,
      trialDays,
    } = req.body as any;

    const restaurantExists = await fastify.prisma.restaurant.findUnique({
      where: { id: Number(restaurantId) }
    });
    if (!restaurantExists) return reply.send({ message: "Restaurant not found!" });

    const planExists = await fastify.prisma.pricingPlan.findUnique({
      where: { id: Number(pricingPlanId) }
    });
    if (!planExists) return reply.send({ message: "Plan doesn't exist!" });
    
    try {
      await fastify.prisma.restaurantPricingPlan.deleteMany({
        where: { restaurantId: Number(restaurantId) },
      });
      const saved = await fastify.prisma.restaurantPricingPlan.upsert({
        where: {
          restaurantId_pricingPlanId: {
            restaurantId: Number(restaurantId),
            pricingPlanId: Number(pricingPlanId),
          },
        },
        update: {
          cgst: Boolean(CGST),
          sgst: Boolean(SGST),
          igst: Boolean(IGST),
          addLut: Boolean(LUT),
          startDate: new Date(startDate),
          planMode: planMode,
          trialDays: trialDays,
        },
        create: {
          restaurantId: Number(restaurantId),
          pricingPlanId: Number(pricingPlanId),
          cgst: Boolean(CGST),
          sgst: Boolean(SGST),
          igst: Boolean(IGST),
          addLut: Boolean(LUT),
          startDate: new Date(startDate),
          planMode: planMode,
          trialDays: trialDays,
        },
      });








      const base = Number(planExists.basePrice); // or fixedPrice if hybrid — adjust as needed

      // TAX calculations
      const cgstAmount = CGST ? base * 0.09 : 0;
      const sgstAmount = SGST ? base * 0.09 : 0;
      const igstAmount = IGST ? base * 0.18 : 0;

      // FINAL total
      const totalAmount = base + cgstAmount + sgstAmount + igstAmount;

      // due date = 10 days from startDate
      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + 10);

      // invoice number example:
      const invoiceNumber = `INV-${Date.now()}`;

      const invoice = {
        restaurantId: Number(restaurantId),
        pricingPlanId: Number(pricingPlanId),
        totalAmount: totalAmount,
        dueDate: dueDate,
        invoiceNumber: invoiceNumber,
        status: "pending"
      };

      await fastify.prisma.invoice.create({ data: invoice });










      return reply.send({ message: "Plan assigned successfully", data: saved });
    } catch (err) {
      console.error("Error mapping plan:", err);
      return reply.code(500).send({ error: "Failed to assign plan" });
    }
  });

  // Get specific Restaurant Plan (specific route — stays above the generic one)
  fastify.get("/plan-map/:restaurantId/:pricingPlanId", async (request, reply) => {
    const { restaurantId, pricingPlanId } = request.params as any;

    try {
      // Use findUnique for composite unique lookup and include the plan relation
      const mapping = await fastify.prisma.restaurantPricingPlan.findUnique({
        where: {
          restaurantId_pricingPlanId: {
            restaurantId: Number(restaurantId),
            pricingPlanId: Number(pricingPlanId),
          },
        },
        include: {
          pricingPlan: {
            include: {
              meteredProducts: {
                include: {
                  product: true
                }
              },
              includedProducts: {
                include: {
                  product: true
                }
              }
            }
          },
        },
      });

      if (!mapping) {
        return reply.code(404).send({ message: "Mapping not found." });
      }

      return reply.send(mapping);
    } catch (err) {
      fastify.log.error("Error fetching specific plan mapping:", err);
      return reply.code(500).send({ error: "Failed to fetch specific plan mapping" });
    }
  });

  // Get specific Restaurant's pricingPlanId
  fastify.get("/plan-map/:restaurantId", async (request, reply) => {
    const { restaurantId } = request.params as any;

    const mapping = await fastify.prisma.restaurantPricingPlan.findFirst({
      where: { restaurantId: Number(restaurantId) },
    });

    if (!mapping) return reply.send({ message: "No plan assigned." });

    return reply.send(mapping);
  });

  // ➤ Get all restaurants
  fastify.get("/", async () => {
    return fastify.prisma.restaurant.findMany({
      include: {
        brand: {
          include: {
            business: true
          }
        },
        restaurantPricingPlans: {
          include: {
            pricingPlan: true
          }
        },
        invoices: true
      }
    });
  });

}