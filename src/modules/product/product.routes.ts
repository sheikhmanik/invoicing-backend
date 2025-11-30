// routes/products.ts
import { FastifyInstance } from "fastify";

export default async function ProductRoutes(fastify: FastifyInstance) {
  // CREATE product
  fastify.post("/", async (req, reply) => {
    try {
      const { name, license } = req.body as any;
  
      if (!name || !name.trim()) {
        return reply.code(400).send({ error: "Product name is required" });
      }
  
      // Create product with license field if exists
      const product = await fastify.prisma.product.create({
        data: {
          name: name,
          license: license ?? null
        }
      });
  
      return reply.send({ product });
  
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