
import { FaCheckCircle, FaCalendarCheck, FaLock, FaCommentDots } from "react-icons/fa";

export default function FeaturesSection() {
  const features = [
    { icon: <FaCheckCircle className="text-indigo-500" />, title: "Psicólogos verificados" },
    { icon: <FaCalendarCheck className="text-indigo-500" />, title: "Citas fáciles de gestionar" },
    { icon: <FaLock className="text-indigo-500" />, title: "Privacidad y seguridad" },
    { icon: <FaCommentDots className="text-indigo-500" />, title: "Chat directo" },
  ];

  return (
    <section className="bg-white py-16 px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {features.map((f, idx) => (
          <div key={idx} className="flex items-center gap-4">
            <div className="text-3xl">{f.icon}</div>
            <h4 className="text-lg font-semibold">{f.title}</h4>
          </div>
        ))}
      </div>
    </section>
  );
}
