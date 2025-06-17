import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-primary-orange rounded-lg flex items-center justify-center">
                <i className="fas fa-project-diagram text-white"></i>
              </div>
              <span className="text-xl font-bold text-dark-gray">CauseMapster</span>
            </div>
            <p className="text-medium-gray mb-4 max-w-md">
              La solution professionnelle pour l'analyse des accidents du travail selon la méthode INRS, 
              assistée par l'intelligence artificielle.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-medium-gray hover:text-primary-orange transition-colors">
                <i className="fab fa-linkedin text-xl"></i>
              </a>
              <a href="#" className="text-medium-gray hover:text-primary-orange transition-colors">
                <i className="fab fa-twitter text-xl"></i>
              </a>
              <a href="#" className="text-medium-gray hover:text-primary-orange transition-colors">
                <i className="fab fa-youtube text-xl"></i>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-dark-gray mb-4">Produit</h4>
            <ul className="space-y-2 text-medium-gray">
              <li><Link href="/" className="hover:text-dark-gray transition-colors">Fonctionnalités</Link></li>
              <li><a href="#" className="hover:text-dark-gray transition-colors">Tarifs</a></li>
              <li><a href="#" className="hover:text-dark-gray transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-dark-gray transition-colors">API</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-dark-gray mb-4">Support</h4>
            <ul className="space-y-2 text-medium-gray">
              <li><a href="#" className="hover:text-dark-gray transition-colors">Centre d'aide</a></li>
              <li><a href="#" className="hover:text-dark-gray transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-dark-gray transition-colors">Formation</a></li>
              <li><a href="#" className="hover:text-dark-gray transition-colors">Communauté</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-medium-gray text-sm">
            © 2024 CauseMapster. Tous droits réservés.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-medium-gray hover:text-dark-gray text-sm transition-colors">
              Confidentialité
            </a>
            <a href="#" className="text-medium-gray hover:text-dark-gray text-sm transition-colors">
              Conditions d'utilisation
            </a>
            <a href="#" className="text-medium-gray hover:text-dark-gray text-sm transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
