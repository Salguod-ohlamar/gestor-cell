import React, { useState } from 'react';
import Button from './Button.jsx';

const ContactForm = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    console.log('Dados do formulário enviados:', formData);
    alert('Mensagem enviada com sucesso! Em breve entraremos em contato.');
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div className="max-w-xl mx-auto bg-gray-900 p-8 rounded-2xl shadow-xl">
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300">Nome</label>
          <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200" />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
          <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200" />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-300">Mensagem</label>
          <textarea id="message" name="message" value={formData.message} onChange={handleInputChange} rows="4" required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200"></textarea>
        </div>
        <Button type="submit" size="md" className="w-full !px-4 !py-3 text-base">
          Enviar mensagem
        </Button>
      </form>
    </div>
  );
};

export default ContactForm;