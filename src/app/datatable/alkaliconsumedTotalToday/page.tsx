import db from '../configKnexTable';
import { format } from 'date-fns';
export const dynamic = 'force-dynamic';

// 1. Mark the function as async to use await
export default async function Datatable() { 

     
  
  // Note: Ensure 'timestamp' is defined or passed as a prop
  // For now, I'll assume it's available in your scope
  const result = await db('alkaliconsumedtotal')
    .select('*')
    .orderBy('date_time', 'desc');

  // console.log(result);

  return (
    <>
      <h1 className="font-bold">Data Table NaOH Transfer Total</h1>
      <p className="text-sm text-gray-500">Total Records: {result.length}</p>
      
      <hr className="my-4"/>
      
      {/* Example: Basic data mapping */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left border-b">
              <th>ID</th>
              <th>date_time</th>
              <th>volume_T3_Kg</th>
              <th>volume_T4_Kg</th>
              <th>volumepd1_total</th>
              <th>volumepd2_total</th>
              <th>volumepd3_total</th>

              {/* Add other columns like Tank or Status */}
            </tr>
          </thead>
          <tbody>
            {result.map((row, index) => (
              <tr key={index} className="border-b">
                <td>{row.id}</td>
                <td>{format(row.date_time*1000, 'yyyy-MM-dd HH:mm:ss')}</td>
                <td>{row.volume_T3_Kg}</td>
                <td>{row.volume_T4_Kg}</td>
                <td>{row.volumepd1_total}</td>
                <td>{row.volumepd2_total}</td>
                <td>{row.volumepd3_total}</td>

              </tr>
            ))}
            {/* {result} */}
          </tbody>
        </table>
      </div>
    </>
  );
}