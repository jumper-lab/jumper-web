import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark px-6">
      <div className="text-center max-w-md">
        <h1 className="text-7xl font-bold font-display text-primary mb-4">
          404
        </h1>
        <p className="text-xl text-zinc-700 dark:text-zinc-300 mb-2">
          Página não encontrada
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-8">
          O endereço que você acessou não existe ou foi movido.
        </p>
        <Link
          to="/"
          className="inline-block bg-primary text-white px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-wide hover:opacity-90 transition-opacity duration-500 ease-soft"
        >
          Voltar para o início
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
