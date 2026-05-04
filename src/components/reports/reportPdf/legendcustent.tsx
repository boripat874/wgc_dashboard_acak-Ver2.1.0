import React from 'react';

// Define the interface for a single legend entry object
interface LegendEntry {
  color: string;
  value: string | number;
  // Recharts may add other properties like payload, type, etc.,
  // which you can add here if needed.
}

// Define the interface for the props of the CustomLegend component
interface CustomLegendProps {
  payload?: LegendEntry[];
}

const CustomLegend: React.FC<CustomLegendProps> = (props) => {
  const { payload } = props;
  
  // Guard clause to ensure payload is not undefined or null before mapping
  if (!payload) {
    return null;
  }

  return (
    <ul style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 0 }}>
      {payload.map((entry, index) => (
        <li key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', margin: '0 10px' }}>
          <svg width="16" height="16" viewBox="0 0 32 32" style={{ marginRight: '5px' }}>
            <rect x="0" y="0" width="32" height="32" fill={entry.color} />
          </svg>
          <span style={{ color: '#000', fontSize: 16 }}>
            {entry.value}
          </span>
        </li>
      ))}
    </ul>
  );
};

export default CustomLegend;