import { FastifyInstance } from "fastify";

export default async function restaurantRoutes(fastify: FastifyInstance) {
  // ➤ Create restaurant
  fastify.post("/", async (req, reply) => {
    const {
      name,
      address,
      location,
      GSTIN,
      FSSAI,
      PrimaryContactName,
      PrimaryContactPhone,
      brandId
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

  // ➤ Get all restaurants
  fastify.get("/", async () => {
    return fastify.prisma.restaurant.findMany({
      include: {
        brand: {
          include: {
            business: true
          }
        }
      }
    });
  });
}