// routes/products.ts
import { FastifyInstance } from "fastify";

export default async function ProductRoutes(fastify: FastifyInstance) {
  // CREATE product
  fastify.post("/", async (req, reply) => {
    try {
      const { name, credit } = req.body as any;

      if (!name || !name.trim()) {
        return reply.code(400).send({ error: "Product name is required" });
      }

      const cleanName = name.trim();

      const existing = await fastify.prisma.product.findFirst({
        where: {
          name: {
            equals: cleanName,
            mode: "insensitive"
          }
        }
      });

      // if (existing) {
      //   return reply.code(400).send({ error: "Product already exists" });
      // }

      // If product name is unique constraint in schema, use upsert
      const product = await fastify.prisma.product.upsert({
        where: { name },
        update: {},
        create: { name }
      });

      let meteredProduct = null;
      if (credit !== undefined && credit !== null && !isNaN(Number(credit))) {
        // find a metered plan (first)
        const meteredPlan = await fastify.prisma.pricingPlan.findFirst({
          where: { planType: "metered" }
        });

        if (meteredPlan) {
          // create or upsert metered usage
          meteredProduct = await fastify.prisma.meteredProduct.upsert({
            where: {
              planId_productId: {
                planId: meteredPlan.id,
                productId: product.id
              }
            },
            update: {
              credits: Number(credit),
              isActive: true
            },
            create: {
              planId: meteredPlan.id,
              productId: product.id,
              credits: Number(credit)
            }
          });
        }
      }

      return reply.send({ product, meteredProduct });
    } catch (err: unknown) {
      fastify.log.error(err);
      return reply.code(500).send({
        error: "Failed to create product",
        detail: err instanceof Error ? err.message : String(err)
      });
    }
  });

  // GET All products (simple)
  fastify.get("/", async (req, reply) => {
    try {
      const products = await fastify.prisma.product.findMany({ orderBy: { name: "asc" }});
      return reply.send(products);
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: "Failed to fetch products" });
    }
  });
  
  // GET Metered products (simple)
  fastify.get("/meteredProducts", async (req, reply) => {
    try {
      const products = await fastify.prisma.product.findMany({ orderBy: { name: "asc" }});
      return reply.send(products);
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: "Failed to fetch products" });
    }
  });
}