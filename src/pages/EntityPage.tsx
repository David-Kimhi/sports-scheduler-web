import { useParams } from 'react-router-dom';

export default function EntityPage() {
  const { type, id } = useParams();
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">{type} - {id}</h1>
    </div>
  );
}
