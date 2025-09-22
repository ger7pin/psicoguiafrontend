
import { FaFacebookF, FaTwitter, FaLinkedinIn } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-white py-10 px-8">
      <div className="grid grid-cols-2 md:grid-cols-4 text-sm text-gray-700 gap-4 mb-6">
        <a href="#nosotros">Sobre nosotros</a>
        <a href="#contacto">Contacto</a>
        <a href="#faq">FAQ</a>
        <a href="#terminos">Términos</a>
      </div>
      <div className="flex justify-center gap-6 text-xl text-gray-500">
        <FaFacebookF />
        <FaTwitter />
        <FaLinkedinIn />
      </div>
    </footer>
  );
}
