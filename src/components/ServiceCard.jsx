import React from 'react';

const ServiceCard = ({ service }) => {
  const Icon = service.icon;
  return (
    <div className="bg-gray-900 p-6 rounded-2xl shadow-xl border-t-4 border-green-500 transform hover:scale-105 transition-transform duration-300 text-center">
      <div className="flex justify-center mb-4">
        <Icon size={48} className="text-green-400" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
      <p className="text-gray-400 text-sm">{service.description}</p>
    </div>
  );
};

export default ServiceCard;