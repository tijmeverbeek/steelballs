import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const clFinale = await prisma.poule.findUnique({ where: { code: "SGPZ3B" } });
  if (!clFinale) throw new Error("CL finale poule SGPZ3B niet gevonden");
  if (!clFinale.organisatorId) throw new Error("CL finale poule heeft geen organisatorId");

  // Verwijder bestaande uitzwaai poule als die er al is
  const bestaande = await prisma.poule.findFirst({ where: { featured: true } });
  if (bestaande) {
    console.log(`Bestaande featured poule gevonden: ${bestaande.code} (${bestaande.naam}), wordt vervangen`);
    await prisma.poule.update({ where: { id: bestaande.id }, data: { featured: false } });
  }

  // Maak de uitzwaai poule aan
  const poule = await prisma.poule.create({
    data: {
      naam: "Nederland - Algerije · Uitzwaai",
      code: "UITZWAAI",
      organisatorId: clFinale.organisatorId,
      featured: true,
      deelnemers: {
        create: { userId: clFinale.organisatorId },
      },
    },
  });

  console.log(`✅ Uitzwaai poule aangemaakt: ${poule.code} (${poule.naam})`);
  console.log(`   Organisator: ${clFinale.organisatorId}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
