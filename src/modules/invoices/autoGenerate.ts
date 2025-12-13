import fastify, { FastifyInstance } from "fastify";

export default async function AutoGenerates(fastify: FastifyInstance) {
  fastify.post("/", async (req, reply) => {
    // Deal with Invoices
    const invoices = await fastify.prisma.invoice.findMany({
      include: {
        restaurant: true,
        pricingPlan: {
          include: {
            restaurantPricingPlans: true
          }
        }
      }
    });
    function groupInvoicesByProforma(allInvoices: any[]) {
      const groups: Record<string, any[]> = {};
    
      for (const inv of allInvoices) {
        if (!inv.proformaNumber) continue;
        const key = inv.proformaNumber;
        if (!groups[key]) groups[key] = [];
        groups[key].push(inv);
      }
    
      return groups;
    }
    function getLatestUnpaidInvoices(groups: Record<string, any[]>) {
      return Object.values(groups)
        .map((list) =>
          list.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0]
        ).filter((inv) => inv.status === "pending" || inv.status === "partially paid");
    }

    const groupedInvoicesByProforma = groupInvoicesByProforma(invoices);
    const unpaidInvoices = getLatestUnpaidInvoices(groupedInvoicesByProforma);

    // function autoCreation() {
    //   const invoice = groupedInvoicesByProforma.map(
    //     (inv) => inv
    //   )
    // }
    return groupedInvoicesByProforma;

  });
}