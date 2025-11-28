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

      // -------------------------
      //  PROFORMA & INVOICE NUMBERS
      // -------------------------

      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);             // e.g. "25"
      const month = String(now.getMonth() + 1).padStart(2, "0");       // e.g. "11"

      // 1) Generate Proforma Number: E/PI/YY/MM/0001
      const lastProforma = await fastify.prisma.invoice.findFirst({
        where: {
          proformaNumber: {
            startsWith: `E/PI/${year}/${month}/`,
          },
        },
        orderBy: { createdAt: "desc" },
      });

      let proformaSeq = 1;
      if (lastProforma?.proformaNumber) {
        const lastPart = lastProforma.proformaNumber.split("/").pop() || "0";
        const parsed = Number(lastPart);
        proformaSeq = Number.isFinite(parsed) ? parsed + 1 : 1;
      }
      const proformaSeqPadded = String(proformaSeq).padStart(4, "0");
      const proformaNumber = `E/PI/${year}/${month}/${proformaSeqPadded}`;

      // 2) Generate Invoice Number: E/I/YY/MM/0001
      const lastInvoiceForMonth = await fastify.prisma.invoice.findFirst({
        where: {
          invoiceNumber: {
            startsWith: `E/I/${year}/${month}/`,
          },
        },
        orderBy: { createdAt: "desc" },
      });

      let invoiceSeq = 1;
      if (lastInvoiceForMonth?.invoiceNumber) {
        const lastPart = lastInvoiceForMonth.invoiceNumber.split("/").pop() || "0";
        const parsed = Number(lastPart);
        invoiceSeq = Number.isFinite(parsed) ? parsed + 1 : 1;
      }
      const invoiceSeqPadded = String(invoiceSeq).padStart(4, "0");
      const invoiceNumber = `E/I/${year}/${month}/${invoiceSeqPadded}`;

      // -------------------------
      //  CREATE INVOICE ROW
      // -------------------------

      const invoice = {
        restaurantId: Number(restaurantId),
        pricingPlanId: Number(pricingPlanId),
        subTotalAmount: planExists.basePrice,
        totalAmount,
        remainingAmount: totalAmount,
        dueDate,
        proformaNumber,   // 👈 new
        invoiceNumber,    // 👈 final invoice number reserved
        status: "pending" // still pending until payment is updated
      };

      await fastify.prisma.invoice.create({ data: invoice });

      return reply.send({ message: "Plan assigned successfully", data: saved });
    } catch (err) {
      console.error("Error mapping plan:", err);
      return reply.code(500).send({ error: "Failed to assign plan" });
    }
  });

  fastify.post("/update-tax-settings", async (req, reply) => {
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
      
      const updated = await fastify.prisma.restaurantPricingPlan.update({
        where: {
          restaurantId_pricingPlanId: {
            restaurantId: Number(restaurantId),
            pricingPlanId: Number(pricingPlanId),
          },
        },
        data: {
          cgst: Boolean(CGST),
          sgst: Boolean(SGST),
          igst: Boolean(IGST),
          addLut: Boolean(LUT),
          startDate: new Date(startDate),
          planMode,
          trialDays,
        },
      });

      const base = Number(planExists.basePrice);

      const cgstAmount = CGST ? base * 0.09 : 0;
      const sgstAmount = SGST ? base * 0.09 : 0;
      const igstAmount = IGST ? base * 0.18 : 0;

      const totalAmount = base + cgstAmount + sgstAmount + igstAmount;

      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);             // e.g. "25"
      const month = String(now.getMonth() + 1).padStart(2, "0");       // e.g. "11"

      // 2) Generate Invoice Number: E/I/YY/MM/0001
      const lastInvoiceForMonth = await fastify.prisma.invoice.findFirst({
        where: {
          invoiceNumber: {
            startsWith: `E/I/${year}/${month}/`,
          },
        },
        orderBy: { createdAt: "desc" },
      });

      let invoiceSeq = 1;
      if (lastInvoiceForMonth?.invoiceNumber) {
        const lastPart = lastInvoiceForMonth.invoiceNumber.split("/").pop() || "0";
        const parsed = Number(lastPart);
        invoiceSeq = Number.isFinite(parsed) ? parsed + 1 : 1;
      }
      const invoiceSeqPadded = String(invoiceSeq).padStart(4, "0");
      const invoiceNumber = `E/I/${year}/${month}/${invoiceSeqPadded}`;

      const lastInvoice = await fastify.prisma.invoice.findFirst({
        where: { restaurantId: Number(restaurantId) },
        orderBy: { createdAt: "desc" },
      });

      const invoice = {
        restaurantId: Number(restaurantId),
        pricingPlanId: Number(pricingPlanId),
        subTotalAmount: lastInvoice.subTotalAmount,
        totalAmount,
        dueDate: lastInvoice.dueDate,
        proformaNumber: lastInvoice.proformaNumber,
        invoiceNumber,
        status: lastInvoice.status,
      };

      await fastify.prisma.invoice.create({ data: invoice });
  
      return reply.send({ message: "Tax settings updated successfully.", updated });
  
    } catch (err) {
      console.error("Update Tax Settings Failed:", err);
      return reply.code(500).send({ error: "Failed to update tax settings" });
    }
  });

  fastify.post("/update-payment", async (req, reply) => {
    const {
      currentResId,
      paymentDate,
      paymentNotes,
      isPartial,
      partialAmount,
      paymentFileUrl,
    } = req.body as any;
  
    if (!currentResId || !paymentDate) {
      return reply.code(400).send({ error: "Missing required fields" });
    }
  
    try {
      const restaurant = await fastify.prisma.restaurant.findUnique({
        where: { id: Number(currentResId) },
        include: { invoices: true }
      });
  
      if (!restaurant) {
        return reply.code(404).send({ error: "Restaurant not found" });
      }
  
      const lastInvoice = restaurant.invoices[restaurant.invoices.length - 1];
  
      if (!lastInvoice) {
        return reply.code(400).send({
          error: "Restaurant has no invoice. Assign a plan first."
        });
      }
  
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = String(now.getMonth() + 1).padStart(2, "0");
  
      const lastFinal = await fastify.prisma.invoice.findFirst({
        where: {
          invoiceNumber: {
            startsWith: `E/I/${year}/${month}/`,
          },
        },
        orderBy: { createdAt: "desc" },
      });
  
      let seq = 1;
      if (lastFinal?.invoiceNumber) {
        seq = Number(lastFinal.invoiceNumber.split("/").pop()) + 1;
      }
  
      const invoiceNumber = `E/I/${year}/${month}/${String(seq).padStart(4, "0")}`;

      const updatedRemainingAmount = lastInvoice.partialAmount
      ? lastInvoice.totalAmount - (lastInvoice.partialAmount + partialAmount)
      : lastInvoice.totalAmount - partialAmount

      const updatedStatus = isPartial === "Yes" && partialAmount && updatedRemainingAmount > 0 ? "partially paid" : "paid";
  
      const newInvoice = await fastify.prisma.invoice.create({
        data: {
          restaurantId: Number(currentResId),
          pricingPlanId: lastInvoice.pricingPlanId,
          subTotalAmount: lastInvoice.subTotalAmount,
          totalAmount: lastInvoice.totalAmount,
          partialAmount: partialAmount,
          remainingAmount: updatedRemainingAmount,
          dueDate: lastInvoice.dueDate,
          proformaNumber: lastInvoice.proformaNumber,
          invoiceNumber,
          status: updatedStatus,
          paymentDate: new Date(paymentDate),
          paymentNotes: paymentNotes || null,
          isPartialPayment: isPartial === "Yes",
          paymentFileUrl,
        },
      });
  
      return reply.send({
        message: "Payment updated successfully",
        invoice: newInvoice
      });
  
    } catch (err) {
      console.error("Payment update failed:", err);
      return reply.code(500).send({ error: "Internal server error" });
    }
  });

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

  fastify.get("/plan-map/:restaurantId", async (request, reply) => {
    const { restaurantId } = request.params as any;

    const mapping = await fastify.prisma.restaurantPricingPlan.findFirst({
      where: { restaurantId: Number(restaurantId) },
    });

    if (!mapping) return reply.send({ message: "No plan assigned." });

    return reply.send(mapping);
  });

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