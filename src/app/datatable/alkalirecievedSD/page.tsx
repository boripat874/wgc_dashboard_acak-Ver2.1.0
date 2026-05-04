import db from '../configKnexTable';
import { format } from 'date-fns';
export const dynamic = 'force-dynamic';


// 1. Mark the function as async to use await
export default async function Datatable() { 

     
  
  // Note: Ensure 'timestamp' is defined or passed as a prop
  // For now, I'll assume it's available in your scope
  const result = await db('alkalirecievedSD')
    .select('*')
    .orderBy('date_time', 'desc');


  return (
    <>
      <h1 className="font-bold">Data Table NaOH System Data</h1>
      <p className="text-sm text-gray-500">Total Records: {result.length}</p>
      
      <hr className="my-4"/>
      
      {/* Example: Basic data mapping */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left border-b">
              <th>ID</th>
              <th>date_time</th>
              <th>Fill_Kg</th>
              <th>Density</th>
              <th>Density_T3  </th>
              <th>Density_T4</th>
              {/* Add other columns like Tank or Status */}
            </tr>
          </thead>
          <tbody>
            {result.map((row, index) => (
              <tr key={index} className="border-b">
                <td>{row.id}</td>
                <td>{format(row.date_time*1000, 'yyyy-MM-dd HH:mm:ss')}</td>
                <td>{row.Fill_Kg}</td>
                <td>{row.Density}</td>
                <td>{row.Density_T3}</td>
                <td>{row.Density_T4}</td>
                {/* <td>{row.volume_T1_Kg}</td>
                <td>{row.volume_T1_Kg}</td> */}

                {/* <td>{new Date(row.start_time).toLocaleString()}</td> */}
                {/* <td>{row.amount}</td> */}
              </tr>
            ))}
            {/* {result} */}
          </tbody>
        </table>
      </div>
    </>
  );
}