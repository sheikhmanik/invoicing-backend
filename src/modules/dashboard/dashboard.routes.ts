import { FastifyInstance } from "fastify";

export default async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.get("/stats", async () => {
    const totalCustomers = await fastify.prisma.restaurant.count();
    const totalOutlets = totalCustomers;

    return {
      totalCustomers,
      totalOutlets,
      pendingInvoices: 0,
      paidInvoices: 0,
      mrr: 0,
      arr: 0,
      newCustomers: 0,
      churn: 0,
    };
  });
}