import { prisma } from "@server/database";
import Moment from "moment";

export async function generateStaticParams() {
  const devos = await prisma.devo.findMany({
    select: {
      id: true,
    },
  });
  return devos.map((devo) => ({
    params: {
      id: devo.id,
    },
  }));
}

async function getDevo(id: string) {
  const devo = await prisma.devo.findUnique({
    where: {
      id,
    },
    include: {
      sourceDocuments: {
        select: {
          sourceDocument: true,
        },
      },
    },
  });

  if (!devo) throw new Error(`Devo with id ${id} not found`);

  return devo;
}

export default async function DevoPage({ params }: { params: { id: string } }) {
  const devo = await getDevo(params.id);
  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col flex-1 px-5 py-2 overflow-y-auto">
        <h1 className="mb-2 text-2xl font-bold">
          {Moment(devo.createdAt).format("MMMM Do YYYY")}
        </h1>
        <p className="mb-20 break-words whitespace-pre-wrap">{devo.content}</p>
        <ul className="flex flex-row space-x-2">
          {devo.sourceDocuments.map(({ sourceDocument }) => (
            <li key={sourceDocument.id}>
              {sourceDocument.metadata?.toLocaleString()}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
