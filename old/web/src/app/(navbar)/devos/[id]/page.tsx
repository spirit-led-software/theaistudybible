import { getDevo } from '@/lib/client/devos';
import Moment from 'moment';

export default async function DevoPage({ params }: { params: { id: string } }) {
  const { devo, error } = await getDevo(params.id);
  if (error) {
    throw error;
  }
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col overflow-y-auto py-2 px-5">
        <h1 className="text-2xl font-bold mb-2">
          {Moment(devo.created).format('MMM Do YYYY')}
        </h1>
        <p className="mb-20 break-words whitespace-pre-wrap">{devo.content}</p>
        <ul className="flex flex-row space-x-2">
          {devo.sourceDocuments.map((sourceDocument) => (
            <li key={sourceDocument.id}>{sourceDocument.metadata}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
