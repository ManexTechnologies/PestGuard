import React from 'react';
import { ALL_PESTS, CROP_TYPES } from '@/data/pestData';

const KnowledgeBase = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Pest Knowledge Base</h1>
      <p className="mb-4">Total Pests in Database: {ALL_PESTS.length}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALL_PESTS.map((pest, index) => (
          <div key={index} className="border rounded-lg p-4 shadow">
            <h3 className="font-semibold text-lg">{pest.name}</h3>
            <p className="text-sm text-gray-600">{pest.scientificName}</p>
            <p className="mt-2">{pest.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KnowledgeBase;
